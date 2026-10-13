/**
 * Server-rendered email sign-in entry. Reads authentication configuration on each request and passes only the legacy account information needed by the form.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
import {emailAuthConfig} from '../email-auth';
import {getLegacyUser} from '../chatgpt-auth';
import EmailSignIn from './sign-in';
export const dynamic='force-dynamic';
export default async function Auth(){const enabled=!!emailAuthConfig();const legacy=enabled?await getLegacyUser():null;return <main className="email-auth-page"><a className="text-button" href="/">Back to Real Love</a>{enabled?<EmailSignIn legacy={legacy?{accountId:legacy.userId,email:legacy.email}:null}/>:<section className="form-section"><h1>Email sign-in is being connected.</h1><p>Your existing profile and conversations remain available through the current sign-in.</p><a className="primary" href="/signin-with-chatgpt?return_to=/" target="_top">Existing member sign-in</a></section>}</main>;}
