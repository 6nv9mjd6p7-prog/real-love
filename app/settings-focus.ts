type FocusTarget = Pick<HTMLElement,'focus'|'getClientRects'> | Pick<HTMLElement,'focus'> | null;

export function focusSettingsDeleteTarget(
  open: boolean,
  wasOpen: boolean,
  targets: {prompt:FocusTarget;trigger:FocusTarget;summary:FocusTarget},
) {
  if(open===wasOpen)return;
  if(open){targets.prompt?.focus();return;}
  const trigger=targets.trigger;
  if(trigger&&'getClientRects' in trigger&&trigger.getClientRects().length){trigger.focus();return;}
  targets.summary?.focus();
}
