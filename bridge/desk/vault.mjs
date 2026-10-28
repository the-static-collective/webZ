// BRIDGE-LEDGER-004 encrypted, browser-local journal; separate custody from the Link Wallet.
import {emptyJournal,verifyJournal} from "./ledger.mjs";
export const ENVELOPE_SCHEMA="abundent/bridge-ledger-ciphertext-v1";
const CONTENT="ABUNDENT-BRIDGE-LEDGER-V1",ITERATIONS=600000;
const enc=new TextEncoder(),dec=new TextDecoder("utf-8",{fatal:true});
const context=enc.encode(CONTENT);
const fail=s=>{throw Error(s)};
function exact(o,keys){if(!o||typeof o!=="object"||Array.isArray(o)||Object.keys(o).sort().join("|")!==keys.slice().sort().join("|"))fail("Unexpected vault fields.")}
function b64(a){let s="";for(const b of a)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function decode(s,max){if(typeof s!=="string"||s.length>max||!/^[A-Za-z0-9_-]+$/.test(s))fail("Invalid encrypted encoding.");let a;try{a=Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4)),c=>c.charCodeAt(0))}catch{fail("Invalid encrypted encoding.")}if(b64(a)!==s)fail("Invalid encrypted encoding.");return a}
export function validateEnvelope(e){
 exact(e,["schema","kdf","iterations","salt","iv","ciphertext","revision","updatedAt"]);
 if(e.schema!==ENVELOPE_SCHEMA||e.kdf!=="PBKDF2-SHA256/AES-256-GCM"||e.iterations!==ITERATIONS||
  typeof e.revision!=="string"||!/^[a-f0-9]{32}$/.test(e.revision)||
  typeof e.updatedAt!=="string"||!Number.isFinite(Date.parse(e.updatedAt)))fail("Invalid encrypted journal envelope.");
 if(decode(e.salt,32).length!==16||decode(e.iv,24).length!==12||
  decode(e.ciphertext,580000).length<16||JSON.stringify(e).length>590000)fail("Encrypted journal is too large or damaged.");
 return e;
}
async function derive(pass,salt){
 if(typeof pass!=="string"||pass.length<12||pass.length>200)fail("Choose a 12–200 character passphrase.");
 const material=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt,iterations:ITERATIONS},material,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function seal(journal,key,salt){
 const verified=await verifyJournal(journal),plain=enc.encode(JSON.stringify(verified));
 if(plain.byteLength>400000)fail("Journal is too large for this vault.");
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:context},key,plain);
 return validateEnvelope({schema:ENVELOPE_SCHEMA,kdf:"PBKDF2-SHA256/AES-256-GCM",
 iterations:ITERATIONS,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(cipher)),
 revision:b64(crypto.getRandomValues(new Uint8Array(16))).replace(/[^a-f0-9]/g,"").padEnd(32,"0").slice(0,32),
 updatedAt:new Date().toISOString()});
}
function secureRevision(){return Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,"0")).join("")}
async function encrypted(journal,key,salt){
 const result=await seal(journal,key,salt);
 return {...result,revision:secureRevision()};
}
export async function createVault(pass){
 const salt=crypto.getRandomValues(new Uint8Array(16)),key=await derive(pass,salt),journal=emptyJournal();
 return {key,journal,envelope:await encrypted(journal,key,salt)};
}
export async function unlockVault(envelope,pass){
 const e=validateEnvelope(envelope),key=await derive(pass,decode(e.salt,32));
 let journal;
 try{
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:decode(e.iv,24),additionalData:context},key,decode(e.ciphertext,580000));
 journal=JSON.parse(dec.decode(plain));
 }catch{fail("Wrong passphrase or damaged journal backup.")}
 return {key,journal:await verifyJournal(journal),envelope:e};
}
export async function resealVault(journal,key,previous){
 const e=validateEnvelope(previous);
 return encrypted(journal,key,decode(e.salt,32));
}
