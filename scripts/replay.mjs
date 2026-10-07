import {readFile} from 'node:fs/promises';
import {thaw,project} from '../app/model.mjs';
const path=process.argv[2];if(!path)throw Error('Usage: npm run replay -- <frozen-export.json>');
console.log(JSON.stringify(project(await thaw(JSON.parse(await readFile(path,'utf8')))),null,2));
