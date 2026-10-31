/**
 * SPAM-MUSUBI-002
 * Compost a user-pasted, untrusted message into content-free QA recipes.
 * NO SPAM VERDICT, IDENTITY INFERENCE, NETWORK REQUEST, OR REUSE OF PAYLOAD.
 */
export const MUSUBI_SCHEMA = 'abundent/spam-musubi-recipe/v0';
export const MAX_INPUT = 5000;

function safeCount(number) { return Math.min(999, number); }

export function compost(raw) {
  if (typeof raw !== 'string' || raw.length > MAX_INPUT) {
    throw new TypeError('Enter up to 5,000 characters of text.');
  }
  const input = raw.trim();
  if (!input) throw new TypeError('Paste some text before testing.');

  const lines = input.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const normalized = lines.map(x => x.toLocaleLowerCase());
  const repeats = lines.length - new Set(normalized).size;
  const links = [...input.matchAll(/(?:https?:\/\/|www\.)[^\s<>"']+/gi)].length;
  const chars = [...input].filter(c => /[A-Za-z]/.test(c));
  const uppercase = chars.filter(c => c >= 'A' && c <= 'Z').length;
  const highCaps = chars.length >= 18 && uppercase / chars.length > 0.8;
  const longText = input.length > 1200;

  const signals = [];
  if (links >= 2) signals.push({ id: 'MULTIPLE_LINK_SHAPES', count: safeCount(links) });
  if (repeats >= 2) signals.push({ id: 'REPEATED_LINES', count: safeCount(repeats) });
  if (highCaps) signals.push({ id: 'MOSTLY_CAPS', count: null });
  if (longText) signals.push({ id: 'LONG_TEXT', count: null });

  // We only save test recipes, never pasted contents, URLs, quoted insults,
  // contact identifiers, usernames, hashes, or exact timestamps.
  const recipes = [{
    id: 'PLAYFUL_HUMAN_FALSE_POSITIVE',
    question: 'Can an off-topic joke or strange question remain welcome without being mistaken for a bot?',
    expected: 'Allow clarification; never punish on strangeness alone.',
  }];
  if (links >= 2) recipes.push({
    id: 'LINK_BURST_REVIEW',
    question: 'Can the receiver avoid making repeated link-shaped input public before review?',
    expected: 'Hold link-bearing display for independent, revocable human review. Do not follow links.',
  });
  if (repeats >= 2) recipes.push({
    id: 'DUPLICATE_COLLAPSE',
    question: 'Can repeated submissions be grouped without erasing distinct legitimate speakers?',
    expected: 'Suggest a duplicate cluster for review, not a ban or identity inference.',
  });
  if (highCaps) recipes.push({
    id: 'LOUD_IS_NOT_ABUSIVE',
    question: 'Can shouty formatting be handled without presuming hostile intent?',
    expected: 'Preserve access; offer format improvements without downgrading the human.',
  });
  if (longText) recipes.push({
    id: 'LONG_MESSAGE_FAIRNESS',
    question: 'Can large messages be bounded without losing the right to make a real request?',
    expected: 'Offer a shorter path and preserve a separate opt-in review route.',
  });
  return {
    schema: MUSUBI_SCHEMA,
    status: 'LOCAL_HYPOTHESIS_ONLY',
    input: 'DISCARDED_FROM_OUTPUT',
    content_retained: false,
    signals,
    recipes,
    disposition: 'NO_AUTOMATED_VERDICT',
    moderation: 'HUMAN_REVIEW_REQUIRED',
    identity: 'NOT_INFERRED',
    publish: 'NOT_AUTHORIZED',
    block: 'NOT_AUTHORIZED',
    contact: 'NOT_AUTHORIZED',
    note: 'This observes formatting patterns, not whether a person is a troll, bot, malicious, or sincere.',
  };
}

export function printableRecipes(recipe) {
  if (!recipe || recipe.schema !== MUSUBI_SCHEMA) throw new TypeError('Invalid recipe.');
  return [
    'SPAM MUSUBI · LOCAL TEST RECIPE · NOT A VERDICT',
    ...recipe.recipes.map((r, i) => `${i + 1}. ${r.id}: ${r.question} Expected: ${r.expected}`),
    'Untrusted source text and URLs not copied. No automated action authorized.',
  ].join('\n');
}
