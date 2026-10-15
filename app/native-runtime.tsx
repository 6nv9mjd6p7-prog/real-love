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

    void StatusBar.setOverlaysWebView({ overlay: false });
    void StatusBar.setStyle({ style: Style.Light });
    void Keyboard.setResizeMode({ mode: KeyboardResize.Native });
    void Keyboard.setStyle({ style: KeyboardStyle.Light });
    void Keyboard.addListener('keyboardWillShow', () => {
      document.documentElement.dataset.keyboardOpen = 'true';
    }).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });
    void Keyboard.addListener('keyboardDidHide', () => {
      delete document.documentElement.dataset.keyboardOpen;
    }).then(handle => {
      if (alive) handles.push(handle);
      else void handle.remove();
    });

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
      delete document.documentElement.dataset.nativePlatform;
      delete document.documentElement.dataset.keyboardOpen;
      document.removeEventListener('click', externalLink);
      handles.forEach(handle => void handle.remove());
    };
  }, []);

  return null;
}
