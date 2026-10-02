// Opt-in local diagnostics. No network requests or persistence.
export function summarizeIntervals(samples){
  if(!samples.length)return {samples:0,median:null,p95:null,over25Percent:0,passes:false};
  const sorted=samples.slice().sort((a,b)=>a-b);
  const median=sorted[Math.floor((sorted.length-1)*.5)],p95=sorted[Math.ceil(sorted.length*.95)-1];
  const over25Percent=samples.filter(t=>t>25).length/samples.length*100;
  return {samples:samples.length,median:+median.toFixed(2),p95:+p95.toFixed(2),over25Percent:+over25Percent.toFixed(2),passes:median<=18&&p95<=25&&over25Percent<=5};
}
if(typeof location!=='undefined'&&new URLSearchParams(location.search).has('measure')){
  const samples=new Map();let previous,frame=0,lastScroll=0,started=performance.now(),warmup=1500,bounds=[];
  const output=document.createElement('output');output.id='performance-results';
  output.style.cssText='position:fixed;bottom:0;left:0;z-index:10000;background:#fff;color:#111;font:10px monospace;padding:8px;max-width:100%;pointer-events:none';
  document.body.append(output);
  const measure=()=>{bounds=[...document.querySelectorAll('[data-chapter]')].map(el=>{const b=el.getBoundingClientRect();return {name:el.dataset.chapter,top:b.top+scrollY,bottom:b.bottom+scrollY};});};
  const report=()=>({userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],device:'record physical model, iOS and display cadence manually',warmupMs:warmup,chapters:Object.fromEntries([...samples].map(([name,values])=>[name,summarizeIntervals(values)]))});
  function sample(time){
    frame=0;
    if(document.hidden){previous=undefined;return;}
    if(previous&&time-started>=warmup){
      const chapter=bounds.find(b=>scrollY>=b.top&&scrollY<b.bottom)?.name||'document';
      if(!samples.has(chapter))samples.set(chapter,[]);
      samples.get(chapter).push(time-previous);
    }
    previous=time;
    if(time-lastScroll<150)frame=requestAnimationFrame(sample);
    else{previous=undefined;output.textContent=JSON.stringify(report());}
  }
  function scroll(){lastScroll=performance.now();if(!frame&&!document.hidden)frame=requestAnimationFrame(sample);}
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;previous=undefined;}}
  measure();addEventListener('scroll',scroll,{passive:true});addEventListener('resize',measure);document.addEventListener('visibilitychange',visibility);
  window.runwayPerformance={report,refresh:measure,reset({warmupMs=1500}={}){samples.clear();warmup=warmupMs;started=performance.now();previous=undefined;measure();},destroy(){cancelAnimationFrame(frame);removeEventListener('scroll',scroll);removeEventListener('resize',measure);document.removeEventListener('visibilitychange',visibility);output.remove();}};
}
