import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const text=readFileSync('app/love-app.tsx','utf8'),source=ts.createSourceFile('app.tsx',text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const app=source.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='LoveApp');
const statements=app.body.statements.flatMap(node=>{
 if(ts.isVariableStatement(node)){
  const declarations=node.declarationList.declarations.filter(d=>d.name.getText(source)==='peopleFilters'||(ts.isArrayBindingPattern(d.name)&&['peopleLimit','pageFilters'].includes(d.name.elements[0].name?.text)));
  return declarations.length?['const '+declarations.map(d=>d.getText(source)).join(',')+';']:[];
 }
 if(ts.isIfStatement(node)&&node.expression.getText(source).startsWith('peopleFilters.some'))return[node.getText(source)];
 return [];
});
let showMore,slice;
function visit(node){
 if(ts.isJsxAttribute(node)&&node.name.getText(source)==='onClick'&&node.initializer?.expression?.getText(source).includes('setPeopleLimit'))showMore=node.initializer.expression.getText(source);
 if(ts.isCallExpression(node)&&node.getText(source)==='shown.slice(0,peopleLimit)')slice=node.getText(source);
 ts.forEachChild(node,visit);
}visit(app);assert(showMore);assert(slice);
const fields=['search','category','interestMode','locationFilter','radiusMiles','filterMinAge','filterMaxAge','activityFilter','availabilityFilter','aceFilter','profileFilters'];
const code=`const useState=(...args)=>globalThis.__paginationHooks.useState(...args);
export default function view({filters,shown}){const {${fields.join(',')}}=filters;${statements.join('\n')}return {limit:peopleLimit,visible:${slice},showMore:${showMore}};}`;
const js=ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {default:view}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const slots=[];let index,dirty;
globalThis.__paginationHooks={useState(initial){const i=index++;if(!(i in slots))slots[i]=initial;return[slots[i],next=>{const value=typeof next==='function'?next(slots[i]):next;if(!Object.is(value,slots[i])){slots[i]=value;dirty=true;}}];}};
function render(props){for(let pass=0;pass<10;pass++){index=0;dirty=false;const result=view(props);if(!dirty)return result;}throw Error('Pagination reset did not settle');}
let props={filters:{search:'',category:'All interests',interestMode:'any',locationFilter:'any',radiusMiles:25,filterMinAge:18,filterMaxAge:99,activityFilter:'',availabilityFilter:'',aceFilter:false,profileFilters:{}},shown:Array.from({length:160},(_,id)=>({id}))};
let state=render(props);assert.equal(state.limit,50);assert.deepEqual(state.visible,props.shown.slice(0,50));
state.showMore();state=render(props);assert.equal(state.limit,100);assert.equal(state.visible.length,100);
// A refreshed result list or an unchanged filter object must preserve Show more.
props={...props,shown:[...props.shown],filters:{...props.filters}};state=render(props);assert.equal(state.limit,100);
const changes={search:'reading',category:'Literature',interestMode:'mine',locationFilter:'local',radiusMiles:50,filterMinAge:25,filterMaxAge:65,activityFilter:'Walk',availabilityFilter:'Weekends',aceFilter:true,profileFilters:{orientation:'Asexual'}};
for(const [key,value] of Object.entries(changes)){
 state.showMore();state=render(props);assert(state.limit>50);
 props={...props,filters:{...props.filters,[key]:value}};state=render(props);assert.equal(state.limit,50,`${key} resets pagination before effects`);assert.deepEqual(state.visible,props.shown.slice(0,50));
 state.showMore();state=render(props);assert.equal(state.limit,100);props={...props,filters:{...props.filters}};state=render(props);assert.equal(state.limit,100,`${key} unchanged preserves expanded results`);
}
props={...props,filters:{...props.filters,profileFilters:{...props.filters.profileFilters}}};assert.equal(render(props).limit,50,'profile-filter object replacement keeps the existing dependency identity semantics');
delete globalThis.__paginationHooks;
console.log('Discovery pagination expands by 50, resets for every filter dependency before effects, and survives unchanged-filter/result refreshes.');
