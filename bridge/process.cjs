'use strict';
const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');const {Transport}=require('./transport.cjs');
function createCodexTransport({executable,workspace,confirmed}){
 if(confirmed!==true)throw Error('Activation confirmation required');if(!path.isAbsolute(executable)||!path.isAbsolute(workspace))throw Error('Absolute local paths required');const cwd=fs.realpathSync(workspace);if(!fs.statSync(cwd).isDirectory())throw Error('Workspace unavailable');
 const env={};for(const name of ['HOME','PATH','TMPDIR','LANG','LC_ALL'])if(process.env[name])env[name]=process.env[name];
 return new Transport(spawn(fs.realpathSync(executable),['app-server','--stdio','-c','approval_policy="untrusted"','-c','sandbox_mode="read-only"'],{cwd,env,stdio:['pipe','pipe','pipe'],shell:false}));
}
module.exports={createCodexTransport};
