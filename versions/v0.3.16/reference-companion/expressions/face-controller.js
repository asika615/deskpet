(function(global){
  'use strict';
  const clamp=(x,a,b)=>Math.min(b,Math.max(a,Number(x)||0));
  class FaceController {
    constructor(config,images,createCanvas,loadImage){this.config=config;this.images=images;this.createCanvas=createCanvas;this.loadImage=loadImage;this.pending=new Map();this.eyeBuffers=new Map();}
    static expressionPaths(config,name){
      const spec=config.expressions[name];
      if(!spec)throw new Error('Unknown expression: '+name);
      const paths=['brows','eyes','mouth','mouthClear','blush','fx','eyeOverlay','eyeLashes'].map(k=>spec[k]).filter(Boolean);
      paths.push('parts/'+name+'/mouth.png');
      if(['surprised','scared','flustered','excited'].includes(name))paths.push(config.expressions.sleep.eyes);
      return [...new Set(paths)];
    }
    static async load(config,loadImage,createCanvas){
      const paths=new Set([config.base,config.normalBase,config.eyeClear,config.faceMask]);
      for(const e of config.normalEyes)for(const k of ['sclera','iris','lashes','aperture','faceClip'])paths.add(e[k]);
      for(const p of FaceController.expressionPaths(config,'neutral'))paths.add(p);
      paths.add('parts/happy/mouth.png');
      const entries=await Promise.all([...paths].map(async p=>[p,await loadImage(p)]));
      return new FaceController(config,new Map(entries),createCanvas,loadImage);
    }
    hasExpression(name){return FaceController.expressionPaths(this.config,name).every(p=>this.images.has(p));}
    async ensureExpression(name){
      await Promise.all(FaceController.expressionPaths(this.config,name).map(p=>{
        if(this.images.has(p))return Promise.resolve();
        if(!this.pending.has(p)){
          const request=Promise.resolve().then(()=>this.loadImage(p)).then(image=>{this.images.set(p,image);}).finally(()=>this.pending.delete(p));
          this.pending.set(p,request);
        }
        return this.pending.get(p);
      }));
    }
    drawNormalEye(ctx,e,open,gaze,tilt,scaleY=1){
      const [x,y,x1,y1]=e.rect,w=x1-x,h=y1-y;
      let buffer=this.eyeBuffers.get(e.side);
      if(!buffer){buffer=this.createCanvas(w,h);this.eyeBuffers.set(e.side,buffer);}
      const c=buffer.getContext('2d');c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);
      c.drawImage(this.images.get(e.sclera),0,0);
      // Only the iris responds to gaze. Eye width, height and position stay fixed.
      const iris=this.images.get(e.iris),dx=Math.round(gaze[0]*13),dy=Math.round(gaze[1]*9);
      c.drawImage(iris,dx,dy);
      if(dy>0&&Array.isArray(e.irisUpperFill)){
        // Complete only the cropped upper band exposed while looking down.
        // Copy original edge colors; preserve the source texture and the gaze offsets.
        const fill=this.createCanvas(w,h),f=fill.getContext('2d');f.imageSmoothingEnabled=false;
        for(const [column,sampleX,sampleY,top,edge] of e.irisUpperFill){
          f.drawImage(iris,sampleX,sampleY,1,1,column+dx,top-2,1,edge+dy-top+4);
        }
        const first=e.irisUpperFill[0],last=e.irisUpperFill[e.irisUpperFill.length-1];
        for(const [span,offset] of [[first,-2],[last,1]]){
          const [column,sampleX,sampleY,top,edge]=span;
          f.drawImage(iris,sampleX,sampleY,1,1,column+dx+offset,top-2,2,edge+dy-top+4);
        }
        c.save();c.beginPath();
        const runs=[];
        for(const span of e.irisUpperFill){const run=runs[runs.length-1];if(!run||span[0]!==run[run.length-1][0]+1)runs.push([span]);else run.push(span);}
        for(const run of runs){
          c.moveTo(run[0][0]+dx,run[0][3]);
          for(const [column,sampleX,sampleY,top,edge] of run){c.lineTo(column+dx,top);c.lineTo(column+dx+1,top);}
          for(let i=run.length-1;i>=0;i--){const [column,sampleX,sampleY,top,edge]=run[i];c.lineTo(column+dx+1,edge+dy);c.lineTo(column+dx,edge+dy);}
          c.closePath();
        }
        c.clip();c.filter='blur(0.7px)';c.drawImage(fill,0,0);c.restore();
      }
      c.globalCompositeOperation='destination-in';c.drawImage(this.images.get(e.aperture),0,0);c.globalCompositeOperation='source-over';
      const shift=e.lidDepth*(1-open)*.7;
      if(open<.999||Math.abs(tilt)>.0001){
        const t=e.lidTop-y+shift;
        // Clear above the upper lid, rather than scaling the iris vertically.
        const cut=this.createCanvas(w,h),k=cut.getContext('2d');
        k.beginPath();k.moveTo(0,t-tilt*w/2);k.lineTo(w,t+tilt*w/2);k.lineTo(w,h);k.lineTo(0,h);k.closePath();k.fillStyle='#fff';k.fill();
        c.globalCompositeOperation='destination-in';c.drawImage(cut,0,0);c.globalCompositeOperation='source-over';
      }
      if(open<=.02)c.clearRect(0,0,w,h);
      c.save();c.translate(w/2,shift);c.rotate(tilt);c.translate(-w/2,0);c.drawImage(this.images.get(e.lashes),0,0);c.restore();
      if(open<.999||Math.abs(tilt)>.0001){c.globalCompositeOperation='destination-in';c.drawImage(this.images.get(e.faceClip),0,0);c.globalCompositeOperation='source-over';}
      if(scaleY===1)ctx.drawImage(buffer,x,y);
      else{ctx.save();ctx.translate(0,e.lidTop);ctx.scale(1,scaleY);ctx.drawImage(buffer,x,y-e.lidTop);ctx.restore();}
    }
    drawBrows(ctx,spec){
      if(!spec.browsVisible)return;
      if(!spec.browCrop&&!spec.browOffsetY){ctx.drawImage(this.images.get(spec.brows),0,0);return;}
      const [w,h]=this.config.canvas,buffer=this.createCanvas(w,h),c=buffer.getContext('2d');
      const crop=spec.browCrop,dy=spec.browOffsetY||0;
      if(crop)c.drawImage(this.images.get(spec.brows),...crop,...crop);
      else c.drawImage(this.images.get(spec.brows),0,dy);
      c.globalCompositeOperation='destination-in';c.drawImage(this.images.get(this.config.faceMask),0,0);
      ctx.drawImage(buffer,0,0);
    }
    drawEyeOverlay(ctx,spec,blink,gaze){
      if(!spec.eyeOverlay||blink>.92)return;
      const image=this.images.get(spec.eyeOverlay),dy=spec.eyeOverlayOffsetY||0;
      if(!spec.overlayFollowsGaze){ctx.drawImage(image,0,dy);return;}
      // Preserve the reference iris artwork; stars follow the same gaze and eye registration.
      const [w,h]=this.config.canvas,buffer=this.createCanvas(w,h),c=buffer.getContext('2d');
      for(const e of this.config.normalEyes){
        const [x,y,x1,y1]=e.rect,ew=x1-x,eh=y1-y;
        c.save();c.beginPath();c.rect(x,y,ew,eh*(spec.eyeScaleY||1));c.clip();
        c.translate(0,e.lidTop);c.scale(1,spec.eyeScaleY||1);
        c.drawImage(image,x,y,ew,eh,x+Math.round(gaze[0]*13),y-e.lidTop+Math.round(gaze[1]*9),ew,eh);c.restore();
      }
      c.globalCompositeOperation='destination-in';c.drawImage(this.images.get(this.config.faceMask),0,0);ctx.drawImage(buffer,0,0);
    }
    draw(ctx,frame={}){
      const name=frame.expression||frame.face||'neutral';const spec=this.config.expressions[name];
      if(!spec)throw new Error('Unknown expression: '+name);
      const blink=clamp(frame.blink,0,1),talk=clamp(frame.talk,0,1);
      const gaze=Array.isArray(frame.gaze)?frame.gaze:spec.gaze||[0,0];
      const gx=clamp(gaze[0],-1,1),gy=clamp(gaze[1],-1,1);
      const neutral=name==='neutral';ctx.clearRect(0,0,...this.config.canvas);
      ctx.drawImage(this.images.get(neutral?this.config.normalBase:this.config.base),0,0);
      if(neutral&&blink>0)ctx.drawImage(this.images.get(this.config.eyeClear),0,0);
      if(!neutral){ctx.drawImage(this.images.get(spec.blush),0,0);this.drawBrows(ctx,spec);}
      const open=clamp(spec.openness*(1-blink),0,1);
      if(spec.eyeMode==='normal')for(const e of this.config.normalEyes)this.drawNormalEye(ctx,e,open,[gx,gy],spec.tilt*(e.side==='left'?1:-1),spec.eyeScaleY||1);
      else if(spec.eyeMode==='closed-cry')ctx.drawImage(this.images.get(spec.eyeLashes),0,0);
      else{
        if(name==='wink')this.drawNormalEye(ctx,this.config.normalEyes[0],1-blink,[gx,gy],0);
        ctx.drawImage(this.images.get(spec.eyes),0,0);
        if(['surprised','scared','flustered','excited'].includes(name)&&blink>.97){
          const layer=this.config.expressions.sleep.eyes;ctx.drawImage(this.images.get(this.config.base),505,505,388,134,505,505,388,134);ctx.drawImage(this.images.get(layer),0,0);
        }
      }
      this.drawEyeOverlay(ctx,spec,blink,[gx,gy]);
      if(!neutral)ctx.drawImage(this.images.get(spec.mouth),0,0);
      if(talk>0){
        ctx.drawImage(this.images.get(spec.mouthClear),0,0);
        const p=this.images.get('parts/'+(neutral?'happy':name)+'/mouth.png');
        const width=neutral?32:Math.max(25,Math.min(92,p.width*.4));const height=Math.max(5,12+talk*35);
        ctx.drawImage(p,714-width/2,657-height/2,width,height);
      }
      ctx.drawImage(this.images.get(spec.fx),0,0);
      return {expression:name,blink,openness:open,gaze:[gx,gy],talk};
    }
  }
  if(typeof module!=='undefined'&&module.exports)module.exports={FaceController};else global.FaceController=FaceController;
})(typeof globalThis!=='undefined'?globalThis:this);
