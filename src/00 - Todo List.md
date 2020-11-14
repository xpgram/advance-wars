- [ ] Re-rip the plasma textures: some of them are clipped by 1px.
- [ ] Sea looks nicer, I think, but my frame-animation skills are a teense lacking. Update it.
- [ ] Setup unit 'exhibit' image spritesheet.
    - [ ] Come up with a different name for them.
        - Why not just "landPortrait" and "unitPortrait"?

- [ ] Implement Team & CO classes
- [ ] TurnState: Start→Move→Anim→Command→Cancel→Start loses the player-drawn path
- [ ] Clean up Window UI classes
- [ ] Add "Unit Info" window switch-to-able with 'C' — all unit information is prepped now.
    - [ ] Let 'C' switch the stack-order of the blurb panels; bottom is whichever detailed describes.
        - [ ] This will require adding TerrainInfo to Detailed's wipe-away mask.

- [ ] After building the map, send all non-animated sprites to a mesh / paint them permenantly onto one big sprite, kind of like I do for the backdrop ocean. This should improve speed, kind of like it did for the backdrop ocean.

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

- [ ] Refactor the map-sprites system to post tile graphics to a mesh instead of keeping all these sprite objects active. This should speed things up on lower-performing computers, just like how consolidating the ocean sprites did.
    - [ ] Transparent and animated graphics must be kept alive and on a separate layer.
        - [ ] In theory, they could be posted to their own layer and saved into their own mesh, kind of like the animated ocean graphic. Animated layers would simply be animated meshes with each frame of the source posted to a frame of the mesh.
        This will require some work.

- [ ] Add "Choose Attack Target" step to turn structure in two steps:
    - [ ] Active step:
        - [ ] Within the affective range, build a list of all targetable units in the order left-to-right, top-to-bottom.
        - [ ] Controls: Up/Left ascends the list, Down/Right descends the list. List loops.
            - Slider objects, I believe, have range-loop as a mode setting.
        - [ ] MapCursor is shown, its controls are disabled.
            - [ ] TurnState handles controls as it handles the list.
    - [ ] Passive step (during 'Move' step):
        - [ ] Use recalcPathToPoint() (whatever it's called) to adjust the unit's travel destination to the nearest position within range of the target.
            - The source game ignores this rule if the actionable unit is a battleship and only recalcs the path on formally choosing a target, prefering not a similar path to the one drawn but the shortest path to some point within range. I can't think of a technical reason for this; it is probably just a convenience assumed for the player.
            - [ ] recalcPathToPoint() must be updated:
                - New parameter: range
                recalc accepts a position and travel path if it terminates in a position some distance from the target.
                Current uses of the recalc method would submit a range value of 0.
                - This does not allow smart navigation if the unit's range function is a map and not a set of distances. Concievably a simple change, though. But I may write for it now to future-proof. This means:
                    - [X] Finish implementation of RegionMap.

- [ ] Update each unit-type to include an attack range. Make this displayable on the map.

- [ ] Refactor Square.traversable to .traversible; it's driving me crazy.
- [X] Compare 25x15x3 sprites drawn individually (with transparency) vs the same in a mesh.
    Predictably, yes, it is faster with meshes.
    - [ ] Refactor the map building system to create a mesh instead of a sprite grid.
        - [X] Sea layer: Rendered to one animated texture.
            - [ ] Refactor its placement into its own layer; I think its currently in bottom.
        - [ ] Ground layer: All rendered to one texture.
        - [ ] Overlap layer: Each row rendered to one texture.
        - [ ] Animated layer: All animated tiles (fire and plasma) are their own entity.
            - This is fixable, but requires more work.
            The gist is that I'd save each frame for each entity to a different mesh. So, the plasma layer would have 3 different meshes it cycles between, the fire layer 5.
        - [ ] UI layer: ... I dunno yet.
        - Without a re-rendering strategy on change, cities may need to be on the animated layer. Note that this means cities would be unaffected by mountain shadows when right-adjacent, which is not source-game behaviour.