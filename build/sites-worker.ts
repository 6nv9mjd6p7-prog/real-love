import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";
import { cleanup } from "../app/safety";

export default {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const path=new URL(request.url).pathname;
    let response:Response;
    // Apply Cloudflare's edge limiter before API handlers, so abusive request
    // bursts are rejected before they consume D1, storage, or authentication work.
    const edgeLimiter=path==='/api/auth'?env.RATE_LIMITER_AUTH:path.startsWith('/api/')?env.RATE_LIMITER_API:undefined;
    const clientIp=request.headers.get('CF-Connecting-IP');
    if(edgeLimiter&&clientIp){
      let allowed=true;
      try{
        allowed=(await edgeLimiter.limit({key:clientIp})).success;
      }catch{
        // Keep the app available if Cloudflare's limiter has a transient error;
        // existing per-account database quotas still protect individual actions.
      }
      response=allowed
        ?await runWithConnectorBinding(binding,()=>handler.fetch(request,env,ctx))
        :Response.json({error:'Too many requests. Please wait a minute and try again.'},{status:429,headers:{'Retry-After':'60','Cache-Control':'no-store'}});
    }else response=await runWithConnectorBinding(binding,()=>handler.fetch(request,env,ctx));
    const security = new Headers(response.headers);
    security.set('X-Content-Type-Options','nosniff');
    security.set('Referrer-Policy','no-referrer');
    // Tell browsers to keep using HTTPS for this host after a secure visit.
    // Omit includeSubDomains because the hosting platform may share parent domains.
    if (new URL(request.url).protocol === 'https:') {
      security.set('Strict-Transport-Security', 'max-age=31536000');
    }
    // Same-origin location requests still require explicit browser permission.
    security.set('Permissions-Policy','camera=(), microphone=(self), geolocation=(self)');
    security.set('Cross-Origin-Resource-Policy','same-origin');
    let body=response.body;
    if(!security.has('Content-Security-Policy')){
      // A per-response nonce lets server-rendered script/style blocks run
      // without allowing arbitrary inline JavaScript or stylesheet blocks.
      const nonceBytes=crypto.getRandomValues(new Uint8Array(18));
      const nonce=Array.from(nonceBytes,byte=>byte.toString(16).padStart(2,'0')).join('');
      const nonceHtml=response.headers.get('Content-Type')?.toLowerCase().includes('text/html');
      security.set('Content-Security-Policy',`default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'nonce-${nonce}'; style-src-attr 'none'; img-src 'self' blob: data:; media-src 'self' blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com`);
      // Only HTML pages need the nonce; API responses retain their original body.
      if(nonceHtml)body=new HTMLRewriter().on('script,style',{element(element){element.setAttribute('nonce',nonce);}}).transform(response).body;
    }
    return new Response(body,{status:response.status,statusText:response.statusText,headers:security});
  },
  // Run retention cleanup even when the app has no user traffic. Report
  // evidence is deleted after its expiry instead of lingering in object storage.
  scheduled(_controller: ScheduledController, _env: Cloudflare.Env, ctx: ExecutionContext) {
    ctx.waitUntil(cleanup());
  },
};
