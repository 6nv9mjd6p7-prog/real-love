declare namespace Cloudflare {
  interface Env {
    SUPABASE_URL?: string;
    SUPABASE_PUBLISHABLE_KEY?: string;
    PILOT_OWNER_EMAIL?: string;
    WORKSPACE_HEADER_AUTH?: string;
    WEB_PUSH_PRIVATE_JWK?: string;
    WEB_PUSH_PUBLIC_KEY?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
    RATE_LIMITER_API?: RateLimit;
    RATE_LIMITER_AUTH?: RateLimit;
  }
}
