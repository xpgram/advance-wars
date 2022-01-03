# Map Configuration

TODO Picture of rand gen?

The Map is the object which defines the game board and board interface. It's an abstraction layer above essentially a plane of MapTiles, shown to the right.

MapTiles themselves are responsible for tile-specific properties, which cover various referential details such as its Defense Boost value, whether it has been marked 'Attackable' or 'Traversable', and which Battle Unit if any is present within it.

The Map's domain is inter-tile behavior, with methods for retrieving a particular MapTile at some location, or for marking all tiles within range of some Battle Unit as actionable according to the present set of circumstances.

## MapTiles

[Pic of lone Mountain]

Let's describe what they are, first.

## Building The Game World

The map system in Advance Wars is dynamic. For any map, it reads a list of terrain-type instructions in the form of serial numbers, then builds one large, seamless map image for the players to play on. Aside of the very board-gamey nature of this map, the players shouldn't be able to tell it's discretely constructed.

This dynamic nature greatly simplifies the overhead in the level design process, but it also means the map system has to accommodate virtually every conceivable configuration of tiles. There can't be any holes in the process if there can't also be any guiding hands to ease around them.

So, from serials, the map constructs the board graphics in multiple stages:

### Object Assembly



### Tile Auto-Configuration



### Step Third, Whatever It Was



I should probably pin down what I actually want to cover.

- The Map API, probably; what is it capable of.
- How the Map is initialized, what phases it goes through.
  - How does a tile know how to match its surroundings?
- The sprite optimizations made to speed up draw()

So, the first thing I ought to do is set up the problem that Map solves.



1. Basic description of Map
2. The problems the game needs solving
3. How Map solves them, step-by-step