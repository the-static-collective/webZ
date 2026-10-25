# WASECA GROCERY / INDEPENDENT SOCIAL IGNITION 001

**LIVE PUBLIC INVITATION:** https://kbhqacsdvjsstzyplqij.supabase.co/functions/v1/waseca-grocery

**State (October 25, 2026):** Independent, active, publicly reachable campaign. No official WAFC endorsement, co-op membership enrollment, co-op account administration, automated social posting, or verified official 1,000-member recruitment target.

## Core correction to Social Porch

Social media is **not the goal**. The goal is to discover and concentrate genuine community interest into an eventual lawful member/owner relationship, if the cooperative itself establishes and publishes a verified enrollment route. The participant hypothesizes that *around 1,000 members* would make organizers feel confident, but this is **not a verified target**. It must not appear as a published official threshold, current member count or promised outcome.

Unlike the Stage Two committee-oriented planning kit, this PUBLIC page requires no cooperative's permission to express an independently labeled opinion and invite a public conversation. It is explicitly not publishing *for* the cooperative. No donation, dues, signup or authority is implied. Once an official enrollment link and requirements are independently verified, a separate change can bridge interested participants to that **true** signup, without manufacturing members out of likes, clicks or informal interest.

## The already-built launch loop

1. **One independent public door.** Headline: “What if our next grocery belonged to us?” Honest Waseca co-op context cited to the October 22 Waseca County Pioneer reporting. Shares connect to one canonical public URL.
2. **One specific question.** Visitors select a priority—affordable basics, local growers, accessible store, or community connection—and optionally add a short public-safe thought.
3. **One deliberate transmission.** Pick “Make my neighbor invitation” for a composed, owner-voiced caption, or actively check consent and “Send this as a private suggestion.” Ordinary choice does not transmit anything. No hidden survey analytics.
4. **One human-moderated return.** The submitted suggestion uses the existing Garden's private `PENDING` ledger via same-origin Edge relay and an opt-in consent check. A random withdrawal capability is handed to the submitter; database saves only its hash. No auto-publication or member enrollment. The submission-and-withdrawal loop has not yet been proven in a live browser across devices.
5. **One outward share.** Native phone share sheet, exact copyable text, copyable permanent URL, Facebook sharer handoff, and a locally rendered square PNG via Canvas. Sharing requires the visitor's actual action. No platform accounts are connected. No automated commenting, mass DM, purchased follows, scraped audiences or referral tracking.
6. **One owned return channel.** Optional Abundent opt-in contact form `https://abundent.org/contact/?via=grocery` is separate from cooperative membership and expressly disclaims representing WAFC. Garden and First Yes links support a concrete next act.

## First public post (independently from a personal account)

> Waseca, what if our next grocery actually belonged to us?
>
> A community-owned grocery is being explored here. I think this is worth talking about *now*, while ordinary people can still influence what gets built.
>
> If we did it, what would matter most to you: affordable everyday groceries, local growers, access and transportation, or simply a good place to connect?
>
> I made a little independent doorway where you can answer in one click and pass it to one neighbor. No membership dues, no fundraising, no account required just to take a look.
>
> [PUBLIC LINK]
>
> This is an independent Static Collective / Abundent invitation, not the cooperative's official membership registration.

## Next two variations

**The invitation chain / one-to-one**
> I want to see whether we can connect ordinary Waseca neighbors around a possible community-owned grocery without making everybody join another committee. I'm starting with one question: what would you want from a store worth owning together? Answer here and invite one neighbor who'd have a different perspective: [PUBLIC LINK]. Independent conversation, not official membership.

**The contribution door / small useful act**
> A grocery can't be built out of Facebook likes. But a conversation might lead to a real decision, a producer interview, a practical accessibility question, or one useful volunteer action. If you have a question or a skill, here's a place to begin: [PUBLIC LINK]. We won't enroll or assign anybody on the strength of a comment. Independent Static Collective / Abundent invitation.

Use the public webpage for three built-in editable variations and a downloadable square image.

## How not to lose the membership objective

We have **not verified** a current official online WAFC membership form, ownership dues, signup price, or public member tally. The October 22 reporting describes opportunities to become a member at the October 25 event, not a permanent public enrollment endpoint. The invitation therefore clearly says **“Interested is not enrolled.”** An independent contact consent only permits follow-up from Abundent; it does not make someone a WAFC co-op owner. On obtaining an actual official enrollment URL, prefer a prominent, direct verified link **to the cooperative's own service**. Do not copy member data into our ledger or misstate membership conversions.

## What it actually means to reach 1,000 people

Treat “1,000 neighbors” as an **aspiration to start real independent conversations**, not a measured or authorized membership goal. Without opt-in analytics or independent confirmation, do not claim a numeric reach or participant count. Preserve what is actually known: reviewed consented questions, explicitly accepted contributions, confirmed producer relationships, and eventual official member signups counted by the cooperative itself.

## Infrastructure and verification

- Source `garden/waseca-grocery/index.html`, `edge/site.ts`, `edge/index.ts`.
- Supabase `waseca-grocery` Edge Function v1 ACTIVE, `verify_jwt=false`, public HTML confirmed via independent HTTPS read.
- Strict POST: exact same origin, 1400 byte bounded JSON, only four allowlisted grocery priorities, exact reviewed `kind=question` envelope and `consentToReview=true`, or holder-only withdrawal. Upstream Garden API does additional rate limiting, content checks and private RLS storage.
- No service-role credentials in this public function or browser. No automated social platform publication. OG text tags support link previews; no externally hosted share image currently exists, and some platforms may display only title/description.
- The short branded path on `abundent.org` remains a separate deployment need; the Garden Vercel site has hit a daily deployment API limit. Do not assume DNS forwarding in Porkbun affects the live site: `abundent.org` uses authoritative Cloudflare DNS.
- No measured participant count, social traffic count, actual membership enrollments, or end-to-end phone submission proof. No affiliation claims beyond what the official source confirms.

**Next social act:** an actual person opens the link, copies their own post, shares on their own Facebook feed or permissible local community group, invites real responses, and optionally asks consenting neighbors to pass it along. This does not need permission from the co-op; publishing as the co-op, using its member data or enrolling owners does.
