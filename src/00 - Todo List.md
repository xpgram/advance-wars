- [ ] Re-rip the plasma textures: some of them are clipped by 1px.
- [ ] Sea looks nicer, I think, but my frame-animation skills are a teense lacking. Update it.
- [ ] Refactor unit sprites (...?)
    - [ ] (On a different sheet) All have an 'exhibit' image matching the dimensions of landscape images for terrain.

- [ ] Implement Team & CO classes
- [ ] TurnState: Start→Move→Anim→Command→Cancel→Start loses the player-drawn path
- [ ] Clean up Window UI classes
- [ ] Add "Unit Info" window switch-to-able with 'C' — all unit information is prepped now.
    - [ ] Let 'C' switch the stack-order of the blurb panels; bottom is whichever detailed describes.
        - [ ] This will require adding TerrainInfo to Detailed's wipe-away mask.
- [ ] Highlighted squares look nice, but implementation is sloppy. Clean 'em boys up.

Map.generateTravelMapBase sets every reachable tile as attackable since they technically are,
but we need more sophistication.
- [ ] Boats which cannot attack land or air units should not list land tiles as attackable.
- [ ] genMap(), when it has reached the end of a path, should light up all tiles within unit range **if** unit can both move and attack.
    - [ ] Else, light up all tiles with manhatten distance in-range. This will have to be a separate loop, probably. We only need to check a square of area (2x+1)^2, where x is max range, though.
        - [ ] In fact, use that formula to speed up genMap() culling in the other methods.

- [ ] Update Unit.ts and UnitObject.ts to include:
    - [ ] isIndirect: max range > 1
    - [ ] canCounter: min range == 1
    - [ ] canMoveAndAttack: default true, most indirects set to false
    - [ ] min and max range *facepalm*: range.max returns a constant, 1 or 0, depending on ammo and secondary.

- [ ] Reorder turn structure to MoveUnit → CommandMenu → AnimateTravel → Ratify