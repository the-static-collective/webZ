// RIVER-GATE-001 • source-pinned real geography, no live data ingestion.
// Geocoded POINTS ARE APPROXIMATE PUBLIC PARK REFERENCES, not access points.
// Reviewed public source snapshot: October 24, 2026. No affiliations asserted.
export const SNAPSHOT_COMMIT='eda1444fea2141adff257d5e48976e59a72ef968';
export const SNAPSHOT_DATE='2026-10-24';
export const REGION='Mankato, Minnesota · United States';
export const SOURCE_CARDS=Object.freeze({
  bridge:{label:'CITY OF MANKATO / KERN BRIDGE',url:'https://city.mankatomn.gov/streetprojects/updates/130',scope:'Municipal construction updates, last checked October 24, 2026'},
  opening:{label:'KEYC / SCHEDULED OCTOBER 27 OPENING',url:'https://www.keyc.com/2026/10/14/city-mankato-announces-opening-date-kern-bridge-over-blue-earth-river/',scope:'Oct 14 report of planned Oct 27 at 1 p.m. ceremony, not live access confirmation'},
  dnr:{label:'MINNESOTA DNR / WATERSHED HEALTH',url:'https://www.dnr.state.mn.us/whaf/index.html',scope:'Public framework, not park-specific measurements in this app'},
  explorer:{label:'MINNESOTA DNR / WHAF EXPLORER',url:'https://whaf-explorer.dnr.state.mn.us/index.html',scope:'Original map explorer, opens independently'},
  mpca:{label:'MPCA / WATERSHED APPROACH',url:'https://www.pca.state.mn.us/air-water-land-climate/watershed-approach-to-water-quality',scope:'Statewide program explanation; not a verified local condition'},
  river:{label:'MINNESOTA DNR / RIVER MAPS',url:'https://www.dnr.state.mn.us/state-water-trails/minnesota-river/segments-maps.html',scope:'Regional hydrology and public information, not water-access permission'},
  eco:{label:'BLUE EARTH PROJECT / ORIGINAL ECOMAPPER',url:'https://blueearthproject.org/',scope:'Independently operated original game and mapping program'},
  adopt:{label:'BLUE EARTH PROJECT / ADOPT A DRAIN',url:'https://blueearthproject.org/adopt-a-drain/',scope:'Original independent enrollment, reporting and safety rules; no data passes from Abundent'}
});
const site=(data)=>Object.freeze({
  kind:'river-gate.public-place-reference/v0',
  geocode_provenance:'BigGeo geocode_address lookup on 2026-10-24; approximate named-park reference, not entrance, field report, survey or official environmental sampling station',
  trusted_for_navigation:false,task_authorized:false,environmental_condition_verified:false,
  ...data
});
export const PLACES=Object.freeze([
 site({
  id:'sibley',name:'Sibley Park',sub:'THE FIRST SHORE',icon:'◉',
  latitude:44.1615061,longitude:-94.0329562,areaLabel:'900 Mound Avenue · Mankato',
  summary:'A city park at the Blue Earth and Minnesota river area, with walking trails and landscaped areas.',
  source:{label:'CITY OF MANKATO / SIBLEY PARK',url:'https://www.mankatomn.gov/about-mankato/parks-trails-and-recreation/community-parks/sibley-park'},
  questions:['What changes as you look from a garden toward the river?', 'What can a park trail reveal without entering the water?'],
  prompt:'What could a safe, accessible public-landscape observation teach people about this riverside park?',
  humanGate:'Visit only open public portions and established paths. No cleanup, sample collection or construction-area access is authorized.',
  mark:'SIBLEY / PUBLIC PARK REFERENCE'
 }),
 site({
  id:'land-of-memories',name:'Land of Memories Park',sub:'THE CROSSING',icon:'✳',
  latitude:44.157163,longitude:-94.041402,areaLabel:'Amos Owen Lane · Mankato (approximate geocode)',
  summary:'Park beside the Blue Earth–Minnesota river confluence. The new Kern Bridge is planned to connect it with Sibley Park.',
  source:{label:'CITY OF MANKATO / LAND OF MEMORIES CAMPGROUND IN PARK',url:'https://www.mankatomn.gov/about-mankato/parks-trails-and-recreation/campground'},
  questions:['How can one pedestrian crossing change who can appreciate a river?', 'How do we distinguish a construction announcement from an open route?'],
  prompt:'What would help neighbors learn about the Kern Bridge crossing while respecting its real opening and any site closures?',
  humanGate:'The Oct 24 source snapshot did not establish an open Kern Bridge. Verify official current access before travelling or attempting any crossing. Park geocode is not bridge access.',
  mark:'LAND OF MEMORIES / APPROXIMATE REFERENCE'
 }),
 site({
  id:'riverfront',name:'Riverfront Park',sub:'THE LONG VIEW',icon:'⌁',
  latitude:44.1750397,longitude:-94.0007376,areaLabel:'309 West Rock Street · Mankato',
  summary:'A city park with a scenic overlook of the Minnesota River, trails, public space and an event area.',
  source:{label:'CITY OF MANKATO / RIVERFRONT PARK',url:'https://www.mankatomn.gov/about-mankato/parks-trails-and-recreation/community-parks/riverfront-park'},
  questions:['What can a public overlook teach without implying a water-quality measurement?', 'How does a river connect different neighborhoods and histories?'],
  prompt:'How might a public educational story help people understand the river and distinguish observation from environmental data?',
  humanGate:'Observe from open public areas only. Parks can have event-related closures. No river entry or sampling is part of this invitation.',
  mark:'RIVERFRONT / PUBLIC PARK REFERENCE'
 })
]);
export const PLACE_BY_ID=Object.freeze(Object.fromEntries(PLACES.map(p=>[p.id,p])));
export const WAYS=Object.freeze([
 {id:'observe',name:'NOTICE & LEARN',icon:'◉',type:'READ_OR_OBSERVE',
  description:'Read an original public source, then consider an optional, non-invasive observation from an open public path.',
  disclaimer:'Seeing litter, water coloration or debris is not proof of a contaminant, hazard level, source or successful cleanup.'},
 {id:'connect',name:'ASK THE STEWARD',icon:'✳',type:'VOLUNTARY_ENQUIRY',
  description:'Ask a safe question or learn about an existing organization-led program, without enrolling or making a pledge through this site.',
  disclaimer:'Blue Earth Project participation requires its own enrollment and safety rules. A link is not an endorsement or agreement.'},
 {id:'return',name:'TAKE A FIELD NOTE',icon:'✎',type:'PRIVATE_REFLECTION',
  description:'Record your own question or reflection as a private, explicitly unverified local note; never as official data.',
  disclaimer:'Notes stay on this device until you deliberately download them. They do not verify an event, a source, or environmental impact.'}
]);
export const WAY_BY_ID=Object.freeze(Object.fromEntries(WAYS.map(w=>[w.id,w])));
