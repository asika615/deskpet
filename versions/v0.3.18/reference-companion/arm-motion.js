// Six local FK angles; preserve artwork, pivots, socket and armor binding.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const sm=(a,b,x)=>{const k=clamp((x-a)/(b-a),0,1);return k*k*(3-2*k)};
const mix=(a,b,k)=>a.map((x,i)=>x+(b[i]-x)*k);
export const actions=['stand','walk','run','jump','hop','wave','greet','drag','dance','shiver','flap','look','turn','nod','shake','spin','sit','sleep','dizzy','bow','happy','love','angry','determined','excited'];
export function target(o){
 const t=o.t||0,mt=o.modeT||0,m=o.mode||'idle',g=o.gesture,k=g?.k||0;
 let p=[0,0,0,0,0,0];
 const l=o.legs?.[0],s=l?clamp(Math.atan2(l[2]-l[0],Math.max(4,l[3]-l[1]))*180/Math.PI/28,-1,1):Math.sin(mt*8);
 if(m==='walk')p=[-10*s,7+5*(1+s),-3*s,8*s,-6-4*(1-s),2*s];
 if(m==='run')p=[22-6*s,26-7*s,4*s,18+5*s,-23-6*s,-3*s];
 const a=o.armIntent==='hop'?.68:1;
 if(m==='crouch')p=[-8*a,9*a,2,-6*a,-8*a,-2];
 if(m==='air'){const b=Math.sin(Math.min(mt/.7,1)*Math.PI);p=[a*(20+9*b),a*(27+8*b),-5*a,-a*(18+8*b),-a*(23+7*b),4*a];}
 if(m==='land')p=[9*a,18*a,-3,-7*a,-15*a,3];
 if(m==='drag'){const w=clamp((o.swing||0)/26,-1,1),q=Math.sin(t*7);p=[29+7*q+4*w,33-6*q,-5*w,-25-6*Math.sin(t*7+.8),-28+5*q,4*w];}
 if(m==='dance'){const q=Math.sin(mt*Math.PI*2*1.1),c=Math.cos(mt*Math.PI*2*1.1);p=[14+13*q,24-9*q,6*c,-11+11*q,-20-8*q,-5*c];}
 if((o.sit||0)>.05)p=mix(p,[-2,8,0,-3,-7,0],clamp(o.sit,0,1));
 if(m==='sleep')p=mix(p,[0,5,0,-2,-4,0],.9);
 if(m==='dizzy')p=[4*Math.sin(t*3),10+3*Math.cos(t*3),2*Math.sin(t*3+.5),-3*Math.sin(t*3),-9,2*Math.cos(t*3)];
 if(['idle','look','sit','sleep','wake','dizzy'].includes(m)){
  const b=Math.sin(t*5),f=o.face;
  if(f==='happy')p=mix(p,[9+2*b,16-2*b,3*b,-7-2*b,-13-2*b,-2*b],.8);
  if(f==='love')p=mix(p,[7+1.5*b,22,2*b,-6-1.5*b,-19,-2*b],.8);
  if(f==='angry')p=mix(p,[10,25+1.2*Math.sin(t*12),-4,-9,-22-1.2*Math.sin(t*12),4],.85);
  if(f==='determined')p=mix(p,[8,19,-3,-7,-17,3],.8);
  if(f==='excited')p=mix(p,[16+3*b,29-3*b,5*b,-14-3*b,-25-3*b,-4*b],.85);
 }
 const e=sm(0,.18,k)*(1-sm(.76,1,k));
 if(g?.kind==='wave'||g?.kind==='greet'){const ph=(k-.18)/.58*Math.PI*4;p=mix(p,[36,64+4*Math.sin(ph+.45),9*Math.sin(ph),-3,-7,0],e);}
 if(g?.kind==='shiver'){const q=Math.sin(t*24);p=mix(p,[-6+.8*q,30-1.5*q,-5,-6-.8*q,-26-1.5*q,5],e);}
 if(g?.kind==='flap'){const q=Math.sin(t*16);p=mix(p,[21+10*q,28-8*q,4*Math.cos(t*16),-19-9*q,-25+7*q,-4*Math.cos(t*16)],e);}
 if(g?.kind==='spin')p=mix(p,[16,17,-3,-14,-15,3],e);
 if(g?.kind==='bow')p=mix(p,[-3,9,-2,-4,-8,2],e);
 return p;
}
export function armMotion(){
 const x=Array(6).fill(0),v=Array(6).fill(0),limits=[[-14,48],[0,80],[-16,16],[-38,32],[-52,12],[-16,16]];
 return {update(o,dt){const goal=target(o);dt=clamp(dt,0,.05);
  for(let i=0;i<6;i++){
   const to=clamp(goal[i],...limits[i]),w=[18,22,24][i%3],d=x[i]-to,e=Math.exp(-w*dt),b=v[i]+w*d;
   const n=to+(d+b*dt)*e;let nv=(v[i]-w*b*dt)*e;
   const speed=[210,270,210][i%3],step=clamp(n-x[i],-speed*dt,speed*dt);
   if(Math.abs(n-x[i])>speed*dt)nv=step/Math.max(dt,1e-6);
   x[i]=clamp(x[i]+step,...limits[i]);v[i]=nv;
  }return {near:x.slice(0,3),far:x.slice(3)};
 },reset(){x.fill(0);v.fill(0)}};
}
