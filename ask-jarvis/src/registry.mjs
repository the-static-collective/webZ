// Public source addresses, observed 2026-10-23. A source pin is not owner canon.
export const CAPABILITIES = Object.freeze([
  {
    "id": "jarvis",
    "name": "JAR;VIS",
    "repo": "JAR-VIS",
    "ref": "0a4f87938b9237ad439d9e58c3aecb276429a34d",
    "path": "README.md",
    "role": "Attention and bounded proposals",
    "tags": [
      "question",
      "ask",
      "agent",
      "automation"
    ]
  },
  {
    "id": "workbench",
    "name": "Workbench",
    "repo": "static-workbench",
    "ref": "53db559bbc510ad1003a0f8330d1673dcd04d7a0",
    "path": "README.md",
    "role": "Local operator desk; public handoff is draft-only",
    "tags": [
      "machine",
      "worker",
      "runtime",
      "workbench",
      "execute"
    ]
  },
  {
    "id": "tablelogic",
    "name": "TABLElogic",
    "repo": "TABLElogic",
    "ref": "55d7772ebc17155193a610294883551fbc543434",
    "path": "README.md",
    "role": "Encounter grammar; conceptual source",
    "tags": [
      "relation",
      "encounter",
      "table",
      "community"
    ]
  },
  {
    "id": "planz",
    "name": "planZ",
    "repo": "planZ",
    "ref": "dad6593c3718c65fa4bb7a3650af8fc80d060ce6",
    "path": "README.md",
    "role": "Plan census, archaeology and disposition",
    "tags": [
      "plan",
      "garden",
      "food",
      "produce",
      "project",
      "build",
      "organize"
    ]
  },
  {
    "id": "cannon",
    "name": "CANNON",
    "repo": "CANNON",
    "ref": "62a557389013155c07e4d98578cbfb560f5f59c5",
    "path": "README.md",
    "role": "Owner-selected evidence and exact source histories",
    "tags": [
      "proof",
      "source",
      "verify",
      "evidence",
      "trust",
      "code"
    ]
  },
  {
    "id": "ghot",
    "name": "GHoT",
    "repo": "GHoT",
    "ref": "e35dd470384d864b7b0b629a68dad570875a7df0",
    "path": "README.md",
    "role": "Owner-authorized compute capability offers",
    "tags": [
      "compute",
      "hardware",
      "processor",
      "audio",
      "song",
      "music"
    ]
  },
  {
    "id": "relatte",
    "name": "reLATTE",
    "repo": "reLATTE",
    "ref": "7016dadcafc335d7ad8dccc26f4d6e0769dcf28c",
    "path": "README.md",
    "role": "Signed crossings and receiver-local disposition",
    "tags": [
      "receipt",
      "crossing",
      "door",
      "invitation",
      "invite",
      "return"
    ]
  }
].map(entry => Object.freeze({...entry, tags:Object.freeze(entry.tags)})));

export function selectSources(question, kind) {
  const words = new Set(question.toLowerCase().match(/[a-z0-9]+/g) || []);
  const score = c => c.tags.reduce((n,t) => n + (words.has(t) ? 3 : 0),0)
    + (c.id === 'cannon' ? 2 : 0) + (kind === 'song' && c.id === 'ghot' ? 4 : 0);
  return [...CAPABILITIES].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id)).slice(0,3);
}

export function sourceUrl(c) {
  return `https://raw.githubusercontent.com/the-static-collective/${c.repo}/${c.ref}/${c.path}`;
}
