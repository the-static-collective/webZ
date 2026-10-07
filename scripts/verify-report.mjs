import {readFile} from 'node:fs/promises';import {observe} from '../app/proof.mjs';
if(!process.argv[2])throw Error('Usage: node scripts/verify-report.mjs <sanitized-report.json>');
console.log(JSON.stringify(await observe(await readFile(process.argv[2],'utf8')),null,2));
