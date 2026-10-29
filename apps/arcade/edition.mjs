// TIMEBACK-CREATIVE-001: a standalone, self-contained, private 6×9 HTML proof.
// This is an Abundent print projection, NOT publication by the lemonPRESS source owner.
import {makeCreativeCarry,verifyCreativeCarry} from "./source-carry.mjs";
export function escapeEditionHtml(value){
  return String(value).replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}
export function makePocketEdition(topic="",index=0){
  const packet=makeCreativeCarry(topic,index,"lemonpress");
  if(!verifyCreativeCarry(packet)||packet.nativeContract.status!=="forming")
    throw new TypeError("HOLD: edition preparation not admitted.");
  const title=escapeEditionHtml(packet.createdFrom.title);
  const text=escapeEditionHtml(packet.createdFrom.artifact);
  const note=escapeEditionHtml(packet.createdFrom.note);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">'+
    '<meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>'+title+' · Private Pocket Edition</title>'+
    '<style>body{background:#f9f3e9;color:#262126;font:18px/1.75 Georgia,serif;max-width:720px;margin:40px auto;padding:24px}'+
    'header{border-bottom:2px solid #514452;padding-bottom:15px}h1{font-size:39px;line-height:1.1;margin:10px 0}'+
    'pre{font:17px/1.8 Georgia,serif;white-space:pre-wrap;overflow-wrap:anywhere;padding:22px 0}'+
    'footer{border-top:1px solid #877e82;font-size:12px;padding-top:15px}'+
    '@page{size:6in 9in;margin:.7in}@media print{body{margin:0;padding:0;background:#fff}footer{break-inside:avoid}}</style>'+
    '</head><body><header><p>THREE BELLS / A VERY SMALL BOOK</p><h1>'+title+'</h1>'+
    '<p>PRIVATE PRINT PROOF · NOT PUBLISHED</p></header><main><pre>'+text+'</pre></main>'+
    '<footer>'+note+'<br>lemonPRESS-style edition preparation: FORMING / ADMISSION PENDING.'+
    '<br>No publication, rights review, external service or contact was performed.</footer></body></html>\n';
}
