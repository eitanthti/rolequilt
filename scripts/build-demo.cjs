'use strict';
const fs=require('node:fs');
const path=require('node:path');
const core=require('../src/core.js');
const root=path.resolve(__dirname,'..');
// Only the checked-in, fictional example is a build input. No arbitrary-file import.
const config=core.parseConfig(fs.readFileSync(path.join(root,'config/demo.example.json'),'utf8'));
const body=JSON.stringify(config,null,2).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
fs.writeFileSync(path.join(root,'src/demo-config.js'),"/* Generated from config/demo.example.json. Fictional public data only. */\n'use strict';\nconst RolequiltDemo = "+body+";\nif(typeof module!=='undefined')module.exports=RolequiltDemo;\n");
console.log('Fictional demo configuration built.');
