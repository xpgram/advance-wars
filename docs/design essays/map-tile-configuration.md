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

Map is validated for basic details, like every player having an HQ

Map is constructed with a neighbor-safe perimeter

Map converts the grid of serials into MapTile objects with TerrainObject children.

Tile legalities are enforced. This is a holdover from when maps were auto-generated, but it's important. Beach needs certain things to be true in order to display.

MapTiles are configured. This has to do with visual effects like shallow seas.

MapTiles are initialized, which is where the tileset juice happens.

MapLayers optimizes the map for draw speed.

Shader animations are started.



I should probably pin down what I actually want to cover.

- The Map API, probably; what is it capable of.
- How the Map is initialized, what phases it goes through.
  - How does a tile know how to match its surroundings?
- The sprite optimizations made to speed up draw()
