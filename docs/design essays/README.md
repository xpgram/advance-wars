I be writin' an essay, dog.

# Advance Wars Web

TODO Picture

A clone of "Days of Ruin" (2008) written with Pixi.js and a sound API whenever I get around to it. You can play the current public build [here.](https://xpgram.github.io/armed-revolt/game.html)

I have (or I will have) various essays about the game's construction linked here.

- [Map and Tile Configuration]()
  How the map generation or construction happens; how does a Beach tile know which direction to face.
  Optimizations to speed up draw()
- [Map Crawler]()
  The search-pattern the map uses to identify moveable targets for allies and actionable tiles for hot actions.
- [Tile- and Unit-Type Code Generation]()
  The python scripts and datafiles I used to save myself looots of time.
- [Turn System and Board Events]()
  Structure, Its simple component toggling nature
  Its built-in failsafes
  How it builds a unit instruction
  How it handles events and animation
    Should I touch on animation techniques? My slider class? Slider, Pulsar and such are probably not interesting enough to get their own essay.
  Broadly, how I've built it in preparation for eventual online play.
- [Battle Units]()
  I imagine we'll talk about pathfinding, the player-team system, the numerous questions asked of them and how they know what they're capable of doing at any moment, etc.
- [Camera]()
  I'm recently proud of it. It's unfinished.
  It zooms.
  It pans.
  It moves into place before board events happen.
  It keeps the map in check: not too far out, always centered when small.
- [UI System]()
  I'm not... sure. It's pretty hacked together, you know.
  It stays out of the way, it auto-updates with new info, it waits to update until able (not while sliding off-screen)
  I could also talk about the unique problems it faces. I'm not using any kind of auto-positioning system, like CSS, which is *why* it feels so hacked together.
- [Command Menu and Menu Generic]()
  Its separated into a functional and a drawable object.
  Its option=>result style interface.
  How the options are populated and how I get icons in there.
- [The Scene-Pattern Separating Game Modes]()
  Not really utilized, but I could write a short blurb about my future plans.
- [Custom Shaders]()
  Not much to say about the shaders themselves. This might be better titled "Interactable Tile Animations" or something.
  We can talk about the strategy for implementing time-expensive shader operations for each tile shape without expending that much time.

Probably more, but this is a lot of essay so far. We'll work on it.