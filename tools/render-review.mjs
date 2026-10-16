import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import { softwareKit } from './software-rig.mjs';
const require=createRequire(import.meta.url);
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const imageCache=new Map();
async function cachedImage(url){const bytes=await fs.readFile(fileURLToPath(url));const key=crypto.createHash('sha256').update(bytes).digest('hex');if(!imageCache.has(key))imageCache.set(key,loadImage(bytes));return imageCache.get(key);}
function element(){return {children:[],style:{},attributes:{},append(...nodes){this.children.push(...nodes)},appendChild(n){this.append(n)},contains(n){return this.children.includes(n)},setAttribute(k,v){this.attributes[k]=v},remove(){},set textContent(v){this.children=[]},set innerHTML(v){this.html=v}};}
globalThis.document={createElementNS(ns,name){if(name!=='canvas')return element();const c=createCanvas(1,1);c.style={};return c;}};

export async function loadFigure(version) {
  const base=path.join(ROOT,'versions',version,'reference-companion');
  const model=JSON.parse(await fs.readFile(path.join(base,'model.json'),'utf8'));
  const {FaceController}=require(path.join(base,'expressions/face-controller.js'));
  require(path.join(base,'expressions/controller-config.js'));
  const {createReferenceFigure}=await import(pathToFileURL(path.join(base,'figure.js')));
  const kit=softwareKit(model);
  const figure=await createReferenceFigure(pathToFileURL(base+'/'),{
    model,kit,FaceController,expressionConfig:globalThis.EXPRESSION_CONFIG,
    loadImage:cachedImage,createCanvas,
  });
  const g=element();
  const frame={look:[0,0],legs:[[124,227,124,256],[144,227,144,256]],low:0,t:0,blink:0,eyeClose:0,swing:0,face:'neutral',mode:'idle',modeT:0,talk:0,drowse:0,sit:0,facing:1,tilt:0,lean:0,groupRot:0,gesture:null};
  figure.draw(g,{},frame);
  kit.rig.renderPixels=false;
  return {base,figure,kit,g,frame};
}

export async function renderPoses(version) {
  const ctx=await loadFigure(version),{figure,kit,g,frame}=ctx;
  const poses={};
  for(const [name,k] of [['idle',null],['half',.075],['full',.3125]]){
    figure.reset();
    for(let i=0;i<160;i++) figure.draw(g,{}, {...frame,t:i/60,gesture:k===null?null:{kind:'wave',k}});
    kit.rig.renderPixels=true;
    figure.draw(g,{}, {...frame,t:160/60,gesture:k===null?null:{kind:'wave',k}});
    kit.rig.renderPixels=false;
    const p=path.join(ROOT,'review',`${version}-${name}.png`);
    await fs.writeFile(p,kit.rig.lastCanvas.toBuffer('image/png'));
    poses[name]={file:path.relative(ROOT,p),arm:figure.diagnostics().rightArmAttachment};
  }
  figure.dispose();return poses;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
  const versions=process.argv.slice(2);const report={method:'Actual production figure, expression pipeline and mesh deformation; deterministic software rasterization; not an Electron screenshot',versions:{}};
  const project=JSON.parse(await fs.readFile(path.join(ROOT,'project.json'),'utf8'));
  for(const v of versions.length?versions:[project.baseline_version,project.current_version]){report.versions[v]=await renderPoses(v);console.log(v,'rendered');}
  await fs.writeFile(path.join(ROOT,'review/pose-render-info.json'),JSON.stringify(report,null,2));
}
