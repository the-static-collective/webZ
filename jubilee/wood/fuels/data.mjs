// FUEL COMMONS 006 · researched PROCESS PATHWAYS, NOT stocks, guarantees, operating banks, or agreements
export const REVIEWED_ON="2026-10-28";
export const BANKS=[
  {
    "id": "edible",
    "name": "Edible surplus",
    "bank": "FOOD / PRIORITY",
    "examples": "Safe unsold groceries, surplus produce, prepared food under appropriate food-safety handling",
    "status": "FOOD FIRST — NOT A FUEL",
    "route": "Food rescue → inspected nonprofit or food shelf → people",
    "value": "Nutrition and food security",
    "source": "https://www.epa.gov/sustainable-management-food/wasted-food-scale",
    "risk": "Food safety, storage, recipient consent",
    "energy": false,
    "eligible": "food_rescue"
  },
  {
    "id": "scraps",
    "name": "Inedible food scraps",
    "bank": "ORGANICS / FEEDSTOCK",
    "examples": "Unavoidable kitchen scraps, expired inedible produce, food-processing residues",
    "status": "PROCESSING REQUIRED",
    "route": "Source-separated organics → authorized compost or anaerobic-digestion operator → compost or qualified biogas → rated energy equipment",
    "value": "Compost/soil products; facility biogas for heat or electricity",
    "source": "https://www.epa.gov/anaerobic-digestion/basic-information-about-anaerobic-digestion",
    "risk": "Contamination, transport, permits, methane leaks, hydrogen sulfide; gas cleanup",
    "energy": true,
    "eligible": "licensed_digester"
  },
  {
    "id": "cooking_oil",
    "name": "Used cooking oil",
    "bank": "OILS / REFINER FEEDSTOCK",
    "examples": "Restaurant fry oil / yellow grease, segregated from petroleum oils",
    "status": "REFINERY REQUIRED",
    "route": "Restaurant owner → legitimate collector/processor → fuel meeting specification → explicitly compatible approved burner",
    "value": "Biodiesel feedstock or other industrial reuse",
    "source": "https://afdc.energy.gov/fuels/biodiesel-production",
    "risk": "Do not put raw fryer oil in a biodiesel-only burner; process involves industrial chemicals; equipment/blend compatibility",
    "energy": true,
    "eligible": "biodiesel_refiner"
  },
  {
    "id": "manure",
    "name": "Farm manure / organic residues",
    "bank": "AGRICULTURAL / FEEDSTOCK",
    "examples": "Manure and suitable uncontaminated agricultural organics",
    "status": "SPECIALIST FACILITY",
    "route": "Authorized farm → permitted digester → conditioned biogas → certified generator/boiler; compliant digestate handling",
    "value": "Heat, electrical power, nutrient recovery",
    "source": "https://www.pca.state.mn.us/sites/default/files/wq-f8-54.pdf",
    "risk": "Feedlot and digestate rules; methane/hydrogen sulfide; professional handling",
    "energy": true,
    "eligible": "licensed_digester"
  },
  {
    "id": "clean_wood",
    "name": "Clean, dry firewood",
    "bank": "SOLID / READY FUEL IF VERIFIED",
    "examples": "Legally sourced, adequately seasoned, untreated wood",
    "status": "FUEL QUALITY + ROUTE CHECK",
    "route": "Owner → dry/quality check → county/quarantine legality → authorized local fuel bank or supplier → approved solid-fuel appliance",
    "value": "Space heating in appropriately rated appliances",
    "source": "https://www.mda.state.mn.us/plants-insects/firewood-information",
    "risk": "Wood pests/quarantine, moisture, chimney fire and emissions; future green wood is NOT current fuel",
    "energy": true,
    "eligible": "approved_wood_vendor"
  },
  {
    "id": "crop_residue",
    "name": "Clean crop and wood-processing residues",
    "bank": "BIOMASS / INDUSTRIAL INPUT",
    "examples": "Clean agricultural residues or sawmill offcuts with uncontaminated provenance",
    "status": "PROCESSING + FUEL SPECIFICATION",
    "route": "Owner → sorting/legality review → industrial pellet/chip/fuel processor → rated boiler at approved receiving facility",
    "value": "Potential biomass heat where equipment/quality standards permit",
    "source": "https://www.epa.gov/burnwise/choosing-wood-burning-appliances",
    "risk": "Unknown binders, paint, moisture, dust, airborne emissions; not ad hoc household fuel",
    "energy": true,
    "eligible": "approved_biomass_processor"
  },
  {
    "id": "plastic",
    "name": "Old plastic bags / films",
    "bank": "MATERIALS RECOVERY — NOT HOUSEHOLD FUEL",
    "examples": "Plastic grocery bags and mixed plastic packaging",
    "status": "NO COMMUNITY COMBUSTION",
    "route": "Reduce/reuse → retailer film collection where accepted → qualified plastics recycler; industrial chemical conversion research only if professionally licensed",
    "value": "Materials recovery, not fuel for a home boiler",
    "source": "https://www.epa.gov/plastics/advanced-recycling-plastics",
    "risk": "Do NOT burn plastic, improvise pyrolysis, or feed home heaters. Harmful fumes, additives, air permits, unknown product quality.",
    "energy": false,
    "eligible": "qualified_recycler"
  },
  {
    "id": "used_motor_oil",
    "name": "Used motor / hydraulic oil",
    "bank": "HAZARDOUS OR REGULATED WASTE",
    "examples": "Automotive and machinery lubricants, distinct from cooking oil",
    "status": "REGULATED — DO NOT MIX",
    "route": "Generator → regulated used-oil recycler; industrial energy recovery only where permitted and specifically rated",
    "value": "Material recovery through qualified handlers",
    "source": "https://www.revisor.mn.gov/rules/7045.0845/",
    "risk": "Never mix with cooking oil or pour into ordinary home heating equipment. Minnesota used-oil rules apply.",
    "energy": false,
    "eligible": "regulated_oil_recycler"
  },
  {
    "id": "solar",
    "name": "Surplus solar electricity / heat",
    "bank": "ENERGY STORE — NOT FUEL",
    "examples": "Measured excess PV output or professionally collected solar thermal energy",
    "status": "NOT FUEL; MEASURED ENERGY",
    "route": "Metered surplus → compatible controller → electric battery or thermal storage → qualified endpoint",
    "value": "Electrical load shifting or thermal storage",
    "source": "https://www.energy.gov/energysaver/solar-energy",
    "risk": "Electrical ratings, storage protection, winter availability, anti-islanding; don't infer surplus from weather",
    "energy": true,
    "eligible": "approved_energy_controller"
  }
];
export const RESTRICTIONS=Object.freeze({
 home_plastic_fuel:"REJECTED — no domestic plastic burning or DIY pyrolysis.",
 raw_oil_in_burner:"REJECTED — used cooking oil is feedstock, not certified biodiesel.",
 food_to_fuel:"HOLD — edible food has a preferred food-rescue pathway.",
 mixed_waste:"REJECTED — never combine incompatible or hazardous feedstocks.",
 unverified_transfer:"HOLD — authorization, quality, legal movement, receiver, and equipment required."
});
export function evaluateBank(id,{receiverAuthorized=false,sourceOwnerConsent=false,feedstockVerified=false,permitsChecked=false,endpointCompatible=false}={}){
 const bank=BANKS.find(b=>b.id===id);
 if(!bank)throw new Error("Unknown material lane.");
 if(["plastic","used_motor_oil"].includes(id))return{status:"NON-HOUSEHOLD-FUEL",why:bank.risk,action:bank.route,unverified:true};
 if(id==="edible")return{status:"FOOD-RESCUE-PRIORITY",why:"Nourishment precedes energy extraction.",action:bank.route,unverified:true};
 const gates={sourceOwnerConsent,receiverAuthorized,feedstockVerified,permitsChecked,endpointCompatible};
 const missing=Object.entries(gates).filter(([,v])=>v!==true).map(([k])=>k);
 if(missing.length)return{status:"HOLD / RESEARCH ONLY",why:"No material or fuel can cross just because a pathway exists.",missing,action:bank.route,unverified:true};
 return{status:"READY FOR INDEPENDENT HUMAN REVIEW — NOT DISPATCHED",why:"Checkboxes are self-attested and not independently verified. Receiver still decides; no storage, transfer, or combustion is authorized here.",action:bank.route,unverified:true};
}
export function publicResearchSlip(id){
 const b=BANKS.find(x=>x.id===id);if(!b)throw Error("Unknown input");
 return [
 "FUEL COMMONS 006 · UNSENT RESEARCH SLIP",
 "RESOURCE: "+b.name, "CLASS: "+b.bank, "CURRENT STATUS: "+b.status,
 "POSSIBLE PATHWAY (NOT ARRANGED): "+b.route,"PRIMARY VALUE: "+b.value,
 "RESTRICTIONS / QUESTIONS: "+b.risk,"SOURCE: "+b.source,
 "PUBLIC PAGE, NO INTAKE OR INVENTORY. NO ORGANIZATION OR MATERIAL HAS BEEN ENROLLED.",
 "Before any crossing: check rightful ownership; preserve usable food; confirm authorized processor/receiver;",
 "verify material quality, permits, delivery legality, rated fuel/appliance compatibility, safety, emissions, and independent acceptance.",
 "Do not include household addresses, clients, health status, or private commercial terms.",
 "STATUS: UNVERIFIED / UNSENT / NOT A PARTNERSHIP"
 ].join("\n");
}
