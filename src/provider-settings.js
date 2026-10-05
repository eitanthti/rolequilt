/* Local preference form only; never connects or runs a model. */
'use strict';
function RolequiltProviderForm({node,core,config,state,role,save}){
 const current=state.modelPreferences[role.id],row=node('form','provider-row'),heading=node('h4','',role.name+' · disconnected'),label=node('label','','Provider preference'),select=node('select'),modelLabel=node('label','','Unverified model ID (optional)'),input=node('input'),button=node('button','button-secondary','Save local preference'),status=node('p');
 select.id='provider-'+role.id;label.htmlFor=select.id;
 for(const [id,name]of Object.entries(core.PROVIDERS)){const option=node('option','',name);option.value=id;option.disabled=!core.LOCAL_RUNTIME_CANDIDATES.includes(id);select.append(option);}select.value=current.provider;
 input.id='model-'+role.id;modelLabel.htmlFor=input.id;input.type='text';input.maxLength=120;input.autocomplete='off';input.placeholder='Optional; model ID not verified';input.value=current.modelId;button.type='submit';status.id='preference-status-'+role.id;status.setAttribute('role','status');status.setAttribute('aria-live','polite');select.setAttribute('aria-describedby',status.id);input.setAttribute('aria-describedby',status.id);
 function update(){const available=core.LOCAL_RUNTIME_CANDIDATES.includes(select.value);input.disabled=!available||select.value==='none';button.disabled=!available;if(select.value==='none')input.value='';status.setAttribute('role','status');input.setAttribute('aria-invalid','false');status.textContent=available?'Local preference only · disconnected.':'Saved route unavailable. Choose local Codex or Not chosen to save.';}
 select.onchange=update;input.oninput=()=>{input.setAttribute('aria-invalid','false');status.textContent='Unsaved local preference · disconnected.';};update();
 row.onsubmit=event=>{event.preventDefault();try{core.setModelPreference(state,config,role.id,{provider:select.value,modelId:input.value.trim()});}catch{status.setAttribute('role','alert');input.setAttribute('aria-invalid','true');status.textContent='Cannot save: choose an available route and use up to 120 letters/digits/dots/hyphens/underscores/slashes for the optional model ID. Do not enter credentials.';return;}
  status.setAttribute('role','status');input.setAttribute('aria-invalid','false');let persisted=false;try{persisted=save()===true;}catch{}status.textContent=persisted?'Saved in this browser · disconnected; model ID not verified.':'Session only: preference could not be persisted and may be lost on reload. Disconnected.';
 };
 row.append(heading,label,select,modelLabel,input,button,status);return row;
}
if(typeof module!=='undefined')module.exports=RolequiltProviderForm;
