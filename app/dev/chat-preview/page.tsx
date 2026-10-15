import {notFound} from 'next/navigation';
import ChatPreview from './preview';

// Keep the synthetic viewport lab out of every production deployment.
export default function ChatPreviewPage(){
 if(process.env.NODE_ENV==='production')notFound();
 return <ChatPreview/>;
}
