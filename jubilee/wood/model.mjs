// WINTER-WARMTH-001: no network, no secret intake, no verification claims.
export const WOOD_CARD_TYPES=Object.freeze({
"seasoned":"Already cut, split, and seasoned firewood",
"future":"Fresh-cut or unverified logs for future seasoning",
"arborist":"Professional tree service / insured arborist offer",
"steward":"Independent nonprofit or community site steward",
"transport":"Insured local delivery / warehouse help",
"equipment":"Dry storage / moisture meter / safety education",
"finance":"Support an authorized fuel vendor or Energy Assistance referral"
});
export const URGENCY=Object.freeze({
"now":"Urgent heat need (refer to local assistance immediately)",
"this-winter":"Potentially useful this winter if properly verified",
"next-winter":"Build safe inventory for next winter"
});
export const COUNTY_HINTS=["Waseca","Blue Earth","Steele","Rice","Nicollet","Le Sueur","Faribault","Freeborn","Mower","Other Minnesota county"];
function singleLine(value,max){return String(value??"").replace(/\s+/g," ").trim().slice(0,max)}
export function prepareWoodFieldCard({kind,county,condition,urgency,moisture,publicOnly}={}){
 if(publicOnly!==true)throw Error("Confirm this is a public, non-personal draft with no address or contact details.");
 if(!Object.hasOwn(WOOD_CARD_TYPES,kind))throw Error("Select a valid resource type.");
 if(!COUNTY_HINTS.includes(county))throw Error("Choose a broad Minnesota county.");
 if(!Object.hasOwn(URGENCY,urgency))throw Error("Select the timing.");
 if(!["tested-dry","unknown","green","not-applicable"].includes(condition))throw Error("Select an honest wood condition.");
 const value=singleLine(moisture,6),numbers=/^(?:\d{1,2}(?:\.\d)?|100(?:\.0)?)$/;
 if(value&& !numbers.test(value))throw Error("Moisture reading must be 0–100%, or left blank.");
 const moistureNumber=value?Number(value):null;
 if(moistureNumber!==null&&(moistureNumber<0||moistureNumber>100))throw Error("Moisture reading must be in range.");
 if(condition==="tested-dry" && (moistureNumber===null||moistureNumber>20))throw Error("A 'tested dry' card needs a moisture reading of 20% or less. Test a newly split face.");
 if(condition==="not-applicable"&&["seasoned","future"].includes(kind))throw Error("Wood supply must include wood condition.");
 if(!["seasoned","future"].includes(kind)&&condition!=="not-applicable")throw Error("Select 'not applicable' for non-wood offers.");
 const woodReadiness=(kind==="seasoned"&&condition==="tested-dry"&&moistureNumber<=20)?"POTENTIAL THIS-WINTER LEAD — source, pest quarantine, species, transport, quality, and steward approval still unverified.":(kind==="seasoned"||kind==="future")?"HOLD / FUTURE STOCK — NOT CURRENT HEATING FUEL. Season and independently test before any burn.":"NON-WOOD SUPPORT — does not establish an available fuel supply.";
 return [
 "WINTER WARMTH / FIELD CARD 001 / UNSENT PUBLIC DRAFT",
 "THIS IS NOT AN OFFER TO A SPECIFIC FAMILY, VERIFIED STOCK, OR A DELIVERED SERVICE.",
 "",
 "Proposed role: "+WOOD_CARD_TYPES[kind],
 "Broad county: "+county,
 "Intended timing: "+URGENCY[urgency],
 "Wood condition: "+condition,
 "Reported moisture: "+(moistureNumber===null?"NOT MEASURED":moistureNumber+"% (SELF-REPORTED; NOT VERIFIED)"),
 "Disposition: "+woodReadiness,
 "",
 "HUMAN STEWARD VERIFICATION / EVERY BOX OPEN",
 "[ ] Owner/land steward explicitly authorizes source and all proposed handling.",
 "[ ] Qualified insured tree professional, not amateur volunteers, handles standing, fallen-risk or storm-damaged trees.",
 "[ ] No painted, treated, glued, construction or suspect contaminated material.",
 "[ ] Check tree health and wood species; inspect pests and disease before movement.",
 "[ ] Minnesota Department of Agriculture quarantine and actual origin/destination rules checked for this exact wood.",
 "[ ] Properly seasoned fuel independently checked with an appropriate moisture meter (best <20%).",
 "[ ] Authorized receiver verifies stove suitability and accepts delivery privately.",
 "[ ] Handling, stacking, vehicles, safety equipment and insurance approved; no unapproved youth chainsaw activity.",
 "[ ] Confirm chimney/appliance maintenance and smoke/CO alarms with qualified help, without retaining household details here.",
 "[ ] Document independent completion separately; publicly report only non-identifying aggregate facts with consent.",
 "",
 "URGENT NEED? Do not wait on a draft or unseasoned wood. Minnesota Energy Assistance includes qualifying wood-fuel vendor payments.",
 "Waseca / nearby counties: Minnesota Valley Action Council 507-345-6822; call to confirm current funding and crisis options.",
 "https://www.mnvac.org/programs/energy/energy-assistance-eap-2/",
 "",
 "No personal information, addresses, contact details or private household fuel status are collected by this page."
 ].join("\n");
}
