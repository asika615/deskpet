/** Adapter for the unchanged r2.3 expression textures. */
import './expressions/face-controller.js';
import './expressions/controller-config.js';
const ALIASES={dragged:'flustered',run:'neutral',dizzy:'confused',content:'neutral',waking:'sleepy',squeeze:'sleep',listening:'neutral',bowing:'sleep'};
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
 const canvas=make(1206,1304),context=canvas.getContext('2d',{willReadFrequently:true});
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

 const interior=make(1206,1304),ig=interior.getContext('2d');
 const outside=make(...config.canvas),og=outside.getContext('2d');
 let lastKey='',lastFrame=null,loadError=null;
 const loading=new Set();
 const registration=Object.freeze({x:0,y:0,scale:1});
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
  const blink=Math.max(frame.blink||0,frame.eyeClose||0);
  const input={expression,blink,talk:frame.talk||0};
  if(Array.isArray(frame.gaze))input.gaze=frame.gaze;
  else if(frame.look&&Math.abs(frame.look[0])+Math.abs(frame.look[1])>.01)input.gaze=frame.look.map(v=>Math.max(-1,Math.min(1,v/6)));
  const key=JSON.stringify(input);if(key===lastKey)return false;
  lastKey=key;lastFrame=controller.draw(fg,input);
  const current=fg.getImageData(...roi).data,under=expression==='neutral'?neutralPixels:basePixels,out=featurePixels.data;
  for(let i=0;i<out.length;i+=4){
   let a=0;
   for(let k=0;k<3;k++){const b=under[i+k]/255,c=current[i+k]/255;
    a=Math.max(a,c<b?(b-c)/Math.max(b,1e-6):(c-b)/Math.max(1-b,1e-6));}
   out[i+3]=Math.round(a*255);
   for(let k=0;k<3;k++)out[i+k]=a>1e-6?Math.max(0,Math.min(255,(current[i+k]-under[i+k]*(1-a))/a)):0;
  }
  eg.putImageData(featurePixels,0,0);
  context.setTransform(1,0,0,1,0,0);context.clearRect(0,0,canvas.width,canvas.height);
  // Restore the original crown, ears, ornaments, chin and curls at source coordinates.
  // No generated or recolored head pixels enter this outer silhouette.
  context.drawImage(source,0,0);
  context.globalCompositeOperation='destination-in';context.drawImage(sourceHeadMask,0,0);context.globalCompositeOperation='source-over';
  // Restore pre-correction neutral brows, mouth and blush as expression pixels,
  // rather than retaining the original artwork's different neutral brows.
  context.drawImage(faceBase,550,430);
  ig.setTransform(1,0,0,1,0,0);ig.clearRect(0,0,1206,1304);ig.drawImage(foreground,115.4+roi[0]*.9,25+roi[1]*.9,roi[2]*.9,roi[3]*.9);
  ig.globalCompositeOperation='destination-in';ig.drawImage(interiorMask,0,0);ig.globalCompositeOperation='source-over';
  context.drawImage(interior,0,0);
  context.globalCompositeOperation='destination-in';context.drawImage(sourceHeadMask,0,0);context.globalCompositeOperation='source-over';
  // The full reference canvas is opaque. Keep transparent FX outside the head separately.
  og.setTransform(1,0,0,1,0,0);og.clearRect(0,0,...config.canvas);og.drawImage(controller.images.get(config.expressions[expression].fx),0,0);
  og.globalCompositeOperation='destination-out';og.drawImage(mask,0,0);og.globalCompositeOperation='source-over';context.drawImage(outside,115.4,25,config.canvas[0]*.9,config.canvas[1]*.9);
  return true;
 }
 return {canvas,context,registration,controller,full,foreground,featureROI:roi,get featureBaseline(){return lastFrame?.expression==='neutral'?neutralPixels:basePixels;},get lastFrame(){return lastFrame;},paint,reset(){lastKey='';}};
}
