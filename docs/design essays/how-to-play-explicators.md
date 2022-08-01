
# What do...?

I need to collect a bunch of assets which explain what this game is and how to do literally anything. Some of these assets might actually make it into the game itself.

Q: How get Pixi save texture [x] and then download that to your PC [ ]?
I suppose it doesn't matter, like, *too* much, maybe; but I want to get the resolution right.

Aspect Ratio: 5:3
Resolution: 320x192


## Feature-set

I'm gonna start by cataloguing all the things I've added that I might include.

All of these will be accompanied by a little gif-video clip.



The last ffmpeg settings -> -filter:v "crop=1597:959:0:74"
This was with x5 I think? So ~1600x960

This was how I stitched together clips
ffmpeg -i turn-splash-red.mkv -i turn-splash-blue.mkv -i turn-splash-yellow.mkv -i turn-splash-black.mkv -filter_complex "[0:v] [1:v] [2:v] [3:v] concat=n=4:v=1 [v]" -map "[v]" 0-out.mkv

[ ] Collect a static (high-quality, not gif) banner from the title screen.



## Intro [I'm working on it]

The primary drive is to... well. Honestly, it's all the fun I have. But the *second* primary drive—the *bi*mary drive, if you will—is to show off to employers. I am very cool, after all.

If you happen to be an employer.

Uh.

I dunno, I'm hard to reach sometimes.

I like working on games. I can work on other things.  
—Let's just get on with the presentation.

## Features

There are quite many, so I'll break them up here.

[Table of contents with links to sections]
1. Game Board
2. Troops
3. ...

TODO Demo trailer playground
I need maps to add variety to everything you see.
I could... demo the things I want to do in the actual game, I guess... since that has more dev features.

### Game Board

[StageBuilt] [FootageAcquired]

[x] [x]
Auto-configuring tileset + animated shorelines and terrain types
[I'll show that one island in the middle of Greyfield Strikes]

[x] [x]
Terrain details linked to UI system
[show the details window as the cursor slides over a couple things: wood, city maybe]

### Troops

[x] [x] [ ]
Troop Pathfinding
[show the mapcursor circling (squareling?) around a lone helicopter "Spinny Helicopter"]
[Also, I could show Infantry travelling infinitely through the sea to capture the yellow HQ. That would be funny.]

[x] [x]
Troop movement and attack animations
[show anti-air attack and destroy heli in Waylon Strikes Back]

[x] [x]
Contextual actions
[show a Rig w/ already selected tile where it can only Wait, then it cancels and moves to a tile w/ a Suppliable infantry and something else]

[x] [x]
Troop-inside-troop recursion
[On "Contextual Actions," show an infantry->Rig then a Rig->Lander]
  [show an Infantry loading into a TCopter, then that TCopter loading into a Cruiser]

[x] [x]
Player-to-player visibility rules
[show P1 hide their sub, *cut* show P2 moving a ship over that sub with ambush and everything]
[this can happen right before the flare footage]
[we'll probably do this on History of Hate. Show a sub dive and move, then show the opponent getting ambushed by them.]

[x] [x]
Fog of War
[show a Flare revealing a portion of the map]

[x] [x]
Large Explosions
[show a Silo]
[do this on "Time Map"]

[x] [x]
Cool distance cannons
[show a Battleship moving with its giant reticule and attacking something beyond a mountain range]

[x] [x]
Espionage and Headquarters-seizure
[show an Infantry surrounded by Yellow units moving into and capturing the Yellow HQ]
[added yellow to bounty river]

### UI

[ ] [?]
Factory shops
[show a regular factory; page switching]
[Add page arrow first, though]

[x] [x]
Minimap and click-clicky
[show the minimap camera being moved around by the mouse; also show camera zoom]

[x] [x]
Up to four players
[show the player dialogs sliding in, cut, show each pre-turn animation in brief, cuts abound]
[I might do this on Jay Islands or Land's End]

[x] [x]
Neat Title Screen and no Title Menu
[show ingress from title to map selector]

### VFX

[ ] [ ]
Shaders..?
I don't have the burn-away yet. But I'll know where to put it.

### Input

[ ] [ ]
Gamepad support (but probably not yours; DS4/5 accepted)
[show...?]

[ ] [ ]
Click?
[minimap already shows this]

[ ] [ ]
Dev tools
[show a montage of Flare animation pausing, open shops anywhere, the devlog retrieved from the console prettified by some text editor, maybe the extra-camera-bounds view]
*These are automatically disabled in public builds.

### Other Modes

[x] [x] 
Map Editor
[dev only, but you know]
[I want to evoke the random-built maps of yore]
[My map editor set is based on Jay Islands, maybe I could connect the footage? Like, "look! you can change the map!"]

[x] [x] 
Rigs can build stuff
The features were built in tandem, so.. I may as well display them that way, I guess.

[ ] [ ]
Meteors and plasma can disappear
I might group this as well since the animation is... well, there isn't one.

[ ] [ ]
Carriers can create seaplanes