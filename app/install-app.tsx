'use client';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { useNativeApp } from './use-native-app';
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const subscribeCapabilities = () => () => {};
const iosSnapshot = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const installedSnapshot = () => window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
const serverInstalled = () => true;
const serverIos = () => false;
function subscribeDisplayMode(onChange: () => void) {
  if (Capacitor.isNativePlatform()) return () => {};
  const display = window.matchMedia('(display-mode: standalone)');
  display.addEventListener('change', onChange);
  return () => display.removeEventListener('change', onChange);
}
export default function InstallApp() {
  const nativeApp = useNativeApp();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  // The install event may arrive before the browser's standalone flags update.
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const ios = useSyncExternalStore(subscribeCapabilities, iosSnapshot, serverIos);
  const standalone = useSyncExternalStore(subscribeDisplayMode, installedSnapshot, serverInstalled);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const display = window.matchMedia('(display-mode: standalone)');
    // Later display changes make the browser snapshot authoritative again.
    const displayChanged = () => setInstalled(false);
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const done = () => { setInstalled(true); setPrompt(null); setOpen(false); };
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', done);
    display.addEventListener('change', displayChanged);
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    return () => { window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', done); display.removeEventListener('change', displayChanged); };
  }, [nativeApp]);
  async function install() {
    if (!prompt || busy) return;
    setBusy(true);
    try { await prompt.prompt(); const choice = await prompt.userChoice; setPrompt(null); setNotice(choice.outcome === 'accepted' ? 'Installation requested. Follow your browser’s instructions.' : 'You can install later from your browser menu.'); }
    catch { setPrompt(null); setNotice('Use your browser menu to install Real Love.'); }
    finally { setBusy(false); }
  }
  // Installation is discoverable immediately; never depend on a one-time engagement event.
  // Installed web apps and the native shell already have a home-screen entry.
  if (nativeApp || installed || standalone) return null;
  return <section className="install-app" aria-label="Install Real Love">
    <button className="secondary" aria-label={open ? 'Close install guide' : 'Add Real Love to your phone'} aria-controls="real-love-install-guide" aria-expanded={open} onClick={() => setOpen(!open)}><span className="utility-label-full">{open ? 'Close install guide' : 'Add Real Love to your phone'}</span><span className="utility-label-short" aria-hidden="true">{open ? 'Close guide' : 'Add to phone'}</span></button>
    {open && <div className="install-guide" id="real-love-install-guide">
      <h2>Keep Real Love on your home screen</h2>
      {prompt ? <button className="primary" disabled={busy} onClick={install}>{busy ? 'Opening installation…' : 'Install Real Love'}</button> : ios ? <p>Open this website in Safari. Tap Share, choose Add to Home Screen, then tap Add. If shown, turn on Open as Web App.</p> : <p>Open your browser menu and look for Install app or Add to Home screen. On a computer, look for an install icon in the address bar. If your browser doesn’t offer installation, you can keep using the website.</p>}
      <p>Open the site directly in your browser rather than inside another app. Your account and access stay the same. Profiles and conversations need an internet connection.</p>
      {notice && <p role="status">{notice}</p>}
    </div>}
  </section>;
}
