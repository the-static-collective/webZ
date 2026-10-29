import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {makeFilmRecipe,FILM_SCHEMA} from "../apps/arcade/film-recipe.mjs";

test("the browser prepares a finite six-scene original film recipe, not a video",()=>{
  const p=makeFilmRecipe("Make a blue morning music video",0,161);
  assert.equal(p.schema,FILM_SCHEMA);
  assert.equal(p.scenes.length,6);
  assert.deepEqual(p.scenes.map(s=>s.kind),
    ["roof","window","hands","rings","coffee","notes"]);
  assert.equal(p.scenes[0].start,0);
  assert.ok(p.scenes.every((s,i)=>i===0||s.start>p.scenes[i-1].start));
  assert.ok(p.scenes.at(-1).start<161);
  assert.equal(p.source.status,"RECIPE_ONLY_NOT_RENDERED_OR_PUBLISHED");
  assert.equal(p.source.renderer,"tools/timeback-film/render.py");
  assert.deepEqual(p,makeFilmRecipe("Make a blue morning music video",0,161));
});
test("input is bounded, duration explicit, schema remains edit-ready",()=>{
  const x=makeFilmRecipe("",2,16);
  assert.equal(x.video.width,640);
  assert.equal(x.video.height,360);
  assert.equal(x.video.fps,12);
  assert.equal(x.scenes[0].start,0);
  assert.ok(x.scenes.at(-1).start<16);
  assert.throws(()=>makeFilmRecipe("",0,0),RangeError);
  assert.throws(()=>makeFilmRecipe("",0,3601),RangeError);
  assert.throws(()=>makeFilmRecipe("",0,NaN),RangeError);
  assert.throws(()=>makeFilmRecipe("",3,60),RangeError);
  assert.ok(x.scenes[0].lines[0].length<=38);
});
test("the arcade exports source recipe only on explicit tap, not an upload",()=>{
  const page=readFileSync(new URL("../apps/arcade/index.html",import.meta.url),"utf8");
  const code=readFileSync(new URL("../apps/arcade/app.mjs",import.meta.url),"utf8");
  assert.match(page,/id="film-seconds"/);
  assert.match(page,/id="film-recipe-download"/);
  assert.match(page,/recipe, <strong>not<\/strong> a finished video/);
  assert.match(code,/addEventListener\("click",\(\)=>\{/);
  assert.match(code,/makeFilmRecipe/);
  assert.match(code,/new Blob\(\[JSON.stringify\(manifest/);
  assert.match(page,/connect-src 'none'/);
  assert.doesNotMatch(code,/fetch\s*\(|sendBeacon|localStorage|sessionStorage|MediaRecorder|AudioContext/);
});
