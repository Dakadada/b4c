// Measured inner reveals of the generated gateway, in image coordinates.
// Each backplate and the original terrace share one camera; neither image fades.
export const DESTINATIONS={
 desktop:{x:.591,y:.397,width:.354,height:.452},
 portrait:{x:.584,y:.55,width:.367,height:.31},
};
const clamp=v=>Math.max(0,Math.min(1,Number(v)||0));
export function cameraFrame(progress,mode='desktop'){
 const d=DESTINATIONS[mode],t=clamp((clamp(progress)-.18)/.76);
 // Quintic lens travel has zero velocity/acceleration at both stops, in either direction.
 const q=t*t*t*(t*(t*6-15)+10);
 const sx=Math.exp(Math.log(1/d.width)*q),sy=Math.exp(Math.log(1/d.height)*q);
 const x=-d.x*(sx-1)/(1-d.width),y=-d.y*(sy-1)/(1-d.height);
 const destination={x:d.x*sx+x,y:d.y*sy+y,width:d.width*sx,height:d.height*sy};
 if(t===1)return {backdrop:{x:-d.x/d.width,y:-d.y/d.height,sx:1/d.width,sy:1/d.height},destination:{x:0,y:0,width:1,height:1},travel:q};
 return {backdrop:{x,y,sx,sy},destination,travel:q};
}
