import{g as n,c as u,r as c,a as f}from"./index-Dh-0Ho4f.js";import{r as x}from"./overlay-Dt-dDdNq.js";import{a as m}from"./coffeescript-CLSggxac.js";import{a as g}from"./css-Bjqzbvs-.js";import{a as v}from"./sass-CmuqXt1l.js";import{a as y}from"./stylus-33ewLRuQ.js";import{a as d}from"./pug-C2dz9sel.js";import{a as $}from"./handlebars-DadgnbgZ.js";function b(r,p){for(var e=0;e<p.length;e++){const s=p[e];if(typeof s!="string"&&!Array.isArray(s)){for(const t in s)if(t!=="default"&&!(t in r)){const a=Object.getOwnPropertyDescriptor(s,t);a&&Object.defineProperty(r,t,a.get?a:{enumerable:!0,get:()=>s[t]})}}}return Object.freeze(Object.defineProperty(r,Symbol.toStringTag,{value:"Module"}))}var h={exports:{}};(function(r,p){(function(e){e(u,x(),c(),f(),m,g,v,y,d,$)})(function(e){var s={script:[["lang",/coffee(script)?/,"coffeescript"],["type",/^(?:text|application)\/(?:x-)?coffee(?:script)?$/,"coffeescript"],["lang",/^babel$/,"javascript"],["type",/^text\/babel$/,"javascript"],["type",/^text\/ecmascript-\d+$/,"javascript"]],style:[["lang",/^stylus$/i,"stylus"],["lang",/^sass$/i,"sass"],["lang",/^less$/i,"text/x-less"],["lang",/^scss$/i,"text/x-scss"],["type",/^(text\/)?(x-)?styl(us)?$/i,"stylus"],["type",/^text\/sass/i,"sass"],["type",/^(text\/)?(x-)?scss$/i,"text/x-scss"],["type",/^(text\/)?(x-)?less$/i,"text/x-less"]],template:[["lang",/^vue-template$/i,"vue"],["lang",/^pug$/i,"pug"],["lang",/^handlebars$/i,"handlebars"],["type",/^(text\/)?(x-)?pug$/i,"pug"],["type",/^text\/x-handlebars-template$/i,"handlebars"],[null,null,"vue-template"]]};e.defineMode("vue-template",function(t,a){var i={token:function(l){if(l.match(/^\{\{.*?\}\}/))return"meta mustache";for(;l.next()&&!l.match("{{",!1););return null}};return e.overlayMode(e.getMode(t,a.backdrop||"text/html"),i)}),e.defineMode("vue",function(t){return e.getMode(t,{name:"htmlmixed",tags:s})},"htmlmixed","xml","javascript","coffeescript","css","sass","stylus","pug","handlebars"),e.defineMIME("script/x-vue","vue"),e.defineMIME("text/x-vue","vue")})})();var o=h.exports;const E=n(o),A=b({__proto__:null,default:E},[o]);export{A as v};
