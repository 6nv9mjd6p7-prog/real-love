export function focusMainContent(root:HTMLElement|null){
 if(!root)return false;
 const heading=root.querySelector<HTMLElement>('h1');
 const target=heading||root;
 if(heading){heading.tabIndex=-1;heading.classList.add('route-focus-heading');}
 target.focus({preventScroll:true});
 return !!heading;
}

export function routeFocusDecision(previousRoute:string,route:string,loaded:boolean,pending:boolean){
 const changed=!!previousRoute&&previousRoute!==route;
 const shouldFocus=changed||pending;
 return {focus:loaded&&shouldFocus,pending:!loaded&&shouldFocus};
}
