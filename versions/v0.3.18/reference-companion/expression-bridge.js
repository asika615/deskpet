/** Adapter for the unchanged r2.3 expression textures. */
import './expressions/face-controller.js';
import './expressions/controller-config.js';
const ALIASES={heart:'love',normal:'neutral',dragged:'flustered',run:'neutral',dizzy:'confused',content:'neutral',waking:'sleepy',squeeze:'sleep',listening:'neutral',bowing:'sleep'};
export async function createExpressionBridge(base,opts={}) {
 const config=opts.expressionConfig??globalThis.EXPRESSION_CONFIG;
 const Controller=opts.FaceController??globalThis.FaceController;
 if(!Controller||!config)throw new Error('表情控制器未加载');
 const make=opts.createCanvas??((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});
 const load=opts.loadImage??(url=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('表情素材加载失败: '+url));im.src=String(url);}));
 const asset=opts.asset??(p=>new URL(p,base));
 const controller=await Controller.load(config,p=>load(asset('expressions/'+p)),make);
 const mask=await load(asset('expression-head-mask.png'));
 const source=await load(asset('original.png'));
 const sourceHeadMask=await load(asset('reference-head-matte.png'));
 const faceBase=await load(asset('face-base.png'));
 const interiorMask=await load(asset('legacy-face-interior-mask.png'));
 const textureScale=.5;
 const canvas=make(1206*textureScale,1304*textureScale),context=canvas.getContext('2d');
 const full=make(...config.canvas),fg=full.getContext('2d');
 // Transfer only the existing expression foreground, not its old skin/background.
 // Two opaque baseline crops let us recover a compositing matte without repainting
 // any eyes, mouths or brows. Keep this work inside the small facial ROI.
 const roi=[510,410,395,305],foreground=make(roi[2],roi[3]),eg=foreground.getContext('2d');
 const baseline=make(...config.canvas),bg=baseline.getContext('2d');
 bg.drawImage(controller.images.get(config.base),0,0);
 const basePixels=bg.getImageData(...roi).data;
 bg.clearRect(0,0,...config.canvas);bg.drawImage(controller.images.get(config.normalBase),0,0);
 bg.drawImage(controller.images.get(config.expressions.neutral.mouthClear),0,0);
 const neutralPixels=bg.getImageData(...roi).data,featurePixels=eg.createImageData(roi[2],roi[3]);
 // Recover only the old neutral brow strokes baked into normal-base.png.
 // The surrounding neutral skin stays the subtraction baseline, preventing
 // legacy face cleanup halos and the old hair/chin outline from being copied.
 const neutralBrowRegions=[[575,466,670,489],[827,466,885,489]];
 for(const [x0,y0,x1,y1] of neutralBrowRegions)for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
  const i=((y-roi[1])*roi[2]+x-roi[0])*4;
  const r=neutralPixels[i],g=neutralPixels[i+1],b=neutralPixels[i+2];
  if(r<230&&r>g&&g>=b&&basePixels[i+1]-g>10)
   for(let k=0;k<3;k++)neutralPixels[i+k]=basePixels[i+k];
 }

 const headBase=make(canvas.width,canvas.height),hg=headBase.getContext('2d');
 hg.drawImage(source,0,0,canvas.width,canvas.height);
 hg.globalCompositeOperation='destination-in';hg.drawImage(sourceHeadMask,0,0,canvas.width,canvas.height);hg.globalCompositeOperation='source-over';
 hg.drawImage(faceBase,550*textureScale,430*textureScale,faceBase.width*textureScale,faceBase.height*textureScale);
 hg.globalCompositeOperation='destination-in';hg.drawImage(sourceHeadMask,0,0,canvas.width,canvas.height);hg.globalCompositeOperation='source-over';
 const interior=make(canvas.width,canvas.height),ig=interior.getContext('2d');
 const interiorClip=make(canvas.width,canvas.height),cg=interiorClip.getContext('2d');
 cg.drawImage(interiorMask,0,0,canvas.width,canvas.height);
 cg.globalCompositeOperation='destination-in';cg.drawImage(sourceHeadMask,0,0,canvas.width,canvas.height);
 const outside=make(...config.canvas),og=outside.getContext('2d');
 let lastKey='',lastFrame=null,lastFx='',loadError=null;
 const loading=new Set();
 const registration=Object.freeze({x:0,y:0,scale:1/textureScale});
 function paint(frame={}) {
  if(loadError)throw loadError;
  const requested=frame.face??frame.expression??'neutral';
  let expression=config.expressions[requested]?requested:(requested==='content'&&frame.drowse>.7?'sleep':ALIASES[requested]??'neutral');
  if(!controller.hasExpression(expression)){
   const pending=expression;
   if(!loading.has(pending)){
    loading.add(pending);
    controller.ensureExpression(pending).catch(error=>{loadError=error;}).finally(()=>loading.delete(pending));
   }
   expression='neutral';
  }
  // Subpixel eye changes are invisible at desktop size but otherwise upload a
  // complete texture every tick. Keep blinks and speech at ten visible steps.
  const quantize=(v,steps)=>Math.round(v*steps)/steps;
  const blink=quantize(Math.max(frame.blink||0,frame.eyeClose||0),10);
  const input={expression,blink,talk:quantize(frame.talk||0,10)};
  if(Array.isArray(frame.gaze))input.gaze=frame.gaze.map(v=>quantize(v,10));
  else if(frame.look&&Math.abs(frame.look[0])+Math.abs(frame.look[1])>.01)input.gaze=frame.look.map(v=>quantize(Math.max(-1,Math.min(1,v/6)),10));
  const key=JSON.stringify(input);if(key===lastKey)return false;
  lastKey=key;lastFrame=controller.draw(fg,input);
  const current=fg.getImageData(...roi).data,under=(expression==='neutral'||config.expressions[expression].sharedNeutral)?neutralPixels:basePixels,out=featurePixels.data;
  for(let i=0;i<out.length;i+=4){
   let a=0;
   for(let k=0;k<3;k++){const b=under[i+k]/255,c=current[i+k]/255;
    a=Math.max(a,c<b?(b-c)/Math.max(b,1e-6):(c-b)/Math.max(1-b,1e-6));}
   out[i+3]=Math.round(a*255);
   for(let k=0;k<3;k++)out[i+k]=a>1e-6?Math.max(0,Math.min(255,(current[i+k]-under[i+k]*(1-a))/a)):0;
  }
  eg.putImageData(featurePixels,0,0);
  context.clearRect(0,0,canvas.width,canvas.height);
  context.drawImage(headBase,0,0);
  ig.clearRect(0,0,canvas.width,canvas.height);
  ig.drawImage(foreground,(115.4+roi[0]*.9)*textureScale,(25+roi[1]*.9)*textureScale,roi[2]*.9*textureScale,roi[3]*.9*textureScale);
  ig.globalCompositeOperation='destination-in';ig.drawImage(interiorClip,0,0);ig.globalCompositeOperation='source-over';
  context.drawImage(interior,0,0);
  // FX depends on the expression, not blink, gaze or mouth movement.
  if(lastFx!==expression){
   og.clearRect(0,0,...config.canvas);og.drawImage(controller.images.get(config.expressions[expression].fx),0,0);
   og.globalCompositeOperation='destination-out';og.drawImage(mask,0,0);og.globalCompositeOperation='source-over';
   lastFx=expression;
  }
  context.drawImage(outside,115.4*textureScale,25*textureScale,config.canvas[0]*.9*textureScale,config.canvas[1]*.9*textureScale);
  return true;
 }
 return {canvas,context,registration,controller,full,foreground,featureROI:roi,get featureBaseline(){return lastFrame&&(lastFrame.expression==='neutral'||config.expressions[lastFrame.expression]?.sharedNeutral)?neutralPixels:basePixels;},get lastFrame(){return lastFrame;},paint,reset(){lastKey='';}};
}
