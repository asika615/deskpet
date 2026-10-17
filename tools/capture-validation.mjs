// One version per process: decoding two complete expression atlases at once
// needlessly doubles native image memory in a constrained review container.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {loadFigure} from './render-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const version=process.argv[2];
const c=await loadFigure(version);
console.log(version+' loaded');
const hashes=[],joints=[],faceHashes=[];
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
let folded=0,shoulderFolded=0,maxSharedFieldError=0;
const grownParts=new Set(['waveShoulderSkin','waveUpper','armR','farShoulderFoundation']);
let protectedTorsoHash;
for(let i=0;i<480;i++){
  const o={...c.frame,t:i/60,gesture:i<360?{kind:'wave',k:i/359}:{kind:i<420?'nod':'bow',k:((i-360)%60)/59}};
  if(i>=360)o.look=[Math.sin((i-360)/20)*4,Math.cos((i-360)/20)*3];
  c.figure.draw(c.g,{},o);
  const meshes=c.kit.rig.meshes(c.kit.rig.state),hh={};
  for(const m of meshes){
    if(!grownParts.has(m.p.id))hh[m.p.id]=sha(new Float64Array(m.vertices.flat()));
    if(m.p.id==='torso'||grownParts.has(m.p.id))for(let j=0;j<m.ny;j++)for(let n=0;n<m.nx;n++){
      const a=j*(m.nx+1)+n,b=a+1,cc=a+m.nx+1,d=cc+1;
      for(const ids of [[a,b,cc],[b,d,cc]]){
        const [p,q,r]=ids.map(n=>m.vertices[n]);
        const area=(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
        if(!Number.isFinite(area)||area<=0){
          const tex=c.kit.rig.textureBytes(m.p.tex),size=c.kit.rig.textureSize(m.p.tex);
          let opaque=false;
          // Ignore transparent atlas padding; inspect centroids and vertices.
          for(const id of [...ids,-1]){
            const u=id<0?ids.reduce((s,k)=>s+k%(m.nx+1),0)/(3*m.nx):(id%(m.nx+1))/m.nx;
            const v=id<0?ids.reduce((s,k)=>s+Math.floor(k/(m.nx+1)),0)/(3*m.ny):Math.floor(id/(m.nx+1))/m.ny;
            const x=Math.min(size[0]-1,Math.floor(u*size[0])),y=Math.min(size[1]-1,Math.floor(v*size[1]));
            if(tex[(y*size[0]+x)*4+3]>32)opaque=true;
          }
          if(opaque){if(m.p.id==='torso')folded++;else shoulderFolded++;}
        }
      }
    }
  }
  hashes.push(hh);
  joints.push([['waveUpperJoint','waveShoulder'],['waveUpperJoint','waveElbow'],['waveElbowJoint','waveElbow'],['waveElbowJoint','waveWrist'],['waveWristJoint','waveWrist']].map(([node,key])=>c.kit.rig.point(node,c.kit.rig.state,...c.figure.model.pivots[key])));
  const {S,X0,FEET}=c.figure.model.units;
  for(const [x,y] of [[625,735],[635,745],[644,752],[650,758]]){
    const p=[128+(x-X0)*S,256+(y-FEET)*S];
    const a=c.kit.rig.point('shoulderSkinBridge',c.kit.rig.state,...p),b=c.kit.rig.point('waveSleeveRoot',c.kit.rig.state,...p);
    maxSharedFieldError=Math.max(maxSharedFieldError,Math.hypot(a[0]-b[0],a[1]-b[1]));
  }
  if(i%20===0)globalThis.gc?.();
}
console.log(version+' motion complete');
protectedTorsoHash=sha(c.kit.rig.textureBytes('torso'));
let cases=0;
for(const face of Object.keys(globalThis.EXPRESSION_CONFIG.expressions)){
  for(const blink of [0,.5,1])for(const talk of [0,.7]){
  const frame={...c.frame,t:8+cases/60,face,blink,talk,look:[1,-1]};
  c.figure.draw(c.g,{},frame);
  const deadline=Date.now()+10000;
  while(c.figure.diagnostics().expression?.expression!==face){
    if(Date.now()>deadline)throw new Error('Expression did not load: '+face);
    await new Promise(resolve=>setTimeout(resolve,10));
    c.figure.draw(c.g,{},frame);
  }
  faceHashes.push(sha(c.kit.rig.textureBytes('expressionHead')));cases++;
  if(cases%10===0)globalThis.gc?.();
  }
}
await fs.mkdir(path.join(root,'.tmp'),{recursive:true});
await fs.writeFile(path.join(root,'.tmp',version+'-capture.json'),JSON.stringify({hashes,joints,faceHashes,folded,shoulderFolded,maxSharedFieldError,protectedTorsoHash,cases}));
c.figure.dispose();console.log(version+' validation capture complete');
