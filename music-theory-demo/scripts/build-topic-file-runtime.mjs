import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(root, 'topic.html'), 'utf8');
const match = html.match(/<script type="module">\s*([\s\S]*?import \{ startCurrentLesson[\s\S]*?)<\/script>/);
if (!match) throw new Error('Could not locate the topic page module.');
const source = match[1];
const imports = source.match(/^\s*import .*;$/gm) || [];
const body = source.replace(/^\s*import .*;$\n?/gm, '');

await build({
  stdin: {
    contents: `${imports.join('\n')}\nif (window.location.protocol === 'file:') {\n${body}\n}`,
    resolveDir: root,
    sourcefile: 'topic-file-runtime-entry.js',
  },
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  outfile: path.join(root, 'src/topic-file-runtime.bundle.js'),
});
