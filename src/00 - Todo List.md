# Next Big Objectives

Search `// TODO` for tasks hidden among the codebase.
Search `// IMPORTANT` for severe infractions on the project's design and my mental.
Search `// FIXME` for important todos which are neither 'important' nor 'todos'.

- [ ] Essays: Emphasize how I designed everything about the turn and event system to be easy to write. That's ++ design philosophy, dawg.
I was going through the source for awdor.com and I realized his turn engine is just an enum. There is sooo much middle management happening.
Granted, I don't know that system. Maybe there are benefits.
If you close the browser and come back, is it easier to assign the correct turn state? I haven't gotten that far in mine yet.
Although, I suspect if my player closed the browser, I wouldn't really care about whether they came back to a movement selection, you know? That seems needlessly granular.
But anyway, yeah. There is constant state checking because his system never just *knows* where it is like mine does.
- One failure of my design, I just realized, is that for online play it is incredibly easy to cheat. I'm not sure *how* but I know it's possible. Units hidden by fog should be unknown to the player, but the client knows always. If a hacker could get the game to log the objects of the map, I can't stop them. Ideally this would be information known to the server and shared only when necessary. Oh well. But anyway, good essay detail. Proves I think.


- [ ] Scene Transitions
  - [ ] Technical Implementation
    - [x] Scene switching mechanism
    - [ ] Scene destruction and memory freeing mechanism
    - [ ] Refactor Scene switching and construction to allow for re-entering.
          Current implementation has no mechanism for constructing a scene, and destroys scenes on exit.
  - [ ] Animating Transitions
    - [ ] SceneTransition class which describes animation state and time progress.
      - [ ] This naturally exists in a persistent space separate from the scene itself, though it will have access to the scene for shader application.
      - [ ] Mechanism for two concurrent scenes in memory at once, so a transition may wipe from one to the other without pausing in-scene animations.
      - [ ] Transitions have access to the display containers for both scenes for full control.


- [ ] Pointer controls: Click-Hold should start ShowUnitAttackRange and MoveCamera
  - [ ] I first need to figure out what "MoveCamera" means in a pointer context, though.
  - [ ] MoveUnit is cancellable by clicking on MapCursor when MapCursor is over a non-highlighted tile. This is fine, but feels a little quirky. Add a clickable HUD button that signals a cancel intent.

- [ ] Map.changeTerrain(pos: Point, terrain: TerrainType)
  This should handle the specifics.
- [ ] Map.changeTileset(mode: 'normal' | 'snow' | 'desert' | 'wasteland')
However, Bridge -> DestroyedBridge should probably be a tile variant option. I could let the server record mutations to the map you're playing on, but that sounds complicated.

- [ ] Map serial interpreter makes room for a variant number.
  - [ ] Use number packing to let one address carry both a 30-bit terrain serial and a 2-bit variant number.
  - This is probably the simplest way to save and construct-from-data Bridge tiles without weird, duplicate classes.
  - [ ] Figure out a way for `new Terrain.Bridge()` to accept the variant number.
    - I think I have to build-in the requirement that *all* TerrainTypes require their variant number for deliberation even though only a few types actually use it.

- [ ] Sight Map caching
  - [ ] What layer are they added to? Can they be simply frozen like other MapLayers?
  - [ ] While I'm at it, why are they imperfectly layered? There is consistently a .5 pixel overlap on some portions of the view. I suspect this has something to do with LowResTransform, but I couldn't really tell you why.
  I suppose it could also be a Pixi imprecision when scaling/placing independent layer items, objects which don't *technically* have anything to do with each other; Pixi doesn't *really* enforce a strict grid, you know. Maybe it does.

- [ ] Sometimes P4 gets stuck in the AnimateEvents turnstate before IssueOrderStart.
  - It's some issue with camera.targetInFrame() or whatever I called it; it only happens while at zoom stage 2 or 3 and is fixed by changing zoom levels.
  The camera won't move but it also can't yield control to the BSM.
  [ ] Create a dev button for posting camera state.

- [ ] Destroyable Bridges — same HP as meteors.
  - [ ] scenario.destroyableBridges == true changes a flag on all bridges on the map that activates HP and targetability.
    - I haven't worked on Meteors yet. Do TerrainObjects need a .destroyable flag to indicate they may be attacked?
  - [ ] Bridges may not be attacked while they have inhabitants; they should not be destroyable while a unit is also present.
  - Some maps might be made unplayable by destroyed bridges preventing any further player interaction.
    - If detected, this could result in a Draw. That would be funny.
    - I want to give Rigs the ability to use Material on new Bridges.
      - Rigs, while adjacent to a bridgable spot, may choose 'Build' (with an icon of a Bridge).
      - The player will choose an adjacent tile, much like ChooseDropLocation.
      - This location will be saved as a CardinalDir on the Rig itself.
      - The Rig uses its Capture mechanic to record progress toward the full build.
        - It would be fun to heartbeat-flash green the tile the Rig is building on during the CaptureEvent animation.
      - When the Rig moves, its capture is reset as well as its CardinalDir.
      - When a unit moves into the space the rig is working on, it is also interrupted.
        - This isn't necessary. The bridge only expands the movement matrix; nothing would be broken. I do think though that it's a design philosophy that tiles are only terraformable when they're uninhabited or are inhabited by self.
      - When a Rig finishes, the terrain is changed to Bridge with full HP (always destructible variant)

- [ ] Timer.every.max is always +1 by implementation; I'm too busy to solve this rn.
  (i.e. max = 1 actually occurs 2 times)
  - [ ] The default for non-repeating events is 0? It should probably be 1. e.repeat should be decremented before the extension check.
  - [ ] FlareIgniteEvent will need to be updated to reflect .every() changes.

- [ ] TrackCar doesn't respect sight map yet.

- [ ] Rigorous Typeface Access
  I don't know if it's feasible to only allow access to font assets that are *definitely* linked ... I mean, I guess I can think of a way. It's a little forceful. Anyway, a system which could verify on access that an assets is or is not loaded could throw an assertion error (the benefit being on strange load errors in real time, the assets would simply be missing, or would maybe default) telling me I've forgotten to link the desired assets. It might also be nice... to have bundles. Scenes don't actually do that much, I feel like they are the bundles, kinda.
  I dunno. Something to think about.
  I guess it'll be more of a problem when I actually start working on other scenes.

- [x] Range Reticle
- [x] Made an integral feature of MapCursor for easy access everywhere.
- [ ] Applied to CoAffected tiles
- [x] Applied to Silos

- [ ] Timer is skippable (max time, order chronology by until?, run update once [complete all tweens])
- [ ] Timer.every() has max occurrences setting.

- [ ] Square.stealth is distinct from .hidden and .hideUnit
  - [ ] In fact, .hidden is confusing and should be .obscuredByFog or something.
  - [ ] .hideUnit, which could be .unitVisible, is whether the unit is seen on screen; it's a player perspective setting. .stealth and .fog are about board state and are both useful to AI in a way that .hideUnit simply isn't.
  - Do subs have their own hidden setting? For stealth. Do a little investigating before changing anything.

- [ ] I have a new debug logging system: add lines for these components to help further diagnose the issue.
- [ ] CMD → Drop → CMD ∴ Status and HP are missing, but only if place === goal.
  - There is an update discrepancy between CmdMenu and IWS. Only one of them can have the preview objects as children, so when IWS wins (for whatever reason) CmdMenu's icons are left blank.
  I think the solution here is to give both containers unique children, not to solve the discrepancy. I need to retain animation control, however. And I can't let a list of roaming sprite objects grow without limit.
  Either:
  - Lent objects get destroyed when no longer necessary. Would Cmd do this? Would TurnState.close()?
  - A dictionary of preview containers are kept and updated, and named for their purpose. The system would request either 'terrain-info' or 'cmdmenu' then.

- [ ] I have a new debug logging system: add lines for these components to help further diagnose the issue.
- [x] IWS cannot refresh while transparency sliding.
- [ ] Problem's not fixed, though.
  This is about flickering when an indirect destroys another unit. (flickering of Details, not UnitInfo)
  Logs indicating what happens:
  - (frame 1)
  - cursor move (indirect)    [by animation step; maybe by MoveEvent]
  - cursor move (target)      [probably by DamageEvent]
  - target destroy            [by DamageEvent]
  - (frame 2)
  - inspect tile              [by workorders; target is obviously gone by now]
  - inspect tile              [by workorders]
  The reason I move the cursor around is to manage the camera. I move it around invisibly. I could, I suppose, swap in a focal point instead.

Todo List cleanup: (some easy ones)
- [ ] On-screen icon indicates when there are un-instructed units
- [ ] On-screen icon indicates when there are un-utilized bases
- [x] Terrain/Unit/Battle tab icons
  - [ ] Make them nice, tho
- [ ] Hide day counter during Shop
  - [ ] Related: refactor IWS.
        I'll need to do some thinking about the ideal implementation.
  - [ ] Slotting new widgets in should be easy.
    - [ ] Make use of the decorators pattern to add styles and behavior (mostly behavior) to ui widgets. I'll have to write all of this.
  - [ ] Windows don't slide independently, why are we treating them as such?
  - [ ] I need a kind of cascading system.
    - HudBar
    - Pushed HudPanel
    - SlidingPanel
      - Terrain Info
      - Unit Info
        - Damage Forecast
      - Details (DrawerPanel; gets side from parent)
      - Player Cards (gets side from parent)
        - Player Card (DrawerPanel; always open)
        - Player Card (DrawerPanel; gets side from parent)
        - Player Card (DrawerPanel; gets side from parent)
        - Player Card (DrawerPanel; gets side from parent)
  - [ ] A settable state for IWS configures which widgets it does and does not show.
    - [ ] Normal: All
    - [ ] Shop: Details (forced open), Terrain; or by convenience, All - hud
    - [ ] Hidden: None
- [ ] DisplayInfo.ts → Typefaces.ts or something, jfc

- [ ] Travel Car checks after each completed tile move if its current position is hidden, adjusts visibility accordingly.
  - I can't really do this one without mock-AI, though.

- [ ] CO Powers are triggerable from the CO Unit Command Menu. Probs doesn't spend the unit.
- [ ] Alt: CO Powers are triggerable from the Field Menu.


- [ ] Multiplayer
- [ ] Music
- [ ] Control indicators
  - [ ] GamepadObserver for each gamepad
    - [ ] VGP uses intent buttons mapped to GamepadObserver
  - [ ] Controls map and proxy

There be stuff to do, but I think the next major update has to be online play.
Everything else in battle mode is just polish, pretty much. I'm missing things like COs and such, but nothing *big,* you know? My brain needs a big new project to work on.
Plus, I need the online system so I can start developing it alongside the game's other features; keep the designs consistent and orderly.


- [x] CO units must be bought again (like double-summoned) to be produced.
- [ ] Indicate somewhere on screen that the CO command will cost funds? This is easy to forget, otherwise. Players need full consent, yo.
I don't even have the funds-cost-remaining widget written yet, so I guess we'll try to force it open whenever I do.

- [ ] Scene has a property called 'resources' which should be equivalent to Game.loader.resources, but I never use it. I think I never use it.

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


More observations:
- Carriers *Launch* not *Drop*. The difference is Carriers can't move and release on the same turn, and also the one unit launched gets to *move and attack*. jfc.
- Advancing to Launch behaves exactly like you had just picked that air unit directly off the map, as if the Carrier weren't even there. It implants the air unit as the object and proceeds through the turn system from MoveUnit as normal. Actually... I don't think my animation system has an equivalent for this. Place is used to grab the Carrier, and always the Carrier. Hm.
- More on that, regressing from Launch returns to OrderStart. My system would have to advance to OrderStart, skipping ratify and such. I'll have to experiment with what I'd rather have happen: going back one stage makes intuitive sense and that's how my system is built anyway, but truthfully, if one launched a unit and then changed their mind, it probably wasn't to pick *the other unit*. Going back to the map might be a worthwhile convenience.
  - OrderStart > MoveUnit(Carrier) > CmdMenu(Carrier) > MoveUnit(Carrier[0]) > CmdMenu(Carrier[0]) > Ratify
- Launch, further further, does not spend the Carrier. It can Launch both held units. 'Wait,' 'Attack' and 'Build,' of course, prevent any more Launches.
- Dropping TCopters, it's impossible to know which is which. Can I fix this in mine? Can I link UnitWindow to the cursor selection?
  - [ ] On ListMenu.cursorMove => inspectUnit(actor.loadedUnits[command.input])
- [ ] Because path arrows do not disappear when dropping, the game has special icon arrows to indicate a drop tile.
- These drop-tile icons appear above units, path arrows, etc. Do I need a second UI layer?         

- [ ] Alternate road preference for vertical or horizontal based on oddness of tile position. Sounds fun. I like complicated roads. The function which figures this out, though, only knows what *types* its neighbors are, not their location.

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

- Ideas for cmd 'Launch':
  - [ ] Chainable instructions
    - [{ action: Launch, which: 1 }, { action: Attack, focal: ... }]
      'One' instruction gets sent as a list of atomized instructions, which all get executed in sequence.
      This isn't how we're doing 'Launch' though; the additional instruction doesn't carry any unique meaning.
  - [ ] Launch ingress strategy
    - [ ] Instruction gets a depth parameter which refers to unit cargo.
    - [ ] 'Launch' sets depth to child# + 1 and resets the instruction data. BSM is advanced to MoveUnit and proceeds as normal. On ratify, 'Move' uses depth > 0 to unload and retain a cargo unit and place it on an empty square.
    - [ ] MoveUnit with depth > 0: on regress, ... I dunno. Maybe we push OrderStart again? The state stack probably regresses fine. MoveUnit might need a little tweaking, though.

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

- [ ] Re-rip the plasma textures: some of them are clipped by 1px. It's the second frame, I believe.
- [ ] Sea looks nicer, I think, but my frame-animation skills are a teense lacking. Update it.

- [ ] Z-Ordering and UI Objects — No standard.
  MapCursor, MenuWindow, TrackCar (probably), etc. define in their constructors their z-order place. This makes changes widespread and difficult to manage; these settings should be consolidated or somehow automatic.

- [ ] The cursor-control settings (such as trigger-movement frequency) used by MapCursor and ListMenu are similar but defined separately. Perhaps these details should have elevated scope?

- [ ] Transition effects between scenes: Game.transition will be a settable class object with start() hold() and finish() steps.
  - start() initates the transition. A callback or some other kind of signal indicates when the transition is ready for some kind of action (the scene change).
  - hold() is an update step which allows for animation while a scene is loading or something. If a scene transition takes longer than expected for some reason, this step keeps the transition effect visually interesting.
  - finish() initiates the final half of the transition. A callback or some other kind of signal (probably less used than start()'s) indicates when the transition is fully cleared and done animating.
  As you can see, we're merely operating an attack-hold-decay-release pattern. Release isn't described, but the effect could theoretically declare itself done before it actually finishes animating, at which point it would destroy itself or something.



CO Unit Effects:
- Make CO units more interesting.
- Vary unit-type choices (I mean, hopefully; I dunno).
- Another vector to balance COs over.

Mechanics:
- CO Zones give a base +10/10 to all units.
- CO Zones expand on every 6 segments.
- CO Power expands the CO Zone to the whole map, and has a special effect.
- CO Unit Effect is a special effect only for the commanding unit. This is introduced to hopefully include a little variancy in the CO unit choices. Maybe Gage is best on an indirect? Maybe Will on a 4-Movement Infantry is useful early on?

  Will
COP  +2 Movement to Direct Ground forces.
COZ  2Z. +20 ATK to Direct Ground forces.
CUE  +1 Movement if Direct Ground unit.

  Brenner 
COP  +3 HP to all forces.
COZ  3Z. +20 DEF to all forces.
CUE  +1 HP per turn on turn start.

  Lin
COP  Rainy weather. +2 Vision to all forces. See into hidden tiles.
COZ  1Z. +20 ATK/DEF to all forces.
CUE  +2 Vision.
  Creating FoW allows her bonuses to be useful anywhere. I wonder if her aggressive (1Z) meter-build style jives with that, though.

  Isabella  —  Inexperienced; latent clone power?
COP  +2 Movement, +2 Range to all forces.   (Yeesh. Overpowered.)
COZ  2Z.
CUE  
  I want to ++Luck, but how. And also why.

  Gage  —  Cool, calculated sniper.
COP  +2 Range to all indirect forces.
COZ  2Z. +10 ATK to all Indirect forces.
CUE  +1 Range? Is this too boring?

  Tasha  —  Fiery commander; rules from the skies.
COP  +2 Movement to all Air forces.
COZ  1Z. +30 ATK, +10 DEF to all Air forces.
CUE  

  Forsythe  —  Would never sink subs because ambushes are dishonorable.
COP  None.
COZ  5Z. No bar.
CUE  I wanted to invert, but. He only +10.

  Waylon
  Coward, pretends to be invincible.
COP  +270 DEF to all Air forces.
COZ  2Z. +20 ATK, +30 DEF to all Air forces.
CUE  

  Greyfield
COP  Replenish all resources.
COZ  3Z. +40 DEF to all Naval, Copter and Seaplanes.
CUE  
  I want to give him Snow, like uh... what's his name.
  +Resources is just meeehh without something to make them matter.

  Penny
COP  Random weather for 3 days.
COZ  3Z. All forces are immune to weather effects. (Only in COZ?)
CUE  
  Penny always felt like an after thought.
  I'm gonna give her Sandstorm, because Caulder's industry be ruinous.
  I guess maybe she should change the map to Wasteland then.
  ...
  What effect would Wasteland have?
  I'll have to think about it.
  Sandstorm + immunity to Sandstorm is kinda like +270 DEF. They're not functionally different. I guess her weather lasts longer. Hm.

  Tabitha
COP  5-Diamond meteor attack (6HP).
COZ  0Z. +50 ATK/DEF.
CUE  None. 0Z is the same thing.
  I think 8 HP damage is extreme. Maybe... that's fine. I dunno. 6 seems okay to me. She got a double-silo, basically. Silos have the same AoE, so really.
  Also, maybe her zone shouldn't grow?
  She has a *big* boost, and her power, especially if I've nerfed it, doesn't really justify the massive opportunity cost of going back to 0Z.
  Maybe the opp cost is fine actually. I might bring it back to 8 HP.
  I feel the player should get... well... the player should get to pick where the missile drops, but maybe they should do 6 HP then. The challenge is to make her more useful, not to buff her.
  Ooooh, I forgot that COPs also expand the COZ to the whole field for a turn.
  6 HP damage, and all units have 160/160? That kinda crazy.

  Caulder
COP  None.
COZ  3Z. +50 ATK/DEF to all forces.  +5 HP every day, all units. (wtf)
CUE  
  So. We gotta nerf him. But we gotta retain the spirit of the dogged persuit of unmitigated, raw power. But from a science angle. I want Sturm back, too, so we gotta differentiate.

  Sturm
COP  5-Diamond meteor attack (8HP). (Units travel unmitigated?)
COZ  2Z. 
CUE  ?