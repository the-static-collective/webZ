# ABUNDENT · CIRCUIT 005 — Blueprint Foundry

**Real-world measured floor plan → operator-traced geometry → inspectable Minecraft Java datapack.**

This is a *translator of measured, human-reviewed geometry*, **not** automatic BIM recognition, a construction document, or proof of real-world building compliance.

## Try it on Mac (GUI, offline)

1. Extract the source ZIP and open `blueprint_foundry/`.
2. Double-click `start-blueprint-mac.command`. The launcher needs Python 3.10+ and starts an HTTP server on `127.0.0.1:8890`, only. The browser opens automatically.
3. Click **Load example floor plan** first. See the pre-traced *illustrative* 12m × 8m workshop. It is not any particular building.
4. Click **Export Minecraft datapack (.zip)**. That is a true Java 26.1.1 datapack with an inspectable `.mcfunction`.
5. Then **Select image** to import your own dimensioned PNG, JPG, WebP or blueprint screenshot. The image stays entirely in the browser; no image pixel data gets sent to Python or the network.
6. **Pick A → B** on a dimension line, enter its actual length in meters, feet or inches, and trace wall endpoints using **Wall** (start/end). Place a **Door** or **Window** marker on the traced segment. This is manual tracing, not automated line recognition.
7. Choose preview material and provisional height; export. Also save `Measured JSON` for a reproducible source file independent of its image.
8. **Stop** the local Python process using Ctrl+C in Terminal when done.

### How to run the exported Minecraft pack

Supported and tested target: **Minecraft Java 26.1.1**, datapack format **101.0**. The ZIP contains `pack.mcmeta`, `data/abundent_blueprint/function/build.mcfunction`, a trace-only `SOURCE_PLAN.json`, `PREVIEW.svg`, and a cautionary README.

- Create a new, disposable, flat creative test world. Do not reuse an inhabited, survival, shared, or valuable world. Make a backup. **The function overwrites blocks within its footprint.**
- Move the ZIP into the world save's `datapacks/` folder, **without extracting it**. Reopen the world or use `/reload` and check `/datapack list`.
- As the operator with permission to use commands, place the build origin using e.g. `/execute positioned 0 80 0 run function abundent_blueprint:build`, and **inspect the whole placement area first**. No automatic build-on-load or world overwrite is embedded.
- The coordinate mapping is `+X` toward the right of the scanned plan, `+Z` toward its bottom; one Minecraft block represents **approximately one real meter**. The origin includes a one-block border. Walls are 1 block thick, rectangular voxels, with straight segments and simple door gaps/glass windows. All heights are operator-supplied provisional values.
- The included `Example_Workshop_Minecraft_26.1.1.zip` is generated from **illustrative sample data**, not from a genuine uploaded building plan.

This pilot has **no PDF import**, site survey, automatic wall detection, elevation inference, stairs, geometry precision below 1m, structural safety, permitted site usage, fire egress certification, occupancy, plumbing, electrical, fabrication, real GHoT task, reLATTE admission or Full Measure Deed. A vector CAD/DXF/SVG importer would be a separate addition; for PDF, take a high-resolution picture/screenshot of the required page (or convert it to PNG before importing). Do not interpret the game render as a legal building plan.

## Engineering proof / developer interface

`blueprint_engine.py` implements bounded raster-grid geometry and compiles to vanilla Java `fill` / `setblock` commands with fixed whitelisted blocks. `server.py` is a loopback-only web service that accepts only `POST /api/build` with JSON `schema=abundent.blueprint.measured-plan/v1`. It refuses unknown and oversized inputs, unlisted block types, excessive footprints, openings not on traced walls, and cross-origin web requests. It never invokes RCON or the Minecraft process.

Standard library tests:

```sh
cd blueprint_foundry
python3 -m unittest discover -s tests -p 'test_*.py' -v
python3 generate.py example_12x8_workshop.json --output sample.zip
```

A Chromium in-memory UI smoke test is included for runners with Playwright installed. Browser-only testing in the authoring environment uses an **in-memory mocked download transport**, because this environment blocks local browser HTTP navigation. The HTTP backend itself has independent direct tests. A GitHub Actions workflow separately runs the exported `.mcfunction` using a freshly downloaded, SHA-1-verified official Mojang Java 26.1.1 dedicated server, and checks voxel states directly via RCON. Verify the workflow result before claiming native Minecraft proof.

**Reproducibility:** The original image remains local, and source JSON contains only wall endpoints, opening centers, dimension scale, materials and height. SHA-256 of canonical source JSON accompanies the generated files. A replay must not invent the missing original photograph, measurement accuracy, or human consent.

## Bigger architecture

This is a **physical drawing → Minecraft carrier** for Abundent Circuit. It can later compose with native reLATTE `HOLD` envelopes, GHoT receipts, and Full Measure game feedback, but **none of those authority layers is activated by compiling a blueprint.** A built Minecraft wall is a game-world voxel, not an inspected physical wall.
