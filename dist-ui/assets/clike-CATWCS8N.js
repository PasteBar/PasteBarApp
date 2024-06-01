import{g as me,c as ge}from"./index-BvxQokli.js";function ke(N,z){for(var y=0;y<z.length;y++){const g=z[y];if(typeof g!="string"&&!Array.isArray(g)){for(const m in g)if(m!=="default"&&!(m in N)){const k=Object.getOwnPropertyDescriptor(g,m);k&&Object.defineProperty(N,m,k.get?k:{enumerable:!0,get:()=>g[m]})}}}return Object.freeze(Object.defineProperty(N,Symbol.toStringTag,{value:"Module"}))}var be={exports:{}};(function(N,z){(function(y){y(ge)})(function(y){function g(e,t,n,l,u,d){this.indented=e,this.column=t,this.type=n,this.info=l,this.align=u,this.prev=d}function m(e,t,n,l){var u=e.indented;return e.context&&e.context.type=="statement"&&n!="statement"&&(u=e.context.indented),e.context=new g(u,t,n,l,null,e.context)}function k(e){var t=e.context.type;return(t==")"||t=="]"||t=="}")&&(e.indented=e.context.indented),e.context=e.context.prev}function R(e,t,n){if(t.prevToken=="variable"||t.prevToken=="type"||/\S(?:[^- ]>|[*\]])\s*$|\*$/.test(e.string.slice(0,n))||t.typeAtEndOfLine&&e.column()==e.indentation())return!0}function O(e){for(;;){if(!e||e.type=="top")return!0;if(e.type=="}"&&e.prev.info!="namespace")return!1;e=e.prev}}y.defineMode("clike",function(e,t){var n=e.indentUnit,l=t.statementIndentUnit||n,u=t.dontAlignCalls,d=t.keywords||{},M=t.types||{},oe=t.builtin||{},G=t.blockKeywords||{},ae=t.defKeywords||{},le=t.atoms||{},v=t.hooks||{},ce=t.multiLineStrings,se=t.indentStatements!==!1,ue=t.indentSwitch!==!1,H=t.namespaceSeparator,fe=t.isPunctuationChar||/[\[\]{}\(\),;\:\.]/,de=t.numberStart||/[\d\.]/,pe=t.number||/^(?:0x[a-f\d]+|0b[01]+|(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)(u|ll?|l|f)?/i,Q=t.isOperatorChar||/[+\-*&%=<>!?|\/]/,X=t.isIdentifierChar||/[\w\$_\xa1-\uffff]/,Y=t.isReservedIdentifier||!1,p,F;function Z(o,a){var i=o.next();if(v[i]){var c=v[i](o,a);if(c!==!1)return c}if(i=='"'||i=="'")return a.tokenize=he(i),a.tokenize(o,a);if(de.test(i)){if(o.backUp(1),o.match(pe))return"number";o.next()}if(fe.test(i))return p=i,null;if(i=="/"){if(o.eat("*"))return a.tokenize=J,J(o,a);if(o.eat("/"))return o.skipToEnd(),"comment"}if(Q.test(i)){for(;!o.match(/^\/[\/*]/,!1)&&o.eat(Q););return"operator"}if(o.eatWhile(X),H)for(;o.match(H);)o.eatWhile(X);var f=o.current();return b(d,f)?(b(G,f)&&(p="newstatement"),b(ae,f)&&(F=!0),"keyword"):b(M,f)?"type":b(oe,f)||Y&&Y(f)?(b(G,f)&&(p="newstatement"),"builtin"):b(le,f)?"atom":"variable"}function he(o){return function(a,i){for(var c=!1,f,I=!1;(f=a.next())!=null;){if(f==o&&!c){I=!0;break}c=!c&&f=="\\"}return(I||!(c||ce))&&(i.tokenize=null),"string"}}function J(o,a){for(var i=!1,c;c=o.next();){if(c=="/"&&i){a.tokenize=null;break}i=c=="*"}return"comment"}function ee(o,a){t.typeFirstDefinitions&&o.eol()&&O(a.context)&&(a.typeAtEndOfLine=R(o,a,o.pos))}return{startState:function(o){return{tokenize:null,context:new g((o||0)-n,0,"top",null,!1),indented:0,startOfLine:!0,prevToken:null}},token:function(o,a){var i=a.context;if(o.sol()&&(i.align==null&&(i.align=!1),a.indented=o.indentation(),a.startOfLine=!0),o.eatSpace())return ee(o,a),null;p=F=null;var c=(a.tokenize||Z)(o,a);if(c=="comment"||c=="meta")return c;if(i.align==null&&(i.align=!0),p==";"||p==":"||p==","&&o.match(/^\s*(?:\/\/.*)?$/,!1))for(;a.context.type=="statement";)k(a);else if(p=="{")m(a,o.column(),"}");else if(p=="[")m(a,o.column(),"]");else if(p=="(")m(a,o.column(),")");else if(p=="}"){for(;i.type=="statement";)i=k(a);for(i.type=="}"&&(i=k(a));i.type=="statement";)i=k(a)}else p==i.type?k(a):se&&((i.type=="}"||i.type=="top")&&p!=";"||i.type=="statement"&&p=="newstatement")&&m(a,o.column(),"statement",o.current());if(c=="variable"&&(a.prevToken=="def"||t.typeFirstDefinitions&&R(o,a,o.start)&&O(a.context)&&o.match(/^\s*\(/,!1))&&(c="def"),v.token){var f=v.token(o,a,c);f!==void 0&&(c=f)}return c=="def"&&t.styleDefs===!1&&(c="variable"),a.startOfLine=!1,a.prevToken=F?"def":c||p,ee(o,a),c},indent:function(o,a){if(o.tokenize!=Z&&o.tokenize!=null||o.typeAtEndOfLine&&O(o.context))return y.Pass;var i=o.context,c=a&&a.charAt(0),f=c==i.type;if(i.type=="statement"&&c=="}"&&(i=i.prev),t.dontIndentStatements)for(;i.type=="statement"&&t.dontIndentStatements.test(i.info);)i=i.prev;if(v.indent){var I=v.indent(o,i,a,n);if(typeof I=="number")return I}var ye=i.prev&&i.prev.info=="switch";if(t.allmanIndentation&&/[{(]/.test(c)){for(;i.type!="top"&&i.type!="}";)i=i.prev;return i.indented}return i.type=="statement"?i.indented+(c=="{"?0:l):i.align&&(!u||i.type!=")")?i.column+(f?0:1):i.type==")"&&!f?i.indented+l:i.indented+(f?0:n)+(!f&&ye&&!/^(?:case|default)\b/.test(a)?n:0)},electricInput:ue?/^\s*(?:case .*?:|default:|\{\}?|\})$/:/^\s*[{}]$/,blockCommentStart:"/*",blockCommentEnd:"*/",blockCommentContinue:" * ",lineComment:"//",fold:"brace"}});function r(e){for(var t={},n=e.split(" "),l=0;l<n.length;++l)t[n[l]]=!0;return t}function b(e,t){return typeof e=="function"?e(t):e.propertyIsEnumerable(t)}var _="auto if break case register continue return default do sizeof static else struct switch extern typedef union for goto while enum const volatile inline restrict asm fortran",j="alignas alignof and and_eq audit axiom bitand bitor catch class compl concept constexpr const_cast decltype delete dynamic_cast explicit export final friend import module mutable namespace new noexcept not not_eq operator or or_eq override private protected public reinterpret_cast requires static_assert static_cast template this thread_local throw try typeid typename using virtual xor xor_eq",U="bycopy byref in inout oneway out self super atomic nonatomic retain copy readwrite readonly strong weak assign typeof nullable nonnull null_resettable _cmd @interface @implementation @end @protocol @encode @property @synthesize @dynamic @class @public @package @private @protected @required @optional @try @catch @finally @import @selector @encode @defs @synchronized @autoreleasepool @compatibility_alias @available",B="FOUNDATION_EXPORT FOUNDATION_EXTERN NS_INLINE NS_FORMAT_FUNCTION  NS_RETURNS_RETAINEDNS_ERROR_ENUM NS_RETURNS_NOT_RETAINED NS_RETURNS_INNER_POINTER NS_DESIGNATED_INITIALIZER NS_ENUM NS_OPTIONS NS_REQUIRES_NIL_TERMINATION NS_ASSUME_NONNULL_BEGIN NS_ASSUME_NONNULL_END NS_SWIFT_NAME NS_REFINED_FOR_SWIFT",ne=r("int long char short double float unsigned signed void bool"),re=r("SEL instancetype id Class Protocol BOOL");function S(e){return b(ne,e)||/.+_t$/.test(e)}function A(e){return S(e)||b(re,e)}var T="case do else for if switch while struct enum union",L="struct enum union";function w(e,t){if(!t.startOfLine)return!1;for(var n,l=null;n=e.peek();){if(n=="\\"&&e.match(/^.$/)){l=w;break}else if(n=="/"&&e.match(/^\/[\/\*]/,!1))break;e.next()}return t.tokenize=l,"meta"}function D(e,t){return t.prevToken=="type"?"type":!1}function P(e){return!e||e.length<2||e[0]!="_"?!1:e[1]=="_"||e[1]!==e[1].toLowerCase()}function s(e){return e.eatWhile(/[\w\.']/),"number"}function x(e,t){if(e.backUp(1),e.match(/^(?:R|u8R|uR|UR|LR)/)){var n=e.match(/^"([^\s\\()]{0,16})\(/);return n?(t.cpp11RawStringDelim=n[1],t.tokenize=q,q(e,t)):!1}return e.match(/^(?:u8|u|U|L)/)?e.match(/^["']/,!1)?"string":!1:(e.next(),!1)}function K(e){var t=/(\w+)::~?(\w+)$/.exec(e);return t&&t[1]==t[2]}function $(e,t){for(var n;(n=e.next())!=null;)if(n=='"'&&!e.eat('"')){t.tokenize=null;break}return"string"}function q(e,t){var n=t.cpp11RawStringDelim.replace(/[^\w\s]/g,"\\$&"),l=e.match(new RegExp(".*?\\)"+n+'"'));return l?t.tokenize=null:e.skipToEnd(),"string"}function h(e,t){typeof e=="string"&&(e=[e]);var n=[];function l(d){if(d)for(var M in d)d.hasOwnProperty(M)&&n.push(M)}l(t.keywords),l(t.types),l(t.builtin),l(t.atoms),n.length&&(t.helperType=e[0],y.registerHelper("hintWords",e[0],n));for(var u=0;u<e.length;++u)y.defineMIME(e[u],t)}h(["text/x-csrc","text/x-c","text/x-chdr"],{name:"clike",keywords:r(_),types:S,blockKeywords:r(T),defKeywords:r(L),typeFirstDefinitions:!0,atoms:r("NULL true false"),isReservedIdentifier:P,hooks:{"#":w,"*":D},modeProps:{fold:["brace","include"]}}),h(["text/x-c++src","text/x-c++hdr"],{name:"clike",keywords:r(_+" "+j),types:S,blockKeywords:r(T+" class try catch"),defKeywords:r(L+" class namespace"),typeFirstDefinitions:!0,atoms:r("true false NULL nullptr"),dontIndentStatements:/^template$/,isIdentifierChar:/[\w\$_~\xa1-\uffff]/,isReservedIdentifier:P,hooks:{"#":w,"*":D,u:x,U:x,L:x,R:x,0:s,1:s,2:s,3:s,4:s,5:s,6:s,7:s,8:s,9:s,token:function(e,t,n){if(n=="variable"&&e.peek()=="("&&(t.prevToken==";"||t.prevToken==null||t.prevToken=="}")&&K(e.current()))return"def"}},namespaceSeparator:"::",modeProps:{fold:["brace","include"]}}),h("text/x-java",{name:"clike",keywords:r("abstract assert break case catch class const continue default do else enum extends final finally for goto if implements import instanceof interface native new package private protected public return static strictfp super switch synchronized this throw throws transient try volatile while @interface"),types:r("var byte short int long float double boolean char void Boolean Byte Character Double Float Integer Long Number Object Short String StringBuffer StringBuilder Void"),blockKeywords:r("catch class do else finally for if switch try while"),defKeywords:r("class interface enum @interface"),typeFirstDefinitions:!0,atoms:r("true false null"),number:/^(?:0x[a-f\d_]+|0b[01_]+|(?:[\d_]+\.?\d*|\.\d+)(?:e[-+]?[\d_]+)?)(u|ll?|l|f)?/i,hooks:{"@":function(e){return e.match("interface",!1)?!1:(e.eatWhile(/[\w\$_]/),"meta")},'"':function(e,t){return e.match(/""$/)?(t.tokenize=V,t.tokenize(e,t)):!1}},modeProps:{fold:["brace","import"]}}),h("text/x-csharp",{name:"clike",keywords:r("abstract as async await base break case catch checked class const continue default delegate do else enum event explicit extern finally fixed for foreach goto if implicit in init interface internal is lock namespace new operator out override params private protected public readonly record ref required return sealed sizeof stackalloc static struct switch this throw try typeof unchecked unsafe using virtual void volatile while add alias ascending descending dynamic from get global group into join let orderby partial remove select set value var yield"),types:r("Action Boolean Byte Char DateTime DateTimeOffset Decimal Double Func Guid Int16 Int32 Int64 Object SByte Single String Task TimeSpan UInt16 UInt32 UInt64 bool byte char decimal double short int long object sbyte float string ushort uint ulong"),blockKeywords:r("catch class do else finally for foreach if struct switch try while"),defKeywords:r("class interface namespace record struct var"),typeFirstDefinitions:!0,atoms:r("true false null"),hooks:{"@":function(e,t){return e.eat('"')?(t.tokenize=$,$(e,t)):(e.eatWhile(/[\w\$_]/),"meta")}}});function V(e,t){for(var n=!1;!e.eol();){if(!n&&e.match('"""')){t.tokenize=null;break}n=e.next()=="\\"&&!n}return"string"}function E(e){return function(t,n){for(var l;l=t.next();)if(l=="*"&&t.eat("/"))if(e==1){n.tokenize=null;break}else return n.tokenize=E(e-1),n.tokenize(t,n);else if(l=="/"&&t.eat("*"))return n.tokenize=E(e+1),n.tokenize(t,n);return"comment"}}h("text/x-scala",{name:"clike",keywords:r("abstract case catch class def do else extends final finally for forSome if implicit import lazy match new null object override package private protected return sealed super this throw trait try type val var while with yield _ assert assume require print println printf readLine readBoolean readByte readShort readChar readInt readLong readFloat readDouble"),types:r("AnyVal App Application Array BufferedIterator BigDecimal BigInt Char Console Either Enumeration Equiv Error Exception Fractional Function IndexedSeq Int Integral Iterable Iterator List Map Numeric Nil NotNull Option Ordered Ordering PartialFunction PartialOrdering Product Proxy Range Responder Seq Serializable Set Specializable Stream StringBuilder StringContext Symbol Throwable Traversable TraversableOnce Tuple Unit Vector Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable Compiler Double Exception Float Integer Long Math Number Object Package Pair Process Runtime Runnable SecurityManager Short StackTraceElement StrictMath String StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void"),multiLineStrings:!0,blockKeywords:r("catch class enum do else finally for forSome if match switch try while"),defKeywords:r("class enum def object package trait type val var"),atoms:r("true false null"),indentStatements:!1,indentSwitch:!1,isOperatorChar:/[+\-*&%=<>!?|\/#:@]/,hooks:{"@":function(e){return e.eatWhile(/[\w\$_]/),"meta"},'"':function(e,t){return e.match('""')?(t.tokenize=V,t.tokenize(e,t)):!1},"'":function(e){return e.match(/^(\\[^'\s]+|[^\\'])'/)?"string-2":(e.eatWhile(/[\w\$_\xa1-\uffff]/),"atom")},"=":function(e,t){var n=t.context;return n.type=="}"&&n.align&&e.eat(">")?(t.context=new g(n.indented,n.column,n.type,n.info,null,n.prev),"operator"):!1},"/":function(e,t){return e.eat("*")?(t.tokenize=E(1),t.tokenize(e,t)):!1}},modeProps:{closeBrackets:{pairs:'()[]{}""',triples:'"'}}});function ie(e){return function(t,n){for(var l=!1,u,d=!1;!t.eol();){if(!e&&!l&&t.match('"')){d=!0;break}if(e&&t.match('"""')){d=!0;break}u=t.next(),!l&&u=="$"&&t.match("{")&&t.skipTo("}"),l=!l&&u=="\\"&&!e}return(d||!e)&&(n.tokenize=null),"string"}}h("text/x-kotlin",{name:"clike",keywords:r("package as typealias class interface this super val operator var fun for is in This throw return annotation break continue object if else while do try when !in !is as? file import where by get set abstract enum open inner override private public internal protected catch finally out final vararg reified dynamic companion constructor init sealed field property receiver param sparam lateinit data inline noinline tailrec external annotation crossinline const operator infix suspend actual expect setparam value"),types:r("Boolean Byte Character CharSequence Class ClassLoader Cloneable Comparable Compiler Double Exception Float Integer Long Math Number Object Package Pair Process Runtime Runnable SecurityManager Short StackTraceElement StrictMath String StringBuffer System Thread ThreadGroup ThreadLocal Throwable Triple Void Annotation Any BooleanArray ByteArray Char CharArray DeprecationLevel DoubleArray Enum FloatArray Function Int IntArray Lazy LazyThreadSafetyMode LongArray Nothing ShortArray Unit"),intendSwitch:!1,indentStatements:!1,multiLineStrings:!0,number:/^(?:0x[a-f\d_]+|0b[01_]+|(?:[\d_]+(\.\d+)?|\.\d+)(?:e[-+]?[\d_]+)?)(u|ll?|l|f)?/i,blockKeywords:r("catch class do else finally for if where try while enum"),defKeywords:r("class val var object interface fun"),atoms:r("true false null this"),hooks:{"@":function(e){return e.eatWhile(/[\w\$_]/),"meta"},"*":function(e,t){return t.prevToken=="."?"variable":"operator"},'"':function(e,t){return t.tokenize=ie(e.match('""')),t.tokenize(e,t)},"/":function(e,t){return e.eat("*")?(t.tokenize=E(1),t.tokenize(e,t)):!1},indent:function(e,t,n,l){var u=n&&n.charAt(0);if((e.prevToken=="}"||e.prevToken==")")&&n=="")return e.indented;if(e.prevToken=="operator"&&n!="}"&&e.context.type!="}"||e.prevToken=="variable"&&u=="."||(e.prevToken=="}"||e.prevToken==")")&&u==".")return l*2+t.indented;if(t.align&&t.type=="}")return t.indented+(e.context.type==(n||"").charAt(0)?0:l)}},modeProps:{closeBrackets:{triples:'"'}}}),h(["x-shader/x-vertex","x-shader/x-fragment"],{name:"clike",keywords:r("sampler1D sampler2D sampler3D samplerCube sampler1DShadow sampler2DShadow const attribute uniform varying break continue discard return for while do if else struct in out inout"),types:r("float int bool void vec2 vec3 vec4 ivec2 ivec3 ivec4 bvec2 bvec3 bvec4 mat2 mat3 mat4"),blockKeywords:r("for while do if else struct"),builtin:r("radians degrees sin cos tan asin acos atan pow exp log exp2 sqrt inversesqrt abs sign floor ceil fract mod min max clamp mix step smoothstep length distance dot cross normalize ftransform faceforward reflect refract matrixCompMult lessThan lessThanEqual greaterThan greaterThanEqual equal notEqual any all not texture1D texture1DProj texture1DLod texture1DProjLod texture2D texture2DProj texture2DLod texture2DProjLod texture3D texture3DProj texture3DLod texture3DProjLod textureCube textureCubeLod shadow1D shadow2D shadow1DProj shadow2DProj shadow1DLod shadow2DLod shadow1DProjLod shadow2DProjLod dFdx dFdy fwidth noise1 noise2 noise3 noise4"),atoms:r("true false gl_FragColor gl_SecondaryColor gl_Normal gl_Vertex gl_MultiTexCoord0 gl_MultiTexCoord1 gl_MultiTexCoord2 gl_MultiTexCoord3 gl_MultiTexCoord4 gl_MultiTexCoord5 gl_MultiTexCoord6 gl_MultiTexCoord7 gl_FogCoord gl_PointCoord gl_Position gl_PointSize gl_ClipVertex gl_FrontColor gl_BackColor gl_FrontSecondaryColor gl_BackSecondaryColor gl_TexCoord gl_FogFragCoord gl_FragCoord gl_FrontFacing gl_FragData gl_FragDepth gl_ModelViewMatrix gl_ProjectionMatrix gl_ModelViewProjectionMatrix gl_TextureMatrix gl_NormalMatrix gl_ModelViewMatrixInverse gl_ProjectionMatrixInverse gl_ModelViewProjectionMatrixInverse gl_TextureMatrixTranspose gl_ModelViewMatrixInverseTranspose gl_ProjectionMatrixInverseTranspose gl_ModelViewProjectionMatrixInverseTranspose gl_TextureMatrixInverseTranspose gl_NormalScale gl_DepthRange gl_ClipPlane gl_Point gl_FrontMaterial gl_BackMaterial gl_LightSource gl_LightModel gl_FrontLightModelProduct gl_BackLightModelProduct gl_TextureColor gl_EyePlaneS gl_EyePlaneT gl_EyePlaneR gl_EyePlaneQ gl_FogParameters gl_MaxLights gl_MaxClipPlanes gl_MaxTextureUnits gl_MaxTextureCoords gl_MaxVertexAttribs gl_MaxVertexUniformComponents gl_MaxVaryingFloats gl_MaxVertexTextureImageUnits gl_MaxTextureImageUnits gl_MaxFragmentUniformComponents gl_MaxCombineTextureImageUnits gl_MaxDrawBuffers"),indentSwitch:!1,hooks:{"#":w},modeProps:{fold:["brace","include"]}}),h("text/x-nesc",{name:"clike",keywords:r(_+" as atomic async call command component components configuration event generic implementation includes interface module new norace nx_struct nx_union post provides signal task uses abstract extends"),types:S,blockKeywords:r(T),atoms:r("null true false"),hooks:{"#":w},modeProps:{fold:["brace","include"]}}),h("text/x-objectivec",{name:"clike",keywords:r(_+" "+U),types:A,builtin:r(B),blockKeywords:r(T+" @synthesize @try @catch @finally @autoreleasepool @synchronized"),defKeywords:r(L+" @interface @implementation @protocol @class"),dontIndentStatements:/^@.*$/,typeFirstDefinitions:!0,atoms:r("YES NO NULL Nil nil true false nullptr"),isReservedIdentifier:P,hooks:{"#":w,"*":D},modeProps:{fold:["brace","include"]}}),h("text/x-objectivec++",{name:"clike",keywords:r(_+" "+U+" "+j),types:A,builtin:r(B),blockKeywords:r(T+" @synthesize @try @catch @finally @autoreleasepool @synchronized class try catch"),defKeywords:r(L+" @interface @implementation @protocol @class class namespace"),dontIndentStatements:/^@.*$|^template$/,typeFirstDefinitions:!0,atoms:r("YES NO NULL Nil nil true false nullptr"),isReservedIdentifier:P,hooks:{"#":w,"*":D,u:x,U:x,L:x,R:x,0:s,1:s,2:s,3:s,4:s,5:s,6:s,7:s,8:s,9:s,token:function(e,t,n){if(n=="variable"&&e.peek()=="("&&(t.prevToken==";"||t.prevToken==null||t.prevToken=="}")&&K(e.current()))return"def"}},namespaceSeparator:"::",modeProps:{fold:["brace","include"]}}),h("text/x-squirrel",{name:"clike",keywords:r("base break clone continue const default delete enum extends function in class foreach local resume return this throw typeof yield constructor instanceof static"),types:S,blockKeywords:r("case catch class else for foreach if switch try while"),defKeywords:r("function local class"),typeFirstDefinitions:!0,atoms:r("true false null"),hooks:{"#":w},modeProps:{fold:["brace","include"]}});var C=null;function W(e){return function(t,n){for(var l=!1,u,d=!1;!t.eol();){if(!l&&t.match('"')&&(e=="single"||t.match('""'))){d=!0;break}if(!l&&t.match("``")){C=W(e),d=!0;break}u=t.next(),l=e=="single"&&!l&&u=="\\"}return d&&(n.tokenize=null),"string"}}h("text/x-ceylon",{name:"clike",keywords:r("abstracts alias assembly assert assign break case catch class continue dynamic else exists extends finally for function given if import in interface is let module new nonempty object of out outer package return satisfies super switch then this throw try value void while"),types:function(e){var t=e.charAt(0);return t===t.toUpperCase()&&t!==t.toLowerCase()},blockKeywords:r("case catch class dynamic else finally for function if interface module new object switch try while"),defKeywords:r("class dynamic function interface module object package value"),builtin:r("abstract actual aliased annotation by default deprecated doc final formal late license native optional sealed see serializable shared suppressWarnings tagged throws variable"),isPunctuationChar:/[\[\]{}\(\),;\:\.`]/,isOperatorChar:/[+\-*&%=<>!?|^~:\/]/,numberStart:/[\d#$]/,number:/^(?:#[\da-fA-F_]+|\$[01_]+|[\d_]+[kMGTPmunpf]?|[\d_]+\.[\d_]+(?:[eE][-+]?\d+|[kMGTPmunpf]|)|)/i,multiLineStrings:!0,typeFirstDefinitions:!0,atoms:r("true false null larger smaller equal empty finished"),indentSwitch:!1,styleDefs:!1,hooks:{"@":function(e){return e.eatWhile(/[\w\$_]/),"meta"},'"':function(e,t){return t.tokenize=W(e.match('""')?"triple":"single"),t.tokenize(e,t)},"`":function(e,t){return!C||!e.match("`")?!1:(t.tokenize=C,C=null,t.tokenize(e,t))},"'":function(e){return e.eatWhile(/[\w\$_\xa1-\uffff]/),"atom"},token:function(e,t,n){if((n=="variable"||n=="type")&&t.prevToken==".")return"variable-2"}},modeProps:{fold:["brace","import"],closeBrackets:{triples:'"'}}})})})();var te=be.exports;const we=me(te),ve=ke({__proto__:null,default:we},[te]);export{te as a,ve as c};
