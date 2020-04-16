- [ ] Re-rip the plasma textures: some of them are clipped by 1px.
- [ ] Sea looks nicer, I think, but my frame-animation skills are a teense lacking. Update it.
- [ ] Setup unit 'exhibit' image spritesheet.
    - [ ] Come up with a different name for them.

- [ ] Implement Team & CO classes
- [ ] TurnState: Start→Move→Anim→Command→Cancel→Start loses the player-drawn path
- [ ] Clean up Window UI classes
- [ ] Add "Unit Info" window switch-to-able with 'C' — all unit information is prepped now.
    - [ ] Let 'C' switch the stack-order of the blurb panels; bottom is whichever detailed describes.
        - [ ] This will require adding TerrainInfo to Detailed's wipe-away mask.
- [ ] Highlighted squares look nice, but implementation is sloppy. Clean 'em boys up.

Map.generateTravelMapBase sets every reachable tile as attackable since they technically are,
but we need more sophistication.
- [X] Boats which cannot attack land or air units should not list land tiles as attackable.
- [X] genMap(), when it has reached the end of a path, should light up all tiles within unit range **if** unit can both move and attack.
    - [ ] Else, light up all tiles with manhatten distance in-range. This will have to be a separate loop, probably. We only need to check a square of area (2x+1)^2, where x is max range, though.
        - [X] In fact, use that formula to speed up genMap() culling in the other methods.

- [ ] Update Unit.ts and UnitObject.ts to include:
    - [ ] isIndirect: max range > 1
    - [ ] canCounter: min range == 1
    - [ ] canMoveAndAttack: default true, most indirects set to false
    - [ ] min and max range *facepalm*: range.max returns a constant, 1 or 0, depending on ammo and secondary.

- [ ] Reorganize BattleSystemManager to use or describe an 'Order' to a unit as a single object.
    - [ ] Acting Unit: Point
    - [ ] Travel Path: CardinalDirection[]
    - [ ] Travel Destination: Point (to check against travel path, like a checksum)
    - [ ] Attack Target: Point
    - [ ] How do I simplify contextual actions? I'll list them:
        - Capture Building
        - Build Temporary Base
        - Fire Flare
        - Fire Silo
        - Release held unit (transport units)
        - Hide (subs and stealth planes)
        - 
        - Build Unit (the only one that doesn't explicitly fit here, but if this object is to be the game's standard internet packet, I may want to think about it); also
        - Build Unit (carriers, though just Seaplanes)

- [X] Reorder turn structure to MoveUnit → CommandMenu → AnimateTravel → Ratify
- [ ] MoveUnit step: if square under cursor is an attackable target, change to target reticle.
    - [X] Cursor graphic switching infrastructure
    - [ ] Alternate cursor graphics in spritesheet
    - [ ] Cursor graphics change logic in relevant turn-states
        - [ ] Graphics change logic is written in MapCursor.ts, enable switches are given to turn states to configure behaviour.
        - [ ] Cursor over base and base is uninhabited → wrench icon
        - [ ] Cursor over attackable target square → target reticle
        - [ ] TurnState == DestroyUnits → ban icon / 'X' icon
    - [ ] Reset cursor switches to default cursor graphics