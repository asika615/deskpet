/** Local reference restoration. No new head, costume design or motion system. */
import { collarOffset } from './collar-connection.js';
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function restoreChestPanel(torso, source, box, make) {
  const [x0,y0,x1,y1]=box,w=x1-x0,h=y1-y0;
  const g=torso.getContext('2d'),old=g.getImageData(0,0,w,h);
  const patch=make(w,h),pg=patch.getContext('2d');
  pg.translate(-x0,-y0);pg.beginPath();
  // Original central fabric panel and lower transition, behind the retained
  // refined buckles/blue diagonal strap. The collar and sleeve are outside.
  pg.moveTo(687,741);pg.bezierCurveTo(711,736,747,738,767,744);
  pg.bezierCurveTo(785,750,794,766,793,784);
  pg.lineTo(780,806);pg.lineTo(751,825);pg.lineTo(720,828);
  pg.lineTo(687,816);pg.lineTo(683,789);pg.lineTo(684,755);pg.closePath();
  pg.clip();pg.drawImage(source,0,0);
  const ref=pg.getImageData(0,0,w,h);
  for(let i=0;i<old.data.length;i+=4){
    const a=ref.data[i+3]/255;if(!a)continue;
    const r=old.data[i],gg=old.data[i+1],b=old.data[i+2];
    // Cold blue-violet diagonal belt and its silver detailing stay in front.
    if(b>r+1&&b>gg+1)continue;
    for(let k=0;k<3;k++)old.data[i+k]=Math.round(old.data[i+k]*(1-a)+ref.data[i+k]*a);
    // Retain torso alpha exactly: no expansion or independent chest layer.
  }
  g.putImageData(old,0,0);return torso;
}

/** Reveal only the already-existing source shoulder under misplaced torso
 * coverage. The cut follows the original inner neckline, with a continuous
 * subpixel mask. It is intersected with registered shoulder coverage, so this
 * does not paint, widen or add a skin layer. */
export function restoreShoulderOcclusion(torso,source,shoulder,box,make){
  const [x0,y0]=box,w=torso.width,h=torso.height,g=torso.getContext('2d'),im=g.getImageData(0,0,w,h);
  const mask=make(source.width,source.height),mg=mask.getContext('2d');
  mg.beginPath();mg.moveTo(610,709);mg.lineTo(644,705);
  mg.bezierCurveTo(660,711,669,718,672,731);
  mg.lineTo(664,748);mg.lineTo(649,773);mg.lineTo(642,776);
  mg.lineTo(644,764);mg.lineTo(637,758);mg.lineTo(626,751);
  mg.lineTo(606,740);mg.closePath();mg.fill();
  const art=mg.getImageData(0,0,source.width,source.height).data;
  const cap=shoulder.getContext('2d').getImageData(0,0,shoulder.width,shoulder.height).data;
  function capY(x,y){
    const head=(1-smooth(612,642,x))*(1-smooth(735,755,y));
    const cw=smooth(610,624,x)*(1-smooth(709,733,y))*(1-head);
    return y+collarOffset(x,y)[1]*cw;
  }
  for(let sy=737;sy<=798;sy++)for(let sx=620;sx<=673;sx++){
    const i=((sy-y0)*w+sx-x0)*4;if(im.data[i+3]===0)continue;
    const targetY=sy+collarOffset(sx,sy)[1],ty=Math.round(targetY);
    const a=art[(ty*source.width+sx)*4+3]/255;if(!a)continue;
    let lo=688,hi=788;
    for(let n=0;n<16;n++){const mid=(lo+hi)/2;if(capY(sx,mid)<targetY)lo=mid;else hi=mid;}
    const cy=Math.round((lo+hi)/2)-688,cx=sx-580;
    if(cy<0||cy>=shoulder.height)continue;
    // Keep a two-source-pixel buried lip for raster interpolation; this
    // guards the edge without adding any visible skin or changing its mesh.
    let covered=255;
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){
      const xx=cx+dx,yy=cy+dy;
      covered=Math.min(covered,xx<0||xx>=shoulder.width||yy<0||yy>=shoulder.height?0:cap[(yy*shoulder.width+xx)*4+3]);
    }
    covered/=255;
    im.data[i+3]=Math.round(im.data[i+3]*(1-a*covered));
  }
  g.putImageData(im,0,0);return torso;
}

/** Static buried-root registration only, before the existing tailBend field.
 * The visible left fluff and tip remain unmodified; the inner edge overlaps
 * the refined coat rather than exposing the original illustration's cutout.
 */
export function tailRootCover(units){
 const {S,X0,FEET}=units;
 return {fn:(u,v,x,y)=>{
   const sx=(x-128)/S+X0,sy=(y-256)/S+FEET;
   // The original lowered glove cut a deeper notch out of the tail. Its
   // buried inner edge needs additional underlap when that glove is lifted.
   const gloveNotch=80*smooth(940,965,sy)*(1-smooth(1005,1030,sy));
   return [(24+gloveNotch)*S*smooth(390,435,sx)*smooth(835,855,sy)*(1-smooth(1135,1180,sy)),0];
 }};
}
