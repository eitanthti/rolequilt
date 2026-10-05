/* Inert preparation primitives. No listener, process spawn, auth or runtime calls. */
'use strict';
const {randomBytes,timingSafeEqual}=require('node:crypto');
function createGuard(port){
 if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid loopback port');
 const host='127.0.0.1:'+port,origin='http://'+host;let secret=null,closed=false;
 function sameOrigin(h){if(closed||h.host!==host||h.origin!==origin||h['sec-fetch-site']!=='same-origin')throw Error('Origin rejected');}
 return {pair(h){sameOrigin(h);if(secret)throw Error('Already paired');secret=randomBytes(32).toString('hex');return secret;},check(h){sameOrigin(h);const supplied=h['x-rolequilt-session'];if(!secret||typeof supplied!=='string'||supplied.length!==secret.length||!timingSafeEqual(Buffer.from(supplied),Buffer.from(secret)))throw Error('Session rejected');return true;},close(){secret=null;closed=true;}};
}
function activationGate(scope,account,usage){
 if(!scope||scope.confirmed!==true||scope.boundaryVerified!==true||scope.approvalCoverageVerified!==true||typeof scope.workspace!=='string'||!scope.workspace.startsWith('/')||scope.workspace==='/')throw Error('Workspace boundary not approved and verified');
 if(account?.account?.type!=='chatgpt')throw Error('Existing ChatGPT subscription required');
 if(usage?.ordinaryUsageAllowed!==true)throw Error('Included usage unavailable or unknown');return true;
}
function approvalResponse(method,decision){
 if(!['item/commandExecution/requestApproval','item/fileChange/requestApproval'].includes(method))throw Error('Unsupported approval request');
 if(!['accept','decline','cancel'].includes(decision))throw Error('Only one-shot decisions allowed');return {decision};
}
module.exports={createGuard,activationGate,approvalResponse};
