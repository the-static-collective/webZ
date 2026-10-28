// PUBLIC seed references only. Personal edits/recipient choices belong in the encrypted local vault.
// Source objects may have evolved since this snapshot; no draft is proof of sending.
import {allDoors,draftFor} from "../network/model.mjs";
import {firstInquiry} from "../locus/model.mjs";
const sourceBase="https://github.com/the-static-collective/";
function splitLetter(letter){const match=/^Subject:\s*(.+?)\n\s*\n([\s\S]*)$/i.exec(letter.trim());return match?{subject:match[1].trim(),body:match[2].trim()}:{subject:"Draft — review subject",body:letter.trim()};}
function seed(id,group,title,letter,source,{to="",kind="SOURCE_DRAFT",note="",status="DRAFT"}={}){return Object.freeze({id,group,title,...splitLetter(letter),to,kind,source,note,origin:"PUBLIC_OR_RECONSTRUCTED_SEED",status,sentEvidence:"",sentAt:""});}
const institution=allDoors.map(d=>seed("bridge-"+d.id,"Institutions",d.name,draftFor(d.id),sourceBase+"webZ/blob/main/bridge/network/model.mjs",{note:"Prospective institution only; check deadline, eligibility and actual recipient. Not sent by this project."}));
const local=[
seed("shelf-wansc","Food & Care","Waseca food shelf — first question",firstInquiry("shelf"),sourceBase+"webZ/blob/main/bridge/locus/model.mjs",{to:"director@wasecaservicecenter.org",note:"Public organizational address requires recheck; no recipient permission or field operation."}),
seed("shelf-coop","Food & Care","Waseca cooperative / MSU food rescue inquiry",firstInquiry("coop"),sourceBase+"webZ/blob/main/bridge/locus/model.mjs",{note:"No specific recipient identified; do not assume course or co-op affiliation."}),
seed("msyou-bryan","Campus & Civic","MSU Mankato — Bryan technical follow-up",`Subject: Good meeting you at the Greater Mankato Coalition gathering — community infrastructure experiments

Hi Bryan,

It was good meeting you at the Coalition gathering on Saturday. I appreciated your interest in what we've been exploring around community grocery organizing and practical tools for connecting people and local projects.

I put together a small, independent field lab to make the technology easier to inspect: https://github.com/the-static-collective/MSyoU

The idea is straightforward: lightweight needs/offers/question cards, deliberate human handoffs, and source-linked project continuity rather than another centralized social platform. The repo has a runnable local demo, a brief architectural map, and a proposed tiny field pilot. It's explicitly not an MSU project or a request for institutional access.

I'd be interested in your technical perspective—especially what would make one community-to-community handoff genuinely useful, testable, and responsibly managed.

Thanks again for coming over to connect,
Lu`,sourceBase+"MSyoU/blob/main/docs/CONTACT-NOTE.md",{note:"Public source labels it NOT SENT. Recheck preferred name, meeting context and recipient channel."}),
seed("still-here-cada","Survivor Support","CADA — independent safeguarding review",`Subject: Request for Guidance — Community Survivor Peer-Support Initiative

Hello,

I'm developing a small, community-based peer-support initiative in southern Minnesota for adults experiencing isolation following relationship abuse, particularly fathers who may struggle to find appropriate support.

The initiative is called Still Here, and we are currently developing its founding structure.

Before inviting participants, I want to ensure the group is designed responsibly, with appropriate safeguards for privacy, confidentiality, and facilitation.

Would someone on your community education team be willing to discuss our proposed approach briefly, or recommend someone qualified to review a fictional practice session?

We're not requesting access to survivor information or assuming an organizational partnership. We're simply hoping to learn from people with practical experience so that we can build something genuinely useful and safe.

Thank you for the work you do in our communities.

The Static Collective
us@abundent.org
https://abundent.org/`,sourceBase+"webZ/blob/main/api/post-office/outreach.js",{to:"info@cadamn.org",status:"HOLD",note:"A separately reviewed fixed envelope also exists in Post Office 007. Its actual provider send status is NOT synchronized here; inspect original operator panel/provider history. Never infer unsent or delivered from this catalog."}),
seed("porchlight-tpc","Housing & Exchange","The People Concern — method review inquiry",`Subject: Porchlight Commons — request for one provider-defined practical question

Hello,

I'm preparing a small, public-safe experiment for comparing organization-owned needs, possible resources and locally governed review steps. We're not offering shelter services or seeking resident records.

Would it be useful to hear one non-sensitive coordination difficulty your team thinks is worth investigating, or to learn where a source-backed method would be inappropriate?

This is a draft inquiry. No participation, referral, partnership or test is assumed.

The Static Collective / Abundent`,sourceBase+"webZ/blob/main/docs/PORCHLIGHT-COMMONS-001.md",{kind:"RECONSTRUCTED_TEMPLATE",note:"Original editable outreach was previously discussed; this is a newly reconstructed TEMPLATE, not a verified verbatim saved draft."}),
seed("porchlight-arcata","Housing & Exchange","Arcata House Partnership — method review inquiry",`Subject: Porchlight Commons — a source-backed method question

Hello,

I'm researching how independently governed providers could exchange non-sensitive practice ideas and explicitly refuse unsuitable resource offers without any client information crossing organizations.

Would someone at Arcata House Partnership be willing to identify one logistical question worth testing—or tell us why this approach would not help? We'd start only with published, fictional or otherwise approved examples.

No organizational affiliation or participation is implied.

The Static Collective / Abundent`,sourceBase+"webZ/blob/main/docs/PORCHLIGHT-COMMONS-001.md",{kind:"RECONSTRUCTED_TEMPLATE",note:"Reconstructed template, not the exact prior saved message."}),
seed("porchlight-humboldt","Housing & Exchange","Humboldt Housing & Homelessness Coalition — method review inquiry",`Subject: Porchlight Commons — provider-owned coordination question

Hello,

We're developing a small experiment in comparing independently owned, non-sensitive resource coordination methods without centralizing personal housing records.

Could a coalition practitioner advise whether one particular inter-provider handoff is worth studying, or whether existing systems already address it? We'd respect local authority and any decision not to participate.

This is an unsent exploratory draft, not a partnership request or claim.

The Static Collective / Abundent`,sourceBase+"webZ/blob/main/docs/PORCHLIGHT-COMMONS-001.md",{kind:"RECONSTRUCTED_TEMPLATE",note:"Reconstructed template; no identity, sponsorship, or prior contact claimed."}),
seed("kinship-radio","Music & Community","Kinship Christian Radio — useful needs / editorial inquiry",`Subject: A small volunteer-friendly needs desk for Kinship

Hello,

I've appreciated the chance to be involved with Kinship's volunteer work. I'm building simple, account-free tools that might help a station share specific public-safe volunteer needs, community music invitations, and follow-up tasks without adding an administrative burden.

Would it help to review a fictional one-page demonstration, or is there a different small task your team actually needs?

This is only an offer for feedback. Nothing is deployed for the station or approved as station programming.

The Static Collective / Abundent`,sourceBase+"webZ/blob/main/docs/JUBILEE-CIRCUIT-001.md",{kind:"RECONSTRUCTED_TEMPLATE",note:"A new starting template from prior Kinship field plans, not a verified original email draft."}),
seed("coalition-care","Campus & Civic","Coalition of Care — ask for one useful public-safe task",`Subject: Coalition of Care — one small piece of work we can return

Hello,

Following the Greater Mankato gathering, I'd be glad to help turn one agreed, public-safe request into a short summary, printable field card, prototype, or follow-up packet.

Rather than assume what the Coalition needs, could a coordinator choose one specific task and designate who should review the return? Nothing will be published or sent on the Coalition's behalf without approval.

The Static Collective / Abundent`,sourceBase+"webZ/blob/main/docs/BRIDGE-001.md",{kind:"RECONSTRUCTED_TEMPLATE",note:"Reconstructed from publicly described follow-up opportunities. Coordinator and appropriate email not established."}),
seed("benya-paper","Publishing","Benya — locally distributed newspaper and public-news experiment",`Subject: An optional local print + digital publishing experiment

Hello,

I've been building a small publishing workflow that could assemble a source-linked local story, email digest and low-cost printed edition without claiming newsroom approval or moving a publication's editorial authority.

I'd be interested in learning whether one specific story, distribution problem or production task could be useful to test. The newspaper would retain full editorial decisions, permissions and rights.

The Static Collective / Abundent`,sourceBase+"webZ/blob/main/docs/BRIDGE-001.md",{kind:"RECONSTRUCTED_TEMPLATE",note:"Reconstructed concept only, not verified verbatim prior draft or actual recipient information."})
];
export const catalog=Object.freeze([...institution,...local]);
export const originCounts=Object.freeze({institutionDrafts:institution.length,sourceOrReconstructed:local.length,total:catalog.length});
export function seedById(id){return catalog.find(x=>x.id===id);}
