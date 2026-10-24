import ts from 'typescript';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
// Workspace identity headers are trusted only where the Sites dispatcher controls them.
const compile=s=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const source=readFileSync('app/chatgpt-auth.ts','utf8')
 .replace("import {env} from 'cloudflare:workers';",'const env=globalThis.__authEnv;')
 .replace("import {getEmailUser} from './email-auth';",'const getEmailUser=async()=>null;')
 .replace('import { headers } from "next/headers";','const headers=async()=>globalThis.__authHeaders;')
 .replace('import { redirect } from "next/navigation";','const redirect=()=>{throw Error("redirect");};');
const authEnv={};globalThis.__authEnv=authEnv;
const {getChatGPTUser}=await import(compile(source));
globalThis.__authHeaders=new Headers({'oai-authenticated-user-id':'forged-id','oai-authenticated-user-email':'owner@example.test'});
assert.equal((await getChatGPTUser())?.userId,'forged-id','on Sites the dispatcher-set headers identify the member');
authEnv.WORKSPACE_HEADER_AUTH='off';
assert.equal(await getChatGPTUser(),null,'with workspace header auth off, client-sent headers never sign anyone in');
