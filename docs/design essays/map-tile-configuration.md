# Map Construction

TODO Picture of rand gen?

The Map is the object which defines the game board and board interface.

It has three main jobs:

1. Coordinate the initial instantiation and setup of the board.
2. Provide a few convenient inter-tile algorithms.
3. Provide references to individual tile objects, which themselves answer questions about their particular state.

We're talking about the first one here.

## Building the Game World

Maps are large, complicated objects. They're made up of hundreds of individual tiles, a number that grows exponentially with the size of the board, and each tile itself is made of multiple visual layers and effects.

[img: 5 primary layers of a map tile: sea, land(cliff), top, glass, unit]

This is a lot of sprites to have on-screen at once, if done naively.

### Sea Layer

Sea tiles, much like the Plains tile, are generally numerous as they are a foundational effect for many other terrain types. They're also animated, which means they're slightly more expensive than your typical sprite. Each one has its own sub-process where it figures out which frame it should be and where to keep that data.

All sea tiles are in sync, though; they all update with the same next frame at the same time. So, all those sub-processes are actually doing a lot of redundant work, calculating the same answers over and over again.

We can easily sidestep this issue by having one tessellated sprite do the updating once and then simply have that one image repeated across the entire length of the board.

[image with tessellated sea anisprite, w/ transparent land sprites overtop arranged in a small island]

This, in a mathematical kind of way, is similar in principle to a concept known as caching. We have essentially calculated the result of one tile, saved the result (in a sense), and used that to inform the visual state of other tiles elsewhere.

We'll use this same strategy a few other times this guide.

### Land Layer

[thought vomit; rewrite]

Pixi's graphics system is structurally a scene graph. This means that sprite placement is handled in a tree-like fashion. Sprites are made children of other sprites, which are children of containers, which are children of other containers, which are collectively all children of the root container; the starting point.

Pixi's draw step essentially looks like this: it descends down the list of children until it reaches an endpoint. It then renders that object, holds that information somewhere, and ascends one level back up the tree. If there are no other children for that particular node, it then renders that node itself with all its pre-rendered children displayed above or below its own graphics as a microcosm of the grander scene.

This process is repeated until it returns to the top-level root node again and the whole thing can be rendered completely.

For images that don't really change, however, there is a lot of redundant work being done here.

Pixi has its own optimizations for this problem, but it can't know everything. You can tell it you're done tweaking an object by setting the cacheAsBitmap property on one of these scene graph nodes.

This is what I've done for the bottom land layer. The whole thing is contained within its own node and the whole thing can be marked visually immutable, cutting off that entire branch of the render tree.

There are two layers to the land system, though.

### Land Layer - Top

Some terrain types are very tall and overhang their neighbors above them.

[img: Mountain overhanging plain with infantry]

This is easy to manage dynamically, but top-layer sprites can also be numerous and can also benefit from visual freezing. But visual freezing, naturally, breaks dynamic ordering, or in the case of capturable bases, color changing.

This is where the caching strategies finally get tricky.

[img: illustration of rows system I developed]

I needed a system that filtered graphical objects during the add-child-to-node process to respective z-layers which could be frozen or unfrozen independently. I mean, I didn't need it, but the trade-off is larger maps, so.

[MapLayers and layer config / cache update / etc.]

### Panel Layer - Map UI





## Tile Orientation

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
