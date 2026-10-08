export function dialogControls(root:HTMLElement){
 return Array.from(root.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,summary,[tabindex]')).filter(el=>!el.matches(':disabled,[hidden],[aria-hidden="true"]')&&el.tabIndex>=0&&!el.closest('[hidden],[inert],[aria-hidden="true"]')&&el.getClientRects().length>0);
}
export function tabDestination(controls:HTMLElement[],active:Element|null,backward:boolean){
 if(!controls.length)return null;
 if(!controls.includes(active as HTMLElement))return backward?controls.at(-1)!:controls[0];
 if(backward&&active===controls[0])return controls.at(-1)!;
 if(!backward&&active===controls.at(-1))return controls[0];
 return undefined;
}
export function manageDialogFocus(root:HTMLElement,onDismiss:()=>void,isBusy:()=>boolean){
 const prior=document.activeElement as HTMLElement|null;
 const overflow=document.body.style.overflow;
 const backgrounds=Array.from(document.querySelectorAll<HTMLElement>('.app-shell>main,.app-shell>aside,.app-shell>.skip-link,.install-app')).map(el=>({el,inert:el.inert}));
 backgrounds.forEach(({el})=>{el.inert=true;});document.body.style.overflow='hidden';
 const focusFirst=()=>{(dialogControls(root)[0]??root).focus({preventScroll:true});};focusFirst();
 function keys(e:KeyboardEvent){if(document.querySelector('dialog.photo-viewer[open]'))return;if(e.key==='Escape'&&!isBusy()){e.preventDefault();onDismiss();}if(e.key==='Tab'){const next=tabDestination(dialogControls(root),document.activeElement,e.shiftKey);if(next!==undefined){e.preventDefault();(next??root).focus();}}}
 function focus(e:FocusEvent){if(document.querySelector('dialog.photo-viewer[open]'))return;if(!root.contains(e.target as Node))focusFirst();}
 document.addEventListener('keydown',keys);document.addEventListener('focusin',focus);
 return()=>{document.removeEventListener('keydown',keys);document.removeEventListener('focusin',focus);backgrounds.forEach(({el,inert})=>{el.inert=inert;});document.body.style.overflow=overflow;if(prior?.isConnected)prior.focus({preventScroll:true});};
}
