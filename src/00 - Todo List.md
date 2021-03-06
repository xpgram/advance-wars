- [ ] I have locked Pixi.js to version 5.2.1 because 5.3 removes some functionality
I don't have a work around for yet, either that or the package update wasn't complete.
Point is, 5.3.3 breaks the game. Don't use it until you're prepared to refactor.
    - [ ] For this reason, I have also locked Pixi Filters to whatever version it was.

- [ ] Re-rip the plasma textures: some of them are clipped by 1px.
- [ ] Sea looks nicer, I think, but my frame-animation skills are a teense lacking. Update it.
- [ ] Setup unit-portraits image spritesheet.
    - [X] Unit.exhibit —→ Unit.infoPortrait
    - [ ] Terrain.landscape —→ Terrain.infoPortrait (consistency)

- [ ] Implement Team & CO classes
- [ ] TurnState: Start→Move→Anim→Command→Cancel→Start loses the player-drawn path
- [ ] Clean up Window UI classes
- [ ] Add "Unit Info" window switch-to-able with 'C' — all unit information is prepped now.
    - [ ] Let 'C' switch the stack-order of the blurb panels; bottom is whichever detailed describes.
        - [ ] This will require adding TerrainInfo to Detailed's wipe-away mask.

- [ ] After building the map, send all non-animated sprites to a mesh / paint them permenantly onto one big sprite, kind of like I do for the backdrop ocean. This should improve speed, kind of like it did for the backdrop ocean.

- [ ] Reorganize BattleSystemManager to use or describe an 'Order' to a unit as a single object.
    - [ ] Acting Unit: Point
    - [ ] Travel Path: CardinalDirection[]
    - [ ] Action Type: Number
    - [ ] Action Focal: Point
    - Action type possible values:
        - 0: Wait; Do Nothing
        - 1: Attack
        - 2: Contextual (capture/use-Silo, build (unit/T.base), cast flare, stealth)
        - 3: Contextual 2 (release held unit, supply nearby units)

- [ ] Include CommandMenu in the turn structure.
    - [X] Implement Waiting
    - [ ] Implement the decision branch
        - Since I don't have a menu UI yet, do this:
        - [ ] '1' issues 'Wait'
        - [ ] '2' issues 'Attack'
            - My virtual controller might limit me to 'c' and 'v' or whatever.
    - Before the above:
        - [X] Refactor the turn scripting system to be more... composed? Less slapped together.
        - [ ] Refactor each turn script to follow the new principles——get rid of redlines.
        - [ ] Refactor each turn script to make requests, not to evalutate algorithms.
              Ie, Map.getDestinationFrom(point): Point is used to confirm a path leads to a known location; the algorithm is not contained in the script.
        - [ ] Refactor BattleSceneControllers (I remember now I didn't know what to call it)
            - [ ] order.source: Point               Typically the actor to carry out order.
            - [ ] order.path: CardinalDirection[]   The movement path, if travelling.
            - [ ] order.action: Number              Codified contextual action.
            - [ ] order.focal: Point                Action's point of execution.
            - [ ] order.which: Number               Action's variation.
            - Action type possible values:
                - 0: Wait; Do Nothing
                - 1: Attack
                - 2: Contextual (capture/use-Silo, build (unit/T.base), cast flare, stealth)
                - 3: Contextual 2 (release held unit, supply nearby units)
                - How does a carrier, which may Build, Attack and Release, indicate
                  that it wants to release its second held unit and not the first?

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