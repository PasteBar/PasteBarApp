import{g as x,c as z}from"./index-BM7NOh-V.js";function O(l,c){for(var o=0;o<c.length;o++){const i=c[o];if(typeof i!="string"&&!Array.isArray(i)){for(const f in i)if(f!=="default"&&!(f in l)){const u=Object.getOwnPropertyDescriptor(i,f);u&&Object.defineProperty(l,f,u.get?u:{enumerable:!0,get:()=>i[f]})}}}return Object.freeze(Object.defineProperty(l,Symbol.toStringTag,{value:"Module"}))}var b={exports:{}};(function(l,c){(function(o){o(z)})(function(o){o.defineMode("solr",function(){var i=/[^\s\|\!\+\-\*\?\~\^\&\:\(\)\[\]\{\}\"\\]/,f=/[\|\!\+\-\*\?\~\^\&]/,u=/^(OR|AND|NOT|TO)$/i;function k(e){return parseFloat(e).toString()===e}function g(e){return function(t,r){for(var n=!1,a;(a=t.next())!=null&&!(a==e&&!n);)n=!n&&a=="\\";return n||(r.tokenize=s),"string"}}function d(e){return function(t,r){var n="operator";return e=="+"?n+=" positive":e=="-"?n+=" negative":e=="|"?t.eat(/\|/):e=="&"?t.eat(/\&/):e=="^"&&(n+=" boost"),r.tokenize=s,n}}function v(e){return function(t,r){for(var n=e;(e=t.peek())&&e.match(i)!=null;)n+=t.next();return r.tokenize=s,u.test(n)?"operator":k(n)?"number":t.peek()==":"?"field":"string"}}function s(e,t){var r=e.next();return r=='"'?t.tokenize=g(r):f.test(r)?t.tokenize=d(r):i.test(r)&&(t.tokenize=v(r)),t.tokenize!=s?t.tokenize(e,t):null}return{startState:function(){return{tokenize:s}},token:function(e,t){return e.eatSpace()?null:t.tokenize(e,t)}}}),o.defineMIME("text/x-solr","solr")})})();var p=b.exports;const y=x(p),m=O({__proto__:null,default:y},[p]);export{m as s};
