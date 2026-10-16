// Deterministic software review of the actual Coopanion mesh grids.
// Reuses production deformer definitions and textures through kit injection.
// This does not test browser/WebGL/Electron integration or GPU mip filtering.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { createCanvas } = require('@napi-rs/canvas');

export function applyChain(defs, id, st, x, y) {
  for (let n = id; n; n = defs[n].parent) {
    const d = defs[n], s = st[n];
    if (!s) continue;
    if (d.kind === 'rot') {
      const [px, py] = d.pivot, a = (s.a || 0) * Math.PI / 180;
      const c = Math.cos(a), sn = Math.sin(a);
      const lx = (x - px) * (s.sx ?? s.s ?? 1), ly = (y - py) * (s.sy ?? s.s ?? 1);
      x = px + (s.tx || 0) + lx * c - ly * sn;
      y = py + (s.ty || 0) + lx * sn + ly * c;
    } else if (d.kind === 'warp' && s.fn) {
      const r = d.rect, u = Math.max(0, Math.min(1, (x - r[0]) / (r[2] - r[0])));
      const v = Math.max(0, Math.min(1, (y - r[1]) / (r[3] - r[1])));
      const q = s.fn(u, v, x, y); x += q[0]; y += q[1];
    }
  }
  return [x, y];
}

export function softwareKit(artModel, options = {}) {
  const { S, X0, FEET } = artModel.units;
  const scale = options.scale ?? 1;
  const W = Math.round(1206 * scale), H = Math.round(1304 * scale);
  const pixel = ([x,y]) => [((x - 128) / S + X0) * scale, ((y - 256) / S + FEET) * scale];
  let lastRig;
  return { get rig() { return lastRig; }, createRig(canvas, model) {
    const textures = new Map();
    const rig = {
      model, state: null, renderPixels: false, lastCanvas: null,
      gl: { VERSION: 0, getParameter() { return 'Software mesh review; no WebGL context'; } },
      upload(key, src) {
        const c = createCanvas(src.width, src.height), g = c.getContext('2d'); g.drawImage(src, 0, 0);
        textures.set(key, { w: src.width, h: src.height, data: g.getImageData(0,0,src.width,src.height).data });
      },
      point(id,st,x,y) { return applyChain(model.deformers,id,st,x,y); },
      textureBytes(key) { return textures.get(key)?.data; },
      textureSize(key) { const t=textures.get(key);return t?[t.w,t.h]:null; },
      meshes(st) {
        return model.parts.map(p => {
          const [nx,ny] = p.grid || [6,6], [x,y,w,h] = p.box;
          const vertices = [];
          for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++) vertices.push(applyChain(model.deformers,p.parent,st,x+w*i/nx,y+h*j/ny));
          return { p, nx, ny, vertices };
        });
      },
      render(st) {
        rig.state = st;
        if (!rig.renderPixels) return;
        const meshes = rig.meshes(st), cached = new Map();
        const raster = m => {
          if(cached.has(m.p.id))return cached.get(m.p.id);
          const p=m.p, tex=textures.get(p.tex);
          if(!tex) throw Error('Missing software texture: '+p.tex);
          const verts=m.vertices.map(pixel), buf=new Float32Array(W*H*4);
          const [u0,v0,u1,v1]=p.uvBox||[0,0,1,1];
          const uv = index => [u0+(u1-u0)*(index%(m.nx+1))/m.nx,v0+(v1-v0)*Math.floor(index/(m.nx+1))/m.ny];
          function triangle(ai,bi,ci) {
            const [ax,ay]=verts[ai],[bx,by]=verts[bi],[cx,cy]=verts[ci];
            const d=(by-cy)*(ax-cx)+(cx-bx)*(ay-cy);if(Math.abs(d)<1e-8)return;
            const [au,av]=uv(ai),[bu,bv]=uv(bi),[cu,cv]=uv(ci);
            const minX=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)), maxX=Math.min(W-1,Math.floor(Math.max(ax,bx,cx)-.5));
            const minY=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)), maxY=Math.min(H-1,Math.floor(Math.max(ay,by,cy)-.5));
            for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
              const a=((by-cy)*(x+.5-cx)+(cx-bx)*(y+.5-cy))/d;
              const b=((cy-ay)*(x+.5-cx)+(ax-cx)*(y+.5-cy))/d,c=1-a-b;
              if(a< -1e-7||b< -1e-7||c< -1e-7)continue;
              const tx=Math.max(0,Math.min(tex.w-1,(a*au+b*bu+c*cu)*tex.w-.5));
              const ty=Math.max(0,Math.min(tex.h-1,(a*av+b*bv+c*cv)*tex.h-.5));
              const ix=Math.floor(tx),iy=Math.floor(ty),fx=tx-ix,fy=ty-iy;
              const ids=[(iy*tex.w+ix)*4,(iy*tex.w+Math.min(tex.w-1,ix+1))*4,(Math.min(tex.h-1,iy+1)*tex.w+ix)*4,(Math.min(tex.h-1,iy+1)*tex.w+Math.min(tex.w-1,ix+1))*4];
              const ws=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy], di=(y*W+x)*4;
              let alpha=0,r=0,g=0,bl=0;
              for(let k=0;k<4;k++){
                const z=ids[k],aa=tex.data[z+3]/255*ws[k];alpha+=aa;
                r+=tex.data[z]/255*aa;g+=tex.data[z+1]/255*aa;bl+=tex.data[z+2]/255*aa;
              }
              buf[di]=r;buf[di+1]=g;buf[di+2]=bl;buf[di+3]=alpha;
            }
          }
          for(let j=0;j<m.ny;j++)for(let i=0;i<m.nx;i++){
            const a=j*(m.nx+1)+i,b=a+1,c=a+m.nx+1,d=c+1;triangle(a,b,c);triangle(b,d,c);
          }
          cached.set(p.id,buf);return buf;
        };
        const out=new Float32Array(W*H*4);
        for(const m of meshes.sort((a,b)=>(st.z?.[a.p.id]??a.p.z??0)-(st.z?.[b.p.id]??b.p.z??0))){
          const p=m.p, alpha=st.alpha?.[p.id]??1;if(alpha<.001)continue;
          const buf=raster(m),maskMesh=p.occludeBy?meshes.find(m=>m.p.id===p.occludeBy):null;
          const mask=maskMesh?raster(maskMesh):null,maskAlpha=maskMesh?(st.alpha?.[maskMesh.p.id]??1):0;
          for(let i=0;i<out.length;i+=4){
            let k=alpha;
            if(mask){let t=Math.max(0,Math.min(1,(mask[i+3]-.02)/.96));k*=1-t*t*(3-2*t)*maskAlpha;}
            const a=buf[i+3]*k;if(a<1e-6)continue;
            for(let n=0;n<3;n++)out[i+n]=buf[i+n]*k+out[i+n]*(1-a);
            out[i+3]=a+out[i+3]*(1-a);
          }
          if(!meshes.some(n=>n.p.occludeBy===p.id))cached.delete(p.id);
        }
        const result=createCanvas(W,H),g=result.getContext('2d'),im=g.createImageData(W,H);
        for(let i=0;i<out.length;i+=4){const a=out[i+3];for(let k=0;k<3;k++)im.data[i+k]=a?Math.round(out[i+k]/a*255):0;im.data[i+3]=Math.round(a*255);}
        g.putImageData(im,0,0);rig.lastCanvas=result;
      },
      dispose(){ textures.clear(); }
    };lastRig=rig;return rig;
  } };
}
