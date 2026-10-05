'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/core.js');
const config = {
  schemaVersion: 1,
  team: {id:'sample-studio', name:'Sample Studio', tagline:'A fictional studio', leadRoleId:'planner', focus:{label:'Demo workspace',heading:'Build a clearer plan.',description:'Fictional data for offline exploration.'}},
  roles: [
    {id:'planner',name:'Planner',label:'Priorities',specialty:'Define the next step',color:'#d3ab70',shape:0,summary:'Make the goal clear.',heading:'Begin with a clear goal.',intro:'Turn an idea into a practical plan.',focus:[{title:'Clarify the outcome',detail:'Write one useful next step.'}],responsibility:'Keep the plan current.',handoff:'Pass the brief to the maker.',deliverable:'A short plan.',tags:['Planning'],prompts:['Draft a plan']},
    {id:'maker',name:'Maker',label:'Creation',specialty:'Make useful drafts',color:'#94aaa0',shape:1,summary:'Make a small draft.',heading:'Try a small first draft.',intro:'Use the plan to make something tangible.',focus:[{title:'Keep it small',detail:'Start with one deliverable.'}],responsibility:'Produce draft work.',handoff:'Send the draft for review.',deliverable:'A draft.',tags:['Creation'],prompts:['Outline a draft']}
  ],
  tasks: [{id:'task-01',owner:'planner',title:'Outline the next step',description:'Fictional demonstration task.',status:'todo'}]
};
const copy=()=>JSON.parse(JSON.stringify(config));
test('accepts a portable fictional configuration and returns a detached value',()=>{
  const clean=core.validateConfig(config); assert.deepEqual(clean,config); clean.roles[0].name='Changed'; assert.equal(config.roles[0].name,'Planner');
});
test('rejects unknown credential fields, duplicate roles and dangling task owners',()=>{
  for(const mutate of [c=>c.apiKey='secret', c=>c.roles[1].id='planner', c=>c.tasks[0].owner='missing', c=>c.team.leadRoleId='missing', c=>c.roles[0].color='url(example)', c=>c.roles[0].shape=99]){
    const c=copy();mutate(c);assert.throws(()=>core.validateConfig(c),/invalid config/i);
  }
});
test('rejects dangerous keys at any depth and non-plain objects',()=>{
  for(const key of ['__proto__','constructor','prototype']){
    const c=copy();c.roles[0]=JSON.parse(JSON.stringify(c.roles[0]).replace('"name":',`"${key}":{},"name":`));
    assert.throws(()=>core.validateConfig(c),/unsafe key/i);
  }
  const c=copy();c.team.focus=new Date();assert.throws(()=>core.validateConfig(c),/invalid config/i);assert.equal({}.polluted,undefined);
});
test('enforces byte, collection, type, identifier and version limits without reflecting input',()=>{
  for(const mutate of [c=>c.roles[0].intro='x'.repeat(4097),c=>c.roles=Array(25).fill(c.roles[0]),c=>c.schemaVersion=2,c=>c.roles[0].id='bad/id',c=>c.roles[0].tags=[false]]){
    const c=copy();mutate(c);assert.throws(()=>core.validateConfig(c),/invalid config/i);
  }
  assert.throws(()=>core.parseConfig('x'.repeat(65537)),/size/i);
  assert.throws(()=>core.parseConfig('{'),/JSON/);
  assert.throws(()=>core.parseConfig(JSON.stringify({...config,team:{...config.team,name:'💡'.repeat(20000)}})),/size/i);
});
test('preserves literal hostile text as text and separates configuration storage keys',()=>{
  const c=copy();c.roles[0].intro='<img src=x onerror=alert(1)>';assert.equal(core.validateConfig(c).roles[0].intro,'<img src=x onerror=alert(1)>');
  const key=core.storageKey(config);c.roles[0].deliverable='A different brief';assert.notEqual(core.storageKey(c),key);
});
test('keeps histories and drafts independent and restores only configured task statuses',()=>{
  const s=core.seedState(config);s.drafts.planner='draft one';s.drafts.maker='draft two';
  core.appendLocalMessage(s,config,'planner','A local note',false,1000);
  assert.equal(s.messages.planner.length,1);assert.equal(s.messages.maker.length,0);assert.equal(s.drafts.maker,'draft two');
  s.tasks[0].status='done';s.tasks.push({id:'unconfigured',status:'done'});
  const loaded=core.restoreState(JSON.stringify(s),config);
  assert.equal(loaded.recovered,false);assert.equal(loaded.state.messages.planner[0].text,'A local note');assert.equal(loaded.state.tasks.length,1);assert.equal(loaded.state.tasks[0].status,'done');assert.equal(loaded.state.drafts.maker,'draft two');
});
test('uses an explicitly fixed preview that never pretends to execute or analyze messages',()=>{
  const s=core.seedState(config);core.appendLocalMessage(s,config,'maker','Write a secret result',true,1000);
  assert.equal(s.messages.maker[1].type,'preview');assert.match(s.messages.maker[1].text,/fixed preview/i);assert.match(s.messages.maker[1].text,/does not analyze/);assert.doesNotMatch(s.messages.maker[1].text,/Write a secret result/);
});
test('caps histories and rejects blank or oversized messages',()=>{
  const s=core.seedState(config);
  for(let i=0;i<140;i++)core.appendLocalMessage(s,config,'planner',String(i),false,i);
  assert.equal(s.messages.planner.length,100);assert.equal(s.messages.planner[0].text,'40');
  assert.throws(()=>core.appendLocalMessage(s,config,'planner','x'.repeat(4001),false,1000));
  assert.throws(()=>core.appendLocalMessage(s,config,'planner',' ',false,1000));
  assert.throws(()=>core.appendLocalMessage(s,config,'unknown','hi',false,1000));
});
test('corrupt, dangerous, oversized and wrong-version state recover without mutating defaults',()=>{
  for(const raw of ['{','{"version":2}','{"version":1,"constructor":{}}','x'.repeat(2097153)]){
    const loaded=core.restoreState(raw,config);assert.equal(loaded.recovered,true);assert.equal(loaded.state.messages.planner.length,0);
  }
  const s=core.seedState(config);s.agent='missing';s.messages.planner=[{type:'online',text:'bad',time:1},{type:'user',text:'safe',time:2}];
  const loaded=core.restoreState(JSON.stringify(s),config);assert.equal(loaded.state.agent,'planner');assert.equal(loaded.state.messages.planner.length,1);assert.equal(loaded.state.messages.planner[0].text,'safe');
});
module.exports={config};
