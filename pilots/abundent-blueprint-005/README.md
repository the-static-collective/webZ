# BLUEPRINT BRIDGE 005 — Actual Plans → Minecraft Drafts

**Status:** runnable offline, human-traced 2D floor-plan-to-Java-Minecraft command compiler. No blueprint was supplied for this experiment, so the included source is intentionally **fictional**. This is not CAD reconstruction, automatic image recognition, structural review, a building permit, or server automation.

## Try it immediately

Open `Blueprint_Bridge_005_Offline.html` in a modern browser. Click **Load demonstration**, then **TRANSLATE TO MINECRAFT**. The sample 20m × 12m plan produces a 21×13-block floor, traced room walls, and glass windows, together with `.mcfunction` and versioned JSON cartridge exports. The source image remains local and is **omitted** from the JSON cartridge.

## Try a real floor plan

1. Get permission to use your source plan. Export a single floor of a PDF as PNG, or use an existing PNG, JPEG or WebP image. (Limit: 10 MB, 10,000px each side.)
2. Load the image. Select a printed labeled dimension whose endpoints are visible, enter its numeric distance and correct units, click **Measure**, then click both dimension endpoints. Without a known dimension, the compiler refuses translation.
3. Choose **Set origin** to align an image point with the Minecraft world X/Z position (default `(0,70,0)`); set Minecraft blocks-per-real-unit (`1 m/block`, `0.5 m/block`, `1 ft/block`, etc). **One voxel does not provide construction-level precision.**
4. Trace wall *centerlines*, door *openings* (erase intersecting wall cells), windows along existing wall lines, and rectangles of floor. Use the undo button to fix errors. Trace one layer only, no elevations inferred.
5. Translate and inspect command counts, 128×128 maximum bounding area, bounds and projected grid. A single .mcfunction is at most 17,000 lines; floor is 96×96 max per rectangle. Wall height 2–12 blocks, materials allowlisted.
6. Export the `.mcfunction` **draft** and/or `blueprint_DRAFT_cartridge.json`. The JSON includes source-independent calibration, traces, local limits, and original authoring coordinates, **not** the scanned blueprint image or any verified survey. The annotated PNG **does** contain the original image: handle privately.
7. Only after direct review in a backed-up, deliberately empty Minecraft Java creative test area should the user decide how to place the `.mcfunction` into a compatible Java datapack and execute it with authorized game operator commands. This editor **never connects to Minecraft, GHoT, Abundent or real machinery**.

## Independent headless compilation

```
node --test tests/core.test.cjs
node convert_cartridge.cjs samples/demo-cartridge.json /tmp/blueprint-compiled
```

The CLI writes `abundent_blueprint_DRAFT.mcfunction` and `compilation_receipt.json` containing SHA-256 of generated command text; this hash establishes exact draft bytes, **not** successful server execution. There is no dependency on web services or node packages.

For the actual game, basic Java `.mcfunction` command lines have **no leading slash**. The exported commands use integer coordinates, `fill ... keep` for cautious occupancy avoidance and `fill ... replace <specific wall material>` for the window infill. `keep` is **not atomic**; partial builds can happen on an occupied world. Inspect and stage backups. The exporter deliberately does not generate `air` demolition, loot, op grants, redstone execution, or auto-run scripts.

## What's next in Circuit 004

Blueprint Bridge 005 is an **exported authoring tool adjacent to** the native Minecraft Lantern Commons (Circuit 004). The future integration boundary should be: cartridge explicitly locally approved → material/geometry limits checked again by the **game-world owner** → RCON or datapack preview in a dedicated test world → actual server-state readback → GHoT hash receipt → `GAME_ONLY_HOLD`. No Full Measure Deed, real-world structural approval, money, land claim, or physical act can be inferred from the Minecraft picture.

## Non-goals / present limitations

- No automatic tracing or OCR: building plans have graphical conventions and dimensions that cannot safely be guessed. User traces walls manually.
- No imported DWG, DXF, IFC or multi-page PDF rendering in this version; raster floor-plan images only.
- Flat schematic only; doesn't understand elevation, roofs, stairs, doors, structural materials, MEP, site surveying, or building code.
- Only orthogonal-ish line traces are accurately represented at coarse voxel resolution. Diagonal walls are Bresenham raster approximations.
- Door gap tool subtracts voxel cells; tight alignment matters. It leaves empty passages, not hinged doors.
- No network calls, upload, localStorage, external CDNs, or automatic remote actions.
- Support for extremely old macOS browsers may vary; PNG image and Node CLI are portable.

**FUNDAMENTAL DISTINCTION:** REAL BLUEPRINT DIMENSION → EXPLICIT HUMAN CALIBRATION → APPROXIMATE MINECRAFT BLOCKS, not `IMAGE → VERIFIED BUILDING`.
