// JAR;VIS café handoffs: no storage, accounts, automatic submission or remote delivery.
// A question becomes a URL fragment only when the visitor explicitly chooses to share it.
export const HANDOFF_KINDS = Object.freeze(['auto','question','invitation','door','song','plan']);
const contact = /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|(?:\+?1[- .]?)?\(?\d{3}\)?[- .]?\d{3}[- .]?\d{4}/;
export function shareableQuestion(question) {
  return typeof question === 'string' &&
    question.trim().length >= 8 && question.length <= 360 &&
    !/[\u0000-\u001f\u007f]/.test(question) && !contact.test(question);
}
export function makeHandoffLink(currentUrl, question, kind='auto') {
  if (!shareableQuestion(question)) throw Error('SHARING_REQUIRES_PUBLIC_SAFE_QUESTION');
  if (!HANDOFF_KINDS.includes(kind)) throw Error('UNKNOWN_RETURN_KIND');
  const url = new URL(currentUrl);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw Error('HTTPS_REQUIRED');
  url.pathname = '/'; url.search = '';
  url.hash = new URLSearchParams({q: question,kind}).toString();
  return url.toString();
}
export function readHandoff(hash) {
  if (typeof hash !== 'string' || hash.length > 2800 || !hash.startsWith('#')) return null;
  const values = new URLSearchParams(hash.slice(1));
  if ([...values.keys()].some(k=>!['q','kind'].includes(k))) return null;
  if (values.getAll('q').length !== 1 || values.getAll('kind').length>1) return null;
  const question = values.get('q') || '';
  const kind = values.get('kind') || 'auto';
  return shareableQuestion(question) && HANDOFF_KINDS.includes(kind) ? {question,kind} : null;
}
