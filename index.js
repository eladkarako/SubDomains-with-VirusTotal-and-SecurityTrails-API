"use strict";

const  FS           = require("fs")
      ,PATH         = require("path")
      ,URL          = require("url")
      ,TEMPLATE     = "https://www.virustotal.com/vtapi/v2/domain/report?apikey=###API_KEY###&domain=###DOMAIN###"
      ,ARGS         = process.argv.filter(function(s){return false === /node\.exe/i.test(s) && process.mainModule.filename !== s;})
      ,ARG_API      = ARGS[0]
      ,ARG_DOMAIN   = ARGS[1]
      ,TARGET_URL   = TEMPLATE.replace(/###API_KEY###/g, ARG_API)
                              .replace(/###DOMAIN###/g,  ARG_DOMAIN)
      ,HEADERS      = {"DNT":             "1"
                      ,"Accept":          "*/*"
                      ,"Referer":         "https://www.virustotal.com/"
                      ,"Connection":      "Close"
                      ,"User-Agent":      "Mozilla/5.0 Chrome"
                      ,"Accept-Language": "en-US,en;q=0.9"
                      ,"Cache-Control":   "no-cache"
                      ,"Pragma":          "no-cache"
                      ,"X-Hello":         "Goodbye"
                      }
     ,NATURAL_COMPARE = function(a, b){
                          var ax=[], bx=[];

                          a.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ ax.push([$1 || Infinity, $2 || ""]); });
                          b.replace(/(\d+)|(\D+)/g, function(_, $1, $2){ bx.push([$1 || Infinity, $2 || ""]); });

                          while(ax.length > 0 && bx.length > 0){
                            var an, bn, nn;
                            
                            an = ax.shift();
                            bn = bx.shift();
                            nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
                            if(nn) return nn;
                          }
                          return ax.length - bx.length;
                        }
      ;

function get(url, onresponse, onheaders){ //supports both headers and request body handling.
  var HTTP  = require("http")
     ,HTTPS = require("https")
     ;
     
  url = URL.parse(url);
  
  const CONF = {protocol: url.protocol               // "http:"               or  "https:"
               ,auth:     url.auth                   // "username:password"
               ,hostname: url.hostname               // "www.example.com"
               ,port:     url.port                   // 80                    or  "443"
               ,path:     url.path                   // "/"
               ,family:   4                          // IPv4
               ,method:   "GET"
               ,headers:  HEADERS
               ,agent:    undefined                  //use http.globalAgent for this host and port.
               ,timeout:  10 * 1000                  //10 seconds
               }
       ,REQUEST = ("http" === url.protocol ? HTTP : HTTPS).request(CONF)
       ,CONTENT = []
       ;
  REQUEST.setSocketKeepAlive(false);                                      //make sure to return right away (single connection mode).
  REQUEST.on("response", function(response){
    if("function" === typeof onheaders) onheaders(REQUEST,response,URL,CONTENT.join("")); //response headers.
    if("function" === typeof onresponse){
      response.setEncoding("utf8");
      response.on("data", function(chunk){ CONTENT.push(chunk);                                  } );  
      response.on("end",  function(){      onresponse(CONTENT.join(""), URL, REQUEST, response); } );  //response body.
    }
  });

  REQUEST.end();
}


//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


get(TARGET_URL, function(content){
  content = JSON.parse(content);
  content.domain_siblings = content.domain_siblings.sort(NATURAL_COMPARE);
  content.subdomains      = content.subdomains.sort(NATURAL_COMPARE);
  
  content = [].concat(content.domain_siblings, "", "", content.subdomains)
              .join("\r\n")
              ;

  console.log(content)

  process.exitCode=0;
  process.exit();
});

