/** Shoulder base volume, in original artwork coordinates.
 * The inner anchors and distal arm stay put; only the proximal cross section
 * grows. These fields run before the existing shared shoulder skinning/FK.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
export const SHOULDER_VOLUME=Object.freeze({
  near:{gain:.16,max:9.5,along:[-78,-28,60,115]},
  far:{gain:.10,max:6,along:[-68,-22,55,112]},
  note:'Asymmetric inner shoulder supports; armor, torso scale and joint pivots unchanged',
});

export function shoulderVolumeOffset(x,y,side,model){
  const {S,X0,FEET}=model.units;
  const toSource=p=>[(p[0]-128)/S+X0,(p[1]-256)/S+FEET];
  const p=toSource(model.pivots[side==='near'?'waveShoulder':'armFar']);
  const e=toSource(model.pivots[side==='near'?'waveElbow':'elbowFar']);
  const l=Math.hypot(e[0]-p[0],e[1]-p[1]),ax=(e[0]-p[0])/l,ay=(e[1]-p[1])/l;
  const nx=side==='near'?-ay:ay,ny=side==='near'?ax:-ax;
  const dx=x-p[0],dy=y-p[1],along=dx*ax+dy*ay,outer=dx*nx+dy*ny;
  const c=SHOULDER_VOLUME[side];
  const w=smooth(c.along[0],c.along[1],along)*(1-smooth(c.along[2],c.along[3],along));
  const amount=Math.min(c.max,Math.max(0,outer)*c.gain)*w*smooth(0,14,outer);
  return[nx*amount,ny*amount];
}

/** Editable Q-style foundation contours. They form actual opaque support
 * under the original shoulder/sleeve sprites, not a blurred seam overlay.
 * Near: rounded skin cap, buried into the bodice and under the white plate.
 * Far: smaller dark inner sleeve cap, preserving the outfit's asymmetry.
 */
export function makeShoulderFoundation(side,make){
  const box=side==='near'?[580,704,676,790]:[759,701,826,790];
  const [x0,y0,x1,y1]=box,c=make(x1-x0,y1-y0),g=c.getContext('2d');
  g.translate(-x0,-y0);g.lineJoin='round';g.lineWidth=1.8;
  if(side==='near'){
    g.fillStyle='#ffe3d3';g.strokeStyle='#2a1710';
    g.beginPath();g.moveTo(653,718);
    g.bezierCurveTo(634,711,612,716,601,729);
    g.bezierCurveTo(593,739,591,751,597,762);
    g.lineTo(616,779);g.bezierCurveTo(637,781,655,765,662,744);
    g.lineTo(653,718);g.closePath();g.fill();g.stroke();
  }else{
    g.fillStyle='#343338';g.strokeStyle='#1f1410';
    g.beginPath();g.moveTo(776,715);
    g.bezierCurveTo(790,708,805,721,813,737);
    g.bezierCurveTo(820,752,812,770,799,780);
    g.lineTo(777,772);g.lineTo(765,747);
    g.bezierCurveTo(764,734,768,722,776,715);g.closePath();g.fill();g.stroke();
  }
  return{canvas:c,sourceBox:box};
}
