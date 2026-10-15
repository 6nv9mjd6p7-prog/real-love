'use client';

import { Capacitor } from '@capacitor/core';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const nativeSnapshot = () => Capacitor.isNativePlatform();
const serverSnapshot = () => false;

export function useNativeApp() {
  return useSyncExternalStore(subscribe, nativeSnapshot, serverSnapshot);
}
