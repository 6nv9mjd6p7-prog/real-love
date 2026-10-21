import {emailAuthConfig} from '../email-auth';
import {getLegacyUser} from '../chatgpt-auth';
import EmailSignIn from './sign-in';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function Auth(){const enabled=!!emailAuthConfig();const legacy=enabled?await getLegacyUser():null;return <main className="email-auth-page"><Link className="text-button" href="/">Back to Real Love</Link>{enabled?<EmailSignIn legacy={legacy?{accountId:legacy.userId,email:legacy.email}:null}/>:<section className="form-section"><h1>Email sign-in is being connected.</h1><p>Your existing profile and conversations remain available through the current sign-in.</p><a className="primary" href="/signin-with-chatgpt?return_to=/" target="_top">Existing member sign-in</a></section>}</main>;}
