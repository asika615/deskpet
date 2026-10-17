import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(import.meta.url);
const old=path.join(root,'versions/v0.3.14/reference-companion');
const current=path.join(root,'versions/v0.3.15/reference-companion');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

for(const version of ['v0.3.14','v0.3.15']){
  const result=spawnSync(process.execPath,['--expose-gc',path.join(root,'tools/capture-validation.mjs'),version],{
    cwd:root,encoding:'utf8',env:process.env,maxBuffer:2*1024*1024,
  });
  if(result.status!==0)throw new Error(version+' capture failed: '+result.stderr+'\n'+result.stdout);
  process.stdout.write(result.stdout);
}
const a=JSON.parse(fs.readFileSync(path.join(root,'.tmp/v0.3.14-capture.json')));
const b=JSON.parse(fs.readFileSync(path.join(root,'.tmp/v0.3.15-capture.json')));
for(const field of ['hashes','joints','faceHashes','protectedTorsoHash'])
  assert.deepEqual(b[field],a[field],field+' differs from v0.3.14');
assert.equal(b.hashes.length,480);
assert.equal(b.cases,120);
assert.equal(b.folded,0);
assert.equal(b.shoulderFolded,0);

require(path.join(current,'expressions/controller-config.js'));
const config=globalThis.EXPRESSION_CONFIG;
const {FaceController}=require(path.join(current,'expressions/face-controller.js'));
const baseline=new Set([config.base,config.normalBase,config.eyeClear,config.faceMask]);
for(const eye of config.normalEyes)for(const key of ['sclera','iris','lashes','aperture','faceClip'])baseline.add(eye[key]);
const initial=new Set([...baseline,...FaceController.expressionPaths(config,'neutral'),'parts/happy/mouth.png']);
const all=new Set(initial);
for(const name of Object.keys(config.expressions))for(const file of FaceController.expressionPaths(config,name))all.add(file);
const rgba=files=>[...files].reduce((sum,file)=>{
  const png=fs.readFileSync(path.join(current,'expressions',file));
  assert.equal(png.toString('ascii',1,4),'PNG');
  return sum+png.readUInt32BE(16)*png.readUInt32BE(20)*4;
},0);
assert.equal(initial.size,22);
assert.equal(all.size,156);

let pngCount=0;
function checkPngs(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())checkPngs(file);
    else if(entry.name.endsWith('.png')){
      assert.equal(hash(file),hash(path.join(current,path.relative(old,file))),path.relative(old,file));
      pngCount++;
    }
  }
}
checkPngs(old);
console.log(JSON.stringify({frames:b.hashes.length,expressionCases:b.cases,pngFilesUnchanged:pngCount,
  initialImagesBefore:all.size,initialImagesAfter:initial.size,
  estimatedDecodedMiBBefore:Math.round(rgba(all)/1048576),
  estimatedDecodedMiBAfter:Math.round(rgba(initial)/1048576)},null,2));
