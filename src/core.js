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
  function object(value, keys) {
    if (!value || Array.isArray(value) || typeof value !== 'object') fail('object required');
    if (Object.keys(value).length !== keys.length || keys.some(k=>!Object.hasOwn(value,k)) || Object.keys(value).some(k=>!keys.includes(k))) fail('unsupported fields');
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
      object(role,['id','name','label','specialty','color','shape','summary','heading','intro','focus','responsibility','handoff','deliverable','tags','prompts']);
      id(role.id);if(roleIds.has(role.id))fail('duplicate role');roleIds.add(role.id);
      for(const key of ['name','label'])string(role[key],80);
      for(const key of ['specialty','summary','heading'])string(role[key],160);
      for(const key of ['intro','responsibility','handoff','deliverable'])string(role[key]);
      if(typeof role.color!=='string'||!/^#[a-fA-F0-9]{6}$/.test(role.color))fail('color');
      if(!Number.isInteger(role.shape)||role.shape<0||role.shape>4)fail('shape');
      list(role.focus,1,4,step=>{object(step,['title','detail']);string(step.title,160);string(step.detail,1000);});
      list(role.tags,0,5,item=>string(item,40));list(role.prompts,0,4,item=>string(item,240));
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
      messages:Object.fromEntries(config.roles.map(r=>[r.id,[]])),drafts:Object.fromEntries(config.roles.map(r=>[r.id,''])),tasks:config.tasks.map(t=>({...t}))};
  }
  function capHistories(state,config) {
    for(const role of config.roles)state.messages[role.id]=state.messages[role.id].slice(-100);
    const all=()=>config.roles.flatMap(r=>state.messages[r.id].map(m=>({m,role:r.id})));
    let messages=all(),length=messages.reduce((sum,x)=>sum+x.m.text.length,0);
    while(messages.length>300||length>400000){
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
        const draft=saved.drafts?.[role.id];state.drafts[role.id]=typeof draft==='string'?draft.slice(0,4000):'';
        const history=saved.messages?.[role.id];
        state.messages[role.id]=Array.isArray(history)?history.filter(m=>m&&['user','preview'].includes(m.type)&&typeof m.text==='string'&&m.text.length<=5000&&Number.isFinite(m.time)&&m.time>=0).slice(-100).map(m=>({type:m.type,text:m.text,time:m.time})):[];
      }
      for(const task of state.tasks){const savedTask=Array.isArray(saved.tasks)?saved.tasks.find(t=>t&&t.id===task.id):null;if(savedTask&&Object.hasOwn(STATUS,savedTask.status))task.status=savedTask.status;}
      capHistories(state,config);return {state,recovered:false};
    }catch{return {state,recovered:true};}
  }
  return Object.freeze({validateConfig,parseConfig,storageKey,seedState,appendLocalMessage,restoreState,STATUS,CONFIG_BYTES,STATE_BYTES});
})();
if(typeof module!=='undefined')module.exports=RolequiltCore;
