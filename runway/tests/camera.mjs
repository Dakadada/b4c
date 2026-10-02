import assert from 'node:assert/strict';
import {cameraFrame,DESTINATIONS} from '../js/camera.js';
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
for(const mode of ['desktop','portrait']){
 const d=DESTINATIONS[mode];
 const first=cameraFrame(0,mode);assert.deepEqual(first.destination,d);close(first.backdrop.sx,1);close(first.backdrop.x,0);
 const last=cameraFrame(1,mode);close(last.destination.x,0);close(last.destination.y,0);close(last.destination.width,1);close(last.destination.height,1);
 const previous=cameraFrame(.999999,mode);close(previous.destination.x,last.destination.x);close(previous.destination.width,last.destination.width);
 for(let i=0;i<=1000;i++){
  const p=i/1000,f=cameraFrame(p,mode),before=cameraFrame(Math.max(0,p-.001),mode);
  assert.ok(f.destination.width>=before.destination.width-1e-8);
  assert.ok(f.destination.height>=before.destination.height-1e-8);
  // Both planes use the same camera, so all four shared corners remain registered.
  close(d.x*f.backdrop.sx+f.backdrop.x,f.destination.x);close(d.y*f.backdrop.sy+f.backdrop.y,f.destination.y);
  close(d.width*f.backdrop.sx,f.destination.width);close(d.height*f.backdrop.sy,f.destination.height);
 }
 const saved=cameraFrame(.47,mode);cameraFrame(.9,mode);assert.deepEqual(cameraFrame(.47,mode),saved);
}
console.log('PASS: continuous world-to-destination camera, registered corners on 1001 frames/layout, exact full-viewport endpoint, reverse determinism. (Geometry, not visual acceptance.)');
