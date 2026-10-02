import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const html=await fs.readFile(new URL('../index.html',import.meta.url),'utf8');
const css=await fs.readFile(new URL('../css/runway.css',import.meta.url),'utf8');
const prologue=html.split('<section class="prologue')[1].split('</section>')[0];
assert.ok(prologue.includes('you don’t have to change'));
assert.ok(prologue.includes('you can start by changing'));
assert.ok(!prologue.includes('opening-copy')&&!prologue.includes('One bracelet'),'prologue does not repeat the opening');assert.ok(!prologue.includes('prologue-close')&&!prologue.includes('prologue-wide'),'old image montage removed');assert.ok(html.includes('opening-journey'));assert.equal((html.match(/class="opening-copy"/g)||[]).length,1);
assert.ok(css.includes('.cinematic .opening-journey>.opening-scene'),'shared sticky owner');
const sharedRule=css.match(/\.cinematic \.opening-journey>\.opening-scene\{([^}]+)\}/)[1];assert.ok(!sharedRule.includes('margin-bottom:-100svh'),'sticky margin box must retain height so it releases before making');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'unique ids');
for(const m of html.matchAll(/<img\b[^>]*>/g)){assert.match(m[0],/width="\d+"/);assert.match(m[0],/height="\d+"/);}
for(const m of html.matchAll(/(?:src|srcset)="(assets\/[^\"]+)"/g))await fs.access(new URL('../'+m[1],import.meta.url));
for(const [mobile,limit] of [[true,1250000],[false,3000000]]){
 const names=mobile?['world-camera-mobile','master-mobile','near']:['world-camera','master','near'];
 const sizes=await Promise.all(names.map(name=>fs.stat(new URL('../assets/illustrations/'+name+'.webp',import.meta.url))));
 assert.ok(sizes.reduce((n,s)=>n+s.size,0)<=limit);
}
console.log('PASS: story lines, shared seam viewport/label, unique ids, reserved dimensions, asset existence and initial media budgets. (Source contracts, not visual acceptance.)');
