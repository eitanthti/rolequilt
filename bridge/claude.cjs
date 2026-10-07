/* Official local Claude Code CLI adapter. Presents the coordinator's RPC surface; caller owns activation. */
'use strict';
const path=require('node:path'),fs=require('node:fs'),{spawn}=require('node:child_process'),{EventEmitter}=require('node:events'),{randomUUID}=require('node:crypto');
// Aliases accepted by the installed CLI's --model flag; the runtime resolves each to its current model and reports it in the init event.
const MODEL_ALIASES=Object.freeze([['sonnet','Claude Sonnet (latest)'],['opus','Claude Opus (latest)'],['haiku','Claude Haiku (latest)']]);
const EFFORTS=Object.freeze(['low','medium','high']);
// Every built-in tool, MCP server, settings source, plugin/hook customization and slash command is switched off; denied prompts never reach a person.
// Admin-managed policy hooks cannot be switched off from the CLI; hook events are surfaced so any hook run disconnects. --bare would skip them but cannot use a subscription login.
const CHAT_ONLY_ARGS=Object.freeze(['-p','--input-format','stream-json','--output-format','stream-json','--verbose','--include-partial-messages','--tools','','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--setting-sources','','--safe-mode','--permission-prompts','none','--disable-slash-commands','--no-chrome','--include-hook-events']);
function lines(stream,maxBytes,onLine,onOverflow){let buffer='';stream.setEncoding('utf8');stream.on('data',s=>{buffer+=s;if(Buffer.byteLength(buffer)>maxBytes){buffer='';return onOverflow();}let end;while((end=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,end);buffer=buffer.slice(end+1);if(line.trim())onLine(line);}});}
class ClaudeRuntime extends EventEmitter{
 constructor({executable,workspace,env,spawnProcess=spawn,timeout=15000,maxBytes=1048576}){super();this.executable=executable;this.workspace=workspace;this.env=env;this.spawnProcess=spawnProcess;this.timeout=timeout;this.maxBytes=maxBytes;this.closed=false;this.threads=new Map();this.subscription=false;this.usageBlocked=false;this.active=null;}
 run(args){return this.spawnProcess(this.executable,args,{cwd:this.workspace,env:this.env,stdio:['pipe','pipe','pipe'],shell:false});}
 readAuth(){return new Promise((resolve,reject)=>{const child=this.run(['auth','status','--json']);let out='',done=false;const finish=(error,value)=>{if(done)return;done=true;clearTimeout(timer);try{child.kill('SIGTERM');}catch{}error?reject(error):resolve(value);};const timer=setTimeout(()=>finish(Error('Runtime auth check timed out')),this.timeout);child.stdout.setEncoding('utf8');child.stdout.on('data',s=>{out+=s;if(out.length>65536)finish(Error('Runtime auth output too large'));});child.stderr.on('data',()=>{});child.on('error',()=>finish(Error('Runtime auth check failed')));child.on('exit',()=>{try{finish(null,JSON.parse(out));}catch{finish(Error('Runtime auth output invalid'));}});child.stdin.end();});}
 async call(method,params={}){
  if(this.closed)throw Error('Runtime disconnected');
  if(method==='initialize')return {};
  // Only the subscription facts are kept; email, organization and paths in the CLI output are discarded.
  if(method==='account/read'){const auth=await this.readAuth();this.subscription=auth?.loggedIn===true&&auth.authMethod==='claude.ai'&&auth.apiProvider==='firstParty'&&typeof auth.subscriptionType==='string'&&auth.subscriptionType.length>0;return {account:{type:this.subscription?'claudeSubscription':'unsupported'}};}
  if(method==='account/rateLimits/read')return {ordinaryUsageAllowed:this.subscription&&!this.usageBlocked};
  if(method==='model/list')return {data:MODEL_ALIASES.map(([model,displayName])=>({id:model,model,displayName,supportedReasoningEfforts:EFFORTS.map(reasoningEffort=>({reasoningEffort}))})),nextCursor:null};
  if(method==='thread/start'||method==='thread/resume'){
   if(!MODEL_ALIASES.some(([m])=>m===params.model))throw Error('Unknown runtime model');
   const id=method==='thread/resume'?params.threadId:randomUUID();if(typeof id!=='string'||!/^[0-9a-f-]{36}$/i.test(id))throw Error('Invalid thread');
   this.threads.get(id)?.child?.kill('SIGTERM');this.threads.set(id,{id,model:params.model,instructions:String(params.developerInstructions||''),persist:params.ephemeral!==true,started:method==='thread/resume',child:null});
   return {thread:{id},model:params.model,modelProvider:'anthropic',cwd:this.workspace,toolsDisabled:true};
  }
  if(method==='turn/start'){
   const thread=this.threads.get(params.threadId),text=params.input?.[0]?.text;if(!thread||this.active||typeof text!=='string')throw Error('Invalid turn');
   if(params.model!==thread.model)throw Error('Runtime model mismatch');
   if(!thread.child)this.spawnThread(thread,params.effort);
   const turnId=randomUUID();this.active={threadId:thread.id,turnId,interrupting:false};
   thread.child.stdin.write(JSON.stringify({type:'user',message:{role:'user',content:text}})+'\n');
   return {turn:{id:turnId}};
  }
  if(method==='turn/interrupt'){const thread=this.threads.get(params.threadId);if(!thread?.child||this.active?.turnId!==params.turnId)throw Error('No active turn');this.active.interrupting=true;thread.child.stdin.write(JSON.stringify({type:'control_request',request_id:randomUUID(),request:{subtype:'interrupt'}})+'\n');return {};}
  throw Error('Unsupported runtime method');
 }
 spawnThread(thread,effort){
  const args=[...CHAT_ONLY_ARGS,'--model',thread.model,'--append-system-prompt',thread.instructions];
  if(EFFORTS.includes(effort))args.push('--effort',effort);
  if(thread.started&&!thread.persist)throw Error('Ephemeral runtime session ended; reconnect to start a new one');
  if(!thread.persist)args.push('--no-session-persistence','--session-id',thread.id);else args.push(thread.started?'--resume':'--session-id',thread.id);
  thread.started=true;const child=thread.child=this.run(args);
  child.on('error',()=>this.close('Runtime process error'));child.on('exit',()=>{if(thread.child===child)thread.child=null;if(this.active?.threadId===thread.id)this.close('Runtime exited');});child.stdin.on('error',()=>this.close('Runtime input failed'));child.stderr.on('data',()=>{});
  lines(child.stdout,this.maxBytes,line=>this.read(thread,line),()=>this.close('Runtime frame too large'));
 }
 read(thread,line){
  if(this.closed)return;let m;try{m=JSON.parse(line);}catch{return this.close('Malformed runtime frame');}
  if(!m||typeof m!=='object'||Array.isArray(m))return this.close('Invalid runtime frame');
  const turn=this.active?.threadId===thread.id?this.active:null;
  if(m.type==='system'&&m.subtype==='init'){
   // Fail closed unless the runtime itself reports a tool-free, MCP-free, subscription-authenticated session.
   // Listed agents are inert: with zero tools there is no tool that can start one.
   if(!Array.isArray(m.tools)||m.tools.length||!Array.isArray(m.mcp_servers)||m.mcp_servers.length||m.apiKeySource!=='none'||m.session_id!==thread.id||typeof m.model!=='string')return this.close('Runtime policy mismatch');
   if((m.plugins!==undefined&&(!Array.isArray(m.plugins)||m.plugins.some(p=>p?.path!=='builtin')))||(m.skills!==undefined&&(!Array.isArray(m.skills)||m.skills.length))||(m.slash_commands!==undefined&&(!Array.isArray(m.slash_commands)||m.slash_commands.length)))return this.close('Runtime customizations loaded');
   thread.resolvedModel=m.model;return;
  }
  if(m.type==='system'&&typeof m.subtype==='string'&&m.subtype.startsWith('hook_'))return this.close('Runtime hook ran; chat-only boundary not held');
  if(m.type==='control_request')return this.close('Unsupported runtime request');
  if(m.type==='rate_limit_event'){const info=m.rate_limit_info||{};if(info.isUsingOverage===true||info.status==='rejected'){this.usageBlocked=true;this.emit('notification',{method:'account/rateLimits/updated',params:{}});return this.close('Included usage exhausted or paid overage in use');}return;}
  const content=m.type==='assistant'?m.message?.content:null;if(Array.isArray(content)&&content.some(c=>c?.type!=='text'&&c?.type!=='thinking'&&c?.type!=='redacted_thinking'))return this.close('Unexpected tool activity');
  if(m.type==='stream_event'){const e=m.event||{};if(e.type==='content_block_start'&&!['text','thinking','redacted_thinking'].includes(e.content_block?.type))return this.close('Unexpected tool activity');if(turn&&e.type==='content_block_delta'&&e.delta?.type==='text_delta'&&typeof e.delta.text==='string')this.emit('notification',{method:'item/agentMessage/delta',params:{threadId:thread.id,turnId:turn.turnId,delta:e.delta.text}});return;}
  if(m.type==='result'&&turn){this.active=null;const status=m.subtype==='success'&&m.is_error!==true?'completed':turn.interrupting?'interrupted':'failed';this.emit('notification',{method:'turn/completed',params:{threadId:thread.id,turn:{id:turn.turnId,status,resolvedModel:thread.resolvedModel||null}}});}
 }
 notify(){}
 respond(){}
 reject(){}
 close(reason='Disconnected'){if(this.closed)return;this.closed=true;this.active=null;for(const thread of this.threads.values()){const child=thread.child;thread.child=null;if(!child)continue;try{child.stdin.end();child.kill('SIGTERM');}catch{}const t=setTimeout(()=>{try{child.kill('SIGKILL');}catch{}},1000);t.unref();}this.emit('closed',reason);}
}
function createClaudeTransport({executable,workspace,confirmed,spawnProcess}){
 if(confirmed!==true)throw Error('Activation confirmation required');if(!path.isAbsolute(executable)||!path.isAbsolute(workspace))throw Error('Absolute local paths required');const cwd=fs.realpathSync(workspace);if(!fs.statSync(cwd).isDirectory())throw Error('Workspace unavailable');
 // No ANTHROPIC_* or provider variables pass through, so the CLI can only use its own subscription login.
 const env={};for(const name of ['HOME','USER','PATH','TMPDIR','LANG','LC_ALL'])if(process.env[name])env[name]=process.env[name];
 return new ClaudeRuntime({executable:fs.realpathSync(executable),workspace:cwd,env,spawnProcess});
}
module.exports={ClaudeRuntime,createClaudeTransport,MODEL_ALIASES,CHAT_ONLY_ARGS};
