/* Local-only publication gate. It never sends files or prints matched values. */
'use strict';
const fs=require('node:fs');const path=require('node:path');const {execFileSync}=require('node:child_process');
function scanContent(text){
  const findings=[];
  const patterns=[
    ['token-shaped value',/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|AKIA[A-Z0-9]{16}|sk-(?:proj-)?[A-Za-z0-9_-]{20,})\b/],
    ['private key',/-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/],
    ['private path',/(?:\/(?:Users|home)\/[^\s"']+|[A-Z]:\\Users\\[^\s"']+)/i],
    ['credential assignment',/\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\s*["']?\s*[:=]\s*["'][^"'\s]{8,}["']/i],
    ['credential URL',/https?:\/\/[^\s/:]+:[^\s/@]+@/i]
  ];
  for(const [name,regex]of patterns)if(regex.test(text))findings.push(name);
  const emails=text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)||[];
  if(emails.some(email=>!/@(?:example\.(?:com|org|invalid)|users\.noreply\.github\.com)$/i.test(email)))findings.push('non-example email');
  if(text.includes('\u0000'))findings.push('binary content');
  return findings;
}
function auditRepository(directory){
  const root=fs.realpathSync(directory),errors=[],git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:16*1024*1024,stdio:['ignore','pipe','pipe']});
  let files;
  try{files=JSON.parse(fs.readFileSync(path.join(root,'publish-files.json'),'utf8'));}catch{return ['Publication manifest missing or invalid.'];}
  if(!Array.isArray(files)||!files.length||new Set(files).size!==files.length||files.some(f=>typeof f!=='string'||!/^\.?[a-zA-Z0-9][a-zA-Z0-9/_.-]*$/.test(f)||f.split('/').some(p=>p==='..'||p==='.git')||/(^|\/)(?:\.env(?:\..*)?|private(?:\..*)?|credentials(?:\..*)?|\.aws|\.codex|\.agents)(\/|$)/i.test(f)))return ['Publication manifest contains unsafe entries.'];
  const allow=new Set(files),seen=new Set();
  function content(label,text){for(const finding of scanContent(text))errors.push(label+': '+finding);}
  function entry(label,name,text,mode){
    if(!allow.has(name))errors.push(label+' '+name+': not allowlisted');
    if(mode==='120000'||mode==='160000')errors.push(label+' '+name+': symlink or submodule');
    if(text!==undefined)content(label+' '+name,text);
  }
  function walk(dir,prefix=''){
    for(const item of fs.readdirSync(dir,{withFileTypes:true})){
      if(!prefix&&item.name==='.git')continue;
      const name=prefix+item.name,full=path.join(dir,item.name);
      if(item.isSymbolicLink()){errors.push('working '+name+': symlink');continue;}
      if(item.isDirectory()){walk(full,name+'/');continue;}
      seen.add(name);entry('working',name,fs.readFileSync(full,'utf8'));
    }
  }
  walk(root);for(const file of files)if(!seen.has(file))errors.push('working '+file+': missing');
  try{
    if(fs.realpathSync(git('rev-parse','--show-toplevel').trim())!==root)return [...errors,'Git root is not this isolated project.'];
    if(!fs.statSync(path.join(root,'.git')).isDirectory())errors.push('Git metadata must be local to the isolated project.');
    const staged=git('ls-files','--stage','-z').split('\0').filter(Boolean),stagedNames=new Set();
    for(const row of staged){const [metadata,name]=row.split('\t');const [mode,oid,stage]=metadata.split(' ');stagedNames.add(name);if(stage!=='0')errors.push('Unmerged index entry.');entry('index',name,git('cat-file','blob',oid),mode);}
    for(const file of files)if(!stagedNames.has(file))errors.push('index '+file+': missing');
    if(git('diff','--name-only').trim())errors.push('Working files differ from index. Stage and review the final versions.');
    const revisions=git('rev-list','--all').trim().split('\n').filter(Boolean);
    if(!revisions.length)errors.push('Fresh initial commit missing.');
    const checked=new Set();
    for(const revision of revisions){
      content('history commit '+revision.slice(0,7),git('cat-file','commit',revision));
      for(const row of git('ls-tree','-r','-z',revision).split('\0').filter(Boolean)){
        const [metadata,name]=row.split('\t'),[mode,type,oid]=metadata.split(' ');
        entry('history '+revision.slice(0,7),name,undefined,mode);
        if(type==='blob'&&!checked.has(oid)){checked.add(oid);content('history '+revision.slice(0,7)+' '+name,git('cat-file','blob',oid));}
      }
    }
    content('remote configuration',git('remote','-v'));
  }catch{errors.push('Git audit could not complete.');}
  return [...new Set(errors)];
}
if(require.main===module){const errors=auditRepository(path.resolve(__dirname,'..'));if(errors.length){for(const error of errors)console.error(error);process.exitCode=1;}else console.log('Publication gate passed: working files, index and all reachable history are allowlisted and pattern scans are clear. Manual private-data review remains required.');}
module.exports={scanContent,auditRepository};
