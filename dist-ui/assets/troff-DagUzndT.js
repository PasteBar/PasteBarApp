import{g as p,c as l}from"./index-Dh-0Ho4f.js";function d(c,u){for(var n=0;n<u.length;n++){const f=u[n];if(typeof f!="string"&&!Array.isArray(f)){for(const o in f)if(o!=="default"&&!(o in c)){const r=Object.getOwnPropertyDescriptor(f,o);r&&Object.defineProperty(c,o,r.get?r:{enumerable:!0,get:()=>f[o]})}}}return Object.freeze(Object.defineProperty(c,Symbol.toStringTag,{value:"Module"}))}var g={exports:{}};(function(c,u){(function(n){n(l)})(function(n){n.defineMode("troff",function(){var f={};function o(t){if(t.eatSpace())return null;var e=t.sol(),i=t.next();if(i==="\\")return t.match("fB")||t.match("fR")||t.match("fI")||t.match("u")||t.match("d")||t.match("%")||t.match("&")?"string":t.match("m[")?(t.skipTo("]"),t.next(),"string"):t.match("s+")||t.match("s-")?(t.eatWhile(/[\d-]/),"string"):((t.match("(")||t.match("*("))&&t.eatWhile(/[\w-]/),"string");if(e&&(i==="."||i==="'")&&t.eat("\\")&&t.eat('"'))return t.skipToEnd(),"comment";if(e&&i==="."){if(t.match("B ")||t.match("I ")||t.match("R "))return"attribute";if(t.match("TH ")||t.match("SH ")||t.match("SS ")||t.match("HP "))return t.skipToEnd(),"quote";if(t.match(/[A-Z]/)&&t.match(/[A-Z]/)||t.match(/[a-z]/)&&t.match(/[a-z]/))return"attribute"}t.eatWhile(/[\w-]/);var h=t.current();return f.hasOwnProperty(h)?f[h]:null}function r(t,e){return(e.tokens[0]||o)(t,e)}return{startState:function(){return{tokens:[]}},token:function(t,e){return r(t,e)}}}),n.defineMIME("text/troff","troff"),n.defineMIME("text/x-troff","troff"),n.defineMIME("application/x-troff","troff")})})();var a=g.exports;const x=p(a),b=d({__proto__:null,default:x},[a]);export{b as t};
