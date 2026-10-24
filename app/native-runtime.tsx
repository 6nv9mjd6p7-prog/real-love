'use client';

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { nativeDestination } from './native-links';
import { keyboardDiagnosticsEnabled, keyboardDiagnosticsServerSnapshot, subscribeKeyboardDiagnostics } from './keyboard-diagnostics-store';

function openDeepLink(value: string) {
  const destination = nativeDestination(value);
  if (destination?.kind === 'hash') window.location.hash = destination.value;
  else if (destination?.kind === 'path') window.location.assign(destination.value);
}

export default function NativeRuntime() {
  const diagnosticMode = useSyncExternalStore(subscribeKeyboardDiagnostics, keyboardDiagnosticsEnabled, keyboardDiagnosticsServerSnapshot);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [diagnosticRows, setDiagnosticRows] = useState<Array<Record<string, unknown>>>([]);
  const [diagnosticCopyState, setDiagnosticCopyState] = useState('');

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.dataset.nativePlatform = Capacitor.getPlatform();
    const handles: PluginListenerHandle[] = [];
    let alive = true;
    let keyboardVisible = false;
    let keyboardHeight = 0;
    let restingViewportHeight = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
    let viewportFrame = 0;
    let settleTimer = 0;
    let blurTimer = 0;
    let diagnosticsEnabled = keyboardDiagnosticsEnabled();
    const diagnosticStartedAt = performance.now();
    const rectMetrics = (element: Element | null) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { top: Math.round(rect.top), bottom: Math.round(rect.bottom), height: Math.round(rect.height) };
    };
    const diagnosticSnapshot = () => {
      const root = document.documentElement;
      const active = document.activeElement;
      return {
        platform: Capacitor.getPlatform(),
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        visualViewportWidth: window.visualViewport ? Math.round(window.visualViewport.width) : null,
        visualViewportHeight: window.visualViewport ? Math.round(window.visualViewport.height) : null,
        visualViewportOffsetTop: window.visualViewport ? Math.round(window.visualViewport.offsetTop) : null,
        visualViewportScale: window.visualViewport ? Number(window.visualViewport.scale.toFixed(3)) : null,
        viewportMeta: document.querySelector<HTMLMetaElement>('meta[name="viewport"]')?.content ?? null,
        bodyHeight: document.body.clientHeight,
        keyboardHeight: root.style.getPropertyValue('--keyboard-height') || 'unset',
        appViewport: root.style.getPropertyValue('--app-viewport') || 'unset',
        appShell: rectMetrics(document.querySelector('.app-shell')),
        composerDock: rectMetrics(document.querySelector('.direct-chat .direct-compose-dock, .circle-workspace .circle-compose-dock, .sample-chat-main')),
        composer: rectMetrics(document.querySelector('.direct-chat .chat-composer, .circle-workspace .chat-composer, .sample-chat-composer')),
        activeElement: active instanceof HTMLTextAreaElement && active.closest('.direct-chat .chat-composer, .circle-workspace .chat-composer, .sample-chat-composer') ? 'chat composer' : active instanceof HTMLElement ? active.tagName.toLowerCase() : 'none',
        keyboardOpen: keyboardVisible,
      };
    };
    const recordDiagnostic = (event: string, details: Record<string, unknown> = {}) => {
      if (!diagnosticsEnabled) return;
      const row = { time: `${((performance.now() - diagnosticStartedAt) / 1000).toFixed(2)}s`, event, ...diagnosticSnapshot(), ...details };
      setDiagnosticRows(previous => [...previous.slice(-19), row]);
    };
    const onDiagnosticsToggle = (event: Event) => {
      const enabled = (event as CustomEvent<{ enabled: boolean }>).detail.enabled;
      diagnosticsEnabled = enabled;
      if (enabled) recordDiagnostic('diagnostics started');
      else setDiagnosticRows([]);
    };

    const syncKeyboardViewport = () => {
      cancelAnimationFrame(viewportFrame);
      viewportFrame = requestAnimationFrame(() => {
        if (!alive || !keyboardVisible) return;
        const viewport = window.visualViewport;
        const measuredHeight = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
        const viewportDidResize = measuredHeight < restingViewportHeight - 80;
        // Native resize mode normally shrinks the WebView. If iOS reports the
        // keyboard before that resize reaches WebKit, calculate the visible
        // height from the resting viewport and the native keyboard frame.
        // keyboardHeight is in screen points; visualViewport.scale converts it
        // to the CSS-pixel coordinate space used by the layout.
        const scale = viewport?.scale;
        const keyboardCssHeight = keyboardHeight / (scale && scale > 0 ? scale : 1);
        const calculatedHeight = keyboardHeight > 0
          ? Math.max(1, restingViewportHeight - keyboardCssHeight)
          : measuredHeight;
        const lockedHeight = viewportDidResize ? measuredHeight : Math.min(measuredHeight, calculatedHeight);
        document.documentElement.style.setProperty('--app-viewport', `${Math.max(1, Math.round(lockedHeight))}px`);
        document.documentElement.style.setProperty('--app-viewport-top', `${Math.max(0, Math.round(viewport?.offsetTop ?? 0))}px`);
        document.documentElement.style.setProperty('--keyboard-height', `${Math.max(0, Math.round(keyboardHeight))}px`);
      });
    };
    const onKeyboardWillShow = (info: { keyboardHeight: number }) => {
      keyboardHeight = info.keyboardHeight;
      keyboardVisible = true;
      document.documentElement.dataset.keyboardOpen = 'true';
      recordDiagnostic('keyboardWillShow', { reportedKeyboardHeight: info.keyboardHeight });
      syncKeyboardViewport();
    };
    const onKeyboardDidShow = (info: { keyboardHeight: number }) => {
      keyboardHeight = info.keyboardHeight || keyboardHeight;
      recordDiagnostic('keyboardDidShow', { reportedKeyboardHeight: info.keyboardHeight });
      syncKeyboardViewport();
      // Capacitor's native resize may be applied shortly after the keyboard
      // animation. Read the settled WebView size as well as viewport events.
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(() => {
        syncKeyboardViewport();
        requestAnimationFrame(() => recordDiagnostic('settled 350ms after keyboardDidShow', { reportedKeyboardHeight: keyboardHeight }));
      }, 350);
    };
    const clearKeyboardViewport = () => {
      recordDiagnostic('keyboardDidHide');
      keyboardVisible = false;
      cancelAnimationFrame(viewportFrame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(blurTimer);
      delete document.documentElement.dataset.keyboardOpen;
      document.documentElement.style.removeProperty('--app-viewport');
      document.documentElement.style.removeProperty('--app-viewport-top');
      document.documentElement.style.removeProperty('--keyboard-height');
      keyboardHeight = 0;
      restingViewportHeight = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
      if (Capacitor.getPlatform() === 'ios') void Keyboard.setScroll({ isDisabled: false });
    };
    const isChatComposerField = (target: EventTarget | null) =>
      target instanceof HTMLTextAreaElement && !!target.closest('.direct-chat .chat-composer, .circle-workspace .chat-composer, .sample-chat-composer');
    const isChatMessageArea = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest('.direct-chat .conversation-messages, .circle-workspace .conversation-messages, .sample-chat-messages');
    let messageTouchStartY: number | null = null;
    let messageTouchStartedInChat = false;
    const onMessageTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      messageTouchStartY = touch?.clientY ?? null;
      messageTouchStartedInChat = isChatMessageArea(event.target);
      if (keyboardVisible && messageTouchStartedInChat) recordDiagnostic('drag started in message history');
    };
    const onMessageTouchMove = (event: TouchEvent) => {
      if (!messageTouchStartedInChat || messageTouchStartY === null) return;
      const touch = event.touches[0];
      if (!touch || Math.abs(touch.clientY - messageTouchStartY) < 8) return;
      const activeElement = document.activeElement;
      const composerFocused = activeElement instanceof HTMLTextAreaElement && isChatComposerField(activeElement);
      if (composerFocused && activeElement instanceof HTMLTextAreaElement) activeElement.blur();
      if (keyboardVisible) recordDiagnostic('message history drag', { dragDistance: Math.round(Math.abs(touch.clientY - messageTouchStartY)), composerFocused, blurCalled: composerFocused });
      messageTouchStartY = null;
    };
    const resetMessageTouch = () => {
      messageTouchStartY = null;
      messageTouchStartedInChat = false;
    };
    const onFocusIn = (event: FocusEvent) => {
      if (Capacitor.getPlatform() === 'ios' && isChatComposerField(event.target)) {
        window.clearTimeout(blurTimer);
        keyboardVisible = true;
        document.documentElement.dataset.keyboardOpen = 'true';
        syncKeyboardViewport();
        recordDiagnostic('chat composer focused');
        void Keyboard.setScroll({ isDisabled: true });
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (Capacitor.getPlatform() === 'ios' && isChatComposerField(event.target)) {
        // Run before the textarea receives focus so WKWebView cannot scroll
        // the whole page while its keyboard is animating in.
        void Keyboard.setScroll({ isDisabled: true });
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      if (Capacitor.getPlatform() !== 'ios' || !isChatComposerField(event.target)) return;
      recordDiagnostic('chat composer blurred');
      window.clearTimeout(blurTimer);
      window.setTimeout(() => {
        if (isChatComposerField(document.activeElement)) return;
        void Keyboard.setScroll({ isDisabled: false });
        // Some keyboard-dismiss paths do not deliver keyboardDidHide to the
        // WebView. Clear the lock once the native hide animation has had time
        // to finish so the rest of the site remains normally scrollable.
        blurTimer = window.setTimeout(() => {
          if (!isChatComposerField(document.activeElement)) clearKeyboardViewport();
        }, 700);
      }, 0);
    };

    void StatusBar.setOverlaysWebView({ overlay: false });
    void StatusBar.setStyle({ style: Style.Light });
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    void Keyboard.setStyle({ style: KeyboardStyle.Light });
    void Keyboard.addListener('keyboardWillShow', onKeyboardWillShow).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void Keyboard.addListener('keyboardDidShow', onKeyboardDidShow).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void Keyboard.addListener('keyboardWillHide', () => recordDiagnostic('keyboardWillHide')).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void Keyboard.addListener('keyboardDidHide', () => {
      clearKeyboardViewport();
    }).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    if (diagnosticsEnabled) {
      void Keyboard.getResizeMode().then(({ mode }) => recordDiagnostic('native keyboard ready', { resizeMode: mode })).catch(() => recordDiagnostic('could not read resize mode'));
      recordDiagnostic('diagnostics started');
    }
    const onViewportChange = () => {
      if (keyboardVisible) syncKeyboardViewport();
      else restingViewportHeight = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
    };
    window.visualViewport?.addEventListener('resize', onViewportChange);
    window.visualViewport?.addEventListener('scroll', onViewportChange);
    window.addEventListener('resize', onViewportChange);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onMessageTouchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', onMessageTouchMove, { capture: true, passive: true });
    document.addEventListener('touchend', resetMessageTouch, true);
    document.addEventListener('touchcancel', resetMessageTouch, true);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    window.addEventListener('real-love-keyboard-diagnostics-toggle', onDiagnosticsToggle);

    void App.addListener('appUrlOpen', event => openDeepLink(event.url)).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void App.addListener('appStateChange', state => {
      if (state.isActive) window.dispatchEvent(new Event('real-love-app-active'));
    }).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void App.getLaunchUrl().then(event => {
      if (alive && event?.url) openDeepLink(event.url);
    });

    const externalLink = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target !== '_blank') return;
      try {
        const url = new URL(link.href, window.location.href);
        if (url.origin === window.location.origin) return;
        event.preventDefault();
        void Browser.open({ url: url.href, presentationStyle: 'popover', toolbarColor: '#292e72' });
      } catch {
        // Leave invalid URLs to the browser's normal handling.
      }
    };
    document.addEventListener('click', externalLink);

    return () => {
      alive = false;
      keyboardVisible = false;
      cancelAnimationFrame(viewportFrame);
      window.clearTimeout(settleTimer);
      window.clearTimeout(blurTimer);
      delete document.documentElement.dataset.nativePlatform;
      delete document.documentElement.dataset.keyboardOpen;
      document.documentElement.style.removeProperty('--app-viewport');
      document.documentElement.style.removeProperty('--app-viewport-top');
      document.documentElement.style.removeProperty('--keyboard-height');
      if (Capacitor.getPlatform() === 'ios') void Keyboard.setScroll({ isDisabled: false });
      window.visualViewport?.removeEventListener('resize', onViewportChange);
      window.visualViewport?.removeEventListener('scroll', onViewportChange);
      window.removeEventListener('resize', onViewportChange);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('touchstart', onMessageTouchStart, true);
      document.removeEventListener('touchmove', onMessageTouchMove, true);
      document.removeEventListener('touchend', resetMessageTouch, true);
      document.removeEventListener('touchcancel', resetMessageTouch, true);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('real-love-keyboard-diagnostics-toggle', onDiagnosticsToggle);
      document.removeEventListener('click', externalLink);
      handles.forEach(handle => void handle.remove());
    };
  }, []);

  if (!diagnosticMode) return null;

  const visibleDiagnosticRows = Capacitor.isNativePlatform()
    ? diagnosticRows
    : [{ event: 'Native Capacitor bridge unavailable in this browser.' }];

  const copyDiagnostics = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(visibleDiagnosticRows, null, 2));
      setDiagnosticCopyState('Copied');
    } catch {
      setDiagnosticCopyState('Copy unavailable; take a screenshot of Details.');
    }
  };

  return <aside className="keyboard-diagnostics" aria-label="Keyboard diagnostics">
    <div className="keyboard-diagnostics-bar">
      <strong>Keyboard check</strong>
      <button type="button" onClick={() => setDiagnosticOpen(value => !value)}>{diagnosticOpen ? 'Hide details' : 'Details'}</button>
      <button type="button" onClick={() => void copyDiagnostics()}>Copy</button>
    </div>
    {diagnosticCopyState && <p role="status">{diagnosticCopyState}</p>}
    {diagnosticOpen && <><p>No message text is recorded. Reproduce the issue, then use Copy or take a screenshot.</p><ol className="keyboard-diagnostics-list">{visibleDiagnosticRows.map((row: Record<string, unknown>, index) => <li key={index}><strong>{String(row.time || '')} {String(row.event || '')}</strong><pre>{JSON.stringify(row, null, 2)}</pre></li>)}</ol></>}
  </aside>;
}
