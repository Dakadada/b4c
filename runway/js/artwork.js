// Landmarks describe the actual artwork, in normalized viewport coordinates.
export const LANDMARKS = {
  desktop: { near: [.779, .481, .052, .292], far: [.522, .562], },
  portrait: { near: [.797, .602, .073, .162], far: [.501, .64], },
};
export function createArtwork(root, onFailure) {
  let map, destroyed=false;
  const path=root.querySelector('#connection-thread');
  const images = [...root.querySelectorAll('img')];
  const fail = () => onFailure();
  const decode=img=>{
    if(destroyed)return;
    if(!img.naturalWidth){fail();return;}
    if(img.decode)img.decode().then(()=>{if(!destroyed)img.classList.add('art-ready');}).catch(fail);
    else img.classList.add('art-ready');
  };
  const loaded=event=>decode(event.target);
  images.forEach(img=>{
    img.classList.add('art-pending');img.addEventListener('error',fail);img.addEventListener('load',loaded);
    if(img.complete)decode(img);
  });
  // Lazy artwork starts loading one viewport before its scene; decoding gates visibility.
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{
    entries.forEach(entry=>{if(entry.isIntersecting){entry.target.querySelectorAll('img').forEach(img=>{img.loading='eager';});observer.unobserve(entry.target);}});
  },{rootMargin:'100% 0px'}):null;
  root.querySelectorAll('.chapter, .closing').forEach(scene=>observer?.observe(scene));
  function refresh() {
    map = LANDMARKS[innerWidth <= 800 ? 'portrait' : 'desktop'];
    const [x,y,w,h] = map.near;
    root.style.setProperty('--far-x', `${map.far[0]*100}%`);
    root.style.setProperty('--far-y', `${map.far[1]*100}%`);
    root.style.setProperty('--far-w', innerWidth <= 800 ? '1.7%' : '1.3%');
    root.style.setProperty('--far-h', innerWidth <= 800 ? '4.2%' : '8.1%');
    root.style.setProperty('--window-x', `${x*100}%`);
    root.style.setProperty('--window-y', `${y*100}%`);
    root.style.setProperty('--window-w', `${w*100}%`);
    root.style.setProperty('--window-h', `${h*100}%`);
    path.setAttribute('d', `M${x*1000} ${y*1000} C${x*800} 850 ${map.far[0]*800} 800 ${map.far[0]*1000} ${map.far[1]*1000}`);
  }
  refresh();
  return { refresh, destroy() { destroyed=true;observer?.disconnect();images.forEach(img=>{img.removeEventListener('error',fail);img.removeEventListener('load',loaded);img.classList.remove('art-pending');img.classList.remove('art-ready');}); } };
}
