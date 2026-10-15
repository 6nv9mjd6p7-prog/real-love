import {getChatGPTUser,getLegacyUser} from './chatgpt-auth';
import {emailAuthConfig} from './email-auth';
import LoveApp from './love-app';
export const dynamic='force-dynamic';
export default async function Home(){const user=await getChatGPTUser();return <LoveApp key={user?.userId||"guest"} signedIn={!!user} accountId={user?.userId||""} emailSignIn={!!emailAuthConfig()} legacySignIn={!!await getLegacyUser()}/>;}
