import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json'),'utf8'));
const allowed=new Set(Object.values(manifest.palette).map(c=>c.join(',')));
function decode(buf) {
  assert.deepEqual([...buf.subarray(0,8)],[137,80,78,71,13,10,26,10]);
  let width,height;const chunks=[];
  for(let p=8;p<buf.length;){const size=buf.readUInt32BE(p),type=buf.toString('ascii',p+4,p+8),data=buf.subarray(p+8,p+8+size);if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);assert.equal(data[8],8);assert.equal(data[9],6);}if(type==='IDAT')chunks.push(data);p+=size+12;}
  const raw=zlib.inflateSync(Buffer.concat(chunks)),pixels=Buffer.alloc(width*height*4);
  assert.equal(raw.length,(width*4+1)*height);
  for(let y=0;y<height;y++){assert.equal(raw[y*(width*4+1)],0);raw.copy(pixels,y*width*4,y*(width*4+1)+1,(y+1)*(width*4+1));}
  return {width,height,pixels};
}
const decoded=new Map();
for(const item of manifest.assets){
  const png=decode(fs.readFileSync(path.join(root,item.path)));decoded.set(item.path,png);
  assert.equal(png.width,item.width,item.path);assert.equal(png.height,item.height,item.path);
  let transparent=0,opaque=0;
  for(let i=0;i<png.pixels.length;i+=4){const color=[...png.pixels.subarray(i,i+4)].join(',');assert(allowed.has(color),`${item.path}: unexpected color/alpha ${color}`);if(png.pixels[i+3]===0)transparent++;else opaque++;}
  assert(transparent>0&&opaque>0,`${item.path}: must contain both transparency and character pixels`);
}
const base=decoded.get('neatify-mascot.png'),silhouette=decoded.get('neatify-mascot-silhouette.png');
for(let i=3;i<base.pixels.length;i+=4)assert.equal(base.pixels[i],silhouette.pixels[i],'Silhouette must exactly match base alpha');
// The folded hood, stitch, and upper cape stay identical across all ten states.
const idle=decoded.get('runtime/idle.png');
for(const {state} of manifest.expressions){const sprite=decoded.get(`runtime/${state}.png`);for(let y=8;y<14;y++)for(let x=23;x<40;x++){const p=(y*64+x)*4;assert.deepEqual(sprite.pixels.subarray(p,p+4),idle.pixels.subarray(p,p+4),`${state}: signature hood changed`);}}
const ico=fs.readFileSync(path.join(root,'windows/neatify.ico')),sizes=[16,24,32,48,64,128,256];
assert.equal(ico.readUInt16LE(0),0);assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),sizes.length);
sizes.forEach((size,i)=>{const p=6+i*16,bytes=ico.readUInt32LE(p+8),offset=ico.readUInt32LE(p+12);assert.equal(ico[p]||256,size);assert.equal(ico[p+1]||256,size);const frame=ico.subarray(offset,offset+bytes);assert.deepEqual(frame,fs.readFileSync(path.join(root,`windows/${size}x${size}.png`)));assert.equal(decode(frame).width,size);});
console.log(`PASS: ${manifest.assets.length} RGBA PNGs; exact dimensions; eight-color palette; binary alpha; silhouette and hood consistency; seven valid ICO frames.`);
