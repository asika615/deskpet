import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
for(const version of ['v0.3.11','v0.3.12']){
 const result=spawnSync(process.execPath,['--expose-gc',path.join(root,'tools/capture-validation.mjs'),version],{encoding:'utf8'});
 process.stdout.write(result.stdout||'');if(result.status!==0){process.stderr.write(result.stderr||'');throw Error('Validation process failed: '+version+' '+result.status+' '+result.signal);}
}
const a=JSON.parse(await fs.readFile(path.join(root,'.tmp/v0.3.11-capture.json')));
const b=JSON.parse(await fs.readFile(path.join(root,'.tmp/v0.3.12-capture.json')));
assert.deepEqual(a.hashes,b.hashes,'Untouched mesh geometry differs');
assert.deepEqual(a.joints,b.joints,'Shoulder/elbow/wrist coordinates differ');
assert.deepEqual(a.faceHashes,b.faceHashes,'Expression output differs');assert.equal(b.folded,0);assert.equal(b.shoulderFolded,0);assert.equal(a.protectedTorsoHash,b.protectedTorsoHash,'Head-neck/bodice atlas changed');assert(b.maxSharedFieldError<1e-10);
const maxMeshDelta=0,maxJointDelta=0,folded=b.folded,frames=b.hashes.length,expressionCases=b.cases;
const baseA=path.join(root,'versions/v0.3.11/reference-companion'),baseB=path.join(root,'versions/v0.3.12/reference-companion');
async function walk(d){let out=[];for(const x of await fs.readdir(d,{withFileTypes:true})){const p=path.join(d,x.name);out.push(...x.isDirectory()?await walk(p):[p]);}return out;}
const oldFiles=await walk(baseA);let pngUnchanged=0;
for(const p of oldFiles){
  const rel=path.relative(baseA,p);
  if(rel.endsWith('.png')||['motion.js','kit/body.js','kit/rig.js','expression-bridge.js','collar-connection.js'].includes(rel)||rel.startsWith('expressions/')){
    assert.equal(sha(await fs.readFile(p)),sha(await fs.readFile(path.join(baseB,rel))),rel+' changed');
    if(rel.endsWith('.png'))pngUnchanged++;
  }
}
const ma=JSON.parse(await fs.readFile(path.join(baseA,'model.json'))),mb=JSON.parse(await fs.readFile(path.join(baseB,'model.json')));
for(const k of ['units','pivots','view','mesh','headArtRegistration','armArticulation','shoulderContinuityRepair'])assert.deepEqual(ma[k],mb[k]);
for(const p of ma.parts)if(!['waveShoulderSkin','armR'].includes(p.id))assert.deepEqual(p,mb.parts.find(q=>q.id===p.id));
const {collarOffset}=await import(pathToFileURL(path.join(baseB,'collar-connection.js')));
let outsideSamples=0;
for(let y=600;y<=1000;y+=2)for(let x=550;x<=860;x+=2)if(x<=575||x>=840||y>=810){assert.deepEqual(collarOffset(x,y),[0,0]);outsideSamples++;}
const report={version:'0.3.12',method:'Production figure and expression functions with software kit injection',frames,expressionCases,pngFilesByteUnchanged:pngUnchanged,maxUntouchedMeshDelta:maxMeshDelta,maxShoulderElbowWristDelta:maxJointDelta,neckTriangleFoldCount:folded,shoulderOpaqueTriangleFoldCount:b.shoulderFolded,maxSharedShoulderFieldError:b.maxSharedFieldError,neckBodiceAtlasIdentical:a.protectedTorsoHash===b.protectedTorsoHash,outsideFieldSamples:outsideSamples,headRest:mb.headArtRegistration.headRest,limitations:['Software rasterization is not GPU filtering or antialiasing verification','Browser/Electron import was not executed: no local Chromium executable available']};
await fs.mkdir(path.join(baseB,'verification'),{recursive:true});
await fs.writeFile(path.join(baseB,'verification/shoulder-volume-validation.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
