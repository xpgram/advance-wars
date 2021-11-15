# Next Big Objectives

- [ ] Plasma Textures: Second frame, I believe.

- [ ] Damage Forecast window
  - Safe:      0 255 115
  - Normal:    0 255 255
  - Caution: 255 255  80
  - Danger:  255  75  80
  - [x] Replace color   0   0   0 255 (black)
  - [ ] Member of UnitInfo
  - [x] Displays two numbers: damage given as an integer, recieved as a color.

More observations:
- Carriers *Launch* not *Drop*. The difference is Carriers can't move and release on the same turn, and also the one unit launched gets to *move and attack*. jfc.
  - This of course means units that load must also spend because otherwise Carriers would be second-turn bounce points.
- Advancing to Launch behaves exactly like you had just picked that air unit directly off the map, as if the Carrier weren't even there. It implants the air unit as the object and proceeds through the turn system from MoveUnit as normal. Actually... I don't think my animation system has an equivalent for this. Place is used to grab the Carrier, and always the Carrier. Hm.
- More on that, regressing from Launch returns to OrderStart. My system would have to advance to OrderStart, skipping ratify and such. I'll have to experiment with what I'd rather have happen: going back one stage makes intuitive sense and that's how my system is built anyway, but truthfully, if one launched a unit and then changed their mind, it probably wasn't to pick *the other unit*. Going back to the map might be a worthwhile convenience.
- Launch, further further, does not spend the Carrier. It can Launch both held units. 'Wait,' 'Attack' and 'Build,' of course, prevent any more Launches.
- Dropping TCopters, it's impossible to know which is which. Can I fix this in mine? Can I force UnitInfo open while selecting over held units?
- TargetCursor appears over actionables. So, over an attackable unit, or over a unit you can load into, maybe over a Silo, I dunno. Honestly, it's probably a visual flair that means "you can do something here."
- Because path arrows do not disappear when dropping, the game has special icon arrows to indicate a drop tile.
- These drop-tile icons appear above units, path arrows, etc. Do I need a second UI layer?
- Landers drop both their units at once, not in order.
- The drop animation will require at least two additional TrackCars.
- The original TrackCar just hangs for a second while the other two do their thing. I think I'd have to go out of my way to change this.

Post Function:
  I don't remember what post function means.
- [ ] Drop Cmds use IconTitle and the held unit preview is passed in.
- [ ] DropLocation also sets a dir value on the square so the player can see where they're dropping.
- [x] AnimateMove moves to AnimateDrop which does what you would think, which moves to AnimateBattle which doesn't exist yet, which moves to Ratify, I think.

- [x] add cursor pos to debug ui, hide by default?
- [x] Load Unit
- [x] Drop Unit
  This one's going to be tricky...
  - [x] CommandMenu → Where → CommandMenu
  - [x] CMenu → Where → CMenu → Where → CMenu → Wait → ... → Ratify
  - [x] CMenu → Where → CMenu → Regress (Clear Where) → MoveUnit
- [x] nextOrderable - Break into two: unit and base
- [x] Land's End - move predeploy closer for more efficient testing.
- [x] Expand ListMenu to allow for columns (I added pages, anyway)
- [x] New FactoryShop GUI for ListMenu
  - [ ] Force UnitDetail open and right side during shop menu

- [ ] Write a goddamn method to tell menuGUI where the fuck to be. Jesus.

- [ ] Global controller proxy.
  InfoWindowSystem should ask if the showDetailWindow button is down, not specifically the right trigger. Changing that shit is annoying af.

- Source Game observations:
  - The game shows you every standby phase event in sequential order. You probably won't have 100 resupplies to see, but if you did...

- [ ] Add dummy IssueOrderConfirm step, which would get approval from the server.

- [ ] The camera needs to emit an event when it stops moving. Or maybe it just has a getter that responds true whenever its target is in focus. This is less sophisticated, but I think it would suffice.
- [ ] Camera can use this signal itself, too. Whenever its object *is* in focus, it should pick the nearest map-tile point quantized to its zoom ratio or whatever and move there, I suppose at a speed that also scales with zoom to avoid weird staircase zoom effects.
- [ ] Hold B to move fast: camera focal point needs to move to whichever edge or corner your dpad is curretnly pointing in. This will make zoom a little smoother.
- [ ] Hold B to move fast: never goes beyond a few tiles of the map. But you can zoom-trick the camera further. And then tapping B will snap that camera. That's bad.

- [ ] Dev button for grid: top and left edges, over bottom layer

- [ ] Alternate road preference for vertical or horizontal based on oddness of tile position. Sounds fun. I like complicated roads. The function which figures this out, though, only knows what *types* its neighbors are, not their location.

- [ ] Refactor InfoWindowSystem
- [x] Instant move InfoWindowSystem on turn change.
- [x] Instant move InfoWindowSystem on return from MoveCamera state.
- [ ] Instant move InfoWindowSystem on FactoryShop menu open.
- [ ] Force open UnitDetail
- [ ] Move camera to show base tile between shop menu and detail window?

- [x] NextOrderableUnit
  - [ ] Source game has no hold behavior, and won't let you click to next again until the camera has found the cursor (which I think is also hidden, giving the player clear indication when they're allowed to move it).
  - My camera can be fast, that's fine. The player should at least know where the new position is in relation to where the cursor was, though. That's the main problem.
  - I'm gonna need to think about auto-camera-move anyway because watching your opponent on their turn will use it a lot. It needs to be a turn step.
  - A silent camera-move-to-location step would be nice. The trick is telling it where to go after it's finished...
    A neat trick would be to start it, let it finish, regress and move on naturally. This kind of bucks the TurnSystem's design principles, though. All steps should be recorded.
    I've wanted a convenient way to move into an animate step but then direct somewhere else for a while now, though. This should be the way.
- [ ] TurnStateSystem multi-step direct
  Add a way to pass information, specifically a queue of states to move into, to the next turnstate. This next turnstate has the responsibility of deciding when and how to use this information. It can shift out the first one, ignore it, pass it on or not, insert something new and then pass it, etc.
  Realistically, I don't think this game will ever use a list of steps; animation states can chain together logically already, and control states, it's not even reasonable to allow the previous state to dictate where this one goes.

  Actually... I wouldn't do this, but imagine:
  - OrderStart passes [MoveUnit, CommandMenu, Confirm, Animate, Ratify] to next.
  - MoveUnit succeeds.
  - CommandMenu inserts [DropLocation, CommandMenu].
  - CommandMenu, on return, inserts [PickTarget].
  - PickTarget, Confirm succeed.
  - Animate examines the order, inserts [AnimateMove, AnimateDrop, AnimateBattle].
  - Animation steps succeed.
  - Ratify affirms all changes on the board.
  - Ratify inserts [OrderStart] to begin the process again.
  This... isn't necessary, strictly speaking. But it sounds kinda nice.
  It sounds a bit like keeping track of state-change flow would be a little easier.
  The logic for MoveUnit and DropLocation, which tiles to highlight, are different though.
  I guess that could be handled beforehand, but I'm not sure we'd be achieving anything,
  really. Other than the connections being a teense easier to see.
  It's obviously better for reuse; I'd love to be able to insert PickTarget with maybe a few parameters like I would a function call, without having to write 2+ different versions, one for attack targets, one for Silo targets, one for CO Power targets, etc.

- [ ] Refactor TurnSystem to use state queues.
  This is actually kind of a big job. I'd need to think of use cases.
  BSM.insert(states: TurnState[], idx: number = 0);
  BSM.advance();
    // BSM will _not_ increment to next in queue unless this is called.
    // Throws StateChangeError if no states exist in queue.
  BSM.regress();
  BSM.report();   // Or whatever it's called.
    // Prints last 20 states.
    // Prints remaining states in queue.
- [ ] Refactor instruction set to be a list of incremental changes.
  - Instead of {place, path, action, focal, drop, ... }
  - [ ] make it more extensible with
    [
      {path, null, where},
      {path, null, where},
      ...
      {move, null, where},
      {drop, which, where},
      {attack, null, where},
    ]
    A benefit is that this process makes it reeaally easy to see where interruptions would happen, instead of having to calculate them.
    I guess calculating them isn't hard. Path is already incremental, essentially.
    Nevertheless, it's highly extensible in the sense that an Order is a set of actions and not just one discrete action.

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
  - [x] Unit.exhibit → Unit.infoPortrait
  - [ ] Terrain.landscape → Terrain.illustration (consistency)
  - [ ] Unit.infoPortrait (or w/e) → Unit.illustration

- [ ] Clean up Window UI classes
- [ ] Add "Unit Info" window switch-to-able with 'C' — all unit information is prepped now.

- [ ] Z-Ordering and UI Properties refactor  
  Currently, each UI element defines these in their class scripts—in their constructors, actually. I can confirm MenuWindow and MapCursor do. This will be messy later on.
  - [ ] Introduce one place to define z-ordering relationships between layers and layer elements, and extend that for other inter-UI properties as well, if such properties are useful.

- [ ] The cursor behavior settings used by MapCursor and MenuWindow are defined separately and far away from each other, but behave similarly. This might be a good candidate for globalization.
- [ ] ListMenu also has similar control settings which are defined seperately. The frequency of animation pulses, the length of first held-button interval time, the frequency of held-button retrigger pulses; these should all be consistent and tweakable from one place.

- [ ] MoveUnit step: if square under cursor is an attackable target, change to target reticle.
  - [x] Cursor graphic switching infrastructure
  - [ ] Add missing target reticle graphics to spritesheet
  - [x] Cursor graphics change-logic in relevant turn-states
  - [x] Graphics change-logic is written in MapCursor.ts, enable switches are given to turn states to configure behaviour.
    - [ ] mapCursor.mode is defined, it's just lacking a 'target' or 'actionable' mode.
  - [x] Cursor over base and base is uninhabited → wrench icon
  - [ ] Cursor over attackable target square → target reticle
  - [ ] TurnState == DestroyUnits → ban icon / 'X' icon
  - [x] Reset cursor switches to default cursor graphics

- [ ] Add "Choose Attack Target" step to turn structure in two steps:
  - [x] Active step:
  - [x] Within the affective range, build a list of all targetable units in the order left-to-right, top-to-bottom.
  - [x] Controls: Up/Left ascends the list, Down/Right descends the list. List loops.
    - Slider objects, I believe, have range-loop as a mode setting.
  - [x] MapCursor is shown, its controls are disabled.
    - [x] TurnState handles controls as it handles the list.
  - [ ] Passive step (during 'Move' step):
  - [ ] Use recalcPathToPoint() (whatever it's called) to adjust the unit's travel destination to the nearest position within range of the target.
    - The source game ignores this rule if the actionable unit is a battleship and only recalcs the path on formally choosing a target, prefering not a similar path to the one drawn but the shortest path to some point within range. I can't think of a technical reason for this; it is probably just a convenience assumed for the player since just-in-range is typically desirable for indirect units.
