const toggleEvent = 'real-love-keyboard-diagnostics-toggle';
let toggledMode: boolean | undefined;

export function keyboardDiagnosticsEnabled() {
  if (toggledMode !== undefined) return toggledMode;
  if (new URLSearchParams(window.location.search).get('keyboardDebug') === '1') return true;
  try {
    return sessionStorage.getItem('real-love-keyboard-diagnostics') === '1';
  } catch {
    return false;
  }
}

export function keyboardDiagnosticsServerSnapshot() {
  return false;
}

export function subscribeKeyboardDiagnostics(onChange: () => void) {
  const onToggle = (event: Event) => {
    toggledMode = (event as CustomEvent<{ enabled: boolean }>).detail.enabled;
    onChange();
  };
  window.addEventListener(toggleEvent, onToggle);
  return () => window.removeEventListener(toggleEvent, onToggle);
}
