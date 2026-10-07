'use strict';
const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process');const {Transport}=require('./transport.cjs');
function createCodexTransport({executable,workspace,confirmed}){
 if(confirmed!==true)throw Error('Activation confirmation required');if(!path.isAbsolute(executable)||!path.isAbsolute(workspace))throw Error('Absolute local paths required');const cwd=fs.realpathSync(workspace);if(!fs.statSync(cwd).isDirectory())throw Error('Workspace unavailable');
 const env={};for(const name of ['HOME','PATH','TMPDIR','LANG','LC_ALL'])if(process.env[name])env[name]=process.env[name];
 return new Transport(spawn(fs.realpathSync(executable),['app-server','--stdio','-c','approval_policy="on-request"','-c','sandbox_mode="read-only"'],{cwd,env,stdio:['pipe','pipe','pipe'],shell:false}));
}
const {createClaudeTransport}=require('./claude.cjs');
// Launchers pick one runtime per engine; pass the same id as the Engine runtime option.
function createRuntimeTransport({runtime='openai',...options}){if(runtime==='openai')return createCodexTransport(options);if(runtime==='anthropic')return createClaudeTransport(options);throw Error('Unsupported local runtime');}
module.exports={createCodexTransport,createClaudeTransport,createRuntimeTransport};
