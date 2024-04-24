import{g as de,c as ue}from"./index-Dh-0Ho4f.js";function pe(x,O){for(var u=0;u<O.length;u++){const d=O[u];if(typeof d!="string"&&!Array.isArray(d)){for(const g in d)if(g!=="default"&&!(g in x)){const k=Object.getOwnPropertyDescriptor(d,g);k&&Object.defineProperty(x,g,k.get?k:{enumerable:!0,get:()=>d[g]})}}}return Object.freeze(Object.defineProperty(x,Symbol.toStringTag,{value:"Module"}))}var me={exports:{}};(function(x,O){(function(u){u(ue)})(function(u){u.defineMode("css",function(t,i){var f=i.inline;i.propertyKeywords||(i=u.resolveMode("text/css"));var w=t.indentUnit,L=i.tokenHooks,ee=i.documentTypes||{},re=i.mediaTypes||{},oe=i.mediaFeatures||{},te=i.mediaValueKeywords||{},N=i.propertyKeywords||{},M=i.nonStandardPropertyKeywords||{},ie=i.fontProperties||{},ne=i.counterDescriptors||{},C=i.colorKeywords||{},I=i.valueKeywords||{},y=i.allowNested,ae=i.lineComment,le=i.supportsAtComponent===!0,X=t.highlightNonStandardPropertyKeywords!==!1,B,n;function c(e,o){return B=o,e}function se(e,o){var r=e.next();if(L[r]){var a=L[r](e,o);if(a!==!1)return a}if(r=="@")return e.eatWhile(/[\w\\\-]/),c("def",e.current());if(r=="="||(r=="~"||r=="|")&&e.eat("="))return c(null,"compare");if(r=='"'||r=="'")return o.tokenize=Y(r),o.tokenize(e,o);if(r=="#")return e.eatWhile(/[\w\\\-]/),c("atom","hash");if(r=="!")return e.match(/^\s*\w*/),c("keyword","important");if(/\d/.test(r)||r=="."&&e.eat(/\d/))return e.eatWhile(/[\w.%]/),c("number","unit");if(r==="-"){if(/[\d.]/.test(e.peek()))return e.eatWhile(/[\w.%]/),c("number","unit");if(e.match(/^-[\w\\\-]*/))return e.eatWhile(/[\w\\\-]/),e.match(/^\s*:/,!1)?c("variable-2","variable-definition"):c("variable-2","variable");if(e.match(/^\w+-/))return c("meta","meta")}else return/[,+>*\/]/.test(r)?c(null,"select-op"):r=="."&&e.match(/^-?[_a-z][_a-z0-9-]*/i)?c("qualifier","qualifier"):/[:;{}\[\]\(\)]/.test(r)?c(null,r):e.match(/^[\w-.]+(?=\()/)?(/^(url(-prefix)?|domain|regexp)$/i.test(e.current())&&(o.tokenize=ce),c("variable callee","variable")):/[\w\\\-]/.test(r)?(e.eatWhile(/[\w\\\-]/),c("property","word")):c(null,null)}function Y(e){return function(o,r){for(var a=!1,p;(p=o.next())!=null;){if(p==e&&!a){e==")"&&o.backUp(1);break}a=!a&&p=="\\"}return(p==e||!a&&e!=")")&&(r.tokenize=null),c("string","string")}}function ce(e,o){return e.next(),e.match(/^\s*[\"\')]/,!1)?o.tokenize=null:o.tokenize=Y(")"),c(null,"(")}function U(e,o,r){this.type=e,this.indent=o,this.prev=r}function s(e,o,r,a){return e.context=new U(r,o.indentation()+(a===!1?0:w),e.context),r}function m(e){return e.context.prev&&(e.context=e.context.prev),e.context.type}function v(e,o,r){return l[r.context.type](e,o,r)}function b(e,o,r,a){for(var p=a||1;p>0;p--)r.context=r.context.prev;return v(e,o,r)}function Z(e){var o=e.current().toLowerCase();I.hasOwnProperty(o)?n="atom":C.hasOwnProperty(o)?n="keyword":n="variable"}var l={};return l.top=function(e,o,r){if(e=="{")return s(r,o,"block");if(e=="}"&&r.context.prev)return m(r);if(le&&/@component/i.test(e))return s(r,o,"atComponentBlock");if(/^@(-moz-)?document$/i.test(e))return s(r,o,"documentTypes");if(/^@(media|supports|(-moz-)?document|import)$/i.test(e))return s(r,o,"atBlock");if(/^@(font-face|counter-style)/i.test(e))return r.stateArg=e,"restricted_atBlock_before";if(/^@(-(moz|ms|o|webkit)-)?keyframes$/i.test(e))return"keyframes";if(e&&e.charAt(0)=="@")return s(r,o,"at");if(e=="hash")n="builtin";else if(e=="word")n="tag";else{if(e=="variable-definition")return"maybeprop";if(e=="interpolation")return s(r,o,"interpolation");if(e==":")return"pseudo";if(y&&e=="(")return s(r,o,"parens")}return r.context.type},l.block=function(e,o,r){if(e=="word"){var a=o.current().toLowerCase();return N.hasOwnProperty(a)?(n="property","maybeprop"):M.hasOwnProperty(a)?(n=X?"string-2":"property","maybeprop"):y?(n=o.match(/^\s*:(?:\s|$)/,!1)?"property":"tag","block"):(n+=" error","maybeprop")}else return e=="meta"?"block":!y&&(e=="hash"||e=="qualifier")?(n="error","block"):l.top(e,o,r)},l.maybeprop=function(e,o,r){return e==":"?s(r,o,"prop"):v(e,o,r)},l.prop=function(e,o,r){if(e==";")return m(r);if(e=="{"&&y)return s(r,o,"propBlock");if(e=="}"||e=="{")return b(e,o,r);if(e=="(")return s(r,o,"parens");if(e=="hash"&&!/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(o.current()))n+=" error";else if(e=="word")Z(o);else if(e=="interpolation")return s(r,o,"interpolation");return"prop"},l.propBlock=function(e,o,r){return e=="}"?m(r):e=="word"?(n="property","maybeprop"):r.context.type},l.parens=function(e,o,r){return e=="{"||e=="}"?b(e,o,r):e==")"?m(r):e=="("?s(r,o,"parens"):e=="interpolation"?s(r,o,"interpolation"):(e=="word"&&Z(o),"parens")},l.pseudo=function(e,o,r){return e=="meta"?"pseudo":e=="word"?(n="variable-3",r.context.type):v(e,o,r)},l.documentTypes=function(e,o,r){return e=="word"&&ee.hasOwnProperty(o.current())?(n="tag",r.context.type):l.atBlock(e,o,r)},l.atBlock=function(e,o,r){if(e=="(")return s(r,o,"atBlock_parens");if(e=="}"||e==";")return b(e,o,r);if(e=="{")return m(r)&&s(r,o,y?"block":"top");if(e=="interpolation")return s(r,o,"interpolation");if(e=="word"){var a=o.current().toLowerCase();a=="only"||a=="not"||a=="and"||a=="or"?n="keyword":re.hasOwnProperty(a)?n="attribute":oe.hasOwnProperty(a)?n="property":te.hasOwnProperty(a)?n="keyword":N.hasOwnProperty(a)?n="property":M.hasOwnProperty(a)?n=X?"string-2":"property":I.hasOwnProperty(a)?n="atom":C.hasOwnProperty(a)?n="keyword":n="error"}return r.context.type},l.atComponentBlock=function(e,o,r){return e=="}"?b(e,o,r):e=="{"?m(r)&&s(r,o,y?"block":"top",!1):(e=="word"&&(n="error"),r.context.type)},l.atBlock_parens=function(e,o,r){return e==")"?m(r):e=="{"||e=="}"?b(e,o,r,2):l.atBlock(e,o,r)},l.restricted_atBlock_before=function(e,o,r){return e=="{"?s(r,o,"restricted_atBlock"):e=="word"&&r.stateArg=="@counter-style"?(n="variable","restricted_atBlock_before"):v(e,o,r)},l.restricted_atBlock=function(e,o,r){return e=="}"?(r.stateArg=null,m(r)):e=="word"?(r.stateArg=="@font-face"&&!ie.hasOwnProperty(o.current().toLowerCase())||r.stateArg=="@counter-style"&&!ne.hasOwnProperty(o.current().toLowerCase())?n="error":n="property","maybeprop"):"restricted_atBlock"},l.keyframes=function(e,o,r){return e=="word"?(n="variable","keyframes"):e=="{"?s(r,o,"top"):v(e,o,r)},l.at=function(e,o,r){return e==";"?m(r):e=="{"||e=="}"?b(e,o,r):(e=="word"?n="tag":e=="hash"&&(n="builtin"),"at")},l.interpolation=function(e,o,r){return e=="}"?m(r):e=="{"||e==";"?b(e,o,r):(e=="word"?n="variable":e!="variable"&&e!="("&&e!=")"&&(n="error"),"interpolation")},{startState:function(e){return{tokenize:null,state:f?"block":"top",stateArg:null,context:new U(f?"block":"top",e||0,null)}},token:function(e,o){if(!o.tokenize&&e.eatSpace())return null;var r=(o.tokenize||se)(e,o);return r&&typeof r=="object"&&(B=r[1],r=r[0]),n=r,B!="comment"&&(o.state=l[o.state](B,e,o)),n},indent:function(e,o){var r=e.context,a=o&&o.charAt(0),p=r.indent;return r.type=="prop"&&(a=="}"||a==")")&&(r=r.prev),r.prev&&(a=="}"&&(r.type=="block"||r.type=="top"||r.type=="interpolation"||r.type=="restricted_atBlock")?(r=r.prev,p=r.indent):(a==")"&&(r.type=="parens"||r.type=="atBlock_parens")||a=="{"&&(r.type=="at"||r.type=="atBlock"))&&(p=Math.max(0,r.indent-w))),p},electricChars:"}",blockCommentStart:"/*",blockCommentEnd:"*/",blockCommentContinue:" * ",lineComment:ae,fold:"brace"}});function d(t){for(var i={},f=0;f<t.length;++f)i[t[f].toLowerCase()]=!0;return i}var g=["domain","regexp","url","url-prefix"],k=d(g),A=["all","aural","braille","handheld","print","projection","screen","tty","tv","embossed"],z=d(A),F=["width","min-width","max-width","height","min-height","max-height","device-width","min-device-width","max-device-width","device-height","min-device-height","max-device-height","aspect-ratio","min-aspect-ratio","max-aspect-ratio","device-aspect-ratio","min-device-aspect-ratio","max-device-aspect-ratio","color","min-color","max-color","color-index","min-color-index","max-color-index","monochrome","min-monochrome","max-monochrome","resolution","min-resolution","max-resolution","scan","grid","orientation","device-pixel-ratio","min-device-pixel-ratio","max-device-pixel-ratio","pointer","any-pointer","hover","any-hover","prefers-color-scheme","dynamic-range","video-dynamic-range"],K=d(F),E=["landscape","portrait","none","coarse","fine","on-demand","hover","interlace","progressive","dark","light","standard","high"],S=d(E),W=["align-content","align-items","align-self","alignment-adjust","alignment-baseline","all","anchor-point","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","appearance","azimuth","backdrop-filter","backface-visibility","background","background-attachment","background-blend-mode","background-clip","background-color","background-image","background-origin","background-position","background-position-x","background-position-y","background-repeat","background-size","baseline-shift","binding","bleed","block-size","bookmark-label","bookmark-level","bookmark-state","bookmark-target","border","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","caret-color","clear","clip","color","color-profile","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","contain","content","counter-increment","counter-reset","crop","cue","cue-after","cue-before","cursor","direction","display","dominant-baseline","drop-initial-after-adjust","drop-initial-after-align","drop-initial-before-adjust","drop-initial-before-align","drop-initial-size","drop-initial-value","elevation","empty-cells","fit","fit-content","fit-position","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","float-offset","flow-from","flow-into","font","font-family","font-feature-settings","font-kerning","font-language-override","font-optical-sizing","font-size","font-size-adjust","font-stretch","font-style","font-synthesis","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-ligatures","font-variant-numeric","font-variant-position","font-variation-settings","font-weight","gap","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-rows","grid-column","grid-column-end","grid-column-gap","grid-column-start","grid-gap","grid-row","grid-row-end","grid-row-gap","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphens","icon","image-orientation","image-rendering","image-resolution","inline-box-align","inset","inset-block","inset-block-end","inset-block-start","inset-inline","inset-inline-end","inset-inline-start","isolation","justify-content","justify-items","justify-self","left","letter-spacing","line-break","line-height","line-height-step","line-stacking","line-stacking-ruby","line-stacking-shift","line-stacking-strategy","list-style","list-style-image","list-style-position","list-style-type","margin","margin-bottom","margin-left","margin-right","margin-top","marks","marquee-direction","marquee-loop","marquee-play-count","marquee-speed","marquee-style","mask-clip","mask-composite","mask-image","mask-mode","mask-origin","mask-position","mask-repeat","mask-size","mask-type","max-block-size","max-height","max-inline-size","max-width","min-block-size","min-height","min-inline-size","min-width","mix-blend-mode","move-to","nav-down","nav-index","nav-left","nav-right","nav-up","object-fit","object-position","offset","offset-anchor","offset-distance","offset-path","offset-position","offset-rotate","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-style","overflow-wrap","overflow-x","overflow-y","padding","padding-bottom","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","page-policy","pause","pause-after","pause-before","perspective","perspective-origin","pitch","pitch-range","place-content","place-items","place-self","play-during","position","presentation-level","punctuation-trim","quotes","region-break-after","region-break-before","region-break-inside","region-fragment","rendering-intent","resize","rest","rest-after","rest-before","richness","right","rotate","rotation","rotation-point","row-gap","ruby-align","ruby-overhang","ruby-position","ruby-span","scale","scroll-behavior","scroll-margin","scroll-margin-block","scroll-margin-block-end","scroll-margin-block-start","scroll-margin-bottom","scroll-margin-inline","scroll-margin-inline-end","scroll-margin-inline-start","scroll-margin-left","scroll-margin-right","scroll-margin-top","scroll-padding","scroll-padding-block","scroll-padding-block-end","scroll-padding-block-start","scroll-padding-bottom","scroll-padding-inline","scroll-padding-inline-end","scroll-padding-inline-start","scroll-padding-left","scroll-padding-right","scroll-padding-top","scroll-snap-align","scroll-snap-type","shape-image-threshold","shape-inside","shape-margin","shape-outside","size","speak","speak-as","speak-header","speak-numeral","speak-punctuation","speech-rate","stress","string-set","tab-size","table-layout","target","target-name","target-new","target-position","text-align","text-align-last","text-combine-upright","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-skip-ink","text-decoration-style","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-height","text-indent","text-justify","text-orientation","text-outline","text-overflow","text-rendering","text-shadow","text-size-adjust","text-space-collapse","text-transform","text-underline-position","text-wrap","top","touch-action","transform","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","translate","unicode-bidi","user-select","vertical-align","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","volume","white-space","widows","width","will-change","word-break","word-spacing","word-wrap","writing-mode","z-index","clip-path","clip-rule","mask","enable-background","filter","flood-color","flood-opacity","lighting-color","stop-color","stop-opacity","pointer-events","color-interpolation","color-interpolation-filters","color-rendering","fill","fill-opacity","fill-rule","image-rendering","marker","marker-end","marker-mid","marker-start","paint-order","shape-rendering","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","text-rendering","baseline-shift","dominant-baseline","glyph-orientation-horizontal","glyph-orientation-vertical","text-anchor","writing-mode"],P=d(W),$=["accent-color","aspect-ratio","border-block","border-block-color","border-block-end","border-block-end-color","border-block-end-style","border-block-end-width","border-block-start","border-block-start-color","border-block-start-style","border-block-start-width","border-block-style","border-block-width","border-inline","border-inline-color","border-inline-end","border-inline-end-color","border-inline-end-style","border-inline-end-width","border-inline-start","border-inline-start-color","border-inline-start-style","border-inline-start-width","border-inline-style","border-inline-width","content-visibility","margin-block","margin-block-end","margin-block-start","margin-inline","margin-inline-end","margin-inline-start","overflow-anchor","overscroll-behavior","padding-block","padding-block-end","padding-block-start","padding-inline","padding-inline-end","padding-inline-start","scroll-snap-stop","scrollbar-3d-light-color","scrollbar-arrow-color","scrollbar-base-color","scrollbar-dark-shadow-color","scrollbar-face-color","scrollbar-highlight-color","scrollbar-shadow-color","scrollbar-track-color","searchfield-cancel-button","searchfield-decoration","searchfield-results-button","searchfield-results-decoration","shape-inside","zoom"],_=d($),J=["font-display","font-family","src","unicode-range","font-variant","font-feature-settings","font-stretch","font-weight","font-style"],j=d(J),Q=["additive-symbols","fallback","negative","pad","prefix","range","speak-as","suffix","symbols","system"],D=d(Q),V=["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","grey","green","greenyellow","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightgrey","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","slategrey","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"],q=d(V),H=["above","absolute","activeborder","additive","activecaption","afar","after-white-space","ahead","alias","all","all-scroll","alphabetic","alternate","always","amharic","amharic-abegede","antialiased","appworkspace","arabic-indic","armenian","asterisks","attr","auto","auto-flow","avoid","avoid-column","avoid-page","avoid-region","axis-pan","background","backwards","baseline","below","bidi-override","binary","bengali","blink","block","block-axis","blur","bold","bolder","border","border-box","both","bottom","break","break-all","break-word","brightness","bullets","button","buttonface","buttonhighlight","buttonshadow","buttontext","calc","cambodian","capitalize","caps-lock-indicator","caption","captiontext","caret","cell","center","checkbox","circle","cjk-decimal","cjk-earthly-branch","cjk-heavenly-stem","cjk-ideographic","clear","clip","close-quote","col-resize","collapse","color","color-burn","color-dodge","column","column-reverse","compact","condensed","conic-gradient","contain","content","contents","content-box","context-menu","continuous","contrast","copy","counter","counters","cover","crop","cross","crosshair","cubic-bezier","currentcolor","cursive","cyclic","darken","dashed","decimal","decimal-leading-zero","default","default-button","dense","destination-atop","destination-in","destination-out","destination-over","devanagari","difference","disc","discard","disclosure-closed","disclosure-open","document","dot-dash","dot-dot-dash","dotted","double","down","drop-shadow","e-resize","ease","ease-in","ease-in-out","ease-out","element","ellipse","ellipsis","embed","end","ethiopic","ethiopic-abegede","ethiopic-abegede-am-et","ethiopic-abegede-gez","ethiopic-abegede-ti-er","ethiopic-abegede-ti-et","ethiopic-halehame-aa-er","ethiopic-halehame-aa-et","ethiopic-halehame-am-et","ethiopic-halehame-gez","ethiopic-halehame-om-et","ethiopic-halehame-sid-et","ethiopic-halehame-so-et","ethiopic-halehame-ti-er","ethiopic-halehame-ti-et","ethiopic-halehame-tig","ethiopic-numeric","ew-resize","exclusion","expanded","extends","extra-condensed","extra-expanded","fantasy","fast","fill","fill-box","fixed","flat","flex","flex-end","flex-start","footnotes","forwards","from","geometricPrecision","georgian","grayscale","graytext","grid","groove","gujarati","gurmukhi","hand","hangul","hangul-consonant","hard-light","hebrew","help","hidden","hide","higher","highlight","highlighttext","hiragana","hiragana-iroha","horizontal","hsl","hsla","hue","hue-rotate","icon","ignore","inactiveborder","inactivecaption","inactivecaptiontext","infinite","infobackground","infotext","inherit","initial","inline","inline-axis","inline-block","inline-flex","inline-grid","inline-table","inset","inside","intrinsic","invert","italic","japanese-formal","japanese-informal","justify","kannada","katakana","katakana-iroha","keep-all","khmer","korean-hangul-formal","korean-hanja-formal","korean-hanja-informal","landscape","lao","large","larger","left","level","lighter","lighten","line-through","linear","linear-gradient","lines","list-item","listbox","listitem","local","logical","loud","lower","lower-alpha","lower-armenian","lower-greek","lower-hexadecimal","lower-latin","lower-norwegian","lower-roman","lowercase","ltr","luminosity","malayalam","manipulation","match","matrix","matrix3d","media-play-button","media-slider","media-sliderthumb","media-volume-slider","media-volume-sliderthumb","medium","menu","menulist","menulist-button","menutext","message-box","middle","min-intrinsic","mix","mongolian","monospace","move","multiple","multiple_mask_images","multiply","myanmar","n-resize","narrower","ne-resize","nesw-resize","no-close-quote","no-drop","no-open-quote","no-repeat","none","normal","not-allowed","nowrap","ns-resize","numbers","numeric","nw-resize","nwse-resize","oblique","octal","opacity","open-quote","optimizeLegibility","optimizeSpeed","oriya","oromo","outset","outside","outside-shape","overlay","overline","padding","padding-box","painted","page","paused","persian","perspective","pinch-zoom","plus-darker","plus-lighter","pointer","polygon","portrait","pre","pre-line","pre-wrap","preserve-3d","progress","push-button","radial-gradient","radio","read-only","read-write","read-write-plaintext-only","rectangle","region","relative","repeat","repeating-linear-gradient","repeating-radial-gradient","repeating-conic-gradient","repeat-x","repeat-y","reset","reverse","rgb","rgba","ridge","right","rotate","rotate3d","rotateX","rotateY","rotateZ","round","row","row-resize","row-reverse","rtl","run-in","running","s-resize","sans-serif","saturate","saturation","scale","scale3d","scaleX","scaleY","scaleZ","screen","scroll","scrollbar","scroll-position","se-resize","searchfield","searchfield-cancel-button","searchfield-decoration","searchfield-results-button","searchfield-results-decoration","self-start","self-end","semi-condensed","semi-expanded","separate","sepia","serif","show","sidama","simp-chinese-formal","simp-chinese-informal","single","skew","skewX","skewY","skip-white-space","slide","slider-horizontal","slider-vertical","sliderthumb-horizontal","sliderthumb-vertical","slow","small","small-caps","small-caption","smaller","soft-light","solid","somali","source-atop","source-in","source-out","source-over","space","space-around","space-between","space-evenly","spell-out","square","square-button","start","static","status-bar","stretch","stroke","stroke-box","sub","subpixel-antialiased","svg_masks","super","sw-resize","symbolic","symbols","system-ui","table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row","table-row-group","tamil","telugu","text","text-bottom","text-top","textarea","textfield","thai","thick","thin","threeddarkshadow","threedface","threedhighlight","threedlightshadow","threedshadow","tibetan","tigre","tigrinya-er","tigrinya-er-abegede","tigrinya-et","tigrinya-et-abegede","to","top","trad-chinese-formal","trad-chinese-informal","transform","translate","translate3d","translateX","translateY","translateZ","transparent","ultra-condensed","ultra-expanded","underline","unidirectional-pan","unset","up","upper-alpha","upper-armenian","upper-greek","upper-hexadecimal","upper-latin","upper-norwegian","upper-roman","uppercase","urdu","url","var","vertical","vertical-text","view-box","visible","visibleFill","visiblePainted","visibleStroke","visual","w-resize","wait","wave","wider","window","windowframe","windowtext","words","wrap","wrap-reverse","x-large","x-small","xor","xx-large","xx-small"],T=d(H),R=g.concat(A).concat(F).concat(E).concat(W).concat($).concat(V).concat(H);u.registerHelper("hintWords","css",R);function h(t,i){for(var f=!1,w;(w=t.next())!=null;){if(f&&w=="/"){i.tokenize=null;break}f=w=="*"}return["comment","comment"]}u.defineMIME("text/css",{documentTypes:k,mediaTypes:z,mediaFeatures:K,mediaValueKeywords:S,propertyKeywords:P,nonStandardPropertyKeywords:_,fontProperties:j,counterDescriptors:D,colorKeywords:q,valueKeywords:T,tokenHooks:{"/":function(t,i){return t.eat("*")?(i.tokenize=h,h(t,i)):!1}},name:"css"}),u.defineMIME("text/x-scss",{mediaTypes:z,mediaFeatures:K,mediaValueKeywords:S,propertyKeywords:P,nonStandardPropertyKeywords:_,colorKeywords:q,valueKeywords:T,fontProperties:j,allowNested:!0,lineComment:"//",tokenHooks:{"/":function(t,i){return t.eat("/")?(t.skipToEnd(),["comment","comment"]):t.eat("*")?(i.tokenize=h,h(t,i)):["operator","operator"]},":":function(t){return t.match(/^\s*\{/,!1)?[null,null]:!1},$:function(t){return t.match(/^[\w-]+/),t.match(/^\s*:/,!1)?["variable-2","variable-definition"]:["variable-2","variable"]},"#":function(t){return t.eat("{")?[null,"interpolation"]:!1}},name:"css",helperType:"scss"}),u.defineMIME("text/x-less",{mediaTypes:z,mediaFeatures:K,mediaValueKeywords:S,propertyKeywords:P,nonStandardPropertyKeywords:_,colorKeywords:q,valueKeywords:T,fontProperties:j,allowNested:!0,lineComment:"//",tokenHooks:{"/":function(t,i){return t.eat("/")?(t.skipToEnd(),["comment","comment"]):t.eat("*")?(i.tokenize=h,h(t,i)):["operator","operator"]},"@":function(t){return t.eat("{")?[null,"interpolation"]:t.match(/^(charset|document|font-face|import|(-(moz|ms|o|webkit)-)?keyframes|media|namespace|page|supports)\b/i,!1)?!1:(t.eatWhile(/[\w\\\-]/),t.match(/^\s*:/,!1)?["variable-2","variable-definition"]:["variable-2","variable"])},"&":function(){return["atom","atom"]}},name:"css",helperType:"less"}),u.defineMIME("text/x-gss",{documentTypes:k,mediaTypes:z,mediaFeatures:K,propertyKeywords:P,nonStandardPropertyKeywords:_,fontProperties:j,counterDescriptors:D,colorKeywords:q,valueKeywords:T,supportsAtComponent:!0,tokenHooks:{"/":function(t,i){return t.eat("*")?(i.tokenize=h,h(t,i)):!1}},name:"css",helperType:"gss"})})})();var G=me.exports;const fe=de(G),he=pe({__proto__:null,default:fe},[G]);export{G as a,he as c};
