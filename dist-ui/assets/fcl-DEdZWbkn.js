import{g,c as _}from"./index-BM7NOh-V.js";function E(c,a){for(var o=0;o<a.length;o++){const i=a[o];if(typeof i!="string"&&!Array.isArray(i)){for(const u in i)if(u!=="default"&&!(u in c)){const f=Object.getOwnPropertyDescriptor(i,u);f&&Object.defineProperty(c,u,f.get?f:{enumerable:!0,get:()=>i[u]})}}}return Object.freeze(Object.defineProperty(c,Symbol.toStringTag,{value:"Module"}))}var z={exports:{}};(function(c,a){(function(o){o(_)})(function(o){o.defineMode("fcl",function(i){var u=i.indentUnit,f={term:!0,method:!0,accu:!0,rule:!0,then:!0,is:!0,and:!0,or:!0,if:!0,default:!0},s={var_input:!0,var_output:!0,fuzzify:!0,defuzzify:!0,function_block:!0,ruleblock:!0},d={end_ruleblock:!0,end_defuzzify:!0,end_function_block:!0,end_fuzzify:!0,end_var:!0},k={true:!0,false:!0,nan:!0,real:!0,min:!0,max:!0,cog:!0,cogs:!0},x=/[+\-*&^%:=<>!|\/]/;function p(e,n){var t=e.next();if(/[\d\.]/.test(t))return t=="."?e.match(/^[0-9]+([eE][\-+]?[0-9]+)?/):t=="0"?e.match(/^[xX][0-9a-fA-F]+/)||e.match(/^0[0-7]+/):e.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/),"number";if(t=="/"||t=="("){if(e.eat("*"))return n.tokenize=b,b(e,n);if(e.eat("/"))return e.skipToEnd(),"comment"}if(x.test(t))return e.eatWhile(x),"operator";e.eatWhile(/[\w\$_\xa1-\uffff]/);var r=e.current().toLowerCase();return f.propertyIsEnumerable(r)||s.propertyIsEnumerable(r)||d.propertyIsEnumerable(r)?"keyword":k.propertyIsEnumerable(r)?"atom":"variable"}function b(e,n){for(var t=!1,r;r=e.next();){if((r=="/"||r==")")&&t){n.tokenize=p;break}t=r=="*"}return"comment"}function m(e,n,t,r,l){this.indented=e,this.column=n,this.type=t,this.align=r,this.prev=l}function y(e,n,t){return e.context=new m(e.indented,n,t,null,e.context)}function h(e){if(e.context.prev){var n=e.context.type;return n=="end_block"&&(e.indented=e.context.indented),e.context=e.context.prev}}return{startState:function(e){return{tokenize:null,context:new m((e||0)-u,0,"top",!1),indented:0,startOfLine:!0}},token:function(e,n){var t=n.context;if(e.sol()&&(t.align==null&&(t.align=!1),n.indented=e.indentation(),n.startOfLine=!0),e.eatSpace())return null;var r=(n.tokenize||p)(e,n);if(r=="comment")return r;t.align==null&&(t.align=!0);var l=e.current().toLowerCase();return s.propertyIsEnumerable(l)?y(n,e.column(),"end_block"):d.propertyIsEnumerable(l)&&h(n),n.startOfLine=!1,r},indent:function(e,n){if(e.tokenize!=p&&e.tokenize!=null)return 0;var t=e.context,r=d.propertyIsEnumerable(n);return t.align?t.column+(r?0:1):t.indented+(r?0:u)},electricChars:"ryk",fold:"brace",blockCommentStart:"(*",blockCommentEnd:"*)",lineComment:"//"}}),o.defineMIME("text/x-fcl","fcl")})})();var v=z.exports;const C=g(v),O=E({__proto__:null,default:C},[v]);export{O as f};
