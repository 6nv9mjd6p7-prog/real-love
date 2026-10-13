/**
 * React state synchronized with account- and conversation-specific tab drafts. Changing scope loads the correct draft rather than retaining another conversation's text.
 * Reading guide: docs/CODE_READING_GUIDE.md.
 */
'use client';
import {useCallback,useEffect,useState} from 'react';
import {draftKey,readDraft,writeDraft,removeDraft,tabStorage} from './draft-storage';
export function useTabDraft(account:string,kind:string,id:string){
 const key=draftKey(account,kind,id);
 const [state,setState]=useState({key:'',value:''});
 useEffect(()=>{const raw=readDraft(tabStorage(),key,'');setState({key,value:typeof raw==='string'?raw:''});},[key]);
 const value=state.key===key?state.value:'';
 const setValue=useCallback((text:string)=>{if(text)writeDraft(tabStorage(),key,text);else removeDraft(tabStorage(),key);setState(current=>current.key===key||!current.key?{key,value:text}:current);},[key]);
 return [value,setValue] as const;
}
