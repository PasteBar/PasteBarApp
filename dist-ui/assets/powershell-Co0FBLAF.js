import{g as H,c as W}from"./index-DBIou6Yy.js";function L(l,f){for(var u=0;u<f.length;u++){const i=f[u];if(typeof i!="string"&&!Array.isArray(i)){for(const c in i)if(c!=="default"&&!(c in l)){const s=Object.getOwnPropertyDescriptor(i,c);s&&Object.defineProperty(l,c,s.get?s:{enumerable:!0,get:()=>i[c]})}}}return Object.freeze(Object.defineProperty(l,Symbol.toStringTag,{value:"Module"}))}var V={exports:{}};(function(l,f){(function(u){u(W)})(function(u){u.defineMode("powershell",function(){function i(e,r){r=r||{};for(var n=r.prefix!==void 0?r.prefix:"^",o=r.suffix!==void 0?r.suffix:"\\b",t=0;t<e.length;t++)e[t]instanceof RegExp?e[t]=e[t].source:e[t]=e[t].replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&");return new RegExp(n+"("+e.join("|")+")"+o,"i")}var c="(?=[^A-Za-z\\d\\-_]|$)",s=/[\w\-:]/,h=i([/begin|break|catch|continue|data|default|do|dynamicparam/,/else|elseif|end|exit|filter|finally|for|foreach|from|function|if|in/,/param|process|return|switch|throw|trap|try|until|where|while/],{suffix:c}),k=/[\[\]{},;`\\\.]|@[({]/,x=i(["f",/b?not/,/[ic]?split/,"join",/is(not)?/,"as",/[ic]?(eq|ne|[gl][te])/,/[ic]?(not)?(like|match|contains)/,/[ic]?replace/,/b?(and|or|xor)/],{prefix:"-"}),E=/[+\-*\/%]=|\+\+|--|\.\.|[+\-*&^%:=!|\/]|<(?!#)|(?!#)>/,y=i([x,E],{suffix:""}),w=/^((0x[\da-f]+)|((\d+\.\d+|\d\.|\.\d+|\d+)(e[\+\-]?\d+)?))[ld]?([kmgtp]b)?/i,M=/^[A-Za-z\_][A-Za-z\-\_\d]*\b/,R=/[A-Z]:|%|\?/i,I=i([/Add-(Computer|Content|History|Member|PSSnapin|Type)/,/Checkpoint-Computer/,/Clear-(Content|EventLog|History|Host|Item(Property)?|Variable)/,/Compare-Object/,/Complete-Transaction/,/Connect-PSSession/,/ConvertFrom-(Csv|Json|SecureString|StringData)/,/Convert-Path/,/ConvertTo-(Csv|Html|Json|SecureString|Xml)/,/Copy-Item(Property)?/,/Debug-Process/,/Disable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)/,/Disconnect-PSSession/,/Enable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)/,/(Enter|Exit)-PSSession/,/Export-(Alias|Clixml|Console|Counter|Csv|FormatData|ModuleMember|PSSession)/,/ForEach-Object/,/Format-(Custom|List|Table|Wide)/,new RegExp("Get-(Acl|Alias|AuthenticodeSignature|ChildItem|Command|ComputerRestorePoint|Content|ControlPanelItem|Counter|Credential|Culture|Date|Event|EventLog|EventSubscriber|ExecutionPolicy|FormatData|Help|History|Host|HotFix|Item|ItemProperty|Job|Location|Member|Module|PfxCertificate|Process|PSBreakpoint|PSCallStack|PSDrive|PSProvider|PSSession|PSSessionConfiguration|PSSnapin|Random|Service|TraceSource|Transaction|TypeData|UICulture|Unique|Variable|Verb|WinEvent|WmiObject)"),/Group-Object/,/Import-(Alias|Clixml|Counter|Csv|LocalizedData|Module|PSSession)/,/ImportSystemModules/,/Invoke-(Command|Expression|History|Item|RestMethod|WebRequest|WmiMethod)/,/Join-Path/,/Limit-EventLog/,/Measure-(Command|Object)/,/Move-Item(Property)?/,new RegExp("New-(Alias|Event|EventLog|Item(Property)?|Module|ModuleManifest|Object|PSDrive|PSSession|PSSessionConfigurationFile|PSSessionOption|PSTransportOption|Service|TimeSpan|Variable|WebServiceProxy|WinEvent)"),/Out-(Default|File|GridView|Host|Null|Printer|String)/,/Pause/,/(Pop|Push)-Location/,/Read-Host/,/Receive-(Job|PSSession)/,/Register-(EngineEvent|ObjectEvent|PSSessionConfiguration|WmiEvent)/,/Remove-(Computer|Event|EventLog|Item(Property)?|Job|Module|PSBreakpoint|PSDrive|PSSession|PSSnapin|TypeData|Variable|WmiObject)/,/Rename-(Computer|Item(Property)?)/,/Reset-ComputerMachinePassword/,/Resolve-Path/,/Restart-(Computer|Service)/,/Restore-Computer/,/Resume-(Job|Service)/,/Save-Help/,/Select-(Object|String|Xml)/,/Send-MailMessage/,new RegExp("Set-(Acl|Alias|AuthenticodeSignature|Content|Date|ExecutionPolicy|Item(Property)?|Location|PSBreakpoint|PSDebug|PSSessionConfiguration|Service|StrictMode|TraceSource|Variable|WmiInstance)"),/Show-(Command|ControlPanelItem|EventLog)/,/Sort-Object/,/Split-Path/,/Start-(Job|Process|Service|Sleep|Transaction|Transcript)/,/Stop-(Computer|Job|Process|Service|Transcript)/,/Suspend-(Job|Service)/,/TabExpansion2/,/Tee-Object/,/Test-(ComputerSecureChannel|Connection|ModuleManifest|Path|PSSessionConfigurationFile)/,/Trace-Command/,/Unblock-File/,/Undo-Transaction/,/Unregister-(Event|PSSessionConfiguration)/,/Update-(FormatData|Help|List|TypeData)/,/Use-Transaction/,/Wait-(Event|Job|Process)/,/Where-Object/,/Write-(Debug|Error|EventLog|Host|Output|Progress|Verbose|Warning)/,/cd|help|mkdir|more|oss|prompt/,/ac|asnp|cat|cd|chdir|clc|clear|clhy|cli|clp|cls|clv|cnsn|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|dnsn|ebp/,/echo|epal|epcsv|epsn|erase|etsn|exsn|fc|fl|foreach|ft|fw|gal|gbp|gc|gci|gcm|gcs|gdr|ghy|gi|gjb|gl|gm|gmo|gp|gps/,/group|gsn|gsnp|gsv|gu|gv|gwmi|h|history|icm|iex|ihy|ii|ipal|ipcsv|ipmo|ipsn|irm|ise|iwmi|iwr|kill|lp|ls|man|md/,/measure|mi|mount|move|mp|mv|nal|ndr|ni|nmo|npssc|nsn|nv|ogv|oh|popd|ps|pushd|pwd|r|rbp|rcjb|rcsn|rd|rdr|ren|ri/,/rjb|rm|rmdir|rmo|rni|rnp|rp|rsn|rsnp|rujb|rv|rvpa|rwmi|sajb|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls/,/sort|sp|spjb|spps|spsv|start|sujb|sv|swmi|tee|trcm|type|where|wjb|write/],{prefix:"",suffix:""}),j=i([/[$?^_]|Args|ConfirmPreference|ConsoleFileName|DebugPreference|Error|ErrorActionPreference|ErrorView|ExecutionContext/,/FormatEnumerationLimit|Home|Host|Input|MaximumAliasCount|MaximumDriveCount|MaximumErrorCount|MaximumFunctionCount/,/MaximumHistoryCount|MaximumVariableCount|MyInvocation|NestedPromptLevel|OutputEncoding|Pid|Profile|ProgressPreference/,/PSBoundParameters|PSCommandPath|PSCulture|PSDefaultParameterValues|PSEmailServer|PSHome|PSScriptRoot|PSSessionApplicationName/,/PSSessionConfigurationName|PSSessionOption|PSUICulture|PSVersionTable|Pwd|ShellId|StackTrace|VerbosePreference/,/WarningPreference|WhatIfPreference/,/Event|EventArgs|EventSubscriber|Sender/,/Matches|Ofs|ForEach|LastExitCode|PSCmdlet|PSItem|PSSenderInfo|This/,/true|false|null/],{prefix:"\\$",suffix:""}),z=i([R,I,j],{suffix:c}),m={keyword:h,number:w,operator:y,builtin:z,punctuation:k,identifier:M};function a(e,r){var n=r.returnStack[r.returnStack.length-1];if(n&&n.shouldReturnFrom(r))return r.tokenize=n.tokenize,r.returnStack.pop(),r.tokenize(e,r);if(e.eatSpace())return null;if(e.eat("("))return r.bracketNesting+=1,"punctuation";if(e.eat(")"))return r.bracketNesting-=1,"punctuation";for(var o in m)if(e.match(m[o]))return o;var t=e.next();if(t==="'")return O(e,r);if(t==="$")return S(e,r);if(t==='"')return d(e,r);if(t==="<"&&e.eat("#"))return r.tokenize=v,v(e,r);if(t==="#")return e.skipToEnd(),"comment";if(t==="@"){var b=e.eat(/["']/);if(b&&e.eol())return r.tokenize=p,r.startQuote=b[0],p(e,r);if(e.eol())return"error";if(e.peek().match(/[({]/))return"punctuation";if(e.peek().match(s))return S(e,r)}return"error"}function O(e,r){for(var n;(n=e.peek())!=null;)if(e.next(),n==="'"&&!e.eat("'"))return r.tokenize=a,"string";return"error"}function d(e,r){for(var n;(n=e.peek())!=null;){if(n==="$")return r.tokenize=D,"string";if(e.next(),n==="`"){e.next();continue}if(n==='"'&&!e.eat('"'))return r.tokenize=a,"string"}return"error"}function D(e,r){return g(e,r,d)}function T(e,r){return r.tokenize=p,r.startQuote='"',p(e,r)}function A(e,r){return g(e,r,T)}function g(e,r,n){if(e.match("$(")){var o=r.bracketNesting;return r.returnStack.push({shouldReturnFrom:function(t){return t.bracketNesting===o},tokenize:n}),r.tokenize=a,r.bracketNesting+=1,"punctuation"}else return e.next(),r.returnStack.push({shouldReturnFrom:function(){return!0},tokenize:n}),r.tokenize=S,r.tokenize(e,r)}function v(e,r){for(var n=!1,o;(o=e.next())!=null;){if(n&&o==">"){r.tokenize=a;break}n=o==="#"}return"comment"}function S(e,r){var n=e.peek();return e.eat("{")?(r.tokenize=P,P(e,r)):n!=null&&n.match(s)?(e.eatWhile(s),r.tokenize=a,"variable-2"):(r.tokenize=a,"error")}function P(e,r){for(var n;(n=e.next())!=null;)if(n==="}"){r.tokenize=a;break}return"variable-2"}function p(e,r){var n=r.startQuote;if(e.sol()&&e.match(new RegExp(n+"@")))r.tokenize=a;else if(n==='"')for(;!e.eol();){var o=e.peek();if(o==="$")return r.tokenize=A,"string";e.next(),o==="`"&&e.next()}else e.skipToEnd();return"string"}var F={startState:function(){return{returnStack:[],bracketNesting:0,tokenize:a}},token:function(e,r){return r.tokenize(e,r)},blockCommentStart:"<#",blockCommentEnd:"#>",lineComment:"#",fold:"brace"};return F}),u.defineMIME("application/x-powershell","powershell")})})();var C=V.exports;const N=H(C),J=L({__proto__:null,default:N},[C]);export{J as p};