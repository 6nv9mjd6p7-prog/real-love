import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const layout=readFileSync('app/layout.tsx','utf8'),css=readFileSync('app/design-system.css','utf8'),globalCss=readFileSync('app/globals.css','utf8'),composer=readFileSync('app/chat-composer.tsx','utf8'),nativeRuntime=readFileSync('app/native-runtime.tsx','utf8'),capacitorConfig=readFileSync('capacitor.config.ts','utf8'),app=readFileSync('app/love-app.tsx','utf8'),nav=readFileSync('app/main-navigation.tsx','utf8'),loading=readFileSync('app/loading-space.tsx','utf8');
import ts from 'typescript';
assert(layout.indexOf('<div className="site-utility"')<layout.indexOf('{children}'),'site actions precede app content');
assert(css.includes('repeat(5,minmax(0,1fr))'),'mobile navigation reserves equal space for five destinations');
assert(globalCss.includes('body:has(.conversation-screen,.circle-conversation) .site-utility{display:none!important}'),'chat keeps utility content out of the message flow');
assert(!globalCss.includes('html:not([data-native-platform]) .app-shell:has(.conversation-screen,.circle-conversation){position:fixed;')&&!globalCss.includes('overflow:hidden;overscroll-behavior:none'),'chat must not lock the browser page or disable document scroll chaining');
assert(globalCss.includes('.app-shell:has(.conversation-screen,.circle-conversation) .topbar{display:none!important}')&&globalCss.includes('html{-webkit-text-size-adjust:100%;text-size-adjust:100%}'),'mobile chat removes the empty global bar and prevents unintended Safari text inflation');
assert(composer.includes('document.addEventListener(\'focusout\',updateViewport)')&&composer.includes('root.style.removeProperty(\'--app-viewport-top\')'),'browser chat resets viewport offsets when the keyboard closes');
const viewportSource=readFileSync('app/chat-viewport.ts','utf8');
const {chatViewportState}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(viewportSource,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64'));
assert.deepEqual(chatViewportState(844,844,480,420,true),{keyboardOpen:true,layoutHeight:844,height:480,top:364},'visual viewport offsets stay within the space reduced by the keyboard');
assert.deepEqual(chatViewportState(844,844,844,120,false),{keyboardOpen:false,layoutHeight:844,height:null,top:0},'keyboard dismissal clears stale Safari offsets');
assert.deepEqual(chatViewportState(844,400,400,0,false),{keyboardOpen:false,layoutHeight:400,height:null,top:0},'orientation changes refresh the closed-keyboard baseline');
assert(globalCss.includes('.app-shell:has(.conversation-screen,.circle-conversation)>.sidebar{display:none!important}')&&globalCss.includes('.app-shell:has(.conversation-screen,.circle-conversation) .content{padding:0}')&&globalCss.includes('.app-shell:has(.chat-composer:focus-within) .conversation-messages{min-height:10rem;padding:4px 0;scroll-padding-block:4px}'),'mobile chat uses a compact edge-to-edge detail layout and preserves transcript space when typing');
assert(css.includes('html[data-native-platform] .site-utility{display:none!important}'),'native app does not show web install/support actions');
assert(css.includes('.primary,.secondary,.danger{'),'shared action controls use one visual baseline');
assert(css.includes('.person-card,.form-section,.care-card{'),'shared content cards use one visual baseline');
assert(css.includes('--control-size:44px')&&css.includes('--control-radius:8px')&&css.includes('--card-radius:12px'),'shared control and card tokens define consistent sizing');
assert(css.includes('--space-2:8px')&&css.includes('--space-4:16px')&&css.includes('--space-6:24px'),'shared spacing scale is available');
assert(css.includes('.entry-actions>.primary,.entry-actions>.secondary{'),'welcome actions share button dimensions');
assert(app.includes('<div className="entry-actions">')&&app.includes('className="primary" onClick={()=>nav(\'Examples\')}>Explore the demo</button>'),'the first-time primary action opens the demo');
assert(app.includes("!signedIn&&route==='discover'&&<section className=\"entry-card\""),'the full introduction only appears on the public entry route');
assert(app.includes('friendship-first connections through shared interests and honest conversation')&&app.includes('photos stay private until both people agree to share'),'the welcome copy explains Real Love’s distinct purpose');
assert(app.includes('no guaranteed review timeline')&&app.includes('approval alerts after signup'),'the signup disclosure explains review timing and status options');
assert(css.includes('.app-shell>.sidebar nav{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;'),'mobile navigation keeps all five destinations on one row');
assert(css.includes('.chat-composer:focus-within{border-color:var(--accent);box-shadow:0 0 0 3px #747df033}')&&css.includes('.chat-composer .composer-controls>textarea:focus{border:0!important;background:transparent!important;outline:0!important;box-shadow:none!important}'),'composer uses one focus indicator instead of nested field rings');
assert(composer.includes("root.hasAttribute('data-native-platform')")&&composer.includes('RealLoveNative/')&&composer.includes('window.visualViewport')&&composer.includes('root.style.setProperty(\'--app-viewport\',`${state.height}px`)'),'web chat uses a limited viewport fallback while native uses platform resizing');
assert(capacitorConfig.includes('resize: KeyboardResize.Native')&&nativeRuntime.includes('Keyboard.setResizeMode({ mode: KeyboardResize.Native })')&&nativeRuntime.includes("Keyboard.addListener('keyboardWillShow'")&&nativeRuntime.includes("Keyboard.addListener('keyboardDidHide'"),'native chat uses Capacitor keyboard resizing and native keyboard visibility events');
assert(globalCss.includes('html[data-native-platform] .app-shell:has(.conversation-screen,.circle-conversation){display:flex;height:auto;min-height:100dvh;padding-top:0;padding-bottom:0;position:static;overflow:visible}')&&globalCss.includes('html[data-native-platform] .app-shell:has(.conversation-screen,.circle-conversation)>.sidebar{display:none!important}'),'native chat stays in document flow and keeps its focused navigation');
assert(css.includes('prefers-reduced-motion:reduce'),'loading motion respects reduced-motion preference');
assert(nav.includes("label:'Settings'"),'privacy settings share the main navigation across layouts');
assert(!app.includes('support-link'),'support is not duplicated in a second navigation location');
assert(!app.includes('support-section'),'support is not repeated as a settings panel');
assert(loading.includes('role="status"')&&loading.includes('aria-hidden="true"'),'loading placeholders are accessible');
console.log('Shared navigation, site utility layout, chat viewport, reduced motion, consolidated controls and cards, and loading state passed.');

// Check all chat-shell rules, including the later design-system sheet, for accidental page locks.
for(const source of [globalCss,css]){
 for(const [,selector,declarations] of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)){
  if(selector.trim()==='.app-shell:has(.conversation-screen,.circle-conversation)'||selector.trim()==='html[data-native-platform] .app-shell:has(.conversation-screen,.circle-conversation)'){
   assert(!/(?:^|;)height:(?!auto(?:;|$))/.test(declarations),'chat shell height must remain intrinsic');
   assert(!/overflow:(?:hidden|clip)/.test(declarations),'chat shell must not clip page content');
  }
 }
}
assert(globalCss.includes('height:clamp(10rem,calc(var(--app-viewport,100dvh)*.6),40rem)'),'transcript retains readable space without sizing the whole page');
assert(globalCss.includes('overscroll-behavior-y:auto'),'scrolling can continue from message history into the surrounding page');
