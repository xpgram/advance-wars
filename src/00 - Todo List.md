# Next Big Objectives

- [ ] Source game: Can you 'Join' two Rigs holding infantry? Like, probably not, right? What rules does the game use? I have it disabled, but it's a little unintuitive to see Rig10 and Rig2 and not be able to merge them. Like, the reasoning is sound, but the UI doesn't communicate anything.

- [ ] Units emit standby events on resupply, meaning they're emitted during Ratify, meaning Rigs can't resupply allies while its track car is showing.

- [ ] Unit can send a message to QueueEvents or boardPlayer or whatever.
  - [ ] Unit must use BoardPlayer as a proxy to emit() since it has no references to anything.
  - [ ] Unit emits constructed object; queue or whatever inits later with references to camera, etc.

const event = new SupplyEvent({...});
this.boardPlayer.emit(event);
emit(event) {
  this.assets.boardEvents.add(event);
}
AnimateStandbyEvents:
update() {
  const event = this.assets.queue.unshift();
  event.init(this.assets).play();
  ...
}

I feel like I want to refine the above process a little more, but...
it seems fine. I just think boardPlayer.emit(event) -> queue.add(event)
is an obvious out-of-necessity kind of thing and not because it should be
BoardPlayer's responsibility.
The alternative, I suppose, is to give every unit a (static?) reference to
queue, which... isn't an abjectly horrible idea.

- [ ] COAffectedTiles
  - [ ] Do some drafting to confirm visual style before implementation.
  - Source game does *not* show all player's CO ranges. I would like to change this, I think. But with caveats:
    - Do not show CO range on tiles hidden by Fog of War
    - Do not show CO range at all if CO unit is hidden by Fog of War
  - [ ] Tiles reflect whether they are affected or not visually.
    - [ ] Tiles do this *and* indicate by which player they are affected.
  - [ ] MapSquare is refactored to allow for a list of players which affect it.
    - It can't be redetermined per turn because COAffected affects DEF too.
  - [ ] Does the source game change the map UI depending on whose turn it is? I don't remember them having two different visual effects. What happens during overlap then?
- [ ] Alt:
  - COAffected could be obtained from the board players themselves. They would just have a rangeMap, just like units do.
  - The visual effect, if in the overlay layer, could also be maintained by the board player.

- [x] AnimateStandbyEvents should handle unit explosions; gas-empty air and naval units need to blow up all the same. AnimateBattle (will never be filled in) would handle the cutscene battle, then. It probably needs to go before standby, in that case.
Luckily that's really easy to do with the new queueing system.

- [x] I totally forgot I haven't added rank ups. That would be mad easy.

- [ ] UnitDetail Window
- [ ] Switchable with Button.Y / Key.C.

- [ ] Target Reticle around Battleships.
- [ ] Enable move and attack.

- [ ] COAffectedFlag needs to be open to multiple players.
  Naturally, because you should be able to see your opponent's ranges.
  - [ ] COAffected overlays should be color tinted then, huh.
  - [ ] Instead of tints, why not use a (non-obnoxious) variant of the area-target reticle that Silos and Battleships use?
  - [ ] Units are missing the CO-Boarded badge.

- [ ] Supply and Repair are saved as events in BoardPlayer
- [ ] Have AnimateEvents post them to confirm.
- [ ] Supply animations
  - [ ] TileMessage class which displays a message, oscillates up and down, then fades away after a set time.
  - [ ] Anim step sets cursor to tile pos; this moves the camera
  - [ ] Creates a TileMessage
  - [ ] After the TileMessage disappears (boolean, callback, idk), move on to next anim event.
  - [ ] This happens for Supply and Repair

- [ ] Plasma Textures: Second frame, I believe.

More observations:
- Carriers *Launch* not *Drop*. The difference is Carriers can't move and release on the same turn, and also the one unit launched gets to *move and attack*. jfc.
- Advancing to Launch behaves exactly like you had just picked that air unit directly off the map, as if the Carrier weren't even there. It implants the air unit as the object and proceeds through the turn system from MoveUnit as normal. Actually... I don't think my animation system has an equivalent for this. Place is used to grab the Carrier, and always the Carrier. Hm.
- More on that, regressing from Launch returns to OrderStart. My system would have to advance to OrderStart, skipping ratify and such. I'll have to experiment with what I'd rather have happen: going back one stage makes intuitive sense and that's how my system is built anyway, but truthfully, if one launched a unit and then changed their mind, it probably wasn't to pick *the other unit*. Going back to the map might be a worthwhile convenience.
- Launch, further further, does not spend the Carrier. It can Launch both held units. 'Wait,' 'Attack' and 'Build,' of course, prevent any more Launches.
- Dropping TCopters, it's impossible to know which is which. Can I fix this in mine? Can I link UnitWindow to the cursor selection?
  - [ ] On ListMenu.cursorMove => inspectUnit(actor.loadedUnits[command.input])
- TargetCursor appears over actionables. So, over an attackable unit, or over a unit you can load into, maybe over a Silo, I dunno. Honestly, it's probably a visual flair that means "you can do something here."
- Because path arrows do not disappear when dropping, the game has special icon arrows to indicate a drop tile.
- These drop-tile icons appear above units, path arrows, etc. Do I need a second UI layer?
- Landers drop both their units at once, not in order.
- The drop animation will require at least two additional TrackCars.
- The original TrackCar just hangs for a second while the other two do their thing. I think I'd have to go out of my way to change this.

Post Function:
  I don't remember what post function means.
- [x] Drop Cmds use IconTitle and the held unit preview is passed in.
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

- [ ] Refactor TurnStates to take advantage of queueing:
  - [x] Expand IssueOrderStart to MoveUnit,CommandMenu,Confirm,Animate,Ratify
  - [x] Expand CommandMenu to DropLocation,CommandMenu
  - [x] Expand Animate to AnimateMove,AnimateDrop,AnimateBattle,AnimateStandbyEvents
  - [ ] Expand CommandMenu(Silo) to PickBoardTarget
  - [ ] Expand CoPower to PickBoardTarget

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
    Also, it's easier to analyze on more function-like TurnStates.
    I think, anyway.
    Really, I just want a way to pass in arguments to function-like TurnStates.
    Say, PickBoardTarget should know what AoE cursor shape to use.
    A Silo needs spread-3, but some CO powers need square-3.

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

- [ ] Z-Ordering and UI Properties refactor  
  Currently, each UI element defines these in their class scripts—in their constructors, actually. I can confirm MenuWindow and MapCursor do. This will be messy later on.
  - [ ] Introduce one place to define z-ordering relationships between layers and layer elements, and extend that for other inter-UI properties as well, if such properties are useful.

- [ ] The cursor behavior settings used by MapCursor and MenuWindow are defined separately and far away from each other, but behave similarly. This might be a good candidate for globalization.
- [ ] ListMenu also has similar control settings which are defined seperately. The frequency of animation pulses, the length of first held-button interval time, the frequency of held-button retrigger pulses; these should all be consistent and tweakable from one place.

- [ ] MoveUnit step: if square under cursor is an attackable target, change to target reticle.
  - [x] Cursor graphic switching infrastructure
  - [x] Add missing target reticle graphics to spritesheet
  - [x] Cursor graphics change-logic in relevant turn-states
  - [x] Graphics change-logic is written in MapCursor.ts, enable switches are given to turn states to configure behaviour.
    - [ ] mapCursor.mode is defined, it's just lacking a 'target' or 'actionable' mode.
  - [x] Cursor over base and base is uninhabited → wrench icon
  - [x] Cursor over attackable target square → target reticle
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
