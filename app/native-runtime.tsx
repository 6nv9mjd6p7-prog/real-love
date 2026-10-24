'use client';

import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard, KeyboardResize, KeyboardStyle } from '@capacitor/keyboard';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useEffect } from 'react';
import { nativeDestination } from './native-links';

function openDeepLink(value: string) {
  const destination = nativeDestination(value);
  if (destination?.kind === 'hash') window.location.hash = destination.value;
  else if (destination?.kind === 'path') window.location.assign(destination.value);
}

export default function NativeRuntime() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    document.documentElement.dataset.nativePlatform = Capacitor.getPlatform();
    const handles: PluginListenerHandle[] = [];
    let alive = true;
    let keyboardVisible = false;
    let keyboardHeight = 0;
    let viewportFrame = 0;
    let settleTimer = 0;
    const root = document.documentElement;

    const syncKeyboardViewport = () => {
      cancelAnimationFrame(viewportFrame);
      viewportFrame = requestAnimationFrame(() => {
        if (!alive || !keyboardVisible) return;
        // Native resize mode shrinks the WKWebView. Its measured viewport is
        // the usable CSS height; subtracting UIKit's keyboard frame here can
        // count the keyboard twice or mix points and CSS pixels.
        const viewport = window.visualViewport;
        const height = Math.min(window.innerHeight, viewport?.height ?? window.innerHeight);
        root.style.setProperty('--app-viewport', String(Math.max(1, Math.round(height))) + 'px');
        root.style.setProperty('--app-viewport-top', '0px');
        root.style.setProperty('--keyboard-height', String(Math.max(0, Math.round(keyboardHeight))) + 'px');
      });
    };

    const clearKeyboardViewport = () => {
      keyboardVisible = false;
      cancelAnimationFrame(viewportFrame);
      window.clearTimeout(settleTimer);
      delete root.dataset.keyboardOpen;
      root.style.removeProperty('--app-viewport');
      root.style.removeProperty('--app-viewport-top');
      root.style.removeProperty('--keyboard-height');
      keyboardHeight = 0;
      if (Capacitor.getPlatform() === 'ios') void Keyboard.setScroll({ isDisabled: false });
    };

    const isChatComposerField = (target: EventTarget | null) =>
      target instanceof HTMLTextAreaElement && !!target.closest('.direct-chat .chat-composer, .circle-workspace .chat-composer');
    const isChatMessageArea = (target: EventTarget | null) =>
      target instanceof Element && !!target.closest('.direct-chat .conversation-messages, .circle-workspace .conversation-messages');
    let messageTouchStartY: number | null = null;
    let messageTouchStartedInChat = false;
    const onMessageTouchStart = (event: TouchEvent) => {
      messageTouchStartY = event.touches[0]?.clientY ?? null;
      messageTouchStartedInChat = isChatMessageArea(event.target);
    };
    const onMessageTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!keyboardVisible || !messageTouchStartedInChat || messageTouchStartY === null || !touch) return;
      // An upward transcript drag dismisses the keyboard so older messages can
      // use the newly available space.
      if (messageTouchStartY - touch.clientY < 8) return;
      const active = document.activeElement;
      if (active instanceof HTMLTextAreaElement && isChatComposerField(active)) active.blur();
      messageTouchStartY = null;
    };
    const resetMessageTouch = () => {
      messageTouchStartY = null;
      messageTouchStartedInChat = false;
    };
    const onPointerDown = (event: PointerEvent) => {
      if (Capacitor.getPlatform() === 'ios' && isChatComposerField(event.target)) {
        void Keyboard.setScroll({ isDisabled: true });
      }
    };
    const onFocusIn = (event: FocusEvent) => {
      if (Capacitor.getPlatform() === 'ios' && isChatComposerField(event.target)) {
        void Keyboard.setScroll({ isDisabled: true });
      }
    };
    const onFocusOut = (event: FocusEvent) => {
      if (Capacitor.getPlatform() !== 'ios' || !isChatComposerField(event.target)) return;
      window.setTimeout(() => {
        if (!isChatComposerField(document.activeElement)) void Keyboard.setScroll({ isDisabled: false });
      }, 0);
    };

    void StatusBar.setOverlaysWebView({ overlay: false });
    void StatusBar.setStyle({ style: Style.Light });
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    void Keyboard.setStyle({ style: KeyboardStyle.Light });
    void Keyboard.addListener('keyboardWillShow', (info: { keyboardHeight: number }) => {
      keyboardHeight = info.keyboardHeight;
      keyboardVisible = true;
      root.dataset.keyboardOpen = 'true';
      syncKeyboardViewport();
    }).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void Keyboard.addListener('keyboardDidShow', (info: { keyboardHeight: number }) => {
      keyboardHeight = info.keyboardHeight || keyboardHeight;
      syncKeyboardViewport();
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(syncKeyboardViewport, 350);
    }).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void Keyboard.addListener('keyboardDidHide', clearKeyboardViewport).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    window.visualViewport?.addEventListener('resize', syncKeyboardViewport);
    window.visualViewport?.addEventListener('scroll', syncKeyboardViewport);
    window.addEventListener('resize', syncKeyboardViewport);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onMessageTouchStart, { capture: true, passive: true });
    document.addEventListener('touchmove', onMessageTouchMove, { capture: true, passive: true });
    document.addEventListener('touchend', resetMessageTouch, true);
    document.addEventListener('touchcancel', resetMessageTouch, true);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);

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
      delete root.dataset.nativePlatform;
      delete root.dataset.keyboardOpen;
      root.style.removeProperty('--app-viewport');
      root.style.removeProperty('--app-viewport-top');
      root.style.removeProperty('--keyboard-height');
      if (Capacitor.getPlatform() === 'ios') void Keyboard.setScroll({ isDisabled: false });
      window.visualViewport?.removeEventListener('resize', syncKeyboardViewport);
      window.visualViewport?.removeEventListener('scroll', syncKeyboardViewport);
      window.removeEventListener('resize', syncKeyboardViewport);
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('touchstart', onMessageTouchStart, true);
      document.removeEventListener('touchmove', onMessageTouchMove, true);
      document.removeEventListener('touchend', resetMessageTouch, true);
      document.removeEventListener('touchcancel', resetMessageTouch, true);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('click', externalLink);
      handles.forEach(handle => void handle.remove());
    };
  }, []);

  return null;
}
