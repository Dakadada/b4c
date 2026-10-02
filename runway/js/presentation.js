import { BEADS_BY_ID, DEFAULT_DESIGN } from './beads.js';
import { subscribe } from './builder.js';
import { createArtwork } from './artwork.js';
import { cameraFrame } from './camera.js';
export const clamp = v => Math.max(0, Math.min(1, Number(v) || 0));
export const phase = (p,a,b) => clamp((p-a)/(b-a));
const NS='http://www.w3.org/2000/svg';
export function createPresentation() {
  const root=document.documentElement;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const toggle=document.getElementById('motion-toggle');
  let paused=false, failed=false, destroyed=false;
  let timelines=[];
  let litCount=0, frame=0, resizeFrame=0, deferredRefresh=false;
  const pending=new Map();
  const raf=fn=>window.requestAnimationFrame(fn);
  const cancel=id=>window.cancelAnimationFrame(id);
  const prologue=document.querySelector('.prologue-scene');
  const journey=document.querySelector('.opening-journey');
  const backdrop=document.querySelector('.camera-backdrop'),destination=document.querySelector('.camera-destination');
  let sceneWidth=innerWidth,sceneHeight=innerHeight,cameraMode=innerWidth<=800?'portrait':'desktop';
  const keptCord=document.getElementById('kept-cord'), twinCord=document.getElementById('twin-cord');
  const makingThread=document.querySelector('.making-thread'), paper=document.querySelector('.paper-cutout');
  const articles=[...document.querySelectorAll('.how-copy article')];
  const impactScene=document.querySelector('.impact-transition .scene');
  const twinGroup=document.getElementById('twin-beads');
  const trajectories=DEFAULT_DESIGN.map((_,i)=>{
    const a=i/18*Math.PI*2;
    return {lineX:80+i*46.5,lineY:400-Math.sin(i/17*Math.PI)*110,ringX:400+Math.cos(a-Math.PI/2)*175,ringY:390+Math.sin(a-Math.PI/2)*175,cos:Math.cos(a),sin:Math.sin(a)};
  });
  let target={left:0,top:0,width:1,height:1}, origin={}, endX=0,endY=0;
  let viewportWidth=innerWidth,viewportHeight=innerHeight;
  const bounds=new Map();
  function queue(chapter,p){
    pending.set(chapter,p);
    if(!frame&&!document.hidden)frame=raf(()=>{frame=0;if(destroyed||document.hidden)return;try{for(const [key,value] of pending){if(progress[key]!==value)setProgress(key,value);}}catch{failed=true;sync();}pending.clear();});
  }
  const progress={prologue:-1,opening:-1,making:-1,impact:-1,handoff:-1};
  const chapters=[...document.querySelectorAll('[data-chapter]')];
  const opening=document.querySelector('.opening-scene');
  const chapterScenes=new Map(chapters.map(el=>[el,el.querySelector('.scene')]));
  const prologueChapter=chapters.find(el=>el.dataset.chapter==='prologue'),openingChapter=chapters.find(el=>el.dataset.chapter==='opening');
  const world=opening.querySelector('.world');
  let shared=false;
  function mountCamera(enabled){
    if(enabled===shared)return;
    shared=enabled;
    if(enabled){
      journey.insertBefore(opening,prologueChapter);opening.insertBefore(prologue,opening.firstChild);destination.append(world);opening.classList.add('opening-surface');
    }else{
      opening.insertBefore(world,opening.firstChild);prologueChapter.append(prologue);openingChapter.append(opening);opening.classList.remove('opening-surface');
    }
  }
  const studio=document.querySelector('.studio');
  const diagram=document.getElementById('design-svg');
  const handoff=diagram.cloneNode(true);
  handoff.removeAttribute('id'); handoff.setAttribute('aria-hidden','true');
  handoff.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  handoff.classList.add('handoff-bracelet'); document.body.append(handoff);
  const shortcuts=[...document.querySelectorAll('a[href="#builder"]')];
  let bypass=false;
  const shortcut=()=>{bypass=true;studio.inert=false;diagram.style.opacity='1';handoff.style.opacity='0';};
  shortcuts.forEach(el=>el.addEventListener('click',shortcut));
  const dots=Array.from({length:650},()=>{const el=document.createElement('span');el.className='impact-dot';el.style.opacity='.08';return el;});
  document.getElementById('impact-grid').append(...dots);
  const rings=['making-beads','twin-beads'].map(id=>DEFAULT_DESIGN.map((bead,i)=>{
    const el=document.createElementNS(NS,'circle');el.setAttribute('r','20');el.setAttribute('fill',BEADS_BY_ID[bead].color);el.setAttribute('stroke','#17151C');document.getElementById(id).append(el);return el;
  }));
  const traveler=DEFAULT_DESIGN.map((id,i)=>{
    const el=document.createElementNS(NS,'circle');el.setAttribute('fill',BEADS_BY_ID[id].color);
    document.getElementById('impact-travel-beads').append(el);return el;
  });
  const unsubscribe=subscribe(state=>{
    if(destroyed)return;
    rings.forEach(r=>r.forEach((el,i)=>el.setAttribute('fill',BEADS_BY_ID[state.slots[i]]?.color || '#F0E8DB')));
    handoff.querySelectorAll('.diagram-bead').forEach((el,i)=>el.setAttribute('fill',BEADS_BY_ID[state.slots[i]]?.color || '#F0E8DB'));
  });
  function setProgress(chapter,value) {
    if(destroyed)return;
    const p=clamp(value);
    pending.delete(chapter);
    progress[chapter]=p;
    if(chapter==='prologue') {
      const frame=cameraFrame(p,cameraMode),d=frame.destination,w=frame.backdrop;
      backdrop.style.transform=`translate(${w.x*sceneWidth}px,${w.y*sceneHeight}px) scale(${w.sx},${w.sy})`;
      destination.style.transform=`translate(${d.x*sceneWidth}px,${d.y*sceneHeight}px) scale(${d.width},${d.height})`;
      destination.style.setProperty('--edge',`${1.2*(1-phase(p,.8,.94))}%`);
      // Move the original world as one plane, including its existing foreground; no late image swap.
      prologue.style.setProperty('--prologue-first',1-phase(p,.30,.42));
      prologue.style.setProperty('--prologue-second',phase(p,.38,.48)*(1-phase(p,.74,.86)));
      opening.style.setProperty('--camera-title',phase(p,.88,1));
      backdrop.style.visibility=p>=.94?'hidden':'visible';
      backdrop.style.willChange=p>.18&&p<.94?'transform':'';
      destination.style.willChange=p>.18&&p<.94?'transform':'';
    } else if(chapter==='opening') {
      const approach=phase(p,.15,.4), follow=phase(p,.4,.6), aperture=phase(p,.6,.85);
      opening.style.setProperty('--approach',approach);
      opening.style.setProperty('--follow',follow);
      opening.style.setProperty('--thread',phase(p,.15,.6));
      opening.style.setProperty('--aperture',aperture);
      opening.style.setProperty('--note',phase(p,.85,.94));
      opening.style.setProperty('--title',1-phase(p,.18,.38));
    } else if(chapter==='making') {
      const close=phase(p,.25,.5), twin=phase(p,.5,.67), travel=phase(p,.78,1);
      const shrink=1-travel*.8;
      twinGroup.setAttribute('transform',`translate(900 180) scale(${shrink}) translate(${240*twin+260*travel-900} ${-180*travel-180})`);
      twinGroup.style.opacity=String(twin*(1-travel));
      rings.forEach((ring,r)=>ring.forEach((el,i)=>{
        const {lineX,lineY,ringX,ringY}=trajectories[i];
        const x=lineX+(ringX-lineX)*close;
        const y=lineY+(ringY-lineY)*close;
        el.setAttribute('cx',x);el.setAttribute('cy',y);
        if(!r)el.style.opacity=String(phase(p,.03+i*.008,.14+i*.008));
      }));
      keptCord.style.opacity=String(close);
      twinCord.style.opacity=String(twin*(1-travel));
      twinCord.setAttribute('transform',`translate(900 180) scale(${1-travel*.8}) translate(${640+260*travel-900} ${390-180*travel-180}) translate(-640 -390)`);
      makingThread.style.opacity=String(1-close);
      paper.style.transform=`translate(${travel*160}px,${-travel*80}px) rotate(${travel*12}deg)`;
      articles.forEach((el,i)=>{el.style.opacity=String(.22+.78*(1-Math.min(1,Math.abs(p-[.15,.53,.85][i])*4)));});
    } else if(chapter==='handoff') {
      const box={...target,top:target.top-(window.scrollY||0)};
      const x=origin.left+(box.left-origin.left)*p, y=origin.top+(box.top-origin.top)*p;
      handoff.style.transform=`translate(${x}px,${y}px) scale(${(origin.width+(box.width-origin.width)*p)/origin.width},${(origin.height+(box.height-origin.height)*p)/origin.height})`;
      const active=p>0&&p<1&&!bypass&&root.classList.contains('cinematic');
      handoff.style.opacity=active?'1':'0';
      handoff.style.willChange=active?'transform':'';
      diagram.style.opacity=active?'0':'1';
      studio.inert=active;
    } else if(chapter==='impact') {
      if(root.classList.contains('cinematic')&&!bypass){
        handoff.style.transform=`translate(${origin.left}px,${origin.top}px) scale(1)`;
        handoff.style.opacity='1';
      }
      const arrive=phase(p,0,.18);
      traveler.forEach((el,i)=>{
        const {cos,sin}=trajectories[i];
        const radius=35*(1-arrive);
        el.setAttribute('cx',900+(endX-900)*arrive+cos*radius);
        el.setAttribute('cy',180+(endY-180)*arrive+sin*radius);
        el.setAttribute('r',4*(1-arrive)+1);
        el.style.opacity=String(1-arrive);
      });
      const count=Math.ceil(p*650);
      for(let i=Math.min(count,litCount);i<Math.max(count,litCount);i++)dots[i].style.opacity=i<count?'1':'.08';
      litCount=count;
    }
  }
  const artwork=createArtwork(document.querySelector('main'),()=>{failed=true;sync();});
  function kill(){timelines.forEach(t=>t.kill());timelines=[];if(frame)cancel(frame);frame=0;pending.clear();}
  function sync() {
    if(destroyed)return;
    const wasCinematic=root.classList.contains('cinematic');
    const anchor=[...chapters].reverse().find(el=>{const b=el.getBoundingClientRect();return b.top<=0&&b.top+b.height>0;});
    const saved=anchor ? {el:anchor,p:wasCinematic?progress[anchor.dataset.chapter]:clamp(-(anchor.getBoundingClientRect().top)/Math.max(1,anchor.offsetHeight-innerHeight))} : null;
    kill();
    const still=paused||preference.matches||failed||!window.gsap||!window.ScrollTrigger;
    root.classList.toggle('cinematic',!still);
    root.classList.toggle('still',still);
    mountCamera(!still);
    toggle.textContent=preference.matches?'Reduced motion on':paused?'Resume motion':'Pause motion';
    toggle.disabled=preference.matches;
    toggle.setAttribute('aria-pressed',String(still));
    if(still){if(saved&&wasCinematic)window.scrollTo?.(0,saved.el.offsetTop+saved.p*Math.max(0,saved.el.offsetHeight-innerHeight));studio.inert=false;diagram.style.opacity='1';handoff.style.opacity='0';setProgress('prologue',1);setProgress('opening',1);setProgress('making',.65);setProgress('impact',1);articles.forEach(el=>el.style.opacity='1');return;}
    try {
    window.gsap.registerPlugin(window.ScrollTrigger);
    // Own resize/visibility refreshes so they coalesce and preserve chapter position.
    window.ScrollTrigger.config?.({ignoreMobileResize:true,autoRefreshEvents:'DOMContentLoaded,load'});
    measure();
    chapters.forEach(el=>{
      const chapter=el.dataset.chapter;
      timelines.push(window.ScrollTrigger.create({trigger:el,start:'top top',end:()=>`+=${bounds.get(el).travel}`,onUpdate:self=>queue(chapter,self.progress),onRefresh:self=>setProgress(chapter,self.progress)}));
    });
    timelines.push(window.ScrollTrigger.create({trigger:document.getElementById('builder'),start:'top bottom',end:'top top',onUpdate:self=>queue('handoff',self.progress),onRefresh:self=>setProgress('handoff',self.progress)}));
    refresh();
    if(saved&&!wasCinematic)window.scrollTo?.(0,saved.el.offsetTop+saved.p*Math.max(0,saved.el.offsetHeight-innerHeight));
    } catch {failed=true;sync();}
  }
  function measure(){
    const y=window.scrollY||0;
    const sceneBox=opening.getBoundingClientRect();sceneWidth=sceneBox.width;sceneHeight=sceneBox.height;cameraMode=innerWidth<=800?'portrait':'desktop';
    const box=diagram.getBoundingClientRect();target={...box,left:box.left,top:box.top+y,width:box.width,height:box.height};
    const size=Math.min(innerWidth*.28,170);origin={left:innerWidth-size-24,top:viewportHeight-size*.866-24,width:size,height:size*.866};
    Object.assign(handoff.style,{left:'0px',top:'0px',width:`${size}px`,height:`${size*.866}px`,transformOrigin:'0 0'});
    const dot=dots[0].getBoundingClientRect(), scene=impactScene.getBoundingClientRect();
    endX=(dot.left-scene.left)/Math.max(1,scene.width)*1000;endY=(dot.top-scene.top)/Math.max(1,scene.height)*800;
    chapters.forEach(el=>{const b=el.getBoundingClientRect(), scene=chapterScenes.get(el).getBoundingClientRect();bounds.set(el,{top:b.top+y,height:b.height,travel:Math.max(1,b.height-scene.height)});});
  }
  function refresh(){if(destroyed)return;artwork.refresh();measure();window.ScrollTrigger?.refresh();measure();if(shared)setProgress('prologue',Math.max(0,progress.prologue));}
  function resize(){
    if(document.hidden){deferredRefresh=true;return;}
    // Ignore height-only mobile toolbar changes; svh scenes and cached cadence stay stable.
    if(innerWidth<=800&&innerWidth===viewportWidth)return;
    if(resizeFrame)cancel(resizeFrame);
    resizeFrame=raf(()=>{resizeFrame=0;
      const y=window.scrollY||0;const anchor=[...chapters].reverse().find(el=>{const b=bounds.get(el);return b&&y>=b.top&&y<b.top+b.height;});
      const p=anchor?progress[anchor.dataset.chapter]:0;
      viewportWidth=innerWidth;viewportHeight=innerHeight;refresh();
      if(anchor&&root.classList.contains('cinematic')){const b=bounds.get(anchor);window.scrollTo?.(0,b.top+p*b.travel);}
    });
  }
  function setPaused(value){paused=Boolean(value);sync();}
  const click=()=>setPaused(!paused);
  const visibility=()=>{root.classList.toggle('tab-hidden',document.hidden);if(document.hidden){if(frame)cancel(frame);if(resizeFrame){cancel(resizeFrame);deferredRefresh=true;}frame=0;resizeFrame=0;}else{if(deferredRefresh){deferredRefresh=false;viewportWidth=innerWidth;viewportHeight=innerHeight;refresh();}if(pending.size){const [key,p]=pending.entries().next().value;queue(key,p);}}};
  toggle.addEventListener('click',click);
  preference.addEventListener('change',sync);
  window.addEventListener('resize',resize);
  window.addEventListener('orientationchange',resize);
  document.addEventListener('visibilitychange',visibility);
  const layoutChanged=()=>{if(document.hidden){deferredRefresh=true;return;}if(!destroyed&&!resizeFrame)resizeFrame=raf(()=>{resizeFrame=0;refresh();});};
  const layoutObserver=typeof ResizeObserver==='function'?new ResizeObserver(layoutChanged):null;
  layoutObserver?.observe(studio);
  document.fonts?.addEventListener('loadingdone',layoutChanged);
  sync();
  return {setProgress,setPaused,refresh,destroy(){mountCamera(false);destroyed=true;kill();window.ScrollTrigger?.config?.({ignoreMobileResize:false,autoRefreshEvents:'visibilitychange,DOMContentLoaded,load,resize'});layoutObserver?.disconnect();document.fonts?.removeEventListener('loadingdone',layoutChanged);unsubscribe();dots.forEach(el=>el.remove());rings.flat().forEach(el=>el.remove());traveler.forEach(el=>el.remove());studio.inert=false;diagram.style.opacity='1';handoff.remove();shortcuts.forEach(el=>el.removeEventListener('click',shortcut));artwork.destroy();toggle.removeEventListener('click',click);preference.removeEventListener('change',sync);window.removeEventListener('resize',resize);window.removeEventListener('orientationchange',resize);if(resizeFrame)cancel(resizeFrame);document.removeEventListener('visibilitychange',visibility);root.classList.remove('cinematic');root.classList.add('still');}};
}
