import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inspectData,parseCSV,parseJSON,IntakeError} from '../public/labs/earth-intake-001/model.mjs';
const csv='record_id,observed_at,latitude,longitude,value,unit,notes\r\n'
  +'a,2026-01-01T10:00:00Z,44.0,-93.9,7,items,"found litter, near a drain"\r\n'
  +'a,2026-01-03T10:00:00Z,999,-94.1,8,items,"possible duplicate"\r\n'
  +'b,not-a-date,44.1,-94.0,nope,items,"nothing identifying"\r\n';
test('CSV quoted comma, CRLF and complete field counts',()=>{
 const parsed=parseCSV(csv);
 assert.equal(parsed.rows.length,3);
 assert.equal(parsed.rows[0].notes,'found litter, near a drain');
 const report=inspectData(csv,'csv');
 assert.equal(report.totalRows,3);
 assert.equal(report.columns.find(c=>c.name==='record_id').possibleDuplicates,1);
 assert.equal(report.columns.find(c=>c.name==='latitude').invalid,1);
 assert.equal(report.columns.find(c=>c.name==='observed_at').invalid,1);
 assert.equal(report.columns.find(c=>c.name==='value').invalid,1);
 assert.equal(report.columns.find(c=>c.name==='notes').requiresPrivacyReview,true);
 assert.equal(report.rawDataIncluded,false);
 assert.equal(report.uploaded,false);
 assert.doesNotMatch(JSON.stringify(report),/near a drain|not-a-date|44\.0|-93\.9|possible duplicate/);
});
test('flat JSON with mixed fields is profiled, no source values leaked',()=>{
 const report=inspectData(JSON.stringify([{objectid:123,latitude:44.1},{objectid:124,longitude:-93.7}]),'json');
 assert.equal(report.totalRows,2);
 assert.equal(report.columns.find(c=>c.name==='longitude').missing,1);
 assert.equal(report.columns.find(c=>c.name==='objectid').possibleDuplicates,0);
 assert.equal(report.partnerApproval,false);
});
test('fail closed on malformed, oversized, nested and ambiguous CSV',()=>{
 for(const s of ['a,b\n"unclosed,2','a,b\n"quoted"x,b','a,a\n1,2','a,b\n1','']) assert.throws(()=>parseCSV(s),IntakeError);
 assert.throws(()=>parseCSV('x\n'+'a'.repeat(1_000_001)),IntakeError);
 assert.throws(()=>parseJSON('{"bad":"shape"}'),IntakeError);
 assert.throws(()=>parseJSON('[{"geometry":{"x":1}}]'),IntakeError);
 assert.throws(()=>inspectData('hello','xml'),IntakeError);
});
test('offline interface has no automatic upload, location access or tracking',()=>{
 const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
 const app=read('../public/labs/earth-intake-001/app.mjs');
 const html=read('../public/labs/earth-intake-001/index.html');
 assert.match(html,/Independent, unsponsored experimental tool/);
 assert.match(html,/FICTIONAL EXAMPLE/);
 assert.match(html,/id="open"/);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|sendBeacon|WebSocket|localStorage|sessionStorage|geolocation/i);
 assert.doesNotMatch(html,/<(?:iframe|form)\b|<script[^>]+src="https?:/i);
});
