# TIMEBACK-FILM-001 · Teach the stack to make a music video

**Status:** executable, source-independent experimental film operator, with a self-contained original recipe for **Metal Roof Morning**. The recipe and code may be public. The actual MP3, its full film, voice, and media are **not committed**. The prototype is a new **webZ-side TIMEBACK film renderer**, not an invocation of Haunted Toaster or PlayDeck, and neither original tool has silently inherited its authority.

## The outcome

This takes the source principles of the previous private offline *Metal Roof Morning* music film and extracts a **repeatable music-video grammar**:

```text
your own song (local path) + an editable JSON shot recipe
              ↓
  FFmpeg audio decode + 5 Hz RMS envelope
              ↓
  six illustrated scene primitives + musical motion
              ↓
  gentle drift, rain, light, ribbons, manual caption fades
              ↓
  local video encoding (H.264 video + AAC from input audio)
              ↓
  an actual MP4 + contact sheet JPEG + hash / codec receipt
              ↓
  finished; no autoplay, upload, external publisher or audience dependency
```

The scene grammar contains **roof**, **window**, **hands**, **rings**, **coffee**, and **notes**. It isn't a generic slideshow: each scene draws vector artwork, animated weather, low-motion luminance and audio-reactive ribbons. There are three palettes. The beat reaction is measured **audio energy**, not an invented rhythm interpretation, transcription or lyric synchronization.

**Original first film:** the previous standalone `render_metal_roof.py` created `Metal_Roof_Morning_music_video.mp4` from the supplied MP3 and independently verified H.264/AAC. This operator is **generalized from that experiment** and is not promised to render the exact same pixel sequence. Its nine-scene source recipe is `tools/timeback-film/recipes/metal-roof-morning.json`, adapted for the new grammar.

## Use on a computer (without putting music on GitHub)

Prerequisites: Python 3.11+, FFmpeg + FFprobe, and Python packages `numpy`, `opencv-python-headless`, `Pillow`. All operate locally. No account, model provider, API credits or GPU required.

```bash
python -m pip install numpy opencv-python-headless Pillow

# Preview: the original song stays local and the receipt clearly says previewOnly=true
python tools/timeback-film/render.py \
  --audio "/path/to/Metal Roof Morning.mp3" \
  --recipe tools/timeback-film/recipes/metal-roof-morning.json \
  --out "./Metal_Roof_Morning_new_preview.mp4" \
  --preview-seconds 15 --small

# Whole song, 640×360 at 12fps for lower-end CPUs
python tools/timeback-film/render.py \
  --audio "/path/to/Metal Roof Morning.mp3" \
  --recipe tools/timeback-film/recipes/metal-roof-morning.json \
  --out "./Metal_Roof_Morning_new_full.mp4" --small

# 960×540 at 14fps, the higher-fidelity recipe output
python tools/timeback-film/render.py \
  --audio "/path/to/Metal Roof Morning.mp3" \
  --recipe tools/timeback-film/recipes/metal-roof-morning.json \
  --out "./Metal_Roof_Morning_new_960.mp4"
```

Every run produces `<name>.mp4`, `<name>.contact.jpg`, and `<name>.receipt.json`. The receipt hashes the **actual file bytes** and records input SHA-256, recipe SHA-256, duration, resolution, stream codecs, actual verified output, and whether the run was a preview. No lyrics are automatically inferred or transmitted.

### The arcade crossing

The existing **Three Bells** optional creative panel has a new **Make a music-film scene recipe** button. Enter an approximate song duration in seconds, and the browser downloads editable `abundent/timeback-film-recipe/v1` JSON. No music is uploaded or analyzed by the webpage. The downloaded recipe has scenes distributed across the approximate duration, captions inferred only as *editorial text* from the visitor's card, and an explicit `RECIPE_ONLY_NOT_RENDERED_OR_PUBLISHED` marker. Adjust timing and wording if desired, then use the local computer renderer above.

This respects both the user's limited attention and source ownership: a click yields something portable; actual media work is explicit, optional, and performed on the operator's machine.

### Integration with the other engines

- **Haunted Toaster:** remains the superior application-level media experience for users with the native Windows package. The exact original Toaster candidate-move-deck already ran in TIMEBACK-CREATIVE-001. This PR does *not* insert arbitrary Python rendering inside Toaster's approved VisualScore/render pipeline or claim native Toaster video receipts.
- **PlayDeck:** the previously verified original compositor can be launched from a validated local Three Bells carry. This operator offers **another distinct rendering grammar**, without turning a projected PlayDeck receipt into a verified MP4.
- **LemonPRESS:** a human may print the film's contact sheet or create a private print proof. Publication, audio rights and any third-party distribution remain independent gates.
- **JAR;VIS / planZ / LOADOUT / webZ:** can treat this new CLI as a *candidate capability* only after explicit supported local tool binding, not as a public hosted service, signed source owner or permission to upload audio.
- **CANNON / Free Graph / reLATTE:** preserve source/recipe/output digest and independent reception gates rather than pretending a receipt certifies art quality, authenticity or consent.

## Exact test

`python -m unittest tests/timeback_film_test.py -v`

CI also generates an entirely **synthetic six-second WAV** and renders a verified H.264/AAC MP4, with its own contact sheet and receipt, entirely offline. The GitHub Actions job uploads this test output as an inspectable workflow artifact. No user-owned song or private creative input enters CI.

Safety: validates schemas, scene positions, finite duration, bounded resolution and captions, and refuses to overwrite existing output without `--force`. The operator does not claim a predictable dopamine release, mental health benefit or measured time savings.

**Human success condition:** a person can produce a satisfying short film from their own authorized song, keep it, and leave. Rendering a file verifies the machinery; actual independent adoption and quality are separate questions.
