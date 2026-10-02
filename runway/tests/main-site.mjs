import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
for(const name of ['index.html','team.html','legal.html']){
 const preview=await fs.readFile(new URL('../'+name,import.meta.url),'utf8');
 const main=await fs.readFile(new URL('../../'+name,import.meta.url),'utf8');
 const promoted=preview.replace(/((?:src|srcset|href)=")((?:assets|css|js)\/)/g,'$1runway/$2');
 assert.equal(main,promoted,`${name} serves the approved preview with shared assets`);
 assert.ok(!/©|id="year"|copyright/i.test(main));
 for(const m of main.matchAll(/(?:src|srcset|href)="(runway\/[^"?#]+)[^"\s]*"/g))await fs.access(new URL('../../'+m[1],import.meta.url));
}
console.log('PASS: all three main pages match the camera preview, shared local resources exist, no copyright notices.');
