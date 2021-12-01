# Next Big Objectives

- [ ] When selecting over a red tile, MoveUnit should call planPathFromPoint and provide the range map or whatever; I should already have the infrastructure for this.
- [ ] Pressing A in this context skips the command menu and assumes Path, Command.Attack: moves right on to Ratify.

- [x] It is possible to trick BSM into thinking the map-cursor isn't in view if you zoom out and move the cursor to one of the side extremes.
- [ ] This is some kind of off-by-one error that was fixed by adding a small amount of padding around the default camera view frame. I suspect this has to do with how zoom is kind of awkwardly implemented: it only affected the top-side (and maybe left, I didn't check), only after zoom, and the default zoom state that worked flawlessly exhibits the same problem after zooming in again.
  - [ ] Specifically, I wonder if the zoom-scale-slider never actually reaches its target. If it ranges between 1 and 2, let's say, it would start at 1, zoom to 1.999, then zoom again to 1.001. This would affect the focal frame in the way that it is always *just too big* or *just too small*.

- [ ] UnitDetail Window
- [ ] Switchable with Button.Y / Key.C

- [x] Unit CO loaded
- [ ] CO loaded state affects adjacent board tiles.
- [ ] BoardPlayer.CoUnit : filter units => unit.coLoaded == true

- [ ] Command.Move calculates ambushes
- [ ] Command.Move has a way of reporting to callers when it has been interrupted (ambush).

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

- [ ] Target Reticle around Battleships.
- [x] Enable move and attack.

- [ ] COAffectedFlag needs to be open to multiple players.
  Naturally, because you should be able to see your opponent's ranges.
  - [ ] COAffected overlays should be color tinted then, huh.
  - [ ] Instead of tints, why not use a (non-obnoxious) variant of the area-target reticle that Silos and Battleships use?
  - [ ] Units are missing the CO-Boarded badge.

- [ ] Plasma Textures: Second frame, I believe.

More observations:
- Carriers *Launch* not *Drop*. The difference is Carriers can't move and release on the same turn, and also the one unit launched gets to *move and attack*. jfc.
- Advancing to Launch behaves exactly like you had just picked that air unit directly off the map, as if the Carrier weren't even there. It implants the air unit as the object and proceeds through the turn system from MoveUnit as normal. Actually... I don't think my animation system has an equivalent for this. Place is used to grab the Carrier, and always the Carrier. Hm.
- More on that, regressing from Launch returns to OrderStart. My system would have to advance to OrderStart, skipping ratify and such. I'll have to experiment with what I'd rather have happen: going back one stage makes intuitive sense and that's how my system is built anyway, but truthfully, if one launched a unit and then changed their mind, it probably wasn't to pick *the other unit*. Going back to the map might be a worthwhile convenience.
- Launch, further further, does not spend the Carrier. It can Launch both held units. 'Wait,' 'Attack' and 'Build,' of course, prevent any more Launches.
- Dropping TCopters, it's impossible to know which is which. Can I fix this in mine? Can I link UnitWindow to the cursor selection?
  - [ ] On ListMenu.cursorMove => inspectUnit(actor.loadedUnits[command.input])
- [ ] Because path arrows do not disappear when dropping, the game has special icon arrows to indicate a drop tile.
- These drop-tile icons appear above units, path arrows, etc. Do I need a second UI layer?

- [ ] Force UnitDetail open and right side during shop menu

- [ ] Write a goddamn method to tell menuGUI where the fuck to be. Jesus.

- [ ] Global controller proxy.
  InfoWindowSystem should ask if the showDetailWindow button is down, not specifically the right trigger. Changing that shit is annoying af.

- Source Game observations:
  - The game shows you every standby phase event in sequential order. You probably won't have 100 resupplies to see, but if you did...

- [ ] Add dummy IssueOrderConfirm step, which would get approval from the server.

- [x] The camera needs to emit an event when it stops moving. Or maybe it just has a getter that responds true whenever its target is in focus. This is less sophisticated, but I think it would suffice.
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
