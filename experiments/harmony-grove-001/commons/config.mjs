// SAFE DEFAULT. No live endpoint, captcha site key, or third-party traffic.
// After separate review: reverse-proxy /api/giving-tree-commons to a dedicated Edge Function.
// Keep request origin same-site, and set the corresponding trusted-origin/backend controls.
export const GATEWAY='';
export const TURNSTILE_SITE_KEY='';
