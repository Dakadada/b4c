import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
for(const prefix of ['', 'runway/']){
 const base=new URL('../../',import.meta.url);
 const local=await fs.readFile(new URL(`runway/js/team.js`,base),'utf8');
 const page=await(await fetch(`http://localhost:8898/${prefix}team.html`)).text();
 const modulePath=page.match(/src="([^"]*js\/team.js\?[^"]+)"/)[1];
 assert.ok(!page.includes('ten pairs')&&!page.includes('The ten of us'));
 assert.match(page,/10 pairs of hands string/);
 const served=await(await fetch(new URL(modulePath,`http://127.0.0.1:8898/${prefix}team.html`))).text();
 assert.equal(served,local,'served module matches checkout');
 class Element{constructor(){this.children=[];this.style={};}append(...items){this.children.push(...items);}appendChild(item){this.children.push(item);}setAttribute(){}}
 const grid=new Element(),year=new Element();
 vm.runInNewContext(served.replace(/^import .*;$/gm,''),{Date,BEADS_BY_ID:new Proxy({},{get:()=>({})}),swatchStyle:()=>'',document:{getElementById:id=>id==='team-grid'?grid:year,createElement:()=>new Element()}});
 assert.equal(grid.children.length,9);
 const names=grid.children.map(card=>card.children[1].textContent);
 assert.ok(!names.some(name=>/aadil/i.test(name)));
 console.log(`PASS ${prefix||'root/'}: served source matches, module renders 9 cards, no Aadil, count copy nine, approved 10 line retained.`);
}
