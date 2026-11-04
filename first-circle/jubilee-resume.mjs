// Re-entry variations for complete field kits, never evidence of a real event.
const variants=Object.freeze({
"20-minute music corner":["10-minute music round","00–01 welcome; 01–04 performer-chosen permitted music; 04–06 optional listening response; 06–09 repeat one passage only with permission; 09–10 close. No performance was confirmed."],
"One-pot community soup · eight bowls":["Bean salad for two · complete alternative","INGREDIENTS: one can cooked beans, one chopped tomato, dressing if available, optional seasoning. METHOD: Drain and rinse beans, mix with tomato and dressing, serve promptly, and refrigerate leftovers. Check dietary needs and food handling. No meal was made."],
"45-minute field table":["15-minute micro-table agenda","00–03 welcome; 03–05 name one realistic local task; 05–11 perform one reversible action or paper simulation; 11–13 separate observed work from proposals; 13–15 close. No venue is booked."],
"15-minute sound and room preflight":["10-minute one-mic fallback","00–03 check visible cable safety with gear off; 03–06 an authorized operator tests one microphone at safe volume; 06–08 agree a stop cue; 08–10 choose an acoustic fallback if needed. No sound equipment has been tested."],
"15-minute equipment triage table":["Exact observation record","Equipment model: [if known]. Expected: [owner description]. Observed: [only what occurred]. Warnings: [not observed or describe]. Status: unresolved. Do not open unsafe gear. Give the report to its owner for review; no repair is claimed."],
"30-minute useful-work circle":["10-minute facilitation round","00–02 voluntary welcome; 02–04 ask what small work is possible now; 04–08 perform that work or a paper test; 08–09 distinguish completion and proposal; 09–10 close. No partner or volunteer is enrolled."],
"12-minute skill-sharing session":["6-minute teaching round","00–01 select a low-risk skill; 01–03 demonstrate three steps; 03–04 optional repeat-back; 04–05 correct one confusing step without dropping safety warnings; 05–06 summarize and close. No class is confirmed."],
"15-minute first rehearsal":["8-minute second paper round","00–02 choose an observable goal; 02–04 substitute a free resource; 04–06 rehearse one reversible action on paper; 06–08 record observed paper results and remaining unknowns. No field event is presumed."]
});
export function resumePreparedKit(title) {
 if(typeof title!=="string"||!Object.prototype.hasOwnProperty.call(variants,title))return null;
 const [name,body]=variants[title];
 return {title:name,body,status:"BOUNDED_GUIDE"};
}
