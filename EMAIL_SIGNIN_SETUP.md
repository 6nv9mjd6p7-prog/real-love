# Real Love email sign-in activation

The integration is implemented but remains inactive until both runtime values are configured. Existing ChatGPT sign-in remains available while accounts migrate. No production profiles or conversations are moved or recreated.

## Required setup

1. Create a Supabase project owned by Real Love. Email authentication and new user signup must be enabled. Keep email verification required.
2. Set its Site URL to `https://real-love-connections.fetes-rowboat-0k.chatgpt.site`.
3. Configure a production SMTP sender in Supabase Authentication. The default sender only delivers to project-team addresses; it cannot serve public signups. Configure sender-domain verification with the chosen email service.
4. Change the Magic Link email template to show the OTP code rather than a magic link:

```html
<h2>Your Real Love sign-in code</h2>
<p>Enter this code in Real Love: <strong>{{ .Token }}</strong></p>
<p>If you did not request this code, you can ignore this email.</p>
```

5. Configure email OTP expiry to ten minutes and code length to six digits. Keep provider rate limits enabled.
6. Provide the Supabase project URL and **publishable key** (or legacy anon key). A service-role key is unnecessary and must not be used.
7. Configure Site runtime values `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`, then republish the existing project. Do not put credentials in source files.

## Activation checks

- Test receiving and entering a code using an address that is not a project-team member.
- A new member creates an independent profile that still awaits admission.
- The owner opens `/auth` while signed into the existing ChatGPT account, verifies the same email, and confirms their existing member ID, approval queue, conversations, and owner role remain accessible.
- Repeat linking for the existing members before encouraging them to use email-only sign-in. The form explains the linking path.
- Test sign-out, re-login, an incorrect/expired code, resend throttling, and mobile browser cookies.
- The tests mock Supabase and do not prove actual email delivery or mobile browser behavior.

## Account handling

- Account linking requires an authenticated existing account and verification of the same email address. Email alone never claims an existing member ID.
- New email accounts use stable IDs derived from the configured provider and provider user ID.
- No automatic merging occurs if someone first creates a separate independent profile; linking conflicts need deliberate resolution to avoid mixing private histories.
- Sessions use 256-bit opaque cookies, HttpOnly/Secure/SameSite=Lax, with only a SHA-256 hash stored server-side. They expire after seven days and can be revoked by logout or profile deletion.
- Existing admission, blocks, reports, circle permissions and photo consent remain attached to the original member ID.
- No Google/Apple login is included in this first integration.

## Official references

- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-smtp
