import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Vite resolves the browser Supabase bundle’s optional telemetry import locally',()=>{
  const bundle=fs.readFileSync(new URL('../vendor/supabase-2.111.0.js',import.meta.url),'utf8');
  const config=fs.readFileSync(new URL('../vite.config.mjs',import.meta.url),'utf8');
  assert.match(bundle,/import\(`@opentelemetry\/api`\)/);
  assert.match(config,/'@opentelemetry\/api': path\.resolve\(root, 'src\/optional-opentelemetry\.js'\)/);
  assert.match(fs.readFileSync(new URL('optional-opentelemetry.js',import.meta.url),'utf8'),/export const propagation = undefined/);
});
