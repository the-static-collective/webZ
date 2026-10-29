// TIMEBACK-FILM-001: save a coherent six-scene plan without touching a person's song.
// The Python renderer, not the browser, executes the local MP4 production.
import {giftAt} from "./engine.mjs";
export const FILM_SCHEMA="abundent/timeback-film-recipe/v1";
const KINDS=["roof","window","hands","rings","coffee","notes"];
const PALETTES=["blue-dawn","blue-dawn","blue-dawn",
                "violet-evening","amber-dawn","blue-dawn"];
export function makeFilmRecipe(topic="",cardIndex=0,estimatedSeconds=160){
  if(typeof estimatedSeconds!=="number" || !Number.isFinite(estimatedSeconds) ||
     estimatedSeconds<10 || estimatedSeconds>3600)
    throw new RangeError("Choose a song duration from 10 to 3600 seconds");
  const card=giftAt(topic,cardIndex);
  const safe=String(topic).trim().replace(/[\x00-\x1f\x7f]/g," ").slice(0,80);
  const title=safe||card.title;
  return {
    schema:FILM_SCHEMA,
    title,
    palette:"blue-dawn",
    video:{width:640,height:360,fps:12},
    artisticNote:"PRIVATE RECIPE — manual editorial title cards, NOT transcribed lyrics. Check scene timestamps against the real song. Supply your own media with rights to use it.",
    source:{owner:"the-static-collective/webZ",renderer:"tools/timeback-film/render.py",
            status:"RECIPE_ONLY_NOT_RENDERED_OR_PUBLISHED"},
    scenes:KINDS.map((kind,i)=>({
      start:Math.round(estimatedSeconds*i/6*100)/100,
      kind,palette:PALETTES[i],
      lines:i===0?[title.toUpperCase().slice(0,38),"A LITTLE FILM"]:
        i===5?["TAKE IT","WITH YOU"]:[]}))
  };
}
