export const productionOrigin = 'https://real-love-connections.fetes-rowboat-0k.chatgpt.site';

const staticRoutes = new Set([
  'discover',
  'saved',
  'examples',
  'profile',
  'settings',
  'review',
  'notifications',
  'conversations',
  'circles',
]);
const nestedRoute = /^(person|chat|circles)\/[A-Za-z0-9_-]+$/;
const workerRoute = /^circles\/work\/(?:browse|joined|requests|[A-Za-z0-9_-]+)$/;
const inboxRoute = /^conversations\/(chats|requests|sent)$/;

export type NativeDestination =
  | { kind: 'hash'; value: string }
  | { kind: 'path'; value: string }
  | null;

export function allowedAppRoute(value: string) {
  let route = value.replace(/^#\/?/, '').replace(/^\//, '');
  try {
    route = decodeURIComponent(route);
  } catch {
    return null;
  }
  return staticRoutes.has(route) || nestedRoute.test(route) || workerRoute.test(route) || inboxRoute.test(route) ? route : null;
}

export function nativeDestination(value: string): NativeDestination {
  try {
    const url = new URL(value);
    if (url.protocol === 'reallove:') {
      const directRoute = [url.hostname, url.pathname.replace(/^\//, '')].filter(Boolean).join('/');
      const route = allowedAppRoute(url.searchParams.get('route') || url.hash || directRoute);
      return route ? { kind: 'hash', value: route } : null;
    }
    if (url.origin !== productionOrigin) return null;
    const route = allowedAppRoute(url.hash);
    return route
      ? { kind: 'hash', value: route }
      : { kind: 'path', value: url.pathname + url.search };
  } catch {
    return null;
  }
}

// Route context is explicit so worker details never become general Circles after a remount.
export function circleRouteInfo(route:string){
 const parts=route.split('/'),worker=parts[1]==='work'||parts[1]==='organize';
 const target=worker?(parts[1]==='organize'?'organize':parts[2]):parts[1];
 const reserved=['browse','joined','requests','work','organize','action','new'];
 const id=target&&!reserved.includes(target)?decodeURIComponent(target):'';
 const section=target==='joined'?'Joined':target==='requests'?'Requests':id?'':'Discover';
 return {worker,id,section,browse:worker&&!!target,organizing:parts[1]==='organize',compose:target==='new'||parts[1]==='organize'};
}
export function circleListRoute(worker:boolean,section:string){return worker?'circles/work/'+(section==='Joined'?'joined':section==='Requests'?'requests':'browse'):section==='Joined'?'circles/joined':section==='Requests'?'circles/requests':'circles';}
// Mark only app-owned history entries. Browser traversal preserves the original parent.
export function recordAppNavigation(previous:string|null,route:string,account:string){
 const state=history.state||{},marker=state.realLoveNavigation;
 if(marker?.account===account&&marker.route===route)return;
 history.replaceState({...state,realLoveNavigation:{account,route,parent:previous&&allowedAppRoute(previous)?previous:null}},'');
}
export function replaceAppRoute(route:string,account:string,preserveParent=false){
 const next=allowedAppRoute(route)||'circles';
 const parent=preserveParent&&history.state?.realLoveNavigation?.account===account?history.state.realLoveNavigation.parent:null;
 history.replaceState({...history.state,realLoveNavigation:{account,route:next,parent}},'',location.pathname+location.search+'#'+next);
 window.dispatchEvent(new Event('hashchange'));
}
export function appBackDestination(fallback:string,account:string){if(typeof history==='undefined')return fallback;const marker=history.state?.realLoveNavigation;return marker?.account===account&&allowedAppRoute(marker.parent||'')?marker.parent:fallback;}
// A restored history marker is not proof that the browser can traverse to its parent.
// Wait for traversal, then replace the current route if the browser performed no action.
let pendingBack:(()=>void)|null=null;
export function backWithinApp(fallback:string,account:string,steps=1){
 if(pendingBack)return;
 const marker=history.state?.realLoveNavigation;
 if(marker?.account!==account||!marker.parent||!allowedAppRoute(marker.parent)||marker.parent===marker.route){replaceAppRoute(fallback,account);return;}
 const target=appBackDestination(fallback,account),initialHash=location.hash,initialState=history.state;
 const finish=()=>{clearTimeout(timer);window.removeEventListener('popstate',finish);window.removeEventListener('hashchange',finish);pendingBack=null;};
 const timer=setTimeout(()=>{finish();if(location.hash===initialHash&&history.state===initialState)replaceAppRoute(target,account);},700);
 pendingBack=finish;
 window.addEventListener('popstate',finish);window.addEventListener('hashchange',finish);
 try{const count=Number.isSafeInteger(steps)?Math.max(1,steps):1;if(count===1)history.back();else history.go(-count);}catch{finish();replaceAppRoute(target,account);}
}

export function returnToAppRoute(target:string,account:string){if(appBackDestination('',account)===target)backWithinApp(target,account);else replaceAppRoute(target,account);}
export function routeBackLabel(route:string){if(route.startsWith('person/'))return 'profile';if(route==='circles/work')return 'Worker Support';if(route.startsWith('circles/work/'))return 'worker circles';if(route.startsWith('chat/')||route.startsWith('conversations'))return 'Chats';if(route==='notifications')return 'Notifications';if(route==='profile')return 'My profile';if(route==='circles/requests')return 'circle requests';if(route==='circles/joined')return 'joined circles';if(route.startsWith('circles'))return 'Circles';if(route==='saved')return 'Saved';if(route==='examples')return 'Examples';if(route==='settings')return 'Privacy & settings';if(route==='review')return 'Safety review';return 'Discover';}
