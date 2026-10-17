/** Local collar/bodice registration in original artwork pixels.
 * Head, shoulder FK, plate and coat are deliberately outside this field.
 * The band is buried under the existing chin/curls; the tall under-band
 * insert is compressed into a short neckline seam, and the upper bib rises
 * to meet it. Below y=810 all source points stay in place.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export const COLLAR_CONNECTION=Object.freeze({
  sourceRows:[658,710,737,770,810],
  targetRows:[650,696,708,752,810],
  support:[575,610,790,840],
  collarCenter:707,
  collarSpread:0,
});

export function collarOffset(x,y){
  const c=COLLAR_CONNECTION;
  if(y>=810||x<=575||x>=840)return[0,0];
  const weight=smooth(575,610,x)*(1-smooth(790,840,x));
  // Piecewise linear, strictly increasing destination rows: no fold-over in
  // the tightly compressed seam (smoothstep here could invert the mesh).
  let yy=y-8;
  for(let i=0;i<c.sourceRows.length-1;i++)if(y>=c.sourceRows[i]&&y<c.sourceRows[i+1]){
    const t=(y-c.sourceRows[i])/(c.sourceRows[i+1]-c.sourceRows[i]);
    yy=c.targetRows[i]+t*(c.targetRows[i+1]-c.targetRows[i]);break;
  }
  const band=1-smooth(710,737,y);
  const side=clamp(Math.abs(x-c.collarCenter)/80,0,1);
  return[(x-c.collarCenter)*c.collarSpread*band*weight,
    ((yy-y)-3*side*side*(1-smooth(658,710,y)))*weight];
}

/** Use the supplied artwork's collar and central neckline pixels.
 * This is native atlas assembly. All runtime inputs already ship in v0.3.10.
 * Do not transfer original head pixels into the torso: they must stay on Head.
 * The small neck insert is replaced, with a short blend into the existing bib.
 */
export function assembleConnectedTorso(source,headMatte,torso,box,make){
  const [x0,y0,x1,y1]=box,w=x1-x0,h=y1-y0;
  const canvas=make(w,h),g=canvas.getContext('2d');g.drawImage(torso,0,0,w,h);
  const old=g.getImageData(0,0,w,h),patch=make(w,h),pg=patch.getContext('2d');
  pg.drawImage(source,x0,y0,w,h,0,0,w,h);
  pg.globalCompositeOperation='destination-out';pg.drawImage(headMatte,x0,y0,w,h,0,0,w,h);
  const ref=pg.getImageData(0,0,w,h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const sx=x+x0,sy=y+y0;
    if(sy>=770)continue;
    // Keep the already corrected shoulders and white plate. Bright shoulder skin is excluded below.
    const left=1-smooth(625,650,sx),right=smooth(775,798,sx);
    const fadeStart=737-23*Math.max(left,right),fadeEnd=770-26*Math.max(left,right);
    let weight=smooth(575,595,sx)*(1-smooth(804,828,sx))*(1-smooth(fadeStart,fadeEnd,sy));
    // The separate shoulder sprite already supplies the exposed skin. Moving
    // a second copy with the bib would split that skin during a raised arm.
    // Restore only the central insert below the band, keeping both shoulders.
    const center=smooth(625,652,sx)*(1-smooth(775,798,sx));
    weight*=1-smooth(700,714,sy)*(1-center);
    const isBuckle=sx>=697&&sx<=744&&sy<=716;
    if(!isBuckle)weight*=1-smooth(140,170,ref.data[(y*w+x)*4]);
    if(weight<=0)continue;
    const i=(y*w+x)*4,ra=ref.data[i+3]/255,oa=old.data[i+3]/255;
    const a=ra*weight+oa*(1-weight);
    for(let k=0;k<3;k++)old.data[i+k]=a?(ref.data[i+k]*ra*weight+old.data[i+k]*oa*(1-weight))/a:0;
    old.data[i+3]=a*255;
  }
  g.putImageData(old,0,0);
  // Simple Q-style neckline backing, behind the existing sprites. This is
  // editable native geometry, not another copy of the rotating shoulder.
  // Buried ends extend under the current shoulder sprite and white plate.
  g.save();g.globalCompositeOperation='destination-over';g.translate(-x0,-y0);
  g.fillStyle='#ffe3d3';
  // Near-side backing is now separated into the reference shoulder layer.
  // The collar/chest pixels above are unchanged; do not paint a second skin
  // silhouette over that layer. Far-side neckline support stays as before.
  g.beginPath();g.moveTo(766,707);
  g.bezierCurveTo(779,710,790,727,798,745);
  g.lineTo(785,763);g.lineTo(769,736);g.closePath();g.fill();
  g.restore();return canvas;
}

export function createCollarConnection(units){
  const {S,X0,FEET}=units;
  return {fn:(u,v,x,y)=>{
    const q=collarOffset((x-128)/S+X0,(y-256)/S+FEET);
    return[q[0]*S,q[1]*S];
  }};
}
