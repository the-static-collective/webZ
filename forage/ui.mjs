import {prepareForageDoor, coldVerifyForageDoor} from "./bridge.mjs";
const $ = id => document.getElementById(id);
const INPUTS = ["held", "lead", "evidence", "photo"];
let current = null;
let generation = 0;

function reset() {
  generation++;
  current = null;
  $("result").hidden = true;
  $("message").textContent = "";
  $("public-text").textContent = "";
  $("digest").textContent = "";
}
for (const id of INPUTS) $(id).addEventListener("change", reset);
$("consent").addEventListener("change", reset);

async function readJSON(id) {
  const selected = $(id).files?.[0];
  if (!selected) throw Error("MISSING_" + id.toUpperCase() + "_INPUT");
  if (selected.size < 3 || selected.size > 524288) {
    throw Error("JSON_INPUT_SIZE_LIMIT_512_KIB");
  }
  const value = JSON.parse(await selected.text());
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw Error("ORIGINAL_RECORD_OBJECT_REQUIRED");
  }
  return value;
}
async function inputs() {
  const file = $("photo").files?.[0];
  if (!file || file.size < 12 || file.size > 16 * 1024 * 1024) {
    throw Error("LOCAL_ORIGINAL_JPEG_OR_PNG_UNDER_16_MIB_REQUIRED");
  }
  const [groHeld, lead, photoEvidence, buffer] = await Promise.all([
    readJSON("held"), readJSON("lead"), readJSON("evidence"),
    file.arrayBuffer(),
  ]);
  return {groHeld, lead, photoEvidence, originalPhotoBytes: new Uint8Array(buffer)};
}
function download(name, value) {
  const file = new Blob([JSON.stringify(value, null, 2) + "\n"],
                        {type: "application/json"});
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.download = name;
  a.href = url;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

$("prepare").addEventListener("click", async () => {
  const mine = ++generation;
  current = null;
  $("result").hidden = true;
  $("message").textContent = "Checking original photo and GrO HOLD locally…";
  try {
    if ($("consent").checked !== true) {
      throw Error("REVIEW_AND_CONSENT_BEFORE_PUBLIC_PROPOSAL");
    }
    const original = await inputs();
    const options = {...original, consent: true};
    const prepared = await prepareForageDoor(options);
    await coldVerifyForageDoor(options, prepared);
    if (mine !== generation) return; // import changed while hashing
    current = prepared;
    $("public-text").textContent = prepared.public_text;
    $("digest").textContent = "WEBZ proposal hash: " + prepared.proposal.id +
      " · " + prepared.proposal.byte_length + " bytes" +
      " · source fingerprint may be correlated across exports.";
    $("result").hidden = false;
    $("message").textContent = "Ready for your review. Not published or delivered.";
  } catch (err) {
    if (mine === generation) {
      $("message").textContent = "HOLD — " + String(err?.message || err);
    }
  }
});
$("copy").addEventListener("click", async () => {
  if (!current) return;
  const toCopy = current.public_text;
  try {
    if (!navigator.clipboard?.writeText) throw Error("Clipboard API unavailable");
    await navigator.clipboard.writeText(toCopy);
    $("message").textContent = "Public text copied by your request. Paste manually in the WEBZ porch.";
  } catch {
    $("message").textContent = "Clipboard unavailable. Select the displayed public text manually.";
  }
});
$("download").addEventListener("click", () => {
  if (current) download("webz-gro-forage-unsigned-proposal.json", current);
});
$("clear").addEventListener("click", () => {
  reset();
  $("consent").checked = false;
  for (const id of INPUTS) $(id).value = "";
  $("message").textContent = "Inputs cleared from this page. Previously downloaded files remain under your control.";
});
