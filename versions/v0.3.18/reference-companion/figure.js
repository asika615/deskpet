/** Reference atlas skinned by the Coopanion rig. Upstream motion equations live in motion.js.
 * Code: AGPL-3.0-or-later. Artwork: supplied reference, original rights retained.
 */
import { motionDriver } from './motion.js';
import { armMotion } from './arm-motion.js';
import { createExpressionBridge } from './expression-bridge.js';
import { createCollarConnection, assembleConnectedTorso, collarOffset } from './collar-connection.js';
import { makeReferenceShoulder, makeShoulderLining } from './reference-shoulder.js';
import { restoreChestPanel, restoreShoulderOcclusion, tailRootCover } from './reference-compact.js';
import { makeArmUnderlap } from './arm-underlap.js';
import { createRig as createPackRig } from './kit/rig.js';
const NS='http://www.w3.org/2000/svg';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,x)=>{let k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k);};

function imageLoad(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('原图载入失败'));im.src=String(url);});}

export async function createReferenceFigure(base=new URL('./',import.meta.url),opts={}) {
 const kit=opts.kit??await import('./kit/body.js');
 const model=opts.model??await(await fetch(new URL('model.json',base))).json();
 const source=await(opts.loadImage??imageLoad)((opts.asset??(p=>new URL(p,base)))(model.source.file));
 const bridge=await createExpressionBridge(base,opts);
 const faceCanvas=bridge.canvas,faceContext=bridge.context;
 const textures={};await Promise.all(model.parts.filter(p=>!p.procedural).map(async p=>{textures[p.tex]=await(opts.loadImage??imageLoad)((opts.asset??(p=>new URL(p,base)))(p.file));}));
 const make=opts.createCanvas??((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
 textures.waveShoulderSkin=makeReferenceShoulder(source,make).canvas;
 textures.shoulderSocketLining=makeShoulderLining(make).canvas;
 const underlap=makeArmUnderlap(textures.waveUpper,make);
 textures.sleeveRootUnderlap=underlap.root;textures.elbowUnderlap=underlap.elbow;
 const torsoPart=model.parts.find(p=>p.id==='torso');
 const neckHeadMatte=await(opts.loadImage??imageLoad)((opts.asset??(p=>new URL(p,base)))('reference-head-matte.png'));
 textures[torsoPart.tex]=assembleConnectedTorso(source,neckHeadMatte,textures[torsoPart.tex],torsoPart.sourceBox,
  opts.createCanvas??((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;}));
 restoreChestPanel(textures[torsoPart.tex],source,torsoPart.sourceBox,make);
 restoreShoulderOcclusion(textures[torsoPart.tex],source,textures.waveShoulderSkin,torsoPart.sourceBox,make);
 const {S,X0,FEET}=model.units;
 const U=x=>128+(x-X0)*S,V=y=>256+(y-FEET)*S;
 const driver=motionDriver(model),arms=armMotion(),PV=model.pivots;
 const mesh=model.mesh,view=model.view;
 const [nx,ny]=mesh.grid;
 const nodeDefs={
  body:{kind:'rot',pivot:PV.body},
  waist:{kind:'rot',parent:'body',pivot:PV.waist},
  neck:{kind:'rot',parent:'waist',pivot:PV.neck},
  armNear:{kind:'rot',parent:'body',pivot:PV.armNear},
  armFar:{kind:'rot',parent:'body',pivot:PV.armFar},
  rightArmSocket:{kind:'rot',parent:'body',pivot:PV.rightShoulder},
  waveUpperJoint:{kind:'rot',parent:'body',pivot:PV.waveShoulder},
  waveSleeveRoot:{kind:'warp',parent:'waveUpperJoint',rect:[U(395),V(700),U(715),V(1070)]},
  shoulderSkinBridge:{kind:'warp',parent:'body',rect:[U(580),V(688),U(674),V(788)]},
  shoulderLiningBridge:{kind:'warp',parent:'body',rect:[U(568),V(728),U(675),V(795)]},
  sleeveUnderlapBridge:{kind:'warp',parent:'body',rect:[U(574),V(738),U(674),V(846)]},
  waveElbowJoint:{kind:'rot',parent:'waveUpperJoint',pivot:PV.waveElbow},
  elbowUnderlapJoint:{kind:'rot',parent:'waveUpperJoint',pivot:PV.waveElbow},
  waveWristJoint:{kind:'rot',parent:'waveElbowJoint',pivot:PV.waveWrist},
  forearmNear:{kind:'rot',parent:'armNear',pivot:PV.elbowNear},
  wristNear:{kind:'rot',parent:'forearmNear',pivot:PV.wristNear},
  forearmFar:{kind:'rot',parent:'armFar',pivot:PV.elbowFar},
  wristFar:{kind:'rot',parent:'forearmFar',pivot:PV.wristFar},
  floatingPlate:{kind:'warp',parent:'clothes',rect:[U(430),V(731),U(640),V(983)]},
  legBack:{kind:'rot',parent:'body',pivot:PV.legBack},
  legFront:{kind:'rot',parent:'body',pivot:PV.legFront},
  tail:{kind:'rot',parent:'body',pivot:PV.tail},
  tailRootCover:{kind:'warp',parent:'tailBend',rect:[U(195),V(835),U(610),V(1187)]},
  tailBend:{kind:'warp',parent:'body',rect:[U(180),V(900),U(730),V(1200)]},
  headBack:{kind:'warp',parent:'neck',rect:[U(420),V(200),U(970),V(680)]},
  headMid:{kind:'warp',parent:'neck',rect:[U(420),V(200),U(970),V(680)]},
  headFront:{kind:'warp',parent:'neck',rect:[U(420),V(200),U(970),V(680)]},
  bangsSway:{kind:'warp',parent:'headFront',rect:[U(420),V(200),U(970),V(620)]},
  skirt:{kind:'warp',parent:'body',rect:[U(390),V(785),U(962),V(1190)]},
  hairLeft:{kind:'warp',parent:'headMid',rect:[U(65),V(195),U(475),V(965)]},
  hairRight:{kind:'warp',parent:'headMid',rect:[U(890),V(215),U(1170),V(965)]},
  clothes:{kind:'warp',parent:'body',rect:[U(390),V(659),U(962),V(1190)]},
  collarConnection:{kind:'warp',parent:'clothes',rect:[U(575),V(648),U(840),V(810)]},
  skirtSit:{kind:'warp',parent:'body',rect:[U(345),V(940),U(1040),V(1150)]},
  finNear:{kind:'warp',parent:'headMid',rect:[U(448),V(10),U(693),V(275)]},
  finFar:{kind:'warp',parent:'headMid',rect:[U(690),V(48),U(893),V(275)]},
 };
 const chains=mesh.bones.map(b=>{let chain=[];for(let n=b;n;n=nodeDefs[n].parent)chain.push(n);return chain;});
 function transform(chain,st,x,y) {
  for(const n of chain) {
   const d=nodeDefs[n],p=st[n];if(!p)continue;
   if(d.kind==='rot') {
    const [c,s]=rotCache[n]??[Math.cos((p.a||0)*Math.PI/180),Math.sin((p.a||0)*Math.PI/180)],[px,py]=d.pivot;
    const dx=(x-px)*(p.sx??p.s??1),dy=(y-py)*(p.sy??p.s??1);
    x=px+(p.tx||0)+dx*c-dy*s;y=py+(p.ty||0)+dx*s+dy*c;
   }else if(p.fn) {
    const r=d.rect,u=clamp((x-r[0])/(r[2]-r[0]),0,1),v=clamp((y-r[1])/(r[3]-r[1]),0,1);
    const q=p.fn(u,v,x,y);x+=q[0];y+=q[1];
   }
  }
  return[x,y];
 }
 let canvas=null,rig=null,fo=null,fxG=null,mounted=null,lastFaceKey='',stCurrent={},rotCache={},waveWeight=0,rightArmAttachment=null;
 function skinPoint(x,y,st){return transform(['headMid','neck','waist','body'],st,x,y);}
 function mount(g) {
  rig?.dispose();g.textContent='';canvas=document.createElementNS('http://www.w3.org/1999/xhtml','canvas');
  canvas.width=Math.ceil((view[2]-view[0])*4);canvas.height=Math.ceil((view[3]-view[1])*4);
  fo=document.createElementNS(NS,opts.raster?'image':'foreignObject');
  for(const[k,v]of Object.entries({x:view[0],y:view[1],width:view[2]-view[0],height:view[3]-view[1]}))fo.setAttribute(k,v);
  if(!opts.raster){canvas.style.cssText='display:block;width:100%;height:100%';fo.appendChild(canvas);}
  fxG=document.createElementNS(NS,'g');g.append(fo,fxG);
  const innerPart=(id,box,parent,z,grid)=>({id,tex:id,box:[U(box[0]),V(box[1]),(box[2]-box[0])*S,(box[3]-box[1])*S],parent,z,grid});
  rig=(opts.createRig??createPackRig)(canvas,{view,deformers:nodeDefs,parts:[{id:'restAtlas',tex:'atlas',box:mesh.box,grid:[1,1],z:20,parent:'body'},...model.parts.filter(p=>!['head','headBack'].includes(p.id)),
   innerPart('sleeveRootUnderlap',underlap.rootBox,'sleeveUnderlapBridge',4.81,[20,22]),
   innerPart('elbowUnderlap',underlap.elbowBox,'elbowUnderlapJoint',4.82,[12,12]),
   {id:'expressionHead',tex:'expressionHead',box:[U(bridge.registration.x),V(bridge.registration.y),bridge.canvas.width*bridge.registration.scale*S,bridge.canvas.height*bridge.registration.scale*S],grid:model.headArtRegistration?.grid??[40,32],z:9.1,parent:'headMid'},
  ]});
  rig.upload('atlas',source);for(const p of model.parts)rig.upload(p.tex,textures[p.tex]);mounted=g;bridge.reset();lastFaceKey='';
  rig.upload('sleeveRootUnderlap',underlap.root);rig.upload('elbowUnderlap',underlap.elbow);
 }
 function paintFace(fc,o) { return bridge.paint(o); }
 function effects(fc,t) {
  const head=skinPoint(U(905),V(225),stCurrent),c=(x,y)=>skinPoint(U(x),V(y),stCurrent);let s='';
  if(fc.listen){const p=c(1040,440);for(let i=0;i<3;i++){const k=(t*.9+i/3)%1,r=8+k*13;s+=`<path d="M${p[0]+r*.8} ${p[1]-r*.65} A${r} ${r} 0 0 1 ${p[0]+r*.8} ${p[1]+r*.65}" fill="none" stroke="#de543e" stroke-width="2.5" opacity="${1-k}"/>`;}}
  fxG.innerHTML=s;
 }
 function draw(g,fc,o) {
  if(mounted!==g||!g.contains(fo))mount(g);
  const r=driver.update(fc,o),st=r.st;
  const pose=arms.update(o,r.dt);
  st.collarConnection=createCollarConnection(model.units);
  st.clothes={fn:(u,v,x,y)=>{
   const a=(st.waist.a||0)*Math.PI/180*(1-smooth(V(936),V(1190),y)),c=Math.cos(a),s=Math.sin(a),dx=x-PV.waist[0],dy=y-PV.waist[1];
   const q=st.skirt.fn(u,clamp((y-V(785))/(V(1190)-V(785)),0,1));
   return[dx*c-dy*s-dx+q[0],dx*s+dy*c-dy+q[1]];
  }};
  const waveK=o.gesture?.kind==='wave'?o.gesture.k:0;
  const waveTarget=smooth(0,.15,waveK)*(1-smooth(.8,1,waveK));
  waveWeight+=(waveTarget-waveWeight)*(1-Math.exp(-18*r.dt));
  // Each sleeve root follows the bodice; elbow and wrist rotations inherit their socket.
  const nearAngle=pose.near[0];
  for(const [name,pivot,angle] of [['armNear',PV.armNear,nearAngle],['armFar',PV.armFar,pose.far[0]]]) {
   const [x,y]=pivot,rect=nodeDefs.clothes.rect;
   const q=st.clothes.fn(clamp((x-rect[0])/(rect[2]-rect[0]),0,1),clamp((y-rect[1])/(rect[3]-rect[1]),0,1),x,y);
   st[name]={a:angle+(st.waist.a||0),tx:q[0],ty:q[1]};
  }
  st.forearmNear={a:pose.near[1]};st.forearmFar={a:pose.far[1]};
  st.wristNear={a:pose.near[2]};st.wristFar={a:pose.far[2]};
  // The shoulder stays on the bodice. Elbow flexion brings the palm outside the cheek,
  // while the white plate remains on its original clothes deformer.
  const [rx,ry]=PV.waveShoulder,rr=nodeDefs.clothes.rect;
  const rq=st.clothes.fn(clamp((rx-rr[0])/(rr[2]-rr[0]),0,1),clamp((ry-rr[1])/(rr[3]-rr[1]),0,1),rx,ry);
  const rightAngle=pose.near[0];
  st.waveUpperJoint={a:rightAngle+(st.waist.a||0),tx:rq[0],ty:rq[1]};
  st.waveElbowJoint={a:pose.near[1]};st.waveWristJoint={a:pose.near[2]};
  st.elbowUnderlapJoint={a:st.waveElbowJoint.a*.5};
  st.floatingPlate={fn:()=>[0,0]};
  // The sleeve and buried cloth share a continuous skinning field.
  // Visible shoulder skin stays on the bodice; hidden fabric unfolds toward
  // the existing arm FK. No joint, timing or plate moves.
  const armDx=PV.waveElbow[0]-rx,armDy=PV.waveElbow[1]-ry,armLength=Math.hypot(armDx,armDy);
  const ax=armDx/armLength,ay=armDy/armLength;
  function shoulderTarget(x,y,clothOnly=false) {
   // Register only the two buried contacts: the upper edge meets the existing
   // corrected collar, and the outer notch follows the existing face curl.
   // The sleeve lip and both fields share these coordinates; FK is untouched.
   const headW=clothOnly?(1-smooth(U(612),U(642),x))*(1-smooth(V(735),V(755),y)):0;
   const collarW=clothOnly?smooth(U(610),U(624),x)*(1-smooth(V(709),V(733),y))*(1-headW):0;
   const cq=collarOffset((x-128)/S+X0,(y-256)/S+FEET);
   let hx=x,hy=y;
   if(headW>0){
    const hd=nodeDefs.headMid.rect,hq=st.headMid.fn(clamp((x-hd[0])/(hd[2]-hd[0]),0,1),clamp((y-hd[1])/(hd[3]-hd[1]),0,1),x,y);
    hx+=hq[0];hy+=hq[1];
    for(const node of ['neck','waist']){
     const p=st[node],pv=nodeDefs[node].pivot,a=(p.a||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),dx=hx-pv[0],dy=hy-pv[1];
     hx=pv[0]+(p.tx||0)+dx*c-dy*s;hy=pv[1]+(p.ty||0)+dx*s+dy*c;
    }
   }
   const dx=x-rx,dy=y-ry,along=dx*ax+dy*ay,outer=-dx*ay+dy*ax;
   const w=clothOnly?0:smooth(5*S,110*S,along+.2*outer);
   const a=st.waveUpperJoint.a*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
   const q=st.clothes.fn(clamp((x-rr[0])/(rr[2]-rr[0]),0,1),clamp((y-rr[1])/(rr[3]-rr[1]),0,1),x,y);
   const rigidX=rx+rq[0]+dx*c-dy*s,rigidY=ry+rq[1]+dx*s+dy*c;
   const bx=(x+q[0])*(1-w)+rigidX*w,by=(y+q[1])*(1-w)+rigidY*w;
   const cx=x+cq[0]*S,cy=y+cq[1]*S;
   const cloth=st.clothes.fn(clamp((cx-rr[0])/(rr[2]-rr[0]),0,1),clamp((cy-rr[1])/(rr[3]-rr[1]),0,1),cx,cy);
   return [bx*(1-headW-collarW)+hx*headW+(cx+cloth[0])*collarW,
    by*(1-headW-collarW)+hy*headW+(cy+cloth[1])*collarW];
  }
  st.shoulderSkinBridge={fn:(u,v,x,y)=>{const q=shoulderTarget(x,y,true);return[q[0]-x,q[1]-y];}};
  st.sleeveUnderlapBridge={fn:(u,v,x,y)=>{
   const q=shoulderTarget(x,y);
   // Only the buried cloth lip unfolds. The collar-side attachment stays put;
   // no skin, shoulder cap, joint or hand trajectory is moved.
   const unfold=clamp(Math.abs(pose.near[0])/42,0,1)*(1-smooth(U(634),U(660),x))*(1-smooth(V(758),V(810),y));
   return[q[0]-x-14*S*unfold,q[1]-y-14*S*unfold];
  }};
  // The underlap meets the fixed plate, so its lower edge follows clothes,
  // not the rotating arm. Its upper hair contact shares the same registration.
  st.shoulderLiningBridge={fn:(u,v,x,y)=>{const q=shoulderTarget(x,y,true);return[q[0]-x,q[1]-y];}};
  st.waveSleeveRoot={fn:(u,v,x,y)=>{
   const q=shoulderTarget(x,y),a=-st.waveUpperJoint.a*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
   const dx=q[0]-rx-rq[0],dy=q[1]-ry-rq[1];
   return[rx+dx*c-dy*s-x,ry+dx*s+dy*c-y];
  }};
  const tr=nodeDefs.clothes.rect;
  const tq=st.clothes.fn(clamp((PV.tail[0]-tr[0])/(tr[2]-tr[0]),0,1),clamp((PV.tail[1]-tr[1])/(tr[3]-tr[1]),0,1),...PV.tail);
  st.tailRootCover=tailRootCover(model.units);
  st.tailBend={fn:(u,v,x,y)=>{
   const dx=x-PV.tail[0],dy=y-PV.tail[1],w=smooth(4,18,Math.hypot(dx,dy)),a=(r.tail*.5-7*r.sitK)*Math.PI/180*w,c=Math.cos(a),s=Math.sin(a);
   return[dx*c-dy*s-dx+tq[0],dx*s+dy*c-dy-r.tail*.3*(1-u)**2*w+tq[1]];
  }};
  const hairFn=(side)=>(u,v,x,y)=> {
   const na=r.headA*Math.PI/180,w=smooth(.35,.92,v),a=-na*w,c=Math.cos(a),s=Math.sin(a),dx=x-PV.neck[0],dy=y-PV.neck[1],wv=v**1.6;
   return[PV.neck[0]+dx*c-dy*s-x+r.hair*5*wv+Math.sin(o.t*1.6+v*3+side)*wv*.5,
    PV.neck[1]+dx*s+dy*c-y+r.hairY*6*wv*wv-Math.abs(r.hair)*wv*.7];
  };
  st.hairLeft={fn:hairFn(0)};st.hairRight={fn:hairFn(1.2)};
  const ear=(pivot,angle)=>(u,v,x,y)=>{const a=angle*Math.PI/180*(1-smooth(.6,.97,v)),c=Math.cos(a),s=Math.sin(a),dx=x-pivot[0],dy=y-pivot[1];return[dx*c-dy*s-dx,dx*s+dy*c-dy];};
  st.finNear={fn:ear(PV.finNear,st.finNear.a*.38)};st.finFar={fn:ear(PV.finFar,st.finFar.a*.38)};
  const headFn=st.headMid.fn;
  st.headMid={fn:(u,v,x,y)=>{
   const q=headFn(u,v,x,y);
   const fringe=Math.sin(Math.PI*clamp((x-U(420))/(U(966)-U(420)),0,1))*smooth(V(230),V(475),y)*(1-smooth(V(500),V(615),y));
   q[0]+=r.bangs*1.2*fringe;q[1]+=r.hairY*.8*fringe;
   if(y<V(270)){
    const pivot=x<U(698)?PV.finNear:PV.finFar;
    const angle=r.fins*.38*(x<U(698)?1:-.8),w=1-smooth(V(180),V(270),y),a=angle*Math.PI/180*w,c=Math.cos(a),s=Math.sin(a),dx=x-pivot[0],dy=y-pivot[1];
    return[q[0]+dx*c-dy*s-dx,q[1]+dx*s+dy*c-dy];
   }return q;
  }};
  st.headBack=st.headFront=st.headMid;
  stCurrent=st;rotCache=Object.fromEntries(Object.entries(nodeDefs).filter(([n,d])=>d.kind==='rot').map(([n])=>{const a=(st[n]?.a||0)*Math.PI/180;return[n,[Math.cos(a),Math.sin(a)]];}));
  rightArmAttachment={root:transform(['waveUpperJoint','body'],st,rx,ry),body:transform(['body'],st,rx+rq[0],ry+rq[1]),elbow:transform(['waveUpperJoint','body'],st,...PV.waveElbow),elbowChild:transform(['waveElbowJoint','waveUpperJoint','body'],st,...PV.waveElbow),wrist:transform(['waveElbowJoint','waveUpperJoint','body'],st,...PV.waveWrist),wristChild:transform(['waveWristJoint','waveElbowJoint','waveUpperJoint','body'],st,...PV.waveWrist),angle:st.waveUpperJoint.a,waveWeight,elbowAngle:st.waveElbowJoint.a,wristAngle:st.waveWristJoint.a};
  if(paintFace(fc,o))rig.upload('expressionHead',faceCanvas);
  const sitIn=smooth(.44,.54,r.sitK);
  const openHand=smooth(.12,.48,waveWeight);
  st.alpha={restAtlas:0,waveHandClosed:1-openHand,waveHandOpen:openHand,coat:1-sitIn,legL:1-sitIn,legR:1-sitIn,seated:sitIn};
  const raised=waveWeight>.08||(pose.near[0]>20&&pose.near[1]>35);
  st.z.waveForearm=raised?10.2:5.7;st.z.waveHandClosed=raised?10.4:5.72;st.z.waveHandOpen=raised?10.4:5.73;
  rig.render(st);
  if(opts.raster)fo.setAttribute('href',canvas.toDataURL('image/png'));
  effects(fc,o.t);
 }
 function drawRest(g) {
  if(mounted!==g||!g.contains(fo))mount(g);
  rig.render({alpha:{...Object.fromEntries(model.parts.map(p=>[p.id,0])),expressionHead:0,sleeveRootUnderlap:0,elbowUnderlap:0,restAtlas:1}});fxG.textContent='';bridge.reset();
 }
 return{draw,drawRest,ownsExpressionFx:true,reset:()=>{driver.reset();arms.reset();waveWeight=0;bridge.reset();},groupTilt:driver.groupTilt,gestures:['nod','shake','wave','bow'],extent:[6,12,246,260],hits:[[125,101,84],[128,186,46]],anchors:{gaze:[U(753),V(535)],tear:[U(651),V(584)],tears:[[U(631),V(546)],[U(864),V(552)]],z:[211,42],hearts:[100,176,72],bubble:[128,7]},colors:{z:'#cf543f'},setScheme:async()=>{},dispose(){rig?.dispose();rig=null;fo?.remove();fxG?.remove();mounted=null;},model,
  diagnostics(){return{rightArmAttachment,expression:bridge.lastFrame,registration:bridge.registration,renderer:rig?.gl?.getParameter(rig.gl.VERSION),faceBytes:faceContext.getImageData(0,0,faceCanvas.width,faceCanvas.height).data,vertices:model.parts.reduce((n,p)=>n+(p.grid[0]+1)*(p.grid[1]+1),0)+21*23+13*13,canvas};}};
}
export async function createReferenceBody(base,opts={}) {
 const kit=opts.kit??await import('./kit/body.js');
 const figure=await createReferenceFigure(base,{...opts,kit});
 let intent=null,until=-1,time=0;const draw=figure.draw;
 figure.draw=(g,fc,o)=>{time=o.t;if(time>until)intent=null;return draw(g,fc,{...o,armIntent:intent});};
 const body=kit.createBody(opts.host,{figure}),doWord=body.do;
 body.do=word=>{const accepted=doWord(word==='greet'?'wave':word);if(!accepted)return accepted;
  if(['jump','hop','flap'].includes(word)){intent=word;until=time+3;}
  else if(['stand','walk','run','wave','greet','dance','shiver','sit','sleep','dizzy','look','turn','nod','shake','spin','bow'].includes(word))intent=null;
  return accepted;};
 body.words=[...body.words,'greet'];body.figure=figure;return body;
}
