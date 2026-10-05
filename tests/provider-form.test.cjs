'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const core=require('../src/core.js'),demo=require('../src/demo-config.js');
function fixture(persist=true,state=core.seedState(demo),role=demo.roles[0]){
 const node=(tag,cls,text)=>({tag,className:cls,textContent:text,children:[],attributes:{},append(...items){this.children.push(...items);},setAttribute(k,v){this.attributes[k]=v;}});
 const create=require('../src/provider-settings.js');let saved;
 const row=create({node,core,config:demo,state,role,save(){saved=JSON.stringify(state);return persist;}});
 return {row,state,get saved(){return saved;},select:row.children[2],input:row.children[4],button:row.children[5],status:row.children[6],submit(){row.onsubmit({preventDefault(){}});}};
}
test('actual preference form saves optional blank model, reloads, and isolates roles',()=>{const f=fixture();assert.equal(f.input.disabled,true);f.select.value='openai';f.select.onchange();assert.equal(f.input.disabled,false);f.submit();assert.match(f.status.textContent,/Saved in this browser/);assert.equal(core.restoreState(f.saved,demo).state.modelPreferences[demo.roles[0].id].provider,'openai');assert.equal(f.state.modelPreferences[demo.roles[1].id].provider,'none');});
test('form reports validation and storage failure inline, never claims persistence',()=>{const f=fixture(false);f.select.value='openai';f.select.onchange();f.input.value='bad:model';f.submit();assert.equal(f.saved,undefined);assert.equal(f.status.attributes.role,'alert');f.input.value='sample-model';f.submit();assert.match(f.status.textContent,/Session only/);assert.doesNotMatch(f.status.textContent,/Saved in this browser/);});
test('old unavailable preference remains visible but cannot save until supported choice',()=>{const state=core.seedState(demo);state.modelPreferences[demo.roles[0].id]={provider:'google',modelId:'sample-model'};const f=fixture(true,state);assert.equal(f.button.disabled,true);f.submit();assert.equal(f.saved,undefined);f.select.value='none';f.select.onchange();assert.equal(f.input.value,'');assert.equal(f.button.disabled,false);f.submit();assert.equal(f.state.modelPreferences[demo.roles[0].id].provider,'none');});
test('old state without preferences upgrades while preserving fabricated drafts',()=>{const state=core.seedState(demo);delete state.modelPreferences;state.drafts[demo.roles[0].id]='Fictional draft';const restored=core.restoreState(JSON.stringify(state),demo).state;const f=fixture(true,restored);f.select.value='openai';f.select.onchange();f.submit();assert.equal(core.restoreState(f.saved,demo).state.drafts[demo.roles[0].id],'Fictional draft');});

test('browser loads the form module before app startup',()=>{const fs=require('node:fs'),html=fs.readFileSync('index.html','utf8');assert(html.indexOf('src/provider-settings.js')>=0);assert(html.indexOf('src/provider-settings.js')<html.indexOf('src/app.js'));});
