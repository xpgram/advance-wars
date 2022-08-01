<img src="/docs/demo-reels/title-banner.png">

You like Arial font?

Anyway.

This project is a rebuild of the 2008 game titled above.  
It was chosen because it's a really good game, and because I won't have to draw any art.

You can play the current public build [→here.](https://xpgram.github.io/armed-revolt/game.html)

The controls are listed below the game window, but I don't have button prompts in the UI yet, so they may be confusing if you're not used to Z,X + ArrowKeys for web games. Or how Advance Wars plays. I'll put a map somewhere soon.

You can also play with a PS4/5 remote.  
Other gamepads are not guaranteed to work yet, but you can try.

Oh, I should mention.  
This project is not necessarily for the public. I know Nintendo is litigation-happy. One of the key objectives here is just to demonstrate my skill. The rest are, you know, private fun with private people.

Also, there are a lot of gifs below, so... rip in pieces your PC, maybe.

# Features:

<img src="" width="100%" height="2.5rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/shoreline-effects.gif" width="40%" align="left">

<h2 align="right"> Self-Assembling Tileset </h2>

<p align="right">
Nearly any arrangement of terrain is representable. Each tile examines its neighbors during construction and figures out for itself which sprites it needs to blend in with its surroundings.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/terrain-ui.gif" width="40%" align="right">

<h2 align="left"> Terrain Info Panel </h2>

<p align="left">
Every terrain type (and troop type) has its metadata hooked up to the UI panels to answer your burning questions about wheat fields and rock in ocean.

<p align="left">
You can open the detailed panel with left-trigger or Shift.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/troop-pathing.gif" width="40%" align="left">

<h2 align="right"> Troop Pathfinding </h2>

<p align="right">
Troops travel the path you tell them to when moving. And so, when you draw a path that's too long or too rugged for your poor little bike to handle, the path is recalculated to always be valid, preferring the old path as much as possible.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/attack-animation.gif" width="40%" align="right">

<h2 align="left"> Troop Combat </h2>

<p align="left">
Troops <i>can</i> attack other troops, and the whole process is animated, too. The UI even estimates your damage and risk, and lets you see where your distance attackers can actually reach.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/contextual-actions.gif" width="40%" align="left">

<h2 align="right"> Contextual Actions </h2>

<p align="right">
The command-menu system triggers different selectable options depending on what unit you're commanding and where you're moving them to.

<p align="right">
You can also load troops into other troops into other troops recursively. Isn't that fun.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/silo-animation.gif" width="40%" align="right">

<h2 align="left"> Animated Special Actions </h2>

<p align="left">
Explode!

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/turn-splash.gif" width="40%" align="left">

<h2 align="right"> Up to Four Players </h2>

<p align="right">
For now, anyway. Main limitation is art.  
Also, too many players makes for a <i>slooow</i> game.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/player-visibility.gif" width="40%" align="right">

<h2 align="left"> Stealth and Visibility </h2>

<p align="left">
Some units, like the Submarine, can hide their presence and ambush enemies who attempt to travel over them. Each player on their turn can only see the information known to them.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/flare-animation.gif" width="40%" align="left">

<h2 align="right"> Fog of War </h2>

<p align="right">
Battles can be held with limited-information, too, where hidden troops are much more common and troops which can reveal enemy hiding places are suddenly not unimportant.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/minimap+explore-fow.gif" width="40%" align="right">

<h2 align="left"> Minimap </h2>

<p align="left">
A full-picture view of the battlefield accessible at any time. It also shows you where the camera's view is and will auto-move said camera with directional inputs or to wherever you mouse click.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/map-size.gif" width="40%" align="left">

<h2 align="right"> Large Maps </h2>

<p align="right">
Maps can be pretty big because the game makes use of texture caching to skip redundant work on its 2800+ tiles. Or more than that, maybe. Larger than 70x40 makes the minimap in-<i>aesthetic.</i>

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/map-design.gif" width="40%" align="right">

<h2 align="left"> Map Editing </h2>

<p align="left">
Currently dev-only, but it's mostly just missing UI. And a place to store the data. This is actually accessible (in dev builds) in the middle of any battle.

<img src="" width="100%" height="1rem">


<!------------------------------------------------------------------------------------------------->
<img src="/docs/demo-reels/title-screen-10s.gif" width="40%" align="left">

<h2 align="right"> Scene Pattern </h2>

<p align="right">
It's not, or won't be, just battling all the time. The game is already written to enable different modes whenever they're built, each working independently and requiring only the assets unique to their function. Such as this title screen.

<img src="" width="100%" height="1rem">