/* Run a user-selected private launcher in the user's terminal, not as a daemon. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
const file=process.argv[2];
if(!file||!path.isAbsolute(file)){console.error('Usage: npm run start:live -- /absolute/path/to/private-launch.cjs');process.exitCode=1;}
else{let launcher;try{launcher=fs.realpathSync(file);if(!fs.statSync(launcher).isFile()||!launcher.endsWith('.cjs'))throw Error();}catch{console.error('Choose an existing private .cjs launcher.');process.exitCode=1;}
 if(launcher){const child=spawn(process.execPath,[launcher],{stdio:'inherit',shell:false});child.on('error',()=>{console.error('Private live launcher could not start.');process.exitCode=1;});child.on('exit',(code,signal)=>{console.log(signal?'Live service stopped by '+signal:'Live service exited with code '+code);process.exitCode=code??1;});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));}}
