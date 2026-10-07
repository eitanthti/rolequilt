'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),{PassThrough}=require('node:stream'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ClaudeRuntime,createClaudeTransport,CHAT_ONLY_ARGS}=require('../bridge/claude.cjs'),{Engine}=require('../bridge/engine.cjs');
const SUBSCRIPTION={loggedIn:true,authMethod:'claude.ai',apiProvider:'firstParty',subscriptionType:'fixture-plan',email:'fixture@example.invalid'};
function harness(auth=SUBSCRIPTION){
 const spawned=[];
 function spawnProcess(executable,args,options){const c=new EventEmitter();c.args=args;c.options=options;c.stdout=new PassThrough();c.stderr=new PassThrough();c.stdin=new PassThrough();c.written=[];c.stdin.on('data',d=>c.written.push(...String(d).split('\n').filter(Boolean).map(l=>JSON.parse(l))));c.killed=[];c.kill=s=>c.killed.push(s);spawned.push(c);
  if(args[0]==='auth')setImmediate(()=>{c.stdout.end(JSON.stringify(auth));setImmediate(()=>c.emit('exit',0));});return c;}
 const runtime=new ClaudeRuntime({executable:'/fictional/claude',workspace:'/fictional/project',env:{HOME:'/fictional/home'},spawnProcess});
 const engine=new Engine({workspace:'/fictional/project',roles:[{id:'one',instructions:'Fictional role one'},{id:'two',instructions:'Fictional role two'}],confirmed:true,runtime:'anthropic',createTransport:()=>runtime});
 const turn=()=>spawned.filter(c=>c.args[0]==='-p').at(-1);
 const emit=(c,m)=>c.stdout.write(JSON.stringify(m)+'\n');
 const init=(c,extra={})=>emit(c,{type:'system',subtype:'init',session_id:c.args[c.args.indexOf('--session-id')+1],tools:[],mcp_servers:[],apiKeySource:'none',model:'fixture-resolved-model',...extra});
 return {spawned,runtime,engine,turn,emit,init};
}
const tick=()=>new Promise(r=>setImmediate(r));

test('subscription login is required and identity details are never returned',async()=>{
 const h=harness();assert.deepEqual(await h.runtime.call('account/read'),{account:{type:'claudeSubscription'}});assert.deepEqual(h.spawned[0].args,['auth','status','--json']);assert.deepEqual(await h.runtime.call('account/rateLimits/read'),{ordinaryUsageAllowed:true});
 for(const auth of [{...SUBSCRIPTION,authMethod:'apiKey'},{...SUBSCRIPTION,apiProvider:'bedrock'},{...SUBSCRIPTION,loggedIn:false},{...SUBSCRIPTION,subscriptionType:null}]){const other=harness(auth);await assert.rejects(other.engine.enable(),/subscription login required/);assert.equal(other.engine.status,'disconnected');}
});

test('chat runs tool-free through the coordinator, streams to the initiating role and keeps one process per thread',async()=>{
 const h=harness(),deltas=[],done=[];h.engine.on('delta',d=>deltas.push(d));h.engine.on('completed',d=>done.push(d));await h.engine.enable();
 assert.equal(h.engine.status,'ready');assert.deepEqual(h.engine.snapshot().runtime,{id:'anthropic',label:'Claude Code'});assert.deepEqual(h.engine.models.map(m=>m.id),['sonnet','opus','haiku']);
 await assert.rejects(h.engine.start('one','Hello','invented'));await h.engine.start('one','Hello','sonnet');
 const c=h.turn();for(const flag of CHAT_ONLY_ARGS)assert(c.args.includes(flag),flag);assert.equal(c.args[c.args.indexOf('--tools')+1],'');assert.equal(c.args[c.args.indexOf('--model')+1],'sonnet');assert.equal(c.args[c.args.indexOf('--effort')+1],'low');assert(c.args.includes('--no-session-persistence'));assert.match(c.args[c.args.indexOf('--append-system-prompt')+1],/Fictional role one/);assert.equal(c.options.shell,false);assert.deepEqual(c.written[0],{type:'user',message:{role:'user',content:'Hello'}});
 h.init(c);h.emit(c,{type:'stream_event',event:{type:'content_block_start',content_block:{type:'text'}}});h.emit(c,{type:'stream_event',event:{type:'content_block_delta',delta:{type:'text_delta',text:'Fictional reply'}}});h.emit(c,{type:'rate_limit_event',rate_limit_info:{status:'allowed',isUsingOverage:false}});h.emit(c,{type:'result',subtype:'success',is_error:false});await tick();
 assert.deepEqual(deltas,[{roleId:'one',delta:'Fictional reply'}]);assert.equal(done[0].status,'completed');assert.equal(h.engine.status,'ready');
 await h.engine.start('one','Again','sonnet');assert.equal(h.spawned.filter(x=>x.args[0]==='-p').length,1);assert.equal(c.written.length,2);
 h.emit(c,{type:'result',subtype:'success',is_error:false});await tick();await h.engine.start('two','Hello','sonnet');assert.equal(h.spawned.filter(x=>x.args[0]==='-p').length,2);assert.notEqual(h.engine.threads.get('one'),h.engine.threads.get('two'));
 await h.engine.cancel();assert.equal(h.turn().written.at(-1).request.subtype,'interrupt');h.emit(h.turn(),{type:'result',subtype:'error_during_execution',is_error:true});await tick();assert.equal(done.at(-1).status,'interrupted');
 h.engine.disconnect();assert(h.spawned.filter(x=>x.args[0]==='-p').every(x=>x.killed.includes('SIGTERM')));
});

test('runtime reports of tools, MCP servers, API-key auth or tool activity disconnect',async()=>{
 const cases=[c=>({type:'system',subtype:'init',session_id:c.args[c.args.indexOf('--session-id')+1],tools:['Read'],mcp_servers:[],apiKeySource:'none',model:'m'}),c=>({type:'system',subtype:'init',session_id:c.args[c.args.indexOf('--session-id')+1],tools:[],mcp_servers:[{name:'fixture'}],apiKeySource:'none',model:'m'}),c=>({type:'system',subtype:'init',session_id:c.args[c.args.indexOf('--session-id')+1],tools:[],mcp_servers:[],apiKeySource:'ANTHROPIC_API_KEY',model:'m'}),()=>({type:'stream_event',event:{type:'content_block_start',content_block:{type:'tool_use'}}}),()=>({type:'assistant',message:{content:[{type:'tool_use',name:'Read'}]}}),()=>({type:'control_request',request:{subtype:'can_use_tool'}}),()=>'not json'];
 for(const make of cases){const h=harness();await h.engine.enable();await h.engine.start('one','Hello','haiku');const c=h.turn(),m=make(c);c.stdout.write((typeof m==='string'?m:JSON.stringify(m))+'\n');await tick();assert.equal(h.engine.status,'disconnected',JSON.stringify(m));assert(c.killed.includes('SIGTERM'));}
});

test('paid overage or exhausted included usage disconnects and blocks further turns',async()=>{
 for(const info of [{status:'allowed',isUsingOverage:true},{status:'rejected',isUsingOverage:false}]){const h=harness();await h.engine.enable();await h.engine.start('one','Hello','opus');h.emit(h.turn(),{type:'rate_limit_event',rate_limit_info:info});await tick();assert.equal(h.engine.status,'disconnected');assert.equal(h.runtime.usageBlocked,true);await assert.rejects(h.runtime.call('account/rateLimits/read'),/disconnected/);}
});

test('durable threads resume by session id; ephemeral threads never silently restart',async()=>{
 const h=harness(),store=new Map([['one','00000000-0000-4000-8000-000000000001']]);h.engine.threadStore={get:k=>store.get(k),set:(k,v)=>store.set(k,v)};await h.engine.enable();await h.engine.start('one','Hello','sonnet');const c=h.turn();assert.equal(c.args[c.args.indexOf('--resume')+1],'00000000-0000-4000-8000-000000000001');assert(!c.args.includes('--no-session-persistence'));
 const e=harness();await e.engine.enable();await e.engine.start('one','Hello','sonnet');const first=e.turn();e.emit(first,{type:'result',subtype:'success',is_error:false});await tick();first.emit('exit',0);await assert.rejects(e.engine.start('one','Again','sonnet'));assert.equal(e.engine.status,'disconnected');
});

test('factory requires confirmation and passes no API-key or provider variables',()=>{
 assert.throws(()=>createClaudeTransport({executable:'/fictional/claude',workspace:os.tmpdir(),confirmed:false}),/confirmation/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rolequilt-claude-'));const saved={...process.env};process.env.ANTHROPIC_API_KEY='fixture-not-a-key';process.env.ANTHROPIC_BASE_URL='https://example.invalid';
 try{const exe=path.join(dir,'claude');fs.writeFileSync(exe,'');const runtime=createClaudeTransport({executable:exe,workspace:dir,confirmed:true,spawnProcess:()=>{throw Error('unused');}});assert.deepEqual(Object.keys(runtime.env).filter(k=>/ANTHROPIC|CLAUDE/.test(k)),[]);assert.equal(runtime.workspace,fs.realpathSync(dir));}
 finally{for(const k of ['ANTHROPIC_API_KEY','ANTHROPIC_BASE_URL'])if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];fs.rmSync(dir,{recursive:true,force:true});}
});

test('engine rejects unknown runtimes and keeps Codex as the default',()=>{
 assert.throws(()=>new Engine({workspace:'/fictional/project',roles:[],runtime:'other'}),/Unsupported/);assert.equal(new Engine({workspace:'/fictional/project',roles:[]}).snapshot().runtime.id,'openai');
 const {createRuntimeTransport}=require('../bridge/process.cjs');assert.throws(()=>createRuntimeTransport({runtime:'other'}),/Unsupported/);
});
