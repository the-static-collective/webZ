import test from "node:test";
import assert from "node:assert/strict";
import {LETTERS, SONGS, SOURCE, SCHEMA, getNode, neighbors, relation, newSeed, makeScore, validate, invitation} from "../composer/model.mjs";
test("seven published listening letters and fourteen real source song URLs",()=>{
  assert.equal(LETTERS.length,7);assert.equal(SONGS.length,14);
  for(const letter of LETTERS){
    assert.equal(letter.children.length,2);
    for(const id of letter.children){
      assert.equal(getNode(id).letterId,letter.id);
      assert.match(getNode(id).source,/^https:\/\/suno\.com\/song\/[a-f0-9-]+$/);
    }
    assert.equal(letter.source,SOURCE+"#letter-"+letter.order);
  }
});
test("one movement forms an editorial invitation, not invented ancestry",()=>{
  const first=LETTERS[0], second=LETTERS[1], song=first.children[0], pair=first.children[1];
  assert.equal(relation(null,first.id),"chosen-entry");
  assert.equal(relation(first.id,second.id),"suggested-letter-walk");
  assert.equal(relation(first.id,song),"published-letter-membership");
  assert.equal(relation(song,pair),"paired-in-published-letter");
  assert.equal(relation(song,second.id),null);
});
test("visitor-created seed is local, follows its parent and makes a portable invitation",()=>{
  const letter=LETTERS[0],song=letter.children[0];
  const seed=newSeed(song,"Cup on the windowsill",[],"The kettle knows");
  const path=[letter.id,song,seed.id,song,letter.children[1]];
  assert.ok(neighbors(song,[seed]).includes(seed.id));
  const artifact=makeScore(path,[seed],"This was our morning.");
  assert.equal(artifact.schema,SCHEMA);
  assert.equal(artifact.status,"unsigned-local-composition");
  assert.equal(artifact.observations[2].relation,"visitor-created-link");
  assert.equal(artifact.observations[2].origin,null);
  const restored=validate(JSON.parse(JSON.stringify(artifact)));
  assert.deepEqual(restored.path,path);
  assert.match(invitation(artifact),/Cup on the windowsill/);
  assert.match(invitation(artifact),/This was our morning/);
  assert.match(invitation(artifact),/unsigned/i);
});
test("reject missing sources, forged relations, cycles not actually offered, and excessive note",()=>{
  assert.throws(()=>makeScore([LETTERS[0].id,SONGS[12].id]),/crossing/i);
  assert.throws(()=>validate({schema:SCHEMA,path:["bogus"],seeds:[],note:""}),/crossing/i);
  assert.throws(()=>validate({schema:SCHEMA,path:[LETTERS[0].id],seeds:[{id:"seed-1",title:"Hi",phrase:"",parentId:"missing"}],note:""}),/particular/i);
  assert.throws(()=>validate({schema:SCHEMA,path:[LETTERS[0].id],seeds:[],note:"x".repeat(801)}),/note/i);
  assert.throws(()=>newSeed(LETTERS[0].id,"  "),/Name/);
});
