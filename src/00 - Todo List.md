# Next Big Objectives

- [ ] Multiplayer
- [ ] Music
- [ ] Control indicators

- [ ] Dev pause mechanic fails to update controls. I think controls are in... actually, they might be in globalTicker, which would kinda explain the frame-perfect thing you need for it to actually work.
- [ ] The dev controller is separate from the virtual gamepads, but I'm not sure if it's different enough. If I moved the VGp update to scene, but left DevKb update in global... I'm not even sure I ~can~ do that.

- [ ] Scene has a property called 'resources' which should be equivalent to Game.loader.resources, but I never use it. I think I never use it.

- [x] Add pause and frame incrementer
  - [ ] Now I'm just concerned it breaks something.
  - [ ] MapCursor still doesn't play nice.
    - [ ] Because Game.scene.ticker get started() and this makes it independent of the main loop. I can make it part of the main loop by moving the update() call to scene's update step, but this makes the app reeaally slow for some reason. Iunno.
    I'm leaving it be for now.

- [x] Camera refactor: bugs and integration
- [ ] manualMove can't move the camera's target transform fewer than 2 tile spaces away, for some reason.

ShowUnitAttackRange:
- [x] Allow camera movement
- [ ] Does it actually make sense to maintain the position of the map cursor? It's confusing how it has the same behavior as a normal camera move but then snaps back.
  - [ ] This would be annoying to implement, but if I had the track car turn into a bubble that floated around the periphery of your screen whenever it wasn't in view, that would probably help.
    - [ ] Bubble graphic
    - [ ] Visible only when focal is at least half out-of-view
    - [ ] New track car built from actor is a child of bubble graphic
    - [ ] Bubble graphic is a member of the screen-ui layer
    - [ ] Bubble floats around the edges, intersecting the line between the camera's center and the actor's position.

- [ ] Multi-controller support.
  - [ ] Board Players, or some association, knows the boardplayer-to-controller mappings.
  - [ ] Controller Proxy's context is switched to the new controller on turn change.
  - [ ] 'internet' is a keyword controller context that signals "wait for server updates." It is only relevant in online play, for which there can only be one controller player (because of fog of war).
    - [ ] Single-hardware users could open two browsers, though. Can the controller bind process allow for different same-hardware clients to have different controllers?
      - I might need this for testing purposes, even. Well, not *need*, but I will have two browsers open while developing online play a lot, so I'll have plenty of time to build this behavior.
  - [ ] TurnStates ingressed to from the internet context still allow the perspective player to pause/quit/etc.
  - [ ] keyboard controls are always in-focus
  - [ ] Some kind of report or event happens when bound controllers are disconnected
    - [ ] On disconnect, the system waits for one of several events:
      - [ ] The controller reconnects, is present in the controller list, and listening is resumed.
      - [ ] The player presses a button on an unknown controller and binds it to their player context.
      - [ ] The player presses a button on a known controller, the system prompts for confirmation that this controller will be shared, and the user confirms. The controller is then bound to their player context.
      - [ ] The player presses a button on the keyboard and confirms they will not have a controller.

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

- [ ] Write a goddamn method to tell menuGUI where the fuck to be. Jesus.

- [ ] Global controller proxy.
  InfoWindowSystem should ask if the showDetailWindow button is down, not specifically the right trigger. Changing that shit is annoying af.

- Source Game observations:
  - The game shows you every standby phase event in sequential order. You probably won't have 100 resupplies to see, but if you did...

- [ ] Add dummy IssueOrderConfirm step, which would get approval from the server.

- [ ] Dev button for grid: top and left edges, over bottom layer

- [ ] Alternate road preference for vertical or horizontal based on oddness of tile position. Sounds fun. I like complicated roads. The function which figures this out, though, only knows what *types* its neighbors are, not their location.

- [ ] Refactor InfoWindowSystem
- [x] Instant move InfoWindowSystem on turn change.
- [x] Instant move InfoWindowSystem on return from MoveCamera state.
- [x] Instant move InfoWindowSystem on FactoryShop menu open.
- [x] Force open UnitDetail
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
  'Legal' here doesn't mean all that much; I'm not going to implement server-side distance, terrain and fuel checking because  oh  my  god  that would take forever.

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
- [ ] Player Linking System
  PlayerList
  - playerId (login)
  - boardPlayerNumber(s)
  - controller(ref) / keyboard / Internet
     ref needs to persist between unplug/plugin somehow
     but also be reassignable
- [ ] Controller Proxy System
  - proxy.gamepad.button.A.pressed
    proxy.gamepad => players.current.controller
- [ ] Button Mapping System
  - get confirm() { return proxy.gamepad.button.A }
  - get cancel() { return proxy.gamepad.button.B }
  - get moveAxis() { return proxy.gamepad.axis.dpad }
    - axis.dpad.add( axis.leftStick ) => axis (point x [-1, 1] y [-1, 1])
- [ ] UI Event-Messaging System
  When online functions fail to authenticate, or whatever, a message should pop in
  from above to let the player know what's up.

- [ ] For FoW, track car should be invisible when not in sight range, and vice versa.
  - [ ] When the sight map is generated, and every time it's updated, construct a giant mask from all the seeable tiles.
    - This can just be squares, no need for complex mountain shapes. (Actually, is that true? I'll need to see source game.)
    - [ ] Track Car uses this white/black big-sprite as a mask.

- [ ] TurnModerator has an unimplemented property called 'perspective' which returns a player object.
  This is to handle visibility and such; the perspective player is the client player.
  - [ ] In local matches, the perspective player is always the current turn player.
  - [ ] In online matches, the perspective player is the login player.
    - [ ] login IDs are only required for online play. Local matches are fine, there's just a bit of controller matching.
    - [ ] Trying to ingress from the Online menu button (to the menu with options: Create Room, Join Room, etc.) prompts an unidentified user for login information (sign in, sign up)


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
