import{g as T,r as z}from"./index-BfYH8a04.js";function F(l,s){for(var i=0;i<s.length;i++){const a=s[i];if(typeof a!="string"&&!Array.isArray(a)){for(const u in a)if(u!=="default"&&!(u in l)){const c=Object.getOwnPropertyDescriptor(a,u);c&&Object.defineProperty(l,u,c.get?c:{enumerable:!0,get:()=>a[u]})}}}return Object.freeze(Object.defineProperty(l,Symbol.toStringTag,{value:"Module"}))}var w={exports:{}};(function(l,s){(function(i){i(z())})(function(i){i.defineMode("yacas",function(a,u){function c(e){for(var r={},n=e.split(" "),o=0;o<n.length;++o)r[n[o]]=!0;return r}var g=c("Assert BackQuote D Defun Deriv For ForEach FromFile FromString Function Integrate InverseTaylor Limit LocalSymbols Macro MacroRule MacroRulePattern NIntegrate Rule RulePattern Subst TD TExplicitSum TSum Taylor Taylor1 Taylor2 Taylor3 ToFile ToStdout ToString TraceRule Until While"),k="(?:(?:\\.\\d+|\\d+\\.\\d*|\\d+)(?:[eE][+-]?\\d+)?)",f="(?:[a-zA-Z\\$'][a-zA-Z0-9\\$']*)",b=new RegExp(k),h=new RegExp(f),m=new RegExp(f+"?_"+f),y=new RegExp(f+"\\s*\\(");function p(e,r){var n;if(n=e.next(),n==='"')return r.tokenize=x,r.tokenize(e,r);if(n==="/"){if(e.eat("*"))return r.tokenize=S,r.tokenize(e,r);if(e.eat("/"))return e.skipToEnd(),"comment"}e.backUp(1);var o=e.match(/^(\w+)\s*\(/,!1);o!==null&&g.hasOwnProperty(o[1])&&r.scopes.push("bodied");var t=d(r);if(t==="bodied"&&n==="["&&r.scopes.pop(),(n==="["||n==="{"||n==="(")&&r.scopes.push(n),t=d(r),(t==="["&&n==="]"||t==="{"&&n==="}"||t==="("&&n===")")&&r.scopes.pop(),n===";")for(;t==="bodied";)r.scopes.pop(),t=d(r);return e.match(/\d+ *#/,!0,!1)?"qualifier":e.match(b,!0,!1)?"number":e.match(m,!0,!1)?"variable-3":e.match(/(?:\[|\]|{|}|\(|\))/,!0,!1)?"bracket":e.match(y,!0,!1)?(e.backUp(1),"variable"):e.match(h,!0,!1)?"variable-2":e.match(/(?:\\|\+|\-|\*|\/|,|;|\.|:|@|~|=|>|<|&|\||_|`|'|\^|\?|!|%|#)/,!0,!1)?"operator":"error"}function x(e,r){for(var n,o=!1,t=!1;(n=e.next())!=null;){if(n==='"'&&!t){o=!0;break}t=!t&&n==="\\"}return o&&!t&&(r.tokenize=p),"string"}function S(e,r){for(var n,o;(o=e.next())!=null;){if(n==="*"&&o==="/"){r.tokenize=p;break}n=o}return"comment"}function d(e){var r=null;return e.scopes.length>0&&(r=e.scopes[e.scopes.length-1]),r}return{startState:function(){return{tokenize:p,scopes:[]}},token:function(e,r){return e.eatSpace()?null:r.tokenize(e,r)},indent:function(e,r){if(e.tokenize!==p&&e.tokenize!==null)return i.Pass;var n=0;return(r==="]"||r==="];"||r==="}"||r==="};"||r===");")&&(n=-1),(e.scopes.length+n)*a.indentUnit},electricChars:"{}[]();",blockCommentStart:"/*",blockCommentEnd:"*/",lineComment:"//"}}),i.defineMIME("text/x-yacas",{name:"yacas"})})})();var v=w.exports;const E=T(v),P=F({__proto__:null,default:E},[v]);export{P as y};