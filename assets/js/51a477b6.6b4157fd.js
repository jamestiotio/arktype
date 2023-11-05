"use strict";(self.webpackChunkarktype_io=self.webpackChunkarktype_io||[]).push([[3050],{57522:(e,n,t)=>{t.d(n,{Zo:()=>l,kt:()=>y});var r=t(29901);function i(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function a(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){i(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function f(e,n){if(null==e)return{};var t,r,i=function(e,n){if(null==e)return{};var t,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(i[t]=e[t]);return i}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(i[t]=e[t])}return i}var c=r.createContext({}),p=function(e){var n=r.useContext(c),t=n;return e&&(t="function"==typeof e?e(n):a(a({},n),e)),t},l=function(e){var n=p(e.components);return r.createElement(c.Provider,{value:n},e.children)},s="mdxType",d={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},u=r.forwardRef((function(e,n){var t=e.components,i=e.mdxType,o=e.originalType,c=e.parentName,l=f(e,["components","mdxType","originalType","parentName"]),s=p(t),u=i,y=s["".concat(c,".").concat(u)]||s[u]||d[u]||o;return t?r.createElement(y,a(a({ref:n},l),{},{components:t})):r.createElement(y,a({ref:n},l))}));function y(e,n){var t=arguments,i=n&&n.mdxType;if("string"==typeof e||i){var o=t.length,a=new Array(o);a[0]=u;var f={};for(var c in n)hasOwnProperty.call(n,c)&&(f[c]=n[c]);f.originalType=e,f[s]="string"==typeof e?e:i,a[1]=f;for(var p=2;p<o;p++)a[p]=t[p];return r.createElement.apply(null,a)}return r.createElement.apply(null,t)}u.displayName="MDXCreateElement"},35606:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>l,contentTitle:()=>c,default:()=>y,frontMatter:()=>f,metadata:()=>p,toc:()=>s});var r=t(54805),i=t(30008),o=(t(29901),t(57522)),a=["components"],f={hide_table_of_contents:!0},c="inferDefinition",p={unversionedId:"api/inferdefinition",id:"version-1.0.26-alpha/api/inferdefinition",title:"inferDefinition",description:"text",source:"@site/versioned_docs/version-1.0.26-alpha/api/inferdefinition.md",sourceDirName:"api",slug:"/api/inferdefinition",permalink:"/docs/1.0.26-alpha/api/inferdefinition",draft:!1,tags:[],version:"1.0.26-alpha",frontMatter:{hide_table_of_contents:!0}},l={},s=[{value:"text",id:"text",level:2}],d={toc:s},u="wrapper";function y(e){var n=e.components,t=(0,i.Z)(e,a);return(0,o.kt)(u,(0,r.Z)({},d,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"inferdefinition"},"inferDefinition"),(0,o.kt)("h2",{id:"text"},"text"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"export type inferDefinition<def, $> = isAny<def> extends true\n    ? never\n    : def extends Infer<infer t> | InferredThunk<infer t>\n    ? t\n    : def extends string\n    ? inferString<def, $>\n    : def extends List\n    ? inferTuple<def, $>\n    : def extends RegExp\n    ? string\n    : def extends Dict\n    ? inferRecord<def, $>\n    : never\n")))}y.isMDXComponent=!0}}]);