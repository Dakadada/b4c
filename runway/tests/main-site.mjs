import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
// The main site is now served from next/ (see next/tests). This preview folder keeps the
// earlier camera version, which must stay self-contained and loadable at /runway/.
for(const name of ['index.html','team.html','legal.html']){
 const preview=await fs.readFile(new URL('../'+name,import.meta.url),'utf8');
 const main=await fs.readFile(new URL('../../'+name,import.meta.url),'utf8');
 assert.ok(!/©|id="year"|copyright/i.test(preview)&&!/©|id="year"|copyright/i.test(main));
 assert.match(main,/next\/one-pull\/style\.css/,`${name} is served by the main site in next/`);
 for(const m of preview.matchAll(/(?:src|srcset|href)="((?:assets|css|js)\/[^"?#]+)[^"\s]*"/g))await fs.access(new URL('../'+m[1],import.meta.url));
}
console.log('PASS: main pages are served from next/, the camera preview in runway/ keeps its own resources, no copyright notices.');
