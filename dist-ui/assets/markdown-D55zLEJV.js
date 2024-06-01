import{c as fi,r as oi,d as hi}from"./index-BvxQokli.js";var O={exports:{}},z;function ki(){return z||(z=1,function(ci,ti){(function(c){c(fi,oi(),hi())})(function(c){c.defineMode("markdown",function(I,u){var k=c.getMode(I,"text/html"),H=k.name=="null";function U(n){if(c.findModeByName){var i=c.findModeByName(n);i&&(n=i.mime||i.mimes[0])}var l=c.getMode(I,n);return l.name=="null"?null:l}u.highlightFormatting===void 0&&(u.highlightFormatting=!1),u.maxBlockquoteDepth===void 0&&(u.maxBlockquoteDepth=0),u.taskLists===void 0&&(u.taskLists=!1),u.strikethrough===void 0&&(u.strikethrough=!1),u.emoji===void 0&&(u.emoji=!1),u.fencedCodeBlockHighlighting===void 0&&(u.fencedCodeBlockHighlighting=!0),u.fencedCodeBlockDefaultMode===void 0&&(u.fencedCodeBlockDefaultMode="text/plain"),u.xml===void 0&&(u.xml=!0),u.tokenTypeOverrides===void 0&&(u.tokenTypeOverrides={});var f={header:"header",code:"comment",quote:"quote",list1:"variable-2",list2:"variable-3",list3:"keyword",hr:"hr",image:"image",imageAltText:"image-alt-text",imageMarker:"image-marker",formatting:"formatting",linkInline:"link",linkEmail:"link",linkText:"link",linkHref:"string",em:"em",strong:"strong",strikethrough:"strikethrough",emoji:"builtin"};for(var B in f)f.hasOwnProperty(B)&&u.tokenTypeOverrides[B]&&(f[B]=u.tokenTypeOverrides[B]);var W=/^([*\-_])(?:\s*\1){2,}\s*$/,P=/^(?:[*\-+]|^[0-9]+([.)]))\s+/,R=/^\[(x| )\](?=\s)/i,X=u.allowAtxHeaderWithoutSpace?/^(#+)/:/^(#+)(?: |$)/,G=/^ {0,3}(?:\={1,}|-{2,})\s*$/,J=/^[^#!\[\]*_\\<>` "'(~:]+/,K=/^(~~~+|```+)[ \t]*([\w\/+#-]*)[^\n`]*$/,Q=/^\s*\[[^\]]+?\]:.*$/,F=/[!"#$%&'()*+,\-.\/:;<=>?@\[\\\]^_`{|}~\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E42\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC9\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDF3C-\uDF3E]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]/,V="    ";function b(n,i,l){return i.f=i.inline=l,l(n,i)}function y(n,i,l){return i.f=i.block=l,l(n,i)}function Y(n){return!n||!/\S/.test(n.string)}function j(n){if(n.linkTitle=!1,n.linkHref=!1,n.linkText=!1,n.em=!1,n.strong=!1,n.strikethrough=!1,n.quote=0,n.indentedCode=!1,n.f==S){var i=H;if(!i){var l=c.innerMode(k,n.htmlState);i=l.mode.name=="xml"&&l.state.tagStart===null&&!l.state.context&&l.state.tokenize.isInText}i&&(n.f=d,n.block=A,n.htmlState=null)}return n.trailingSpace=0,n.trailingSpaceNewLine=!1,n.prevLine=n.thisLine,n.thisLine={stream:null},null}function A(n,i){var l=n.column()===i.indentation,o=Y(i.prevLine.stream),r=i.indentedCode,g=i.prevLine.hr,L=i.list!==!1,a=(i.listStack[i.listStack.length-1]||0)+3;i.indentedCode=!1;var D=i.indentation;if(i.indentationDiff===null&&(i.indentationDiff=i.indentation,L)){for(i.list=null;D<i.listStack[i.listStack.length-1];)i.listStack.pop(),i.listStack.length?i.indentation=i.listStack[i.listStack.length-1]:i.list=!1;i.list!==!1&&(i.indentationDiff=D-i.listStack[i.listStack.length-1])}var p=!o&&!g&&!i.prevLine.header&&(!L||!r)&&!i.prevLine.fencedCodeEnd,h=(i.list===!1||g||o)&&i.indentation<=a&&n.match(W),t=null;if(i.indentationDiff>=4&&(r||i.prevLine.fencedCodeEnd||i.prevLine.header||o))return n.skipToEnd(),i.indentedCode=!0,f.code;if(n.eatSpace())return null;if(l&&i.indentation<=a&&(t=n.match(X))&&t[1].length<=6)return i.quote=0,i.header=t[1].length,i.thisLine.header=!0,u.highlightFormatting&&(i.formatting="header"),i.f=i.inline,e(i);if(i.indentation<=a&&n.eat(">"))return i.quote=l?1:i.quote+1,u.highlightFormatting&&(i.formatting="quote"),n.eatSpace(),e(i);if(!h&&!i.setext&&l&&i.indentation<=a&&(t=n.match(P))){var T=t[1]?"ol":"ul";return i.indentation=D+n.current().length,i.list=!0,i.quote=0,i.listStack.push(i.indentation),i.em=!1,i.strong=!1,i.code=!1,i.strikethrough=!1,u.taskLists&&n.match(R,!1)&&(i.taskList=!0),i.f=i.inline,u.highlightFormatting&&(i.formatting=["list","list-"+T]),e(i)}else{if(l&&i.indentation<=a&&(t=n.match(K,!0)))return i.quote=0,i.fencedEndRE=new RegExp(t[1]+"+ *$"),i.localMode=u.fencedCodeBlockHighlighting&&U(t[2]||u.fencedCodeBlockDefaultMode),i.localMode&&(i.localState=c.startState(i.localMode)),i.f=i.block=Z,u.highlightFormatting&&(i.formatting="code-block"),i.code=-1,e(i);if(i.setext||(!p||!L)&&!i.quote&&i.list===!1&&!i.code&&!h&&!Q.test(n.string)&&(t=n.lookAhead(1))&&(t=t.match(G)))return i.setext?(i.header=i.setext,i.setext=0,n.skipToEnd(),u.highlightFormatting&&(i.formatting="header")):(i.header=t[0].charAt(0)=="="?1:2,i.setext=i.header),i.thisLine.header=!0,i.f=i.inline,e(i);if(h)return n.skipToEnd(),i.hr=!0,i.thisLine.hr=!0,f.hr;if(n.peek()==="[")return b(n,i,ni)}return b(n,i,i.inline)}function S(n,i){var l=k.token(n,i.htmlState);if(!H){var o=c.innerMode(k,i.htmlState);(o.mode.name=="xml"&&o.state.tagStart===null&&!o.state.context&&o.state.tokenize.isInText||i.md_inside&&n.current().indexOf(">")>-1)&&(i.f=d,i.block=A,i.htmlState=null)}return l}function Z(n,i){var l=i.listStack[i.listStack.length-1]||0,o=i.indentation<l,r=l+3;if(i.fencedEndRE&&i.indentation<=r&&(o||n.match(i.fencedEndRE))){u.highlightFormatting&&(i.formatting="code-block");var g;return o||(g=e(i)),i.localMode=i.localState=null,i.block=A,i.f=d,i.fencedEndRE=null,i.code=0,i.thisLine.fencedCodeEnd=!0,o?y(n,i,i.block):g}else return i.localMode?i.localMode.token(n,i.localState):(n.skipToEnd(),f.code)}function e(n){var i=[];if(n.formatting){i.push(f.formatting),typeof n.formatting=="string"&&(n.formatting=[n.formatting]);for(var l=0;l<n.formatting.length;l++)i.push(f.formatting+"-"+n.formatting[l]),n.formatting[l]==="header"&&i.push(f.formatting+"-"+n.formatting[l]+"-"+n.header),n.formatting[l]==="quote"&&(!u.maxBlockquoteDepth||u.maxBlockquoteDepth>=n.quote?i.push(f.formatting+"-"+n.formatting[l]+"-"+n.quote):i.push("error"))}if(n.taskOpen)return i.push("meta"),i.length?i.join(" "):null;if(n.taskClosed)return i.push("property"),i.length?i.join(" "):null;if(n.linkHref?i.push(f.linkHref,"url"):(n.strong&&i.push(f.strong),n.em&&i.push(f.em),n.strikethrough&&i.push(f.strikethrough),n.emoji&&i.push(f.emoji),n.linkText&&i.push(f.linkText),n.code&&i.push(f.code),n.image&&i.push(f.image),n.imageAltText&&i.push(f.imageAltText,"link"),n.imageMarker&&i.push(f.imageMarker)),n.header&&i.push(f.header,f.header+"-"+n.header),n.quote&&(i.push(f.quote),!u.maxBlockquoteDepth||u.maxBlockquoteDepth>=n.quote?i.push(f.quote+"-"+n.quote):i.push(f.quote+"-"+u.maxBlockquoteDepth)),n.list!==!1){var o=(n.listStack.length-1)%3;o?o===1?i.push(f.list2):i.push(f.list3):i.push(f.list1)}return n.trailingSpaceNewLine?i.push("trailing-space-new-line"):n.trailingSpace&&i.push("trailing-space-"+(n.trailingSpace%2?"a":"b")),i.length?i.join(" "):null}function C(n,i){if(n.match(J,!0))return e(i)}function d(n,i){var l=i.text(n,i);if(typeof l!="undefined")return l;if(i.list)return i.list=null,e(i);if(i.taskList){var o=n.match(R,!0)[1]===" ";return o?i.taskOpen=!0:i.taskClosed=!0,u.highlightFormatting&&(i.formatting="task"),i.taskList=!1,e(i)}if(i.taskOpen=!1,i.taskClosed=!1,i.header&&n.match(/^#+$/,!0))return u.highlightFormatting&&(i.formatting="header"),e(i);var r=n.next();if(i.linkTitle){i.linkTitle=!1;var g=r;r==="("&&(g=")"),g=(g+"").replace(/([.?*+^\[\]\\(){}|-])/g,"\\$1");var L="^\\s*(?:[^"+g+"\\\\]+|\\\\\\\\|\\\\.)"+g;if(n.match(new RegExp(L),!0))return f.linkHref}if(r==="`"){var a=i.formatting;u.highlightFormatting&&(i.formatting="code"),n.eatWhile("`");var D=n.current().length;if(i.code==0&&(!i.quote||D==1))return i.code=D,e(i);if(D==i.code){var p=e(i);return i.code=0,p}else return i.formatting=a,e(i)}else if(i.code)return e(i);if(r==="\\"&&(n.next(),u.highlightFormatting)){var h=e(i),t=f.formatting+"-escape";return h?h+" "+t:t}if(r==="!"&&n.match(/\[[^\]]*\] ?(?:\(|\[)/,!1))return i.imageMarker=!0,i.image=!0,u.highlightFormatting&&(i.formatting="image"),e(i);if(r==="["&&i.imageMarker&&n.match(/[^\]]*\](\(.*?\)| ?\[.*?\])/,!1))return i.imageMarker=!1,i.imageAltText=!0,u.highlightFormatting&&(i.formatting="image"),e(i);if(r==="]"&&i.imageAltText){u.highlightFormatting&&(i.formatting="image");var h=e(i);return i.imageAltText=!1,i.image=!1,i.inline=i.f=N,h}if(r==="["&&!i.image)return i.linkText&&n.match(/^.*?\]/)||(i.linkText=!0,u.highlightFormatting&&(i.formatting="link")),e(i);if(r==="]"&&i.linkText){u.highlightFormatting&&(i.formatting="link");var h=e(i);return i.linkText=!1,i.inline=i.f=n.match(/\(.*?\)| ?\[.*?\]/,!1)?N:d,h}if(r==="<"&&n.match(/^(https?|ftps?):\/\/(?:[^\\>]|\\.)+>/,!1)){i.f=i.inline=_,u.highlightFormatting&&(i.formatting="link");var h=e(i);return h?h+=" ":h="",h+f.linkInline}if(r==="<"&&n.match(/^[^> \\]+@(?:[^\\>]|\\.)+>/,!1)){i.f=i.inline=_,u.highlightFormatting&&(i.formatting="link");var h=e(i);return h?h+=" ":h="",h+f.linkEmail}if(u.xml&&r==="<"&&n.match(/^(!--|\?|!\[CDATA\[|[a-z][a-z0-9-]*(?:\s+[a-z_:.\-]+(?:\s*=\s*[^>]+)?)*\s*(?:>|$))/i,!1)){var T=n.string.indexOf(">",n.pos);if(T!=-1){var ei=n.string.substring(n.start,T);/markdown\s*=\s*('|"){0,1}1('|"){0,1}/.test(ei)&&(i.md_inside=!0)}return n.backUp(1),i.htmlState=c.startState(k),y(n,i,S)}if(u.xml&&r==="<"&&n.match(/^\/\w*?>/))return i.md_inside=!1,"tag";if(r==="*"||r==="_"){for(var q=1,m=n.pos==1?" ":n.string.charAt(n.pos-2);q<3&&n.eat(r);)q++;var E=n.peek()||" ",w=!/\s/.test(E)&&(!F.test(E)||/\s/.test(m)||F.test(m)),M=!/\s/.test(m)&&(!F.test(m)||/\s/.test(E)||F.test(E)),x=null,v=null;if(q%2&&(!i.em&&w&&(r==="*"||!M||F.test(m))?x=!0:i.em==r&&M&&(r==="*"||!w||F.test(E))&&(x=!1)),q>1&&(!i.strong&&w&&(r==="*"||!M||F.test(m))?v=!0:i.strong==r&&M&&(r==="*"||!w||F.test(E))&&(v=!1)),v!=null||x!=null){u.highlightFormatting&&(i.formatting=x==null?"strong":v==null?"em":"strong em"),x===!0&&(i.em=r),v===!0&&(i.strong=r);var p=e(i);return x===!1&&(i.em=!1),v===!1&&(i.strong=!1),p}}else if(r===" "&&(n.eat("*")||n.eat("_"))){if(n.peek()===" ")return e(i);n.backUp(1)}if(u.strikethrough){if(r==="~"&&n.eatWhile(r)){if(i.strikethrough){u.highlightFormatting&&(i.formatting="strikethrough");var p=e(i);return i.strikethrough=!1,p}else if(n.match(/^[^\s]/,!1))return i.strikethrough=!0,u.highlightFormatting&&(i.formatting="strikethrough"),e(i)}else if(r===" "&&n.match("~~",!0)){if(n.peek()===" ")return e(i);n.backUp(2)}}if(u.emoji&&r===":"&&n.match(/^(?:[a-z_\d+][a-z_\d+-]*|\-[a-z_\d+][a-z_\d+-]*):/)){i.emoji=!0,u.highlightFormatting&&(i.formatting="emoji");var ri=e(i);return i.emoji=!1,ri}return r===" "&&(n.match(/^ +$/,!1)?i.trailingSpace++:i.trailingSpace&&(i.trailingSpaceNewLine=!0)),e(i)}function _(n,i){var l=n.next();if(l===">"){i.f=i.inline=d,u.highlightFormatting&&(i.formatting="link");var o=e(i);return o?o+=" ":o="",o+f.linkInline}return n.match(/^[^>]+/,!0),f.linkInline}function N(n,i){if(n.eatSpace())return null;var l=n.next();return l==="("||l==="["?(i.f=i.inline=ii(l==="("?")":"]"),u.highlightFormatting&&(i.formatting="link-string"),i.linkHref=!0,e(i)):"error"}var s={")":/^(?:[^\\\(\)]|\\.|\((?:[^\\\(\)]|\\.)*\))*?(?=\))/,"]":/^(?:[^\\\[\]]|\\.|\[(?:[^\\\[\]]|\\.)*\])*?(?=\])/};function ii(n){return function(i,l){var o=i.next();if(o===n){l.f=l.inline=d,u.highlightFormatting&&(l.formatting="link-string");var r=e(l);return l.linkHref=!1,r}return i.match(s[n]),l.linkHref=!0,e(l)}}function ni(n,i){return n.match(/^([^\]\\]|\\.)*\]:/,!1)?(i.f=ui,n.next(),u.highlightFormatting&&(i.formatting="link"),i.linkText=!0,e(i)):b(n,i,d)}function ui(n,i){if(n.match("]:",!0)){i.f=i.inline=li,u.highlightFormatting&&(i.formatting="link");var l=e(i);return i.linkText=!1,l}return n.match(/^([^\]\\]|\\.)+/,!0),f.linkText}function li(n,i){return n.eatSpace()?null:(n.match(/^[^\s]+/,!0),n.peek()===void 0?i.linkTitle=!0:n.match(/^(?:\s+(?:"(?:[^"\\]|\\.)+"|'(?:[^'\\]|\\.)+'|\((?:[^)\\]|\\.)+\)))?/,!0),i.f=i.inline=d,f.linkHref+" url")}var $={startState:function(){return{f:A,prevLine:{stream:null},thisLine:{stream:null},block:A,htmlState:null,indentation:0,inline:d,text:C,formatting:!1,linkText:!1,linkHref:!1,linkTitle:!1,code:0,em:!1,strong:!1,header:0,setext:0,hr:!1,taskList:!1,list:!1,listStack:[],quote:0,trailingSpace:0,trailingSpaceNewLine:!1,strikethrough:!1,emoji:!1,fencedEndRE:null}},copyState:function(n){return{f:n.f,prevLine:n.prevLine,thisLine:n.thisLine,block:n.block,htmlState:n.htmlState&&c.copyState(k,n.htmlState),indentation:n.indentation,localMode:n.localMode,localState:n.localMode?c.copyState(n.localMode,n.localState):null,inline:n.inline,text:n.text,formatting:!1,linkText:n.linkText,linkTitle:n.linkTitle,linkHref:n.linkHref,code:n.code,em:n.em,strong:n.strong,strikethrough:n.strikethrough,emoji:n.emoji,header:n.header,setext:n.setext,hr:n.hr,taskList:n.taskList,list:n.list,listStack:n.listStack.slice(0),quote:n.quote,indentedCode:n.indentedCode,trailingSpace:n.trailingSpace,trailingSpaceNewLine:n.trailingSpaceNewLine,md_inside:n.md_inside,fencedEndRE:n.fencedEndRE}},token:function(n,i){if(i.formatting=!1,n!=i.thisLine.stream){if(i.header=0,i.hr=!1,n.match(/^\s*$/,!0))return j(i),null;if(i.prevLine=i.thisLine,i.thisLine={stream:n},i.taskList=!1,i.trailingSpace=0,i.trailingSpaceNewLine=!1,!i.localState&&(i.f=i.block,i.f!=S)){var l=n.match(/^\s*/,!0)[0].replace(/\t/g,V).length;if(i.indentation=l,i.indentationDiff=null,l>0)return null}}return i.f(n,i)},innerMode:function(n){return n.block==S?{state:n.htmlState,mode:k}:n.localState?{state:n.localState,mode:n.localMode}:{state:n,mode:$}},indent:function(n,i,l){return n.block==S&&k.indent?k.indent(n.htmlState,i,l):n.localState&&n.localMode.indent?n.localMode.indent(n.localState,i,l):c.Pass},blankLine:j,getType:e,blockCommentStart:"<!--",blockCommentEnd:"-->",closeBrackets:"()[]{}''\"\"``",fold:"markdown"};return $},"xml"),c.defineMIME("text/markdown","markdown"),c.defineMIME("text/x-markdown","markdown")})}()),O.exports}export{ki as r};
