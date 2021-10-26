# Next Big Objectives

- [ ] Refactor Pulsar to allow for optional settings (firstInterval).

- [ ] Refactor controls to:
  - Left/Right Bumper: Prev/Next available unit
  - Left/Right Trigger: Info/Player UI Panel
  - [ ] Move bumpers to Caps/A? Or A/S?

- [x] NextOrderableUnit: use a Pulsar for held button presses.

- [ ] Camera needs a lag follow method that's used when the cursor teleports.
  The zero-frame jumps are really jarring. I get vertigo.

- [x] Connect the turn player to the player window UI. Active, funds, etc.
  This can instant switch because eventually there will be a transition animation where it won't even be visible.
- [ ] Connect turn order and active player as well.

- [ ] BattleSceneController - Comprehensive refactor, baby!
  - [ ] Generally clean up around here; Mom says I have to pick up my toys.

- [ ] Maps should be able to read from a serial string or probably a json object.
  This is in preparation of developing multiplayer; the server *needs* to know which map you're playing on.
  - [x] Read map data from some kind of object.
  - [ ] Read map data specifically from a json object (downloadable).

- [ ] Additions to the tile overlay system.
  - [ ] The solution I have (in TerrainObject.ts) doesn't have any protections against FireTile being the first 'std' tile considered.
    - [ ] 'std' should probably be a special-built case.
  - [ ] FireTiles probably shouldn't show an overlay at all. 'std' looks weird on 'em. What is the source game's behavior?
  - [ ] Silos will need a new whitemask once they're used. Might be a while; I haven't implemented using Silos at all yet.

- [ ] Server and database setup  
  Tables:  
  - users : userId / login / pass(hashed/salted) / recovery(email, probs)
    User accounts data.
  - games : gameId / mapId / [settings . . . ] / [results . . . ]  
    Global game instances and settings.
  - players : gameId / userId / player#  
    Maps users to player-slots in game instances.
  - maps : mapId / name / [data . . . ]  
    Map data which may be downloaded by any clients which need it, I guess.
  - events : eventId / gameId / datetime / actionJson  
    Catalog of unit instructions or whatever else counts.
  - boardstate : boardId / gameId / datetime / [data . . . ]  
    Game-instance landmarking system. Events extend the initial board state through a kind of 'redo' application and the system occasionally updates this anchor point with a new, time-stamped snapshot contained here.
  EventsView returns accepted/rejected after input depending on whether the given action-Json a legal change of board state.  
  'Legal' here doesn't mean all that much; I'm not going to implement server-side distance, terrain and fuel checking because oh_ my_ god_ that would take forever.

- [ ] The performance issues on my wlaptop have something to do with Firefox. Vivaldi (chrome based) runs it perfectly~; I'm quite proud, actually.
- [ ] My wlaptop has strange tile displacement and overlay misalignment issues, as well as general blurriness issues among (most noticably) roads and bridges and such. I assume this has something to do with the laptop's resolution.

- [ ] Game DB and Online Multiplayer
  - [ ] Game State DB System
    - [ ] TurnState Send Interception
          → Confirm Order
          → Authenticate
            → (online) Status 200 from server?
            → (offline) pass
          → (authenticated) pass
          → (refused) revert
            → Send message to UI EventMessageSystem
            → Revert to Confirm Order
          → Reify
          → IssueOrderStart
- [ ] UI Event-Messaging System
  When online functions fail to authenticate, or whatever, a message should pop in
  from above to let the player know what's up.



- [ ] Refactor to use reducers? Approximate the pattern, anyway.
  I want: ratifyInstruction(boardState, action) => boardState
  I don't know how feasible this would really be... I'd have to do a big, BIG refactor
  of the Map class. Hm.
  [9/19] This functional style would be good for board resyncing.
  The DB would prefer to have initial or periodic board states and a series of state-
  change orders and the functional style simplifies the applification process.
  State changes would look like:
    (3,7) rm
    (3,10) u inf,8,87,0,0
  These two instructions indicate an infantry unit moving from one location to another.
  The details of what the unit can and cannot do are left up to the client, I guess,
  but the board state is very simply implemented.

- [ ] Re-rip the plasma textures: some of them are clipped by 1px.
- [ ] Sea looks nicer, I think, but my frame-animation skills are a teense lacking. Update it.
- [ ] Setup unit-portraits image spritesheet.
  - [X] Unit.exhibit → Unit.infoPortrait
  - [ ] Terrain.landscape → Terrain.infoPortrait (consistency)

- [ ] TurnState: Start→Move→Anim→Command→Cancel→Start loses the player-drawn path
- [ ] Clean up Window UI classes
- [ ] Add "Unit Info" window switch-to-able with 'C' — all unit information is prepped now.
  - [ ] Let 'C' switch the stack-order of the blurb panels; bottom is whichever detailed describes.  
    I can't... quite remember why. I think this was to sync the blurb panel with the More Info panel; only one can show while More Info is extended and they should probably match since I don't think More Info is exhaustive.
    - [ ] This will require adding TerrainInfo to Detailed's wipe-away mask.

- [ ] Z-Ordering and UI Properties refactor  
  Currently, each UI element defines these in their class scripts—in their constructors, actually. I can confirm MenuWindow and MapCursor do. This will be messy later on.
  - [ ] Introduce one place to define z-ordering relationships between layers and layer elements, and extend that for other inter-UI properties as well, if such properties are useful.

- [ ] The cursor behavior settings used by MapCursor and MenuWindow are defined separately and far away from each other, but behave similarly. This might be a good candidate for globalization.

- [ ] Include CommandMenu in the turn structure.
  - [X] Implement Waiting
  - [X] Implement the decision branch
  - Before the above:
    - [X] Refactor the turn scripting system to be more... composed? Less slapped together.
    - [X] Refactor each turn script to follow the new principles——get rid of redlines.
    - [X] Refactor each turn script to make requests, not to evalutate algorithms.  
      Ie, Map.getDestinationFrom(point): Point is used to confirm a path leads to a known location; the algorithm is not contained in the script.
    - [ ] Refactor BattleSceneControllers (I remember now I didn't know what to call it)  
      Call it CommandOrder, BattleOrder or something.
      - [ ] order.source: Point               Typically the actor to carry out order.
      - [ ] order.path: CardinalDirection[]   The movement path, if travelling.
      - [ ] order.action: Number              Codified contextual action.
      - [ ] order.focal: Point                Action's point of execution.
      - [ ] order.which: Number               Action's variation, such as which held unit to release.
      - Action type possible values:
        - 0: Wait; Do Nothing
        - 1: Attack
        - 2: Contextual (capture/use-Silo, build (unit/T.base), cast flare, stealth)
        - 3: Contextual 2 (release held unit, supply nearby units)
        - How does a carrier, which may Build, Attack and Release, indicate  
          that it wants to release its second held unit and not the first?

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
  - [X] Active step:
  - [X] Within the affective range, build a list of all targetable units in the order left-to-right, top-to-bottom.
  - [X] Controls: Up/Left ascends the list, Down/Right descends the list. List loops.
    - Slider objects, I believe, have range-loop as a mode setting.
  - [X] MapCursor is shown, its controls are disabled.
    - [X] TurnState handles controls as it handles the list.
  - [ ] Passive step (during 'Move' step):
  - [ ] Use recalcPathToPoint() (whatever it's called) to adjust the unit's travel destination to the nearest position within range of the target.
    - The source game ignores this rule if the actionable unit is a battleship and only recalcs the path on formally choosing a target, prefering not a similar path to the one drawn but the shortest path to some point within range. I can't think of a technical reason for this; it is probably just a convenience assumed for the player.

- [ ] War Tanks can have 6 ammo?
  - I have confirmed it is not a quirk of the demo unit spawner. It's possible unit.maxAmmo is not being set properly in the unit's type configuration.
  - [update] I'd have to look into it again, but I could swear this was a result of unit ammo being randomly assigned with reckless abandon during spawn. Is this what I was referring to when I said it wasn't a quirk of the spawner?
