/**
 * Allowlisted native-app link routing. Separates internal routes, authentication, external links, and rejected destinations.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
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
  return staticRoutes.has(route) || nestedRoute.test(route) || inboxRoute.test(route) ? route : null;
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
