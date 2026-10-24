import ts from 'typescript';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
const source=readFileSync('app/discovery-section-navigation.tsx','utf8');
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText.replace(/from ["']react\/jsx-runtime["']/,`from '${pathToFileURL(require.resolve('react/jsx-runtime')).href}'`);
const {default:Navigation}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));

for(const current of ['discover','saved']){
 let destination='';
 const tree=Navigation({current,onNavigate:route=>destination=route});
 assert.equal(tree.type,'nav');
 assert.equal(tree.props['aria-label'],'Discovery sections');
 const [explore,saved]=tree.props.children;
 assert.equal(explore.props['aria-current'],current==='discover'?'page':undefined);
 assert.equal(saved.props['aria-current'],current==='saved'?'page':undefined);
 assert.equal(explore.props['aria-pressed'],undefined);
 assert.equal(saved.props['aria-pressed'],undefined);
 saved.props.onClick();
 assert.equal(destination,'Saved');
 const html=renderToStaticMarkup(React.createElement(Navigation,{current,onNavigate:()=>{}}));
 assert.match(html,/aria-label="Discovery sections"/);
 assert.match(html,/aria-current="page"[^>]*>[^<]+<\/button>/,'rendered navigation exposes exactly one current-page button');
}
console.log('Discover and Saved are announced as current-page navigation, not pressed checkboxes.');
