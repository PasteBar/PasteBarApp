import{g as v,c as k}from"./index-D07HYTsL.js";function y(f,l){for(var o=0;o<l.length;o++){const n=l[o];if(typeof n!="string"&&!Array.isArray(n)){for(const u in n)if(u!=="default"&&!(u in f)){const c=Object.getOwnPropertyDescriptor(n,u);c&&Object.defineProperty(f,u,c.get?c:{enumerable:!0,get:()=>n[u]})}}}return Object.freeze(Object.defineProperty(f,Symbol.toStringTag,{value:"Module"}))}var T={exports:{}};(function(f,l){(function(o){o(k)})(function(o){o.defineMode("http",function(){function n(e,r){return e.skipToEnd(),r.cur=s,"error"}function u(e,r){return e.match(/^HTTP\/\d\.\d/)?(r.cur=c,"keyword"):e.match(/^[A-Z]+/)&&/[ \t]/.test(e.peek())?(r.cur=h,"keyword"):n(e,r)}function c(e,r){var i=e.match(/^\d+/);if(!i)return n(e,r);r.cur=d;var t=Number(i[0]);return t>=100&&t<200?"positive informational":t>=200&&t<300?"positive success":t>=300&&t<400?"positive redirect":t>=400&&t<500?"negative client-error":t>=500&&t<600?"negative server-error":"error"}function d(e,r){return e.skipToEnd(),r.cur=s,null}function h(e,r){return e.eatWhile(/\S/),r.cur=g,"string-2"}function g(e,r){return e.match(/^HTTP\/\d\.\d$/)?(r.cur=s,"keyword"):n(e,r)}function s(e){return e.sol()&&!e.eat(/[ \t]/)?e.match(/^.*?:/)?"atom":(e.skipToEnd(),"error"):(e.skipToEnd(),"string")}function p(e){return e.skipToEnd(),null}return{token:function(e,r){var i=r.cur;return i!=s&&i!=p&&e.eatSpace()?null:i(e,r)},blankLine:function(e){e.cur=p},startState:function(){return{cur:u}}}}),o.defineMIME("message/http","http")})})();var a=T.exports;const b=v(a),x=y({__proto__:null,default:b},[a]);export{x as h};