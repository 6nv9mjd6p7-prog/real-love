'use client';
import {useEffect,useState} from 'react';
import {clearSupportPrompts,dismissSupportPrompt,supportPromptReady,supportStorage} from './support-prompt';
export function useSupportPrompt(account:string,experienced:boolean){
 const [state,setState]=useState({account:'',show:false});
 useEffect(()=>{const storage=supportStorage();clearSupportPrompts(storage,account||undefined);setState({account,show:supportPromptReady(storage,account,experienced)});},[account,experienced]);
 function dismiss(){setState({account,show:false});dismissSupportPrompt(supportStorage(),account);}
 return {show:experienced&&state.account===account&&state.show,dismiss};
}
