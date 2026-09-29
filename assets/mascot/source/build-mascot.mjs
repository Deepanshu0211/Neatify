/** Neatify's original pixel master. Integer coordinates, indexed palette, binary alpha.
 * Run: node assets/mascot/source/build-mascot.mjs
 * No image model output, raster tracing, remote assets, or antialiasing is used.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const project = path.resolve(root, '../..');
export const palette = {
  _: [0, 0, 0, 0],
  F: [42, 65, 52, 255],       // forest outline
  G: [93, 121, 96, 255],      // sage cloth
  L: [151, 173, 128, 255],    // lit sage
  C: [240, 230, 197, 255],    // warm cream
  W: [250, 247, 232, 255],    // linen highlight
  B: [194, 169, 126, 255],    // beige / face shade
  T: [141, 108, 75, 255],     // warm brown leather
  D: [83, 69, 49, 255],       // dark brown
};
class Grid {
  constructor(w, h = w) { this.w = w; this.h = h; this.p = new Array(w * h).fill('_'); }
  set(x, y, c) { if (x >= 0 && x < this.w && y >= 0 && y < this.h) this.p[y * this.w + x] = c; }
  rect(x, y, w, h, c) { for (let yy=y; yy<y+h; yy++) for (let xx=x; xx<x+w; xx++) this.set(xx,yy,c); }
  poly(points,c) {
    const minY=Math.min(...points.map(p=>p[1])), maxY=Math.max(...points.map(p=>p[1]));
    const minX=Math.min(...points.map(p=>p[0])), maxX=Math.max(...points.map(p=>p[0]));
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      let inside=false;
      for(let i=0,j=points.length-1;i<points.length;j=i++) {
        const [xi,yi]=points[i], [xj,yj]=points[j];
        if(((yi>y+.5)!==(yj>y+.5)) && (x+.5 < (xj-xi)*(y+.5-yi)/(yj-yi)+xi)) inside=!inside;
      }
      if(inside)this.set(x,y,c);
    }
  }
  blit(other, x, y, scale=1) { for(let j=0;j<other.h;j++)for(let i=0;i<other.w;i++){const c=other.p[j*other.w+i];if(c!=='_')this.rect(x+i*scale,y+j*scale,scale,scale,c);} }
}

// The hood is the signature: one folded, squared tip on the viewer's left,
// a cream stitch on that fold, a forest rim, and a wide, unadorned face opening.
function head(state='idle') {
  const g=new Grid(24,23);
  g.poly([[3,1],[10,1],[10,2],[16,2],[16,3],[19,3],[19,5],[21,5],[21,8],[23,8],[23,19],[21,19],[21,21],[18,21],[18,22],[6,22],[6,21],[3,21],[3,19],[1,19],[1,10],[3,10],[3,7],[5,7],[5,5],[3,5]],'F');
  g.poly([[4,2],[9,2],[9,3],[15,3],[15,4],[18,4],[18,6],[20,6],[20,9],[22,9],[22,18],[20,18],[20,20],[17,20],[17,21],[7,21],[7,20],[4,20],[4,18],[2,18],[2,11],[4,11],[4,8],[6,8],[6,5],[4,5]],'G');
  g.poly([[4,2],[9,2],[9,3],[15,3],[15,4],[18,4],[18,6],[8,6],[8,5],[4,5]],'L');
  g.rect(5,3,3,1,'C');
  g.rect(4,9,2,3,'L');
  g.poly([[8,8],[17,8],[17,9],[20,9],[20,11],[21,11],[21,17],[19,17],[19,19],[16,19],[16,20],[8,20],[8,19],[5,19],[5,17],[4,17],[4,12],[5,12],[5,10],[8,10]],'F');
  g.poly([[8,9],[17,9],[17,10],[19,10],[19,12],[20,12],[20,16],[18,16],[18,18],[15,18],[15,19],[9,19],[9,18],[6,18],[6,16],[5,16],[5,12],[6,12],[6,11],[8,11]],'C');
  g.rect(9,9,8,1,'W');g.rect(7,11,1,2,'W');g.rect(8,17,1,1,'B');g.rect(9,18,6,1,'B');g.rect(18,15,2,1,'B');
  if(['happy','celebrating','success'].includes(state)) {
    g.rect(8,12,3,1,'D');g.rect(8,13,1,1,'D');g.rect(10,13,1,1,'D');
    g.rect(15,12,3,1,'D');g.rect(15,13,1,1,'D');g.rect(17,13,1,1,'D');
    g.rect(11,16,4,1,'D');g.rect(12,17,2,1,'D');
  } else if(['sleepy','sleeping','blink'].includes(state)) {
    g.rect(8,14,3,1,'D');g.rect(15,14,3,1,'D');g.rect(12,17,2,1,'T');
  } else {
    const eyeY=state==='curious'?11:12;
    g.rect(8,eyeY,2,3,'D');g.rect(15,12,2,3,'D');g.rect(8,eyeY,1,1,'W');g.rect(15,12,1,1,'W');
    if(state==='confused'||state==='error'){g.rect(7,10,3,1,'T');g.rect(15,11,3,1,'T');g.rect(12,17,3,1,'T');g.rect(14,16,1,1,'T');}
    else {g.rect(11,16,1,1,'T');g.rect(12,17,3,1,'T');g.rect(15,16,1,1,'T');}
  }
  g.rect(12,14,2,1,'B');
  return g;
}
function folder(g,x,y,w=15,h=11) {
  g.rect(x+1,y,w-2,h,'D');g.rect(x,y+3,w,h-4,'D');g.rect(x+2,y-2,6,3,'D');
  g.rect(x+2,y-1,5,3,'B');g.rect(x+1,y+3,w-2,h-4,'B');g.rect(x+2,y+1,w-4,3,'C');g.rect(x+2,y+h-3,w-4,1,'T');
}
function paper(g,x,y) {g.rect(x,y,7,9,'F');g.rect(x+1,y+1,5,7,'W');g.rect(x+2,y+3,3,1,'B');g.rect(x+2,y+5,3,1,'B');}
function mascot(state='idle') {
  const g=new Grid(64);
  // Sturdy, human-like linen body; head is under half of total height.
  g.poly([[25,27],[39,27],[39,29],[42,29],[42,35],[41,35],[41,47],[38,47],[38,51],[25,51],[25,48],[22,48],[22,35],[21,35],[21,30],[25,30]],'F');
  g.rect(24,31,15,16,'C');g.rect(26,32,4,13,'W');g.rect(24,44,15,4,'B');g.rect(26,47,5,4,'G');g.rect(33,47,5,4,'G');
  g.poly([[22,29],[27,27],[38,27],[42,30],[43,36],[40,38],[36,35],[34,31],[30,33],[25,37],[20,36],[21,32]],'G');
  g.rect(24,29,14,2,'L');g.rect(28,31,3,1,'L');g.rect(36,30,3,2,'L');
  // The satchel and diagonal strap never migrate between expressions.
  g.poly([[27,30],[29,30],[37,40],[37,44],[35,44],[35,40]],'T');
  g.rect(35,39,8,9,'D');g.rect(36,40,6,7,'T');g.rect(36,40,6,2,'B');g.rect(38,42,2,2,'C');
  g.rect(24,50,7,5,'D');g.rect(23,53,8,3,'D');g.rect(25,51,5,2,'T');
  g.rect(33,50,7,5,'D');g.rect(33,53,9,3,'D');g.rect(34,51,5,2,'T');
  // Arms are the only body parts re-posed.
  if(state==='celebrating'||state==='success') {
    g.poly([[21,34],[18,34],[18,30],[16,30],[16,24],[20,24],[20,29],[23,29]],'F');g.rect(17,25,2,4,'C');g.rect(19,30,2,3,'G');
    g.poly([[40,30],[44,30],[44,26],[48,26],[48,32],[46,32],[46,35],[42,35]],'F');g.rect(45,27,2,4,'C');g.rect(42,31,3,3,'G');
  } else if(state==='curious'||state==='confused'||state==='error') {
    g.rect(19,34,5,9,'F');g.rect(20,35,3,5,'G');g.rect(20,40,3,2,'C');
    g.rect(41,30,4,8,'F');g.rect(42,31,2,4,'C');g.rect(41,36,3,2,'G');
  } else {
    g.rect(19,34,5,10,'F');g.rect(20,35,3,6,'G');g.rect(20,41,3,2,'C');
    g.rect(41,34,5,10,'F');g.rect(42,35,3,6,'G');g.rect(42,41,3,2,'C');
  }
  g.blit(head(state),20,7);
  if(state==='carrying'||state==='organizing') {
    folder(g,14,37,18,12);g.rect(17,38,3,2,'C');g.rect(29,38,3,2,'C');
    if(state==='organizing'){paper(g,10,28);g.rect(17,30,4,1,'F');}
  }
  if(state==='scanning') {
    paper(g,12,35);g.rect(19,36,2,2,'C');
    // Rectilinear magnifier, held close to the file.
    g.poly([[12,28],[18,28],[18,29],[20,29],[20,35],[18,35],[18,37],[12,37],[12,35],[10,35],[10,30],[12,30]],'F');
    g.rect(12,30,6,5,'L');g.rect(13,30,3,2,'W');g.rect(18,36,2,2,'D');g.rect(20,38,3,2,'D');
  }
  if(state==='working') {paper(g,13,36);g.rect(19,40,3,2,'C');g.rect(21,36,2,6,'T');g.rect(21,34,2,2,'D');}
  if(state==='sleepy'||state==='sleeping') {g.rect(20,37,4,7,'G');g.rect(21,42,3,2,'C');}
  return g;
}
function portrait(state='idle') {const g=new Grid(32);g.blit(head(state),4,3);g.rect(10,25,15,3,'F');g.rect(11,25,13,2,'G');g.rect(14,27,6,2,'C');return g;}
function tinyIcon() {
  const g=new Grid(16);
  g.poly([[3,1],[7,1],[7,2],[10,2],[10,3],[12,3],[12,5],[14,5],[14,12],[12,12],[12,14],[4,14],[4,13],[2,13],[2,11],[1,11],[1,6],[3,6],[3,4],[2,4],[2,2],[3,2]],'F');
  g.poly([[3,2],[6,2],[6,3],[10,3],[10,4],[11,4],[11,6],[13,6],[13,11],[11,11],[11,13],[5,13],[5,12],[3,12],[3,10],[2,10],[2,7],[4,7],[4,4],[3,4]],'G');
  g.rect(3,2,2,1,'C');g.rect(6,4,4,1,'L');
  g.poly([[5,6],[11,6],[11,7],[12,7],[12,10],[11,10],[11,12],[5,12],[5,11],[3,11],[3,8],[5,8]],'C');
  g.rect(5,8,1,2,'D');g.rect(9,8,1,2,'D');g.rect(7,11,2,1,'T');g.rect(6,13,4,1,'L');return g;
}
function icon24() { const g=new Grid(24); const h=head(); for(let y=0;y<h.h;y++)for(let x=0;x<h.w;x++)g.set(x,y,h.p[y*h.w+x]);g.rect(8,22,10,1,'G');return g; }
function circleIcon() {
  const g=new Grid(64);
  for(let y=2;y<62;y++)for(let x=2;x<62;x++)if((x-31.5)**2+(y-31.5)**2<=29.5**2)g.set(x,y,'L');
  for(let y=4;y<60;y++)for(let x=4;x<60;x++)if((x-31.5)**2+(y-31.5)**2<=27.5**2)g.set(x,y,'C');
  g.blit(portrait(),0,0,2);return g;
}
// PNG encoder: nearest-neighbor palette lookup, RGBA8, alpha values only 0/255.
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc32(buf){let c=0xffffffff;for(const v of buf)c=crcTable[(c^v)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),out=Buffer.alloc(data.length+12);out.writeUInt32BE(data.length);name.copy(out,4);data.copy(out,8);out.writeUInt32BE(crc32(Buffer.concat([name,data])),data.length+8);return out;}
function png(grid,w=grid.w,h=grid.h){
  const raw=Buffer.alloc((w*4+1)*h),header=Buffer.alloc(13);header.writeUInt32BE(w);header.writeUInt32BE(h,4);header[8]=8;header[9]=6;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=palette[grid.p[Math.floor(y*grid.h/h)*grid.w+Math.floor(x*grid.w/w)]];const off=y*(w*4+1)+1+x*4;for(let i=0;i<4;i++)raw[off+i]=c[i];}
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
const manifest={version:1,method:'original hand-authored raster pixel grids',palette,assets:[],expressions:[]};
function save(relative,grid,w=grid.w,h=grid.h){const full=path.join(root,relative);fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,png(grid,w,h));manifest.assets.push({path:relative,width:w,height:h,logicalWidth:grid.w,logicalHeight:grid.h});}
const base=mascot(), face=portrait();
save('neatify-mascot.png',base,1024,1024);
save('neatify-mascot-head.png',face,1024,1024);
save('neatify-mascot-icon.png',circleIcon(),1024,1024);
save('neatify-mascot-folder.png',mascot('carrying'),1024,1024);
const silhouette=new Grid(64);silhouette.p=base.p.map(c=>c==='_'?'_':'F');
save('neatify-mascot-silhouette.png',silhouette,1024,1024);
save('windows/neatify-app-icon.png',face,1024,1024);
save('source/idle-grid-64.png',base);save('source/head-grid-32.png',face);save('source/icon-grid-16.png',tinyIcon());save('source/icon-grid-24.png',icon24());
const states=['idle','happy','curious','working','carrying','scanning','organizing','confused','sleepy','celebrating'];
const sheet=new Grid(400,176);
states.forEach((state,i)=>{const sprite=mascot(state);save(`expressions/${state}.png`,sprite,512,512);save(`runtime/${state}.png`,sprite,64,64);sheet.blit(sprite,(i%5)*80+8,Math.floor(i/5)*88+8);manifest.expressions.push({state,row:Math.floor(i/5)+1,column:i%5+1,cell:{x:(i%5)*640,y:Math.floor(i/5)*704,width:640,height:704}});});
save('neatify-expression-sheet.png',sheet,3200,1408);
save('runtime/blink.png',mascot('blink'));
const sizes=[16,24,32,48,64,128,256];
const iconBuffers=[];
for(const size of sizes){const grid=size===16?tinyIcon():size===24||size===48?icon24():portrait();save(`windows/${size}x${size}.png`,grid,size,size);save(`sizes/full-${size}.png`,base,size,size);iconBuffers.push(png(grid,size,size));}
// Windows ICO with native 16/24/32 compositions and crisp larger derivatives.
const icoHeader=Buffer.alloc(6+16*sizes.length);icoHeader.writeUInt16LE(1,2);icoHeader.writeUInt16LE(sizes.length,4);let offset=icoHeader.length;
sizes.forEach((size,i)=>{const p=6+i*16;icoHeader[p]=size===256?0:size;icoHeader[p+1]=size===256?0:size;icoHeader.writeUInt16LE(1,p+4);icoHeader.writeUInt16LE(32,p+6);icoHeader.writeUInt32LE(iconBuffers[i].length,p+8);icoHeader.writeUInt32LE(offset,p+12);offset+=iconBuffers[i].length;});
fs.writeFileSync(path.join(root,'windows/neatify.ico'),Buffer.concat([icoHeader,...iconBuffers]));
// Readable size audit, transparent backing. Each cell contains the exact shipped icon.
const audit=new Grid(760,288);
let auditX=16;
sizes.forEach(size=>{const chosen=size===16?tinyIcon():size===24||size===48?icon24():face;const scaled=new Grid(size);for(let y=0;y<size;y++)for(let x=0;x<size;x++)scaled.set(x,y,chosen.p[Math.floor(y*chosen.h/size)*chosen.w+Math.floor(x*chosen.w/size)]);audit.blit(scaled,auditX,16+Math.floor((256-size)/2));auditX+=size+24;});
save('icon-size-reference.png',audit,760,288);
fs.writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
// Runtime copies are generated; assets/mascot/source remains the source of truth.
const runtime=path.join(project,'public/mascot');fs.mkdirSync(runtime,{recursive:true});
for(const state of [...states,'blink'])fs.copyFileSync(path.join(root,`runtime/${state}.png`),path.join(runtime,`${state}.png`));
for(const size of [16,24,32,48,64,128,256])fs.copyFileSync(path.join(root,`windows/${size}x${size}.png`),path.join(runtime,`head-${size}.png`));
console.log(`Created ${manifest.assets.length} transparent PNGs, a seven-resolution Windows ICO, and runtime copies.`);
