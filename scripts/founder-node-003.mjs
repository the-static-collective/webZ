#!/usr/bin/env node
/* Founder Node 003: explicit local two-key ceremony.
 * NO HTTP, server, payments, radio, auto-network, or repo modifications.
 */
import {readFileSync,writeFileSync,existsSync,lstatSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {
 newIdentity,publicOf,candidatePetition,founderAdmission,ownerAcceptance,
 makeBundle,ownerWithdrawal,verifyCharter,ACK
} from '../founder-node/founder.mjs';

function requireFlag(v,reason){if(!v)throw Error(reason);return v}
const [command,...raw]=process.argv.slice(2);
const opts={};for(let i=0;i<raw.length;i++){
 const key=raw[i];if(!/^--[a-z][a-z-]*$/.test(key)||Object.hasOwn(opts,key))throw Error('INVALID_ARGUMENT');
 if(key==='--approve-local-world'){opts[key]=true;continue}
 opts[key]=requireFlag(raw[++i],'MISSING_VALUE_'+key);
}
const get=key=>requireFlag(opts['--'+key],'REQUIRED_'+key);
function readPrivate(path){
 const p=resolve(path),st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||(st.mode&0o077))throw Error('PRIVATE_KEY_PERMISSIONS');
 if(st.size>12000)throw Error('PRIVATE_KEY_SIZE');
 return readFileSync(p,'utf8');
}
function readJSON(path){
 const p=resolve(path),st=lstatSync(p);
 if(!st.isFile()||st.isSymbolicLink()||st.size>512000)throw Error('INPUT_FILE_INVALID');
 return JSON.parse(readFileSync(p,'utf8'));
}
function save(path,value){
 const dest=resolve(path);
 mkdirSync(dirname(dest),{recursive:true,mode:0o700});
 // Exclusive creation: a failed request never overwrites an existing key or audit.
 writeFileSync(dest,typeof value==='string'?value:JSON.stringify(value,null,2)+'\n',
  {flag:'wx',mode:0o600});
}
function print(o){console.log(JSON.stringify(o,null,2));}
try{
 switch(command){
 case 'init':{
  const path=get('key');
  if(existsSync(resolve(path))||existsSync(resolve(path+'.pub.json')))throw Error('IDENTITY_EXISTS');
  const pair=newIdentity();save(path,pair.privatePem);save(path+'.pub.json',pair.public);
  print({status:'NEW_LOCAL_KEY',key_path:resolve(path),public_path:resolve(path+'.pub.json'),real_world_identity_verified:false});
  break;
 }
 case 'petition':{
  const proposal=get('proposal'),annex=readJSON(get('annex')),key=readPrivate(get('key'));
  const paper=await candidatePetition(annex,proposal,key);
  save(get('out'),paper);
  print({status:'CANDIDATE_PETITION_SIGNED',proposal,output:resolve(opts['--out']),private_reflection_in_output:false});
  break;
 }
 case 'admit':{
  if(opts['--approve-local-world']!==true)throw Error('EXPLICIT_FOUNDER_CHOICE_REQUIRED');
  const petition=readJSON(get('petition')),pin=readJSON(get('candidate-pin')),key=readPrivate(get('key'));
  const paper=founderAdmission(petition,pin,key,ACK);
  save(get('out'),paper);
  print({status:'FOUNDER_LOCAL_ADMISSION_SIGNED',output:resolve(opts['--out']),legal_title:false});
  break;
 }
 case 'accept':{
  const paper=ownerAcceptance(readJSON(get('petition')),readJSON(get('admission')),
   readPrivate(get('key')),readJSON(get('founder-pin')));
  save(get('out'),paper);
  print({status:'CANDIDATE_CUSTODY_ACCEPTED',output:resolve(opts['--out']),remote_world_created:false});
  break;
 }
 case 'bundle':{
  const packet=makeBundle(readJSON(get('petition')),readJSON(get('admission')),readJSON(get('acceptance')));
  save(get('out'),packet);
  print({status:'CHARTER_BUNDLE_ASSEMBLED',output:resolve(opts['--out']),signature_verification:'NOT_YET_CHECKED'});
  break;
 }
 case 'withdraw':{
  const paper=ownerWithdrawal(readJSON(get('bundle')),readPrivate(get('key')),readJSON(get('founder-pin')));
  save(get('out'),paper);
  print({status:'CANDIDATE_WITHDRAWAL_SIGNED',output:resolve(opts['--out'])});
  break;
 }
 case 'verify':{
  const projection=verifyCharter(readJSON(get('bundle')),{
   candidatePin:readJSON(get('candidate-pin')),
   founderPin:readJSON(get('founder-pin')),
   withdrawal:opts['--withdrawal']?readJSON(opts['--withdrawal']):null
  });
  if(opts['--out'])save(opts['--out'],projection);
  print(projection);
  break;
 }
 default:throw Error('USAGE: init|petition|admit|accept|bundle|withdraw|verify');
 }
}catch(e){console.error('FOUNDER_NODE_HOLD: '+e.message);process.exitCode=1}
