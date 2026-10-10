import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,access} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
async function files(dir) {
  const entries=await readdir(dir,{withFileTypes:true});
  return (await Promise.all(entries.map(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]))).flat();
}
test('all published JavaScript modules parse and their relative imports resolve',async()=>{
  const modules=(await files(root)).filter(file=>file.endsWith('.js'));
  assert.ok(modules.length>20);
  for (const file of modules) {
    const checked=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(checked.status,0,checked.stderr);
    const source=await readFile(file,'utf8');
    for (const [,relative] of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
      await access(path.resolve(path.dirname(file),relative.split('?')[0]));
    }
  }
});
test('entry point includes the canvas and local app/style resources',async()=>{
  const html=await readFile(path.join(root,'index.html'),'utf8');
  assert.match(html,/id="world"/);
  assert.match(html,/app\.js\?v=0\.13\.3/);
  assert.match(html,/style\.css\?v=0\.13\.3/);
  await access(path.join(root,'assets/world.png'));
});
