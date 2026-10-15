import {notFound} from 'next/navigation';
import ChatPreviewSession from './session';

// The frame is also guarded directly so it cannot be opened in production.
export default function ChatPreviewSessionPage(){
 if(process.env.NODE_ENV==='production')notFound();
 return <ChatPreviewSession/>;
}
