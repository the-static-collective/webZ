// Abundent Link Wallet 001. No passwords, links or keys sent to a server.
export const WALLET_SCHEMA="abundent.link-wallet/v1";
const CONTENT_SCHEMA="abundent.link-wallet-contents/v1";
const ITERATIONS=600000;
const encoder=new TextEncoder(),decoder=new TextDecoder("utf-8",{fatal:true});
const CONTEXT=encoder.encode("ABUNDENT-LINK-WALLET-V1");
export const SCOPES=["owner","reviewer","submitter","invite","public","other"];
const fail=s=>{throw Error(s)};
function b64(bytes){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function from64(s,max){
 if(typeof s!=="string"||!/^[A-Za-z0-9_-]+$/.test(s)||s.length>max)fail("Invalid encrypted wallet encoding.");
 let bytes;try{bytes=Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_/g,"/")+"=".repeat((4-s.length%4)%4)),c=>c.charCodeAt(0))}
 catch{fail("Invalid encrypted wallet encoding.")}
 if(b64(bytes)!==s)fail("Invalid encrypted wallet encoding.");
 return bytes;
}
function exact(o,keys){if(!o||typeof o!=="object"||Array.isArray(o)||Object.keys(o).sort().join("|")!==[...keys].sort().join("|"))fail("Unsupported or unexpected wallet fields.")}
function label(s,min,max){if(typeof s!=="string")fail("Missing text field.");const v=s.trim().replace(/\s+/g," ");if(v.length<min||v.length>max)fail("Title, label, or note length is invalid.");return v}
export function cleanLink(s){
 if(typeof s!=="string"||s.length>2048||/\s|[\u0000-\u001f\u007f]/.test(s))fail("Enter a full HTTPS link with no spaces.");
 let u;try{u=new URL(s)}catch{fail("Invalid link.")}
 if(u.protocol!=="https:"||u.username||u.password||!u.hostname||u.hostname.endsWith("."))fail("Only HTTPS links without embedded usernames/passwords are supported.");
 if(u.href.length>2048)fail("Link exceeds 2,048 characters.");
 return u.href;
}
export function cleanEntry(e){
 exact(e,["id","title","url","scope","group","note","createdAt"]);
 if(typeof e.id!=="string"||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(e.id))fail("Invalid link ID.");
 if(!SCOPES.includes(e.scope)||typeof e.createdAt!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(e.createdAt)||!Number.isFinite(Date.parse(e.createdAt)))fail("Invalid link role or creation date.");
 return {id:e.id,title:label(e.title,2,80),url:cleanLink(e.url),scope:e.scope,
 group:label(e.group,0,48),note:label(e.note,0,180),createdAt:e.createdAt};
}
export function createEntry({title,url,scope,group="",note=""},at=new Date().toISOString()){
 return cleanEntry({id:crypto.randomUUID(),title,url,scope,group,note,createdAt:at});
}
export function validateEntries(entries){
 if(!Array.isArray(entries)||entries.length>200)fail("Wallet supports at most 200 links.");
 const ids=new Set();
 return entries.map(e=>{const v=cleanEntry(e);if(ids.has(v.id))fail("Duplicate link ID.");ids.add(v.id);return v});
}
export function validateEnvelope(v){
 exact(v,["schema","kdf","iterations","salt","iv","ciphertext","revision","updatedAt"]);
 if(v.schema!==WALLET_SCHEMA||v.kdf!=="PBKDF2-SHA256/AES-256-GCM"||v.iterations!==ITERATIONS||
 typeof v.revision!=="string"||!/^[a-f0-9]{32}$/.test(v.revision)||
 typeof v.updatedAt!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(v.updatedAt)||!Number.isFinite(Date.parse(v.updatedAt)))fail("Unsupported or invalid wallet envelope.");
 if(from64(v.salt,32).length!==16||from64(v.iv,24).length!==12||
 from64(v.ciphertext,330000).length<16||JSON.stringify(v).length>340000)fail("Wallet encryption fields are invalid.");
 return v;
}
export async function keyFromPassphrase(pass,salt){
 if(typeof pass!=="string"||pass.length<12||pass.length>200)fail("Use a 12–200 character passphrase; it cannot be recovered.");
 const input=await crypto.subtle.importKey("raw",encoder.encode(pass),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:ITERATIONS,hash:"SHA-256"},
  input,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function encrypt(entries,key,salt){
 const content=encoder.encode(JSON.stringify({schema:CONTENT_SCHEMA,entries:validateEntries(entries)}));
 if(content.byteLength>220000)fail("Wallet too large.");
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv,additionalData:CONTEXT},key,content);
 const revision=Array.from(crypto.getRandomValues(new Uint8Array(16)),x=>x.toString(16).padStart(2,"0")).join("");
 return validateEnvelope({schema:WALLET_SCHEMA,kdf:"PBKDF2-SHA256/AES-256-GCM",
  iterations:ITERATIONS,salt:b64(salt),iv:b64(iv),ciphertext:b64(new Uint8Array(cipher)),
  revision,updatedAt:new Date().toISOString()});
}
export async function newWallet(pass){
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await keyFromPassphrase(pass,salt);
 return {key,entries:[],envelope:await encrypt([],key,salt)};
}
export async function unlockWallet(envelope,pass){
 const valid=validateEnvelope(envelope),key=await keyFromPassphrase(pass,from64(valid.salt,32));
 let clear;try{
  const bytes=await crypto.subtle.decrypt({name:"AES-GCM",iv:from64(valid.iv,24),additionalData:CONTEXT},
   key,from64(valid.ciphertext,330000));
  clear=JSON.parse(decoder.decode(bytes));
 }catch{fail("Incorrect passphrase or damaged encrypted wallet.")}
 exact(clear,["schema","entries"]);
 if(clear.schema!==CONTENT_SCHEMA)fail("Unsupported wallet contents version.");
 return {key,envelope:valid,entries:validateEntries(clear.entries)};
}
export async function sealWallet(entries,key,previous){
 validateEnvelope(previous);
 return encrypt(entries,key,from64(previous.salt,32));
}
export async function rekeyWallet(entries,pass){
 const fresh=await newWallet(pass);
 return {...fresh,entries:validateEntries(entries),envelope:await sealWallet(entries,fresh.key,fresh.envelope)};
}
