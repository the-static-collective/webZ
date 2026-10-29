// RECURSIVE-WORKSHOP-001: source-informed, offline, proposal-only capability-growth cards.
// It does not parse CAD or G-code and never starts a printer, robot, network or machine.
import {createHash} from 'node:crypto';

export const SOURCE_DOORS=Object.freeze([
  {owner:"STATIC OS",role:"actual OCCT CAD → STL → generic virtual-profile PrusaSlicer G-code; no print",source:"https://github.com/the-static-collective/static-os/pull/61",status:"UNMERGED_SOFTWARE_DEMONSTRATION"},
  {owner:"STATIC OS",role:"ten declared printer families; actual machine selection and signed proposal remain held",source:"https://github.com/the-static-collective/static-os/pull/66",status:"UNMERGED_PROPOSAL"},
  {owner:"GHoT",role:"read-only printer organ and native held proposal",source:"https://github.com/the-static-collective/GHoT/pull/102",status:"UNMERGED_PROPOSAL"},
  {owner:"GHoT × STATIC OS × reLATTE",role:"real native cross-repo G-code/owner-world verification, R3_HOLD; no device contact",source:"https://github.com/the-static-collective/GHoT/pull/105",status:"UNMERGED_SOFTWARE_DEMONSTRATION"},
  {owner:"STATIC OS Robot Garden",role:"synthetic inspection and cold replay; no real camera or motion",source:"https://github.com/the-static-collective/static-os/pull/68",status:"UNMERGED_SYNTHETIC_INSPECTION"},
  {owner:"PENNY",role:"read-only printer-status and physical-evidence capture tooling; CI inputs synthetic",source:"https://github.com/the-static-collective/Jubilee-treasury/pull/21",status:"UNMERGED_EVIDENCE_TOOL"},
  {owner:"CANNON",role:"separate source-pinned culture-artifact execution; not robot fabrication",source:"https://github.com/the-static-collective/CANNON/pull/37",status:"UNMERGED_CULTURAL_EXECUTION"}
]);

const CANDIDATES=Object.freeze({
  arm:{
    label:"Next hand: supervised light-duty arm candidate",
    purpose:"Explore a modular, human-supervised lightweight handling tool; not an autonomous robot.",
    potentially_printable:["structural links (new CAD and stress analysis required)","gripper shell","sensor/electronics covers","alignment and calibration jigs"],
    not_printed_by_ordinary_fff:["servos or stepper motors and drivers","bearings, axles and rated fasteners","wiring, end-stops and controller","electrical supply, fuse and emergency stop"],
    tests:["actual measured fit and dimensional tolerance","load/deflection test under competent supervision","motion envelope, pinch-point and emergency-stop check","independent human observer of one bounded supervised task"]
  },
  body:{
    label:"Next body: a local workshop enclosure candidate",
    purpose:"Explore a modular frame, case and workbench mounting system for an independently operated node.",
    potentially_printable:["protective electronics housing (non-safety-rated)","panel brackets and cable guides","tool holders","assembly gauges and labels"],
    not_printed_by_ordinary_fff:["approved mains and battery power equipment","computer, router, motors or processor","rated metal load-bearing members where needed","wiring, connectors and fire-safe enclosure components"],
    tests:["actual part fit with named substituted hardware","heat/ventilation and wiring review","independent power and emergency-shutdown assessment","operator can repair and remove modules safely"]
  },
  printer:{
    label:"Next tool: printer fixture and calibration kit",
    purpose:"Explore a removable tool/bed fixture; not a self-built or automatically commissioned new printer.",
    potentially_printable:["non-critical mount adapter (fit to be measured)","spool holder or guide, if compatible","part measurement gauge","storage tray for tested replacement pieces"],
    not_printed_by_ordinary_fff:["hot end, heaters, temperature sensors and certified power","motion rails, bearings and safe motors","controller board and firmware","manufacturer-specific calibrated print profile"],
    tests:["physical compatibility and safe-clearance measurement","machine owner checks mounting and material requirements","safe supervised test coupon, separately approved","independent inspection of completed physical part"]
  },
  outreach:{
    label:"Next invitation: public-safe paper and display fixture",
    purpose:"A low-risk optional Still Here / community-table presentation accessory, never a support-service intake device.",
    potentially_printable:["card holder","blank sign stand","simple booklet display fixture","portable labeling jig"],
    not_printed_by_ordinary_fff:["paper, printed text and actual accessible copies","appropriate non-print alternatives","qualified safeguarding and service relationships","any consent to collect personal or survivor records"],
    tests:["accessibility and readability review","no sensitive content, location or participant records","owner authorization for an actual event/display","independent review that a prototype implies no staffed service"]
  }
});

export const GOALS=Object.freeze(Object.keys(CANDIDATES));

function immutableCard(goal) {
  if(typeof goal!=="string" || !Object.hasOwn(CANDIDATES,goal))
    throw new RangeError("Choose one defined goal: "+GOALS.join(", "));
  const part=CANDIDATES[goal];
  const card={
    schema:"abundent/recursive-workshop-proposal-v1",
    version:"2026-10-29.1",
    goal,
    label:part.label,
    purpose:part.purpose,
    potentially_printable:[...part.potentially_printable],
    not_printed_by_ordinary_fff:[...part.not_printed_by_ordinary_fff],
    proposed_independent_tests:[...part.tests],
    source_ownership:"Original source repositories retain ownership; these URLs are evidence doors, not automatically executed dependencies.",
    sources:SOURCE_DOORS.map(s=>({...s})),
    gates:[
      "identify a real consenting owner/steward and inspect actual inventory and use rights",
      "verify CAD/STEP/STL and machine-specific profile and material for one particular part",
      "qualified operator separately authorizes and supervises exactly one machine-local job",
      "inspect real output with measurements, photographs if permitted and independent review",
      "human assembly and safety tests before any robot movement or public use",
      "second independent operator reproduces declared function before blueprint promotion"
    ],
    proposed_outcome:"PROPOSAL_ONLY_HOLD",
    evidence:{
      original_software_proof:"SEPARATE_SOURCE_PR_AND_CI_EVIDENCE",
      actual_printer_connected:false,
      machine_owner_authenticated:false,
      gcode_for_this_new_goal_verified:false,
      print_job_authorized:false,
      physical_part_printed:false,
      robot_assembled:false,
      physical_function_witnessed:false,
      independent_second_build:false,
      community_or_service_deployed:false
    },
    effects:{
      dispatch_job:false,
      actuate_robot:false,
      reserve_material:false,
      debit_inventory:false,
      mint_value:false,
      send_correspondence:false,
      enroll_partner:false,
      open_survivor_intake:false
    },
    independent_boundary:"A signed plan is not a physical object. A printed bracket is not a working arm. One built tool is not a reproducible blueprint. No automatic actuation or custody follows this card."
  };
  const content_sha256_integrity_only=createHash("sha256").update(JSON.stringify(card)).digest("hex");
  return {...card,content_sha256_integrity_only};
}
export function proposeNextCapability(goal="arm"){return immutableCard(goal);}
