import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveChoice} from '../commons/play.mjs';
const commons=readFileSync(new URL('../commons/index.html',import.meta.url),'utf8');
const playJS=readFileSync(new URL('../commons/play.mjs',import.meta.url),'utf8');
const jubilee=readFileSync(new URL('../jubilee/index.html',import.meta.url),'utf8');
const jubileeJS=readFileSync(new URL('../jubilee/main.mjs',import.meta.url),'utf8');

test('Commons offers real interaction before any need-identification form',()=>{
 assert.ok(commons.indexOf('id="play-title"')<commons.indexOf('id="entry-question"'));
 assert.ok(commons.indexOf('id="play-title"')<commons.indexOf('id="exchange-form"'));
 assert.match(commons,/<details class="optional-intake" id="start-draft">/);
 for(const action of ['ask','publish','deliver','leave'])assert.ok(commons.includes('data-play-action="'+action+'"'));
 for(const action of ['ask','publish','deliver']){const result=resolveChoice(action);assert.ok(result.text.length>50);assert.ok(result.script.length>30);}
 assert.equal(resolveChoice('leave').script,null);
 assert.equal(resolveChoice('__proto__'),null);
 assert.doesNotMatch(playJS,/\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage|\.submit\s*\(/);
});
test('Jubilee produces a copyable result before the composer is needed',()=>{
 assert.ok(jubilee.indexOf('id="jubilee-moment"')<jubilee.indexOf('id="invitation-form"'));
 assert.match(jubilee,/<div class="jubilee-moment" id="jubilee-moment" hidden/);
 for(const id of ['jubilee-moment-line','jubilee-moment-copy','jubilee-moment-personalize'])assert.ok(jubilee.includes('id="'+id+'"'));
 assert.match(jubileeJS,/showMoment\(seed\.line,seed\.next/);
 assert.match(jubileeJS,/showMoment\(text,/);
 assert.match(jubileeJS,/navigator\.clipboard\.writeText/);
 assert.doesNotMatch(jubileeJS,/\bfetch\s*\(|XMLHttpRequest|sessionStorage|localStorage/);
 assert.match(jubilee,/<input id="public-only" type="checkbox" required>/);
});
