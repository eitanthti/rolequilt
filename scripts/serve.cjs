/* Read-only, loopback-only demo server. No API or configuration import. */
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const assets=new Map([['/','index.html'],['/index.html','index.html'],['/src/core.js','src/core.js'],['/src/demo-config.js','src/demo-config.js'],['/src/app.js','src/app.js'],['/src/import-prompt.js','src/import-prompt.js'],['/src/styles.css','src/styles.css']]);
function createServer(){return http.createServer((req,res)=>{
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'none'; img-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"};
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{...headers,Allow:'GET, HEAD'});return res.end();}
 const file=assets.get((req.url||'').split('?')[0]);
 if(!file){res.writeHead(404,headers);return res.end('Not found');}
 const full=path.join(root,file);let body;try{if(fs.lstatSync(full).isSymbolicLink())throw Error();body=fs.readFileSync(full);}catch{res.writeHead(404,headers);return res.end('Not found');}
 res.writeHead(200,{...headers,'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8','Content-Length':body.length});res.end(req.method==='HEAD'?undefined:body);
});}
if(require.main===module){const port=Number(process.env.ROLEQUILT_PORT||8766);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Use a port from 1024 to 65535');const server=createServer();server.on('error',()=>{console.error('Preview could not start; choose another local port.');process.exitCode=1;});server.listen(port,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:'+port));}
module.exports={createServer};
