function dependOn(){"use strict";return[require("communicate"),require("proxy"),require("common"),require("util")]}var def;require=function(e){"use strict";return e},def=window.define?window.define:function(e,t){"use strict";return t.apply(null,[{ajax:$.ajax.bind($)}])};var exports=acom_analytics={};def(dependOn(),function(e,t,r,i){"use strict";var n,o=null;for(n in o||(o=new function(){this.proxy=t.proxy.bind(this),this.LOG=r.LOG,this.CONVERSION_TIMEOUT=2e5,this.web2pdfCaller={MENU:0,TOOLBAR:1,AUTO:2},this.web2pdfAction={CONVERT:0,APPEND:1},this.web2pdfContext={PAGE:0,LINK:1};var e="ViewResultsPref";this.getViewResultsPreferenceState=function(){return"false"!==i.getCookie(e)},this.viewPrefIsDefault=function(){return!i.getCookie(e)}},e.registerModule("acro-gstate",o)),o)o.hasOwnProperty(n)&&("function"==typeof o[n]?exports[n]=o[n].bind(o):exports[n]=o[n]);return o});