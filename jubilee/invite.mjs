export const ROLES=Object.freeze({song:"Bring a song or rhythm",host:"Host a field table",food:"Share food or kitchen skills",crew:"Bring festival production skills",tech:"Offer repair, energy or communications skills",steward:"Explore local stewardship",translate:"Translate or teach across cultures"});
const clean=(value,max)=>String(value??"").replace(/\s+/g," ").trim().slice(0,max);
export function prepareInvitation({role,region,offer,publicOnly}){
 if(publicOnly!==true)throw new Error("Confirm that the text is public and non-personal.");
 if(!Object.hasOwn(ROLES,role))throw new Error("Choose a valid participation role.");
 const place=clean(region,70),idea=clean(offer,240),whole=place+" "+idea;
 if(idea.length<12)throw new Error("Describe one concrete public idea (12 characters minimum).");
 if(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(whole)||/(?:\+?\d[\s().-]*){9,}/.test(whole)||/(?:guest name|client name|shelter address|street address|apartment number)\s*:/i.test(whole))throw new Error("Remove contact details or sensitive personal/location information.");
 return ["JUBILEE CIRCUIT 001 / DRAFT INVITATION","The road brings the feast.","","Participation: "+ROLES[role],"Broad region: "+(place||"Not specified"),"Public idea or offer: "+idea,"","Proposed only. No partner, event, song license, resource transfer or service has been confirmed.","A local steward must approve any work. An offer is not a receipt.","Creator permission and attribution are required before sharing songs.","","What is one useful thing we can do and independently verify?"].join("\n");
}