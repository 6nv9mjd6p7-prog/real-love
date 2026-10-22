'use client';
import {useState,useSyncExternalStore} from 'react';
import {NotificationActivityList} from '../../../notification-center';
const items=[
 {id:'photo',kind:'photo_exchange',title:'Maya requested profile photo sharing',url:'#chat/maya',created:'2026-10-18T12:30:00Z',read:0,detail:'Private conversation with Maya',actionLabel:'Open chat'},
 ...Array.from({length:8},(_,i)=>({id:'message-'+i,kind:'message',title:i===0?'Maya sent you a voice note':'Maya sent you a message',url:'#chat/maya',created:new Date(Date.UTC(2026,9,18,12,28-i)).toISOString(),read:i<2?0:1,detail:'Private conversation with Maya',actionLabel:'Open chat'})),
 {id:'circle',kind:'circle_request',title:'Sam requested to join your circle',url:'#circles/weekend',created:'2026-10-18T11:00:00Z',read:0,detail:'Weekend makers',actionLabel:'Review members'}
];
const subscribe=()=>()=>{};
const clientReady=()=>true;
const serverReady=()=>false;
export default function ActivityPreview(){const [selected,setSelected]=useState('');const ready=useSyncExternalStore(subscribe,clientReady,serverReady);if(!ready)return null;return <main className="app-shell"><section className="notification-center" style={{padding:16,minWidth:0}}><h1>Notifications.</h1><p className="field-help">Fictional preview. No activity is sent or marked read.</p>{selected&&<p role="status">Opened fictional alert: {selected}</p>}<NotificationActivityList items={items} onOpen={item=>setSelected(item.id)}/></section></main>;}
