'use client';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState } from 'react';
import { useNativeApp } from './use-native-app';
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
export default function InstallApp() {
  const nativeApp = useNativeApp();
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(true);
  const [open, setOpen] = useState(false);
  const [ios, setIos] = useState(false);
  const [notice, setNotice] = useState('');
  const [engaged, setEngaged] = useState(false);
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const display = window.matchMedia('(display-mode: standalone)');
    const check = () => setInstalled(display.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    check();
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    const capture = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const done = () => { setInstalled(true); setPrompt(null); setOpen(false); };
    const engagement = () => setEngaged(true);
    window.addEventListener('real-love-engaged', engagement);
    window.addEventListener('beforeinstallprompt', capture);
    window.addEventListener('appinstalled', done);
    display.addEventListener('change', check);
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    return () => { window.removeEventListener('real-love-engaged', engagement); window.removeEventListener('beforeinstallprompt', capture); window.removeEventListener('appinstalled', done); display.removeEventListener('change', check); };
  }, [nativeApp]);
  async function install() {
    if (!prompt) return;
    try { await prompt.prompt(); const choice = await prompt.userChoice; setPrompt(null); setNotice(choice.outcome === 'accepted' ? 'Installation requested. Follow your browser’s instructions.' : 'You can install later from your browser menu.'); }
    catch { setPrompt(null); setNotice('Use your browser menu to install Real Love.'); }
  }
  if (nativeApp || installed || !engaged) return null;
  return <section className="install-app" aria-label="Install Real Love">
    <button className="text-button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? 'Close install guide' : 'Add Real Love to your phone'}</button>
    {open && <div className="install-guide">
      <h2>Keep Real Love on your home screen</h2>
      {prompt ? <button className="primary" onClick={install}>Install Real Love</button> : ios ? <p>Open this website in Safari. Tap Share, choose Add to Home Screen, then tap Add. If shown, turn on Open as Web App.</p> : <p>Open your browser menu and look for Install app or Add to Home screen. On a computer, look for an install icon in the address bar. If your browser doesn’t offer installation, you can keep using the website.</p>}
      <p>Open the site directly in your browser rather than inside another app. Sign-in and pilot admission still apply. Profiles and conversations need an internet connection.</p>
      {notice && <p role="status">{notice}</p>}
    </div>}
  </section>;
}
