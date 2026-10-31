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

const nexusInvitations=[
seed("nexus-coalition-deb-2026","Nexus / Learning Team","Nexus — Coalition organizer invitation",`Subject: Nexus learning cohort — could we shape a Waseca / Mankato idea together?

Hi Deb,

I've been thinking about the Coalition of Care gathering and how to turn some of those connections into one piece of useful economic work. The next day I attended the Waseca Area Food Cooperative meeting, and I keep seeing a possibility between the Coalition's collaborative approach and the co-op's community-ownership work.

Nexus Community Partners has a Greater Minnesota Community Wealth Building cohort with six learning sessions and a $7,000 stipend for selected groups. The application deadline is November 6.

What if a few willing people explored a small learning team around cooperative food purchasing, local growers, and possible institutional buyers, including churches if that proves useful? I've prepared a one-page conversation starter, but I would much rather have other people help decide what the question should be.

Would you be open to a short conversation this weekend or early next week, or suggest who might be interested? This is an independent invitation, not a request for a Coalition endorsement or commitment.

Thanks,
Lu`,sourceBase+"webZ/blob/main/bridge/outbox/catalog.mjs",{kind:"NEW_PUBLIC_TEMPLATE",note:"Public-safe draft only. Confirm Nexus program details and correct recipient channel before sending. Attach separate one-page overview if appropriate. No Coalition endorsement or team membership claimed."}),
seed("nexus-waseca-coop-2026","Nexus / Learning Team","Nexus — Waseca cooperative listening invitation",`Subject: Could the Nexus community wealth-building cohort help with Waseca's next co-op question?

Hi [name],

I appreciated the chance to learn about the Waseca Area Food Cooperative at the October 25 meeting. I have been considering how the co-op's work could connect with interested growers, neighbors, and institutions in the wider region, without changing who owns the co-op or makes its decisions.

I found a Nexus Community Partners learning cohort for Greater Minnesota groups exploring shared ownership and cooperative economics. Selected groups receive a $7,000 stipend and attend six learning sessions. Applications close November 6.

I have a rough one-page idea about cooperative purchasing, producer relationships, and potential institutional participation, but I'd much rather ask what question would actually help the co-op now. Would you be willing to take a look and give me fifteen minutes of feedback? And if a small learning team made sense, who should be part of shaping it?

This is an independent exploration, not a proposal made on the co-op's behalf.

Thanks,
Lu`,sourceBase+"webZ/blob/main/bridge/outbox/catalog.mjs",{kind:"NEW_PUBLIC_TEMPLATE",note:"Public-safe draft only. Replace [name], verify contact and current co-op priorities. No co-op endorsement, membership agreement or institutional commitment. Attach one-pager separately."}),
seed("nexus-coalition-mark-2026","Nexus / Learning Team","Nexus — Coalition contact / potential learning partner",`Subject: A practical cooperative-economics idea — would you help test the question?

Hi Mark,

I've kept thinking about the Coalition of Care gathering and the possible work that could come out of it. I went to the Waseca Area Food Cooperative meeting the next day, and the two conversations are starting to connect.

Nexus Community Partners is recruiting Greater Minnesota groups for a community wealth-building learning cohort. The program covers cooperative ownership, economic development, and governance, with six sessions and a $7,000 stipend for selected groups. The application deadline is November 6.

I'm exploring whether a small team could investigate one concrete opportunity: connecting a willing local producer, a community-owned grocery effort, and perhaps an institutional purchaser, with people retaining control of their own decisions and work.

I don't want to assume a team exists or that this is the right project. Would you have time to critique a one-page starting idea, and possibly discuss whether you'd want to participate or recommend someone who would?

Thanks,
Lu`,sourceBase+"webZ/blob/main/bridge/outbox/catalog.mjs",{kind:"NEW_PUBLIC_TEMPLATE",note:"Public-safe draft only. Verify which Mark is intended and a suitable contact channel; no offer of participation assumed. Nexus details and session commitment require reconfirmation."}),
seed("nexus-ashley-church-2026","Nexus / Learning Team","Nexus — church food purchasing and co-op exploration",`Subject: A small Waseca cooperative idea — could I get your perspective?

Hi Ashley,

I've been looking at a Greater Minnesota learning opportunity through Nexus Community Partners. It focuses on community-owned economic activity, and I've been thinking about the Waseca Area Food Cooperative and how local institutions might support a community grocery in ways that are more lasting than a one-time fundraiser.

One idea worth exploring is whether interested churches could help create a dependable local purchasing relationship, support co-op membership under the co-op's own rules, or simply host conversations that connect producers and neighbors. No church or co-op has agreed to any of this; I'm at the listening stage.

Nexus is accepting group applications by November 6 for a learning cohort with a $7,000 stipend for selected groups. Would you be willing to tell me whether the idea seems useful, or suggest who understands the church's food purchasing and community-outreach work? No commitment is being requested.

Thanks,
Lu`,sourceBase+"webZ/blob/main/bridge/outbox/catalog.mjs",{kind:"NEW_PUBLIC_TEMPLATE",note:"Public-safe draft only. Confirm Ashley is the appropriate contact and don't imply church authorization. Distinguish exploration from team invitation; no member voting rights assumed."})
];
// PUBLIC templates only: owner-specific contact details and final edits belong in the encrypted local vault.

export const catalog=Object.freeze([...institution,...local,...nexusInvitations]);
export const originCounts=Object.freeze({institutionDrafts:institution.length,sourceOrReconstructed:local.length,total:catalog.length});
export function seedById(id){return catalog.find(x=>x.id===id);}
