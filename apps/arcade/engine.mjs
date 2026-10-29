// FINITE-DELIGHT-001. Local, reproducible, three-card visit; no feed or reward optimization.
export const LIMIT=3;
const openings=[
  "A haunted toaster formed a tiny brass band.",
  "The elevator filed a formal complaint about gravity.",
  "A cardboard spaceship successfully crossed the living room.",
  "The coffee machine opened an extremely small art museum.",
  "A folding chair ran for mayor of the moon.",
  "A pocket-sized parade marched through a library."
];
const endings=[
  "Its admission policy: no one has to earn a break.",
  "The grand prize was getting your afternoon back.",
  "Everybody was welcome to leave whenever they liked.",
  "The entire festival lasted one comfortable breath.",
  "Afterward, the whole machine politely switched itself off.",
  "Nobody was required to become a member of anything."
];
function topicOf(input){
  if(typeof input!=="string"||input.length>160)throw new RangeError("Topic out of bounds.");
  const s=input.replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim();
  if(s.length>120)throw new RangeError("Topic out of bounds.");
  return s||"a little room to breathe";
}
function seed(s){
  let h=2166136261;
  for(const c of s){h^=c.codePointAt(0);h=Math.imul(h,16777619)>>>0;}
  return h;
}
export function threeGifts(input=""){
  const topic=topicOf(input),n=seed(topic);
  return [
    Object.freeze({id:"wonder",title:"A tiny, strange postcard",kind:"01 / WONDER · MADE-UP STORY",
      artifact:"A VERY SMALL PARADE\n\n"+openings[n%6]+"\n\nThe day's special subject was: "+topic+".\n\n"+endings[Math.floor(n/6)%6]+"\n\n— Fiction, made for this moment.",
      note:"A little creative text. No real-world event or result is claimed."}),
    Object.freeze({id:"relief",title:"One small next step",kind:"02 / RELIEF · PRIVATE WORK CARD",
      artifact:"ONE SMALL NEXT STEP\n\nOn my mind: "+topic+"\n\nWrite one sentence describing the smallest useful finished version.\n\nIdentify one fact or permission that must be confirmed.\n\nDo not wait for someone else's response to enjoy your day.\n\n— Suggested draft, not completed work.",
      note:"A local draft. No resources, partner agreement or human permission were verified."}),
    Object.freeze({id:"invitation",title:"A no-pressure invitation",kind:"03 / CONNECTION · UNSENT DRAFT",
      artifact:"A LITTLE OPEN CHAIR\n\nI'm exploring an idea about "+topic+".\n\nIf this connects to something you're already doing, I'd be interested in one thought whenever it's convenient.\n\nNo meeting, obligation or reply expected.\n\n— Unsent draft. Nothing has been delivered.",
      note:"This is only draft language. Sending is always a separate human choice."})
  ];
}
export function giftAt(input,index){
  if(!Number.isSafeInteger(index)||index<0||index>=LIMIT)throw new RangeError("The visit has only three cards.");
  return threeGifts(input)[index];
}
export function textFor(gift){
  if(!gift||!["wonder","relief","invitation"].includes(gift.id)||typeof gift.artifact!=="string")throw new TypeError("Invalid card.");
  return gift.artifact+"\n\n"+gift.note+"\n";
}
