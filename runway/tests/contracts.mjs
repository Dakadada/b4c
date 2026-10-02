import assert from 'node:assert/strict';
class Element {
  constructor() { this.children=[]; this.attributes={}; this.style={}; this.dataset={}; this.handlers={}; this.value=''; this.textContent=''; this.className=''; this.checked=false; this.classList={add:()=>{},remove:()=>{},contains:()=>false}; }
  appendChild(el){this.children.push(el);return el;}
  set innerHTML(v){this.children=[];} get innerHTML(){return '';}
  setAttribute(k,v){this.attributes[k]=v;}
  addEventListener(k,fn){this.handlers[k]=fn;}
  querySelectorAll(selector){return selector==='.palette-tab'?this.children:[];}
  contains(){return false;}
  select(){} remove(){} focus(){}
  async fire(k){await this.handlers[k]?.({});}
}
const ids=['palette-tabs','palette-grid','bead-count','slot-controls','btn-fill','btn-shuffle','btn-clear','builder-hint','design-strip','selected-bead','order-qty','order-name','order-note-toggle','order-note','order-note-field','order-summary','btn-copy','btn-dm','order-gives','qty-minus','qty-plus','order-total','copy-status'];
const elements=Object.fromEntries(ids.map(id=>[id,new Element()])); elements['order-qty'].value='1';
const details=new Element();
globalThis.document={getElementById:id=>elements[id],createElement:()=>new Element(),activeElement:null,body:new Element(),querySelector:()=>details,execCommand:()=>false};
Object.defineProperty(globalThis,'navigator',{value:{clipboard:{writeText:async text=>{globalThis.copied=text;}}},configurable:true});
const {initBuilder,getState}=await import('../js/builder.js');
const {initOrder}=await import('../js/order.js');
const {BEADS,CATEGORIES}=await import('../js/beads.js');
const scene={setDesign(slots){this.slots=slots.slice();},setSelectedSlot(slot){this.selected=slot;}};
initBuilder(scene);initOrder();
assert.equal(elements['slot-controls'].children.length,18);
assert.equal(elements['order-total'].textContent,'$4.99');
for(let cat=0;cat<CATEGORIES.length;cat++){
  await elements['palette-tabs'].children[cat].fire('click');
  const beads=BEADS.filter(b=>b.category===CATEGORIES[cat].id);
  assert.equal(elements['palette-grid'].children.length,beads.length);
  for(let i=0;i<beads.length;i++){
    await elements['slot-controls'].children[0].fire('click');
    if(getState().selectedSlot!==0) await elements['slot-controls'].children[0].fire('click');
    await elements['palette-grid'].children[i].fire('click');
    assert.equal(getState().slots[0],beads[i].id);
    assert.ok(elements['order-summary'].textContent.includes(`1: ${beads[i].name}`));
  }
}
await elements['btn-clear'].fire('click');assert.equal(scene.slots.filter(Boolean).length,0);
await elements['btn-fill'].fire('click');assert.equal(scene.slots.filter(Boolean).length,18);
await elements['btn-shuffle'].fire('click');assert.equal(scene.slots.length,18);assert.ok(scene.slots.every(id=>BEADS.some(b=>b.id===id)));
elements['order-qty'].value='99';await elements['order-qty'].fire('input');assert.equal(elements['order-qty'].value,10);assert.equal(elements['order-total'].textContent,'$49.90');
elements['order-qty'].value='-2';await elements['order-qty'].fire('input');assert.equal(elements['order-total'].textContent,'$4.99');
elements['order-note'].value='You matter.';elements['order-note-toggle'].checked=true;await elements['order-note-toggle'].fire('change');assert.equal(elements['order-note-field'].hidden,false);assert.ok(elements['order-summary'].textContent.includes('You matter.'));
await elements['btn-copy'].fire('click');assert.equal(globalThis.copied,elements['order-summary'].textContent);
assert.equal(elements['btn-dm'].href,'https://ig.me/m/brace4change.official');
navigator.clipboard.writeText=async()=>{throw Error('Denied');};await elements['btn-copy'].fire('click');assert.equal(details.open,true);assert.match(elements['copy-status'].textContent,/Copy unavailable/);
console.log('PASS: 24 catalog beads, 4 finishes, 18 slots, fill/shuffle/clear, matching slot summaries, quantity bounds, totals, notes, clipboard success/failure, Instagram destination.');
