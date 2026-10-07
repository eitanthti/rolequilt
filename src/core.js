/* Shared browser/Node contracts. No network access or execution adapter. */
'use strict';
const RolequiltCore = (() => {
  const CONFIG_BYTES = 65536;
  const STATE_BYTES = 2097152;
  const STATUS = Object.freeze({todo:'To do',progress:'In progress',blocked:'Blocked',done:'Done'});
  const forbidden = new Set(['__proto__','constructor','prototype']);
  const bytes = text => new TextEncoder().encode(text).length;
  const fail = reason => { throw new Error('Invalid config: '+reason); };
  function inspect(value, maxNodes = 5000) {
    let nodes=0;
    function walk(v, depth) {
      if (++nodes > maxNodes || depth > 12) fail('structure limit');
      if (v === null || typeof v !== 'object') {
        if (!['string','number','boolean'].includes(typeof v) && v !== null) fail('JSON types only');
        return;
      }
      if (!Array.isArray(v) && Object.getPrototypeOf(v) !== Object.prototype && Object.getPrototypeOf(v) !== null) fail('plain objects only');
      for (const k of Object.keys(v)) {
        if (forbidden.has(k)) fail('unsafe key');
        const descriptor=Object.getOwnPropertyDescriptor(v,k);
        if (!descriptor || !Object.hasOwn(descriptor,'value')) fail('data properties only');
        walk(descriptor.value,depth+1);
      }
    }
    walk(value,0);
  }
  function object(value, keys, optional=[]) {
    if (!value || Array.isArray(value) || typeof value !== 'object') fail('object required');
    if (keys.some(k=>!Object.hasOwn(value,k)) || Object.keys(value).some(k=>!keys.includes(k)&&!optional.includes(k))) fail('unsupported fields');
  }
  function string(value, max=4096) {
    if (typeof value !== 'string' || !value.trim() || value.length>max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) fail('text limit or type');
  }
  function id(value) {
    string(value,40);
    if (!/^[a-z][a-z0-9-]*$/.test(value) || forbidden.has(value)) fail('identifier');
  }
  function list(value,min,max,check) {
    if(!Array.isArray(value)||value.length<min||value.length>max)fail('collection limit');
    for(const item of value)check(item);
  }
  function validateConfig(value) {
    inspect(value);
    if(bytes(JSON.stringify(value))>CONFIG_BYTES)fail('size limit');
    object(value,['schemaVersion','team','roles','tasks']);
    if(value.schemaVersion!==1)fail('schema version');
    object(value.team,['id','name','tagline','leadRoleId','focus']);
    id(value.team.id);id(value.team.leadRoleId);string(value.team.name,80);string(value.team.tagline,160);
    object(value.team.focus,['label','heading','description']);string(value.team.focus.label,80);string(value.team.focus.heading,160);string(value.team.focus.description,1000);
    const roleIds=new Set();
    list(value.roles,1,24,role=>{
      object(role,['id','name','label','specialty','color','shape','summary','heading','intro','focus','responsibility','handoff','deliverable','tags','prompts'],['skills','supportingFiles','modelPreference']);
      id(role.id);if(roleIds.has(role.id))fail('duplicate role');roleIds.add(role.id);
      for(const key of ['name','label'])string(role[key],80);
      for(const key of ['specialty','summary','heading'])string(role[key],160);
      for(const key of ['intro','responsibility','handoff','deliverable'])string(role[key]);
      if(typeof role.color!=='string'||!/^#[a-fA-F0-9]{6}$/.test(role.color))fail('color');
      if(!Number.isInteger(role.shape)||role.shape<0||role.shape>4)fail('shape');
      list(role.focus,1,4,step=>{object(step,['title','detail']);string(step.title,160);string(step.detail,1000);});
      list(role.tags,0,5,item=>string(item,40));list(role.prompts,0,4,item=>string(item,240));
      for(const field of ['skills','supportingFiles'])if(role[field]!==undefined){list(role[field],0,16,portablePath);if(new Set(role[field].map(x=>x.toLowerCase())).size!==role[field].length)fail('duplicate file reference');}
      if(role.skills?.some(x=>!/(^|\/)SKILL\.md$/.test(x)))fail('skills must reference SKILL.md');
      if(role.modelPreference!==undefined)validateModelPreference(role.modelPreference);
      if(role.supportingFiles?.some(x=>!/\.(?:md|txt)$/i.test(x)))fail('supporting files must be Markdown or text');
    });
    if(!roleIds.has(value.team.leadRoleId))fail('missing lead role');
    const taskIds=new Set();
    list(value.tasks,0,160,task=>{
      object(task,['id','owner','title','description','status']);id(task.id);id(task.owner);
      if(taskIds.has(task.id))fail('duplicate task');taskIds.add(task.id);
      if(!roleIds.has(task.owner))fail('missing task owner');
      string(task.title,160);string(task.description,1000);
      if(!Object.hasOwn(STATUS,task.status))fail('task status');
    });
    return JSON.parse(JSON.stringify(value));
  }
  function parseConfig(raw) {
    if(typeof raw!=='string'||bytes(raw)>CONFIG_BYTES)fail('size limit');
    let value;try{value=JSON.parse(raw);}catch{fail('JSON syntax');}
    return validateConfig(value);
  }
  function storageKey(config) {
    // Configuration namespace only; this is not a cryptographic security boundary.
    let hash=2166136261;
    for(const char of JSON.stringify(validateConfig(config)))hash=Math.imul(hash^char.codePointAt(0),16777619)>>>0;
    return 'rolequilt:demo:v1:'+config.team.id+':'+hash.toString(16);
  }
  function seedState(config) {
    return {version:1,agent:config.team.leadRoleId,view:'chat',preview:true,
      modelPreferences:Object.fromEntries(config.roles.map(r=>[r.id,r.modelPreference?validateModelPreference(r.modelPreference):{provider:'none',modelId:''}])),messages:Object.fromEntries(config.roles.map(r=>[r.id,[]])),drafts:Object.fromEntries(config.roles.map(r=>[r.id,''])),tasks:config.tasks.map(t=>({...t}))};
  }
  function capHistories(state,config) {
    for(const role of config.roles)state.messages[role.id]=state.messages[role.id].slice(-100);
    const all=()=>config.roles.flatMap(r=>state.messages[r.id].map(m=>({m,role:r.id})));
    let messages=all(),length=messages.reduce((sum,x)=>sum+x.m.text.length,0);
    while(messages.length&&(messages.length>300||length>400000||bytes(JSON.stringify(state))>STATE_BYTES)){
      const oldest=messages.reduce((a,b)=>a.m.time<=b.m.time?a:b);
      const index=state.messages[oldest.role].indexOf(oldest.m);state.messages[oldest.role].splice(index,1);
      length-=oldest.m.text.length;messages=all();
    }
  }
  function appendLocalMessage(state,config,roleId,text,preview,time=Date.now()) {
    const role=config.roles.find(r=>r.id===roleId);
    if(!role||typeof text!=='string'||!text.trim()||text.length>4000||!Number.isFinite(time)||time<0)throw new Error('Invalid local message');
    state.messages[roleId].push({type:'user',text:text.trim(),time});
    if(preview)state.messages[roleId].push({type:'preview',text:'Fixed preview of '+role.name+'’s response format:\n\n'+role.deliverable+'\n\nThis fixed preview does not analyze your message, run an agent, or take any action.',time:time+1});
    state.drafts[roleId]='';capHistories(state,config);
  }
  function restoreState(raw,config) {
    const state=seedState(config);
    if(raw===null||raw===undefined)return {state,recovered:false};
    try {
      if(typeof raw!=='string'||bytes(raw)>STATE_BYTES)throw new Error('size');
      const saved=JSON.parse(raw);inspect(saved,15000);
      if(!saved||saved.version!==1)throw new Error('version');
      if(config.roles.some(r=>r.id===saved.agent))state.agent=saved.agent;
      state.view=saved.view==='board'?'board':'chat';state.preview=saved.preview!==false;
      for(const role of config.roles){
        try{if(saved.modelPreferences?.[role.id])state.modelPreferences[role.id]=validateModelPreference(saved.modelPreferences[role.id]);}catch{/* Invalid inert settings ignored; no connection. */}
        const draft=saved.drafts?.[role.id];state.drafts[role.id]=typeof draft==='string'?draft.slice(0,4000):'';
        const history=saved.messages?.[role.id];
        state.messages[role.id]=Array.isArray(history)?history.filter(m=>m&&['user','preview','live','status'].includes(m.type)&&typeof m.text==='string'&&m.text.length<=5000&&Number.isFinite(m.time)&&m.time>=0).slice(-100).map(m=>({type:m.type,text:m.text,time:m.time,...(config.roles.some(r=>r.id===m.speakerId)?{speakerId:m.speakerId}:{}),...(typeof m.messageId==='string'&&m.messageId.length<100?{messageId:m.messageId}:{}),...(m.partial===true?{partial:true}:{})})):[];
      }
      for(const task of state.tasks){const savedTask=Array.isArray(saved.tasks)?saved.tasks.find(t=>t&&t.id===task.id):null;if(savedTask&&Object.hasOwn(STATUS,savedTask.status))task.status=savedTask.status;}
      capHistories(state,config);return {state,recovered:false};
    }catch{return {state,recovered:true};}
  }
  const PROVIDERS=Object.freeze({none:'Not chosen',openai:'Local Codex / own ChatGPT plan (candidate)',anthropic:'Local Claude Code / own Claude plan (candidate)',google:'Gemini local subscription (unavailable)',xai:'Grok local subscription (unavailable)'});
  const LOCAL_RUNTIME_CANDIDATES=Object.freeze(['none','openai','anthropic']);
  function validateModelPreference(value){object(value,['provider','modelId']);if(!Object.hasOwn(PROVIDERS,value.provider)||typeof value.modelId!=='string'||value.modelId.length>120||(value.modelId&&!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,119}$/.test(value.modelId))||unsafeContent(value.modelId)||(value.provider==='none'&&value.modelId))fail('provider/model preference');return {provider:value.provider,modelId:value.modelId};}
  function setModelPreference(state,config,roleId,value){if(!LOCAL_RUNTIME_CANDIDATES.includes(value?.provider))fail('local subscription route not verified for this app');if(!config.roles.some(r=>r.id===roleId))fail('unknown role');const clean=validateModelPreference(value);state.modelPreferences[roleId]=clean;return {...clean};}
  const REGISTRY_KEY='rolequilt:teams:v1';
  const MAX_TEAMS=8,BUNDLE_FILES=64,FILE_BYTES=131072,BUNDLE_BYTES=1048576,REGISTRY_BYTES=4194304;
  function portablePath(value){
    if(typeof value!=='string'||value.length>240||value.includes('\\')||value.includes('%'))fail('unsafe relative file path');
    const parts=value.split('/');
    if(parts.some(p=>!(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/).test(p)||p.endsWith('.')||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p)||forbidden.has(p)||/^(?:credentials?|secrets?|passwords?|tokens?|api[-_]?keys?)(?:\.|$)/i.test(p)))fail('unsafe relative file path');
    if(value!=='team-config.json'&&!/\.(?:md|txt)$/i.test(value))fail('only team-config.json and Markdown/text supporting files are accepted');
  }
  function unsafeContent(text){
    return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\ufffd]/.test(text)||/^#!/.test(text)||/-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/.test(text)||/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{20,})\b/.test(text)||/\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\s*["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i.test(text);
  }
  function references(config){return config.roles.flatMap(role=>[...(role.skills||[]).map(path=>({roleId:role.id,roleName:role.name,path,kind:'Skill text'})),...(role.supportingFiles||[]).map(path=>({roleId:role.id,roleName:role.name,path,kind:'Supporting text'}))]);}
  function validateBundle(entries){
    if(!Array.isArray(entries)||!entries.length||entries.length>BUNDLE_FILES)fail('bundle file count (1–64)');
    const files=[],paths=new Set();let total=0;
    for(const entry of entries){object(entry,['path','text']);portablePath(entry.path);if(paths.has(entry.path.toLowerCase()))fail('duplicate normalized file path');paths.add(entry.path.toLowerCase());if(typeof entry.text!=='string'||unsafeContent(entry.text))fail('binary, executable or credential-like file content');const size=bytes(entry.text),limit=entry.path==='team-config.json'?CONFIG_BYTES:FILE_BYTES;if(size>limit)fail('bundle file size limit');total+=size;if(total>BUNDLE_BYTES)fail('bundle total size (1 MiB)');files.push({path:entry.path,text:entry.text});}
    const configFile=files.find(f=>f.path==='team-config.json');if(!configFile)fail('bundle requires root team-config.json');
    const config=parseConfig(configFile.text),mapping=references(config),available=new Map(files.map(f=>[f.path,f]));
    const missing=[...new Set(mapping.filter(r=>!available.has(r.path)||!available.get(r.path).text.trim()).map(r=>r.path))];
    return {config,files:files.sort((a,b)=>a.path.localeCompare(b.path)),mapping,missing,totalBytes:total};
  }
  function bundleKey(config,files=[]){
    if(!files.length)return storageKey(config);let hash=2166136261;
    // A namespace fingerprint only; no encryption or access control.
    for(const char of JSON.stringify(files))hash=Math.imul(hash^char.codePointAt(0),16777619)>>>0;
    return storageKey(config)+':files:'+hash.toString(16);
  }
  function createTeamRegistry(raw,demo) {
    const fallback=validateConfig(demo);let entries=[{config:fallback,files:[]}],selected=storageKey(fallback),pending=null;
    const copy=entry=>JSON.parse(JSON.stringify(entry));
    function checkEntry(entry){object(entry,['config','files']);const config=validateConfig(entry.config);if(!Array.isArray(entry.files))fail('bundle files');if(entry.files.length){const b=validateBundle(entry.files);if(b.missing.length||JSON.stringify(b.config)!==JSON.stringify(config))fail('invalid saved bundle');return {config,files:b.files};}if(references(config).length)fail('missing saved skill files');return {config,files:[]};}
    if(raw){try{if(typeof raw!=='string'||bytes(raw)>REGISTRY_BYTES)throw Error();const saved=JSON.parse(raw);inspect(saved,100000);let candidates;if(saved.version===1){object(saved,['version','selected','teams']);candidates=saved.teams.map(c=>checkEntry({config:c,files:[]}));}else{object(saved,['version','selected','entries']);if(saved.version!==2)throw Error();candidates=saved.entries.map(checkEntry);}if(!candidates.length||candidates.length>MAX_TEAMS)throw Error();const keys=candidates.map(e=>bundleKey(e.config,e.files));if(new Set(keys).size!==keys.length||!keys.includes(saved.selected))throw Error();entries=candidates;selected=saved.selected;}catch{/* Never activate invalid persisted files. */}}
    function prepareEntry(config,files){const candidate={config,files},key=bundleKey(config,files),newEntries=entries.some(e=>bundleKey(e.config,e.files)===key)?entries:[...entries,candidate];if(newEntries.length>MAX_TEAMS)throw Error('Local team limit reached (8). Clear site data or use another browser profile.');if(bytes(JSON.stringify({version:2,selected:key,entries:newEntries}))>REGISTRY_BYTES)throw Error('Remembered configuration/file limit reached (4 MiB). Clear site data or use another browser profile.');pending=candidate;}
  return Object.freeze({
      list:()=>entries.map(e=>validateConfig(e.config)),
      listEntries:()=>entries.map(e=>({key:bundleKey(e.config,e.files),config:validateConfig(e.config)})),
      current:()=>validateConfig(entries.find(e=>bundleKey(e.config,e.files)===selected).config),
      currentKey:()=>selected,
      currentFiles:()=>copy(entries.find(e=>bundleKey(e.config,e.files)===selected)).files,
      prepare(text){pending=null;const candidate=parseConfig(text);if(unsafeContent(text))fail('credential-like config content');const missing=[...new Set(references(candidate).map(r=>r.path))];if(missing.length)throw Error('Referenced skill/supporting files require folder import.');prepareEntry(candidate,[]);return validateConfig(candidate);},
      prepareBundle(files){pending=null;const preview=validateBundle(files);if(!preview.missing.length)prepareEntry(preview.config,preview.files);return JSON.parse(JSON.stringify(preview));},
      cancel(){pending=null;},
      apply(){if(!pending)throw Error('Choose and review a valid complete configuration first.');const candidate=checkEntry(pending),next=bundleKey(candidate.config,candidate.files);if(!entries.some(e=>bundleKey(e.config,e.files)===next))entries.push(candidate);selected=next;pending=null;return validateConfig(candidate.config);},
      select(key){if(!entries.some(e=>bundleKey(e.config,e.files)===key))throw Error('Unknown local team.');pending=null;selected=key;return this.current();},
      serialize:()=>JSON.stringify({version:2,selected,entries})
    });
  }
    function connectionPresentation(runtime){
    if(!runtime||runtime.mode==='demo')return {title:'OFFLINE DEMO',detail:'Explicit demo mode · local notes and fixed previews · no model requests',label:'Demo · no AI',composer:'Local demo · no AI',send:false,demo:true};
    const connected=['ready','running','awaiting-approval','cancelling'].includes(runtime.status),name=runtime.runtime?.label||'Local runtime';
    if(runtime.error)return {title:'LIVE REQUEST ERROR',detail:runtime.error+' · no mock fallback',label:connected?name+' connected · request error':'Not connected · error',composer:'Live error · check connection',send:connected&&runtime.status==='ready',demo:false};
    if(connected)return {title:'LIVE · '+name.toUpperCase(),detail:'Signed-in local '+name+' · '+runtime.status+' · runtime policy remains in force',label:runtime.roleModel?name+' · '+runtime.roleModel:name+' connected · role model not yet verified',composer:runtime.status==='ready'?'Live chat · real model replies':'Live turn · '+runtime.status,send:runtime.status==='ready',demo:false};
    return {title:'LIVE WORKSPACE · NOT CONNECTED',detail:runtime.status==='connecting'?'Connecting to the local runtime…':runtime.paired?'Paired · click Connect local runtime':'Click Pair and connect this team to enable live chat',label:runtime.status==='connecting'?'Connecting…':'Not connected',composer:'Live chat unavailable until connected',send:false,demo:false};
  }
  return Object.freeze({connectionPresentation,validateConfig,parseConfig,storageKey,seedState,appendLocalMessage,restoreState,createTeamRegistry,validateBundle,portablePath,references,bundleKey,REGISTRY_KEY,MAX_TEAMS,CONFIG_BYTES,STATE_BYTES,BUNDLE_FILES,FILE_BYTES,BUNDLE_BYTES,REGISTRY_BYTES,STATUS,PROVIDERS,LOCAL_RUNTIME_CANDIDATES,validateModelPreference,setModelPreference});
})();
if(typeof module!=='undefined')module.exports=RolequiltCore;
