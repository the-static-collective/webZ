# BLUEPRINT BRIDGE 005 — How it connects to the world

1. **External real-world plan**: user-supplied raster source with permission, dimensions and known orientation. Images are held only in the browser and are not committed to git or exported in the JSON file.
2. **Human measurement**: explicit two-point distance, source unit and units-per-voxel ratio; local origin alignment. Uncertainty is not hidden. Imported JSON cannot regenerate or verify the original background scan.
3. **Static Workbench / Foundry**: browser works as an offline operator table; exported JSON is a project **proposal** and a proposed physical plan interpretation, not permission.
4. **Minecraft world cartridge**: safe-ish authoring draft of `fill` commands scoped to a modest footprint. No native Minecraft readback in 005. Existing Circuit 004 is a completely separate real-game RCON workflow.
5. **GHoT**: CLI includes an ordinary SHA-256 byte receipt, not the actual GHoT runtime. Circuit 004 can separately provide an actual native GHoT `system.hash` receipt for **observed game state** once a future owner-authorized importer is built.
6. **reLATTE**: a signed crossing may eventually refer to a frozen cartridge hash; the receiver can HOLD and refuse. No automatic authorizations.
7. **Full Measure / GrO**: credited work requires a real performed action and independent human review; a generated plan or in-game placement is not a completed physical project.
8. **Economy / Jubilee**: no resource values, labor costs, paid work, compensation or token issuance represented by this converter.

Two useful verification axes:
- Was the voxel mockup accurately derived from the chosen and explicitly calibrated image? Requires human inspection (not merely a byte hash).
- Did the game world actually adopt and reproduce this mockup? Requires a distinct authorized Minecraft server execution and independent game-state observer.

## Safety invariant

SOURCE DRAWING != MEASURED AS-BUILT != VOXEL DRAFT != GAME WORLD STATE != PHYSICAL CONSTRUCTION.
