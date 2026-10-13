/**
 * Reports whether this client is running inside the native shell so views can select supported behavior.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
'use client';

import { Capacitor } from '@capacitor/core';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const nativeSnapshot = () => Capacitor.isNativePlatform();
const serverSnapshot = () => false;

export function useNativeApp() {
  return useSyncExternalStore(subscribe, nativeSnapshot, serverSnapshot);
}
