"use strict";(self.webpackChunkarktype_io=self.webpackChunkarktype_io||[]).push([[1488],{57522:(e,t,r)=>{r.d(t,{Zo:()=>d,kt:()=>b});var n=r(29901);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function o(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function l(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?o(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):o(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function i(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},o=Object.keys(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(n=0;n<o.length;n++)r=o[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var p=n.createContext({}),u=function(e){var t=n.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):l(l({},t),e)),r},d=function(e){var t=u(e.components);return n.createElement(p.Provider,{value:t},e.children)},c="mdxType",s={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,o=e.originalType,p=e.parentName,d=i(e,["components","mdxType","originalType","parentName"]),c=u(r),m=a,b=c["".concat(p,".").concat(m)]||c[m]||s[m]||o;return r?n.createElement(b,l(l({ref:t},d),{},{components:r})):n.createElement(b,l({ref:t},d))}));function b(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var o=r.length,l=new Array(o);l[0]=m;var i={};for(var p in t)hasOwnProperty.call(t,p)&&(i[p]=t[p]);i.originalType=e,i[c]="string"==typeof e?e:a,l[1]=i;for(var u=2;u<o;u++)l[u]=r[u];return n.createElement.apply(null,l)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},2849:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>d,contentTitle:()=>p,default:()=>b,frontMatter:()=>i,metadata:()=>u,toc:()=>c});var n=r(12314),a=r(6639),o=(r(29901),r(57522)),l=["components"],i={hide_table_of_contents:!0},p="validateBound",u={unversionedId:"api/validatebound",id:"version-1.0.24-alpha/api/validatebound",title:"validateBound",description:"operator",source:"@site/versioned_docs/version-1.0.24-alpha/api/validatebound.md",sourceDirName:"api",slug:"/api/validatebound",permalink:"/docs/1.0.24-alpha/api/validatebound",draft:!1,tags:[],version:"1.0.24-alpha",frontMatter:{hide_table_of_contents:!0}},d={},c=[{value:"operator",id:"operator",level:2},{value:"tableRow",id:"tablerow",level:2},{value:"description",id:"description",level:2},{value:"string",id:"string",level:2}],s={toc:c},m="wrapper";function b(e){var t=e.components,r=(0,a.Z)(e,l);return(0,o.kt)(m,(0,n.Z)({},s,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"validatebound"},"validateBound"),(0,o.kt)("h2",{id:"operator"},"operator"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},(0,o.kt)("a",{parentName:"li",href:"/docs/1.0.24-alpha/api/validatebound"},"bound"))),(0,o.kt)("h2",{id:"tablerow"},"tableRow"),(0,o.kt)("table",null,(0,o.kt)("thead",{parentName:"table"},(0,o.kt)("tr",{parentName:"thead"},(0,o.kt)("th",{parentName:"tr",align:null},"Variable"),(0,o.kt)("th",{parentName:"tr",align:null},"Description"))),(0,o.kt)("tbody",{parentName:"table"},(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"N"),(0,o.kt)("td",{parentName:"tr",align:null},"number literal")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"S"),(0,o.kt)("td",{parentName:"tr",align:null},"sized data (a number, string or array)")),(0,o.kt)("tr",{parentName:"tbody"},(0,o.kt)("td",{parentName:"tr",align:null},"<"),(0,o.kt)("td",{parentName:"tr",align:null},"Comparator (one of <, <=, ==, >=, >)")))),(0,o.kt)("h2",{id:"description"},"description"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},'Bound operators allow data to be bounded in the format "S<N", or as a Range: "N<S<N", with comparators restricted to < or <=')),(0,o.kt)("h2",{id:"string"},"string"),(0,o.kt)("ul",null,(0,o.kt)("li",{parentName:"ul"},'"N<S<N", with comparators restricted to < or <= ',(0,o.kt)("br",null)),(0,o.kt)("li",{parentName:"ul"},'const range = type("2<=number<5")',(0,o.kt)("br",null)),(0,o.kt)("li",{parentName:"ul"},'const bound = type("string[]==5")',(0,o.kt)("br",null))))}b.isMDXComponent=!0}}]);