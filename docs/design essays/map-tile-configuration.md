# Map Configuration

TODO Picture of rand gen?

The Map is the object which defines the game board and board interface.

It has three main jobs:

1. Coordinate the initial instantiation and setup of the board.
2. Provide a few convenient inter-tile algorithms.
3. Provide references to individual tile objects.

We're talking about the first two here.

## Tile Properties

[Pic of lone Mountain]

Let's describe what they are, first.

## Building The Game World

The map system in Advance Wars is dynamic. All it needs is a grid of serial numbers and the rest is auto-configured at run time. Nearly any map conceivable is also playable.

The tilesets used for these maps, though, include [a lot of] borders and pairings to smooth over its grid-like appearance. Which means, for them to look good we need a system that knows which tiles can be matched together and how.

This all happens in multiple stages.

**Map Initialization**
a

**Map Contents**
a

**Preliminary Configuration**
a

**Tile Auto-Configuration**
a

**Draw Optimization**
a

**Stage Shader Animations**
a



I should probably focus on map's design.
The initialization step is too granular. Nobody cares.

Map is constructed via:

- TerrainObjects: Properties and graphics for an individual tile.
  Cover auto-configuration
  Maybe cover the construction phases briefly. Serial→Object→Validating/Pruning→Configuration(shallow seas)→Graphics.
  Cover overlay effects and the shader texture-caching trick.
- MapLayers: Graphics-set hierarchy management.
  Good segway: I use a different caching trick to massively reduce redraw on static map objects but which still allow dynamic z-ordering.
- MapTiles and Algorithms: How moveable/attackable tiles are determined.
  MapTiles are containers for objects and tile settings (visual, temporary values, etc).
  Map uses these to figure out where units can move and such.
  Neighbor matrix gotta get covered here, if not in TerrainObject. Mention how I made map boundaries safe during algs. (Mention how I would make it safer if rewritten (infinite plane)).
