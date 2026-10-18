import {notFound} from 'next/navigation';
import ChatPreviewSession from './session';
import CirclePreview from './circle-preview';

// The frame is also guarded directly so it cannot be opened in production.
export default async function ChatPreviewSessionPage({searchParams}:{searchParams:Promise<{kind?:string}>}){
 if(process.env.NODE_ENV==='production')notFound();
 return (await searchParams).kind==='circle'?<CirclePreview/>:<ChatPreviewSession/>;
}
