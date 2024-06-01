import{g as W,c as I}from"./index-BvxQokli.js";function T(d,m){for(var a=0;a<m.length;a++){const f=m[a];if(typeof f!="string"&&!Array.isArray(f)){for(const o in f)if(o!=="default"&&!(o in d)){const l=Object.getOwnPropertyDescriptor(f,o);l&&Object.defineProperty(d,o,l.get?l:{enumerable:!0,get:()=>f[o]})}}}return Object.freeze(Object.defineProperty(d,Symbol.toStringTag,{value:"Module"}))}var _={exports:{}};(function(d,m){(function(a){a(I)})(function(a){a.defineMode("haskell",function(f,o){function l(e,r,t){return r(t),t(e,r)}var b=/[a-z_]/,y=/[A-Z]/,h=/\d/,F=/[0-9A-Fa-f]/,R=/[0-7]/,c=/[a-z_A-Z0-9'\xa1-\uffff]/,p=/[-!#$%&*+.\/<=>?@\\^|~:]/,k=/[(),;[\]`{}]/,g=/[ \t\v\f]/;function u(e,r){if(e.eatWhile(g))return null;var t=e.next();if(k.test(t)){if(t=="{"&&e.eat("-")){var n="comment";return e.eat("#")&&(n="meta"),l(e,r,v(n,1))}return null}if(t=="'")return e.eat("\\"),e.next(),e.eat("'")?"string":"string error";if(t=='"')return l(e,r,w);if(y.test(t))return e.eatWhile(c),e.eat(".")?"qualifier":"variable-2";if(b.test(t))return e.eatWhile(c),"variable";if(h.test(t)){if(t=="0"){if(e.eat(/[xX]/))return e.eatWhile(F),"integer";if(e.eat(/[oO]/))return e.eatWhile(R),"number"}e.eatWhile(h);var n="number";return e.match(/^\.\d+/)&&(n="number"),e.eat(/[eE]/)&&(n="number",e.eat(/[-+]/),e.eatWhile(h)),n}if(t=="."&&e.eat("."))return"keyword";if(p.test(t)){if(t=="-"&&e.eat(/-/)&&(e.eatWhile(/-/),!e.eat(p)))return e.skipToEnd(),"comment";var n="variable";return t==":"&&(n="variable-2"),e.eatWhile(p),n}return"error"}function v(e,r){return r==0?u:function(t,n){for(var i=r;!t.eol();){var s=t.next();if(s=="{"&&t.eat("-"))++i;else if(s=="-"&&t.eat("}")&&(--i,i==0))return n(u),e}return n(v(e,i)),e}}function w(e,r){for(;!e.eol();){var t=e.next();if(t=='"')return r(u),"string";if(t=="\\"){if(e.eol()||e.eat(g))return r(O),"string";e.eat("&")||e.next()}}return r(u),"string error"}function O(e,r){return e.eat("\\")?l(e,r,w):(e.next(),r(u),"error")}var x=function(){var e={};function r(i){return function(){for(var s=0;s<arguments.length;s++)e[arguments[s]]=i}}r("keyword")("case","class","data","default","deriving","do","else","foreign","if","import","in","infix","infixl","infixr","instance","let","module","newtype","of","then","type","where","_"),r("keyword")("..",":","::","=","\\","<-","->","@","~","=>"),r("builtin")("!!","$!","$","&&","+","++","-",".","/","/=","<","<*","<=","<$>","<*>","=<<","==",">",">=",">>",">>=","^","^^","||","*","*>","**"),r("builtin")("Applicative","Bool","Bounded","Char","Double","EQ","Either","Enum","Eq","False","FilePath","Float","Floating","Fractional","Functor","GT","IO","IOError","Int","Integer","Integral","Just","LT","Left","Maybe","Monad","Nothing","Num","Ord","Ordering","Rational","Read","ReadS","Real","RealFloat","RealFrac","Right","Show","ShowS","String","True"),r("builtin")("abs","acos","acosh","all","and","any","appendFile","asTypeOf","asin","asinh","atan","atan2","atanh","break","catch","ceiling","compare","concat","concatMap","const","cos","cosh","curry","cycle","decodeFloat","div","divMod","drop","dropWhile","either","elem","encodeFloat","enumFrom","enumFromThen","enumFromThenTo","enumFromTo","error","even","exp","exponent","fail","filter","flip","floatDigits","floatRadix","floatRange","floor","fmap","foldl","foldl1","foldr","foldr1","fromEnum","fromInteger","fromIntegral","fromRational","fst","gcd","getChar","getContents","getLine","head","id","init","interact","ioError","isDenormalized","isIEEE","isInfinite","isNaN","isNegativeZero","iterate","last","lcm","length","lex","lines","log","logBase","lookup","map","mapM","mapM_","max","maxBound","maximum","maybe","min","minBound","minimum","mod","negate","not","notElem","null","odd","or","otherwise","pi","pred","print","product","properFraction","pure","putChar","putStr","putStrLn","quot","quotRem","read","readFile","readIO","readList","readLn","readParen","reads","readsPrec","realToFrac","recip","rem","repeat","replicate","return","reverse","round","scaleFloat","scanl","scanl1","scanr","scanr1","seq","sequence","sequence_","show","showChar","showList","showParen","showString","shows","showsPrec","significand","signum","sin","sinh","snd","span","splitAt","sqrt","subtract","succ","sum","tail","take","takeWhile","tan","tanh","toEnum","toInteger","toRational","truncate","uncurry","undefined","unlines","until","unwords","unzip","unzip3","userError","words","writeFile","zip","zip3","zipWith","zipWith3");var t=o.overrideKeywords;if(t)for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);return e}();return{startState:function(){return{f:u}},copyState:function(e){return{f:e.f}},token:function(e,r){var t=r.f(e,function(i){r.f=i}),n=e.current();return x.hasOwnProperty(n)?x[n]:t},blockCommentStart:"{-",blockCommentEnd:"-}",lineComment:"--"}}),a.defineMIME("text/x-haskell","haskell")})})();var E=_.exports;const z=W(E),C=T({__proto__:null,default:z},[E]);export{E as a,C as h};