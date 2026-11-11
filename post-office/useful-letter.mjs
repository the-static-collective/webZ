/**
 * POST OFFICE 005: evidence-gated owner correspondence.
 * Source criteria: public, attributable releases and maintainer-labelled issues.
 * Each invocation selects events from the last COMPLETE UTC calendar day.
 * No user-provided recipient or copy. No AI-generated assertions.
 */
import { createHash } from 'node:crypto';

export const WATCH_REPOS = Object.freeze(['webZ', 'JAR-VIS', 'GRAFT']);
export const SENDER = 'The Static Collective <us@abundent.org>';
export const REPLY_TO = 'us@abundent.org';
export const BASE = 'https://api.github.com/repos/the-static-collective/';
export const FRONT_DOOR = 'https://webz-field-porch-theotherlucasv-1250s-projects.vercel.app/';

export function previousUtcDay(now) {
  if (!(now instanceof Date) || Number.isNaN(now.valueOf())) throw new TypeError('Invalid time');
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const start = end - 86_400_000;
  return { start: new Date(start), end: new Date(end), label: new Date(start).toISOString().slice(0, 10) };
}
const within = (stamp, day) => {
  const t = typeof stamp === 'string' ? Date.parse(stamp) : NaN;
  return Number.isFinite(t) && t >= day.start.getTime() && t < day.end.getTime();
};
const title = raw => String(raw || '').replace(/[\r\n\t\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 140);
function sourceUrl(url, repo, family) {
  if (typeof url !== 'string') return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:' || u.hostname !== 'github.com' || u.port || u.username || u.password) return null;
    const pieces = u.pathname.split('/').filter(Boolean);
    if (pieces[0] !== 'the-static-collective' || pieces[1] !== repo || pieces[2] !== family) return null;
    if (family==='issues' && (pieces.length!==4 || !/^\d+$/.test(pieces[3]||''))) return null;
    if (family==='releases' && (pieces.length!==5 || pieces[3]!=='tag' || !pieces[4] || pieces[4].length>120)) return null;
    return u.origin + u.pathname;
  } catch { return null; }
}
async function publicJson(fetchImpl, url) {
  const response = await fetchImpl(url, {
    headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': 'Static-Collective-Post-Office/005' },
    signal: AbortSignal.timeout(9000),
  });
  if (!response.ok) throw new Error('GitHub read returned HTTP ' + response.status);
  const json = await response.json();
  if (!Array.isArray(json)) throw new Error('Unexpected GitHub response');
  return json;
}
function releaseSignals(items, repo, day) {
  return items.filter(x => x && !x.draft && !x.prerelease && within(x.published_at, day))
    .map(x => ({kind:'release', repo, description:title(x.name || x.tag_name),
      href:sourceUrl(x.html_url,repo,'releases'), sort:x.published_at}))
    .filter(x => x.description && x.href);
}
function issueSignals(items, repo, day) {
  return items.filter(x => x && !x.pull_request && within(x.updated_at, day) &&
    Array.isArray(x.labels) && x.labels.some(l => (typeof l === 'string' ? l : l?.name) === 'post-office-letter'))
    .map(x => ({kind:'owner-attention',repo, description:title(x.title),
      href:sourceUrl(x.html_url,repo,'issues'), sort:x.updated_at}))
    .filter(x => x.description && x.href);
}
async function checkSite(fetchImpl, url=FRONT_DOOR) {
  for (let i=0; i<2; i++) {
    try {
      const res=await fetchImpl(url, { method:'GET', redirect:'manual', signal:AbortSignal.timeout(7000) });
      if (res.status === 200) return null;
    } catch { /* second confirmation attempt follows */ }
  }
  return { kind:'health', repo:'webZ', description:'The public webZ front door failed two independent HTTP checks', href:url, sort: '' };
}
export async function collectSignals({fetchImpl=fetch, now=new Date(), repos=WATCH_REPOS, healthCheck=true}={}) {
  const day=previousUtcDay(now);
  let evidenceReads=0;
  const promises=[];
  for (const repo of repos) {
    if (!WATCH_REPOS.includes(repo)) continue;
    promises.push((async()=>{
      try {
        const releases=await publicJson(fetchImpl,BASE+encodeURIComponent(repo)+'/releases?per_page=25');
        evidenceReads++;
        return releaseSignals(releases,repo,day);
      } catch { return []; }
    })());
    promises.push((async()=>{
      try {
        const issues=await publicJson(fetchImpl,BASE+encodeURIComponent(repo)+'/issues?state=all&labels=post-office-letter&since='+encodeURIComponent(day.start.toISOString())+'&per_page=25');
        evidenceReads++;
        return issueSignals(issues,repo,day);
      } catch { return []; }
    })());
  }
  const results=await Promise.all(promises);
  const health=healthCheck ? await checkSite(fetchImpl) : null;
  const candidates=results.flat().concat(health ? [health] : []);
  const deduped=Array.from(new Map(candidates.map(x=>[x.kind+':'+x.href,x])).values());
  const signals=deduped.sort((a,b)=>String(a.sort).localeCompare(String(b.sort))).slice(0,5);
  return { day:day.label, signals, evidenceReads, healthIncluded:Boolean(health) };
}
export function composeLetter({day,signals}) {
  if (!signals.length) return null;
  const headline=signals.length===1 ? 'One thing worth a look' : signals.length+' things worth a look';
  const lines=['A note from the Static Collective Post Office.','','There is something worth bringing to the table.',''];
  for(const s of signals){
    const why=s.kind==='release' ? 'A declared release was published.' :
      s.kind==='owner-attention' ? 'A maintainer marked this public issue for owner attention.' :
      'The public return door did not respond normally twice.';
    const next=s.kind==='release' ? 'Decide whether to share or build on it.' :
      s.kind==='owner-attention' ? 'Decide the smallest useful next action.' :
      'Inspect the live deployment and repair if confirmed.';
    lines.push('['+s.repo+'] '+s.description,'Why it matters: '+why,'Next: '+next,s.href,'');
  }
  lines.push('This letter is a source-linked signal, not an automatic commitment.',
    'No sensitive records or contact lists are included. Reply to us@abundent.org if you want to pick up a thread.',
    'Quiet days mean no letter.');
  return { from:SENDER, reply_to:REPLY_TO, subject:'The Static Collective — '+headline+' ('+day+')', text:lines.join('\n') };
}
export function dailyIdempotency(day) {
  return createHash('sha256').update('static-post-office-useful-v005:owner:'+day).digest('hex');
}
