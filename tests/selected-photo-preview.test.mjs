import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {renderToStaticMarkup} from 'react-dom/server';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const source=readFileSync('app/selected-photo-preview.tsx','utf8').replace("import {useEffect,useRef} from 'react';",'const useRef=(...args)=>globalThis.__previewHooks.useRef(...args),useEffect=(...args)=>globalThis.__previewHooks.useEffect(...args);');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Preview}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const realCreate=URL.createObjectURL,realRevoke=URL.revokeObjectURL,created=[],revoked=[];
URL.createObjectURL=photo=>{const url='blob:selection-'+(created.length+1);created.push({photo,url});return url;};URL.revokeObjectURL=url=>revoked.push(url);
function mount(){const ref={current:null};let committed,pending,cleanup,lastEffect;
 globalThis.__previewHooks={useRef:()=>ref,useEffect(fn,deps){pending=!committed||deps.some((value,i)=>!Object.is(value,committed[i]))?{fn,deps}:null;}};
 return {render(photo,alt='Selected photo preview'){return Preview({photo,alt});},attach(element){ref.current=element;},commit(){if(!pending)return;cleanup?.();const {fn,deps}=pending;pending=null;committed=deps;lastEffect=fn;cleanup=fn();},replay(){cleanup?.();cleanup=lastEffect();},unmount(){cleanup?.();cleanup=null;ref.current=null;}};
}
const element=()=>({src:'',removeAttribute(name){assert.equal(name,'src');this.src='';}});
const first=new Blob(['first'],{type:'image/png'}),second=new Blob(['second'],{type:'image/webp'}),abandoned=new Blob(['abandoned']);
try{
 const app=mount(),image=element();let tree=app.render(first);assert.equal(tree.type,'img');assert.equal(tree.props.alt,'Selected photo preview');assert.equal(renderToStaticMarkup(tree),'<img alt="Selected photo preview"/>');assert.equal(created.length,0,'rendering/SSR allocates no URL');
 app.attach(image);app.commit();assert.equal(image.src,created[0].url);assert.equal(created[0].photo,first);
 tree=app.render(first,'A descriptive caption');app.commit();assert.equal(tree.props.alt,'A descriptive caption');assert.equal(created.length,1,'caption and parent renders retain the URL');
 app.render(abandoned);app.render(first);app.commit();assert.equal(created.length,1,'a discarded selection allocates no URL');assert.equal(revoked.length,0);
 app.render(second);assert.equal(created.length,1,'replacement waits until commit');app.commit();assert.deepEqual(revoked,[created[0].url]);assert.equal(image.src,created[1].url);assert.equal(created[1].photo,second);
 app.replay();assert.equal(image.src,created[2].url,'effect replay recreates the URL after cleanup');assert.deepEqual(revoked,created.slice(0,2).map(item=>item.url));
 app.unmount();assert.equal(image.src,'');assert.deepEqual(revoked,created.map(item=>item.url),'removing the preview releases every committed URL once');
 // A new composer/selection owns a fresh URL even for the same File/Blob.
 const next=mount(),nextImage=element();next.render(first);next.attach(nextImage);next.commit();assert.equal(nextImage.src,created.at(-1).url);next.unmount();assert.deepEqual(revoked,created.map(item=>item.url));
 // If no image was attached, there is no browser resource to allocate or clean up.
 const missing=mount();missing.render(first);missing.commit();missing.unmount();assert.equal(created.length,4);
}finally{URL.createObjectURL=realCreate;URL.revokeObjectURL=realRevoke;delete globalThis.__previewHooks;}
console.log('Selected photo previews allocate only after commit, retain alt text, release replaced/removed URLs and recover from effect replay without state updates.');
