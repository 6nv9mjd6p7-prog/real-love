'use client';

import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';

const storageKey = 'real-love-keyboard-diagnostics';

export default function KeyboardDiagnosticsToggle() {
  const [available, setAvailable] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setAvailable(Capacitor.isNativePlatform());
    setEnabled(sessionStorage.getItem(storageKey) === '1');
  }, []);

  if (!available) return null;

  const toggle = () => {
    const next = !enabled;
    if (next) sessionStorage.setItem(storageKey, '1');
    else sessionStorage.removeItem(storageKey);
    setEnabled(next);
    window.dispatchEvent(new CustomEvent('real-love-keyboard-diagnostics-toggle', { detail: { enabled: next } }));
  };

  return <section className="keyboard-diagnostics-setting" aria-labelledby="keyboard-diagnostics-setting-title">
    <h2 id="keyboard-diagnostics-setting-title">Keyboard display check</h2>
    <p>Temporarily show keyboard and composer measurements while you try the chat. Message text is never included.</p>
    <button type="button" className="secondary" aria-pressed={enabled} onClick={toggle}>{enabled ? 'Turn off keyboard check' : 'Start keyboard check'}</button>
  </section>;
}
