import{g as c,c as p}from"./index-G4hHUzwE.js";function s(o,a){for(var n=0;n<a.length;n++){const r=a[n];if(typeof r!="string"&&!Array.isArray(r)){for(const l in r)if(l!=="default"&&!(l in o)){const e=Object.getOwnPropertyDescriptor(r,l);e&&Object.defineProperty(o,l,e.get?e:{enumerable:!0,get:()=>r[l]})}}}return Object.freeze(Object.defineProperty(o,Symbol.toStringTag,{value:"Module"}))}var y={exports:{}};(function(o,a){(function(n){n(p)})(function(n){n.defineMode("yaml",function(){var r=["true","false","on","off","yes","no"],l=new RegExp("\\b(("+r.join(")|(")+"))$","i");return{token:function(e,i){var f=e.peek(),t=i.escaped;if(i.escaped=!1,f=="#"&&(e.pos==0||/\s/.test(e.string.charAt(e.pos-1))))return e.skipToEnd(),"comment";if(e.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/))return"string";if(i.literal&&e.indentation()>i.keyCol)return e.skipToEnd(),"string";if(i.literal&&(i.literal=!1),e.sol()){if(i.keyCol=0,i.pair=!1,i.pairStart=!1,e.match("---")||e.match("..."))return"def";if(e.match(/\s*-\s+/))return"meta"}if(e.match(/^(\{|\}|\[|\])/))return f=="{"?i.inlinePairs++:f=="}"?i.inlinePairs--:f=="["?i.inlineList++:i.inlineList--,"meta";if(i.inlineList>0&&!t&&f==",")return e.next(),"meta";if(i.inlinePairs>0&&!t&&f==",")return i.keyCol=0,i.pair=!1,i.pairStart=!1,e.next(),"meta";if(i.pairStart){if(e.match(/^\s*(\||\>)\s*/))return i.literal=!0,"meta";if(e.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i))return"variable-2";if(i.inlinePairs==0&&e.match(/^\s*-?[0-9\.\,]+\s?$/)||i.inlinePairs>0&&e.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/))return"number";if(e.match(l))return"keyword"}return!i.pair&&e.match(/^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^\s,\[\]{}#&*!|>'"%@`])[^#:]*(?=:($|\s))/)?(i.pair=!0,i.keyCol=e.indentation(),"atom"):i.pair&&e.match(/^:\s*/)?(i.pairStart=!0,"meta"):(i.pairStart=!1,i.escaped=f=="\\",e.next(),null)},startState:function(){return{pair:!1,pairStart:!1,keyCol:0,inlinePairs:0,inlineList:0,literal:!1,escaped:!1}},lineComment:"#",fold:"indent"}}),n.defineMIME("text/x-yaml","yaml"),n.defineMIME("text/yaml","yaml")})})();var u=y.exports;const d=c(u),g=s({__proto__:null,default:d},[u]);export{u as a,g as y};
