# Map Construction

The Map is the object which maintains the pretty game world in War Mode.

It acts as an interface for the plane of MapTiles when questions of the board need to be answered, and it broadly coordinates the technical and visual elements of the board image.

## Terrain Object

I'll first briefly cover the auto-configuration strategy of the board in general.

Maps in Advance Wars are highly configurable, and in some iterations dynamic: tiles can change from one kind to another mid game.

A reputable studio might devise tools for level design regardless, but this style which allows even players to design their own maps especially demands a system which can handle tileset borders and pairings automatically and instantly. [long sentence]

The **TerrainObject** is a class type which describes the visual and physical characteristics of a particular kind of Terrain on the board. Roads are easily traversable, Woods provide higher defense, and both have different rules for how they should look based on their surroundings.

This is all figured out in a couple different phases.

**Instantiation**
Every Map first begins as an array of serial numbers indicating their Terrain type. These are easily mapped to their indicated terrain classes which host their serial number as a static- and member-property.

**Validation**
A brief step which ensures the map is of legal configuration.

Each Terrain type has a validation method which confirms its surroundings. The result of this function call can be used to either reject the map entirely or simply smooth-fix these problems on the fly if the map is auto-generated.

**Configuration**
Some tiles require a little extra information post-instantiation to determine how they should look. Primarily this is for Sea tiles which need to know if their shallow or deep water.

In the case of Sea tiles, technically... this could be handled during orientation. Much of this system was developed very early on in the project, but even so, this step is technically sound if underutilized.

**Orientation**
Which tile / positioning

Explain NeighborMatrix and the tileset naming scheme.

**Overlayer Construction**
The silhouette or 'whitemask', and the arrow, and I guess the drop arrow.

Cover whitemask shader optimization via TextureLibrary.

------

And with that, the game world is fully built.

Well, almost. There are a few more steps which I'll cover in the next section.

## MapLayers

**MapLayers** is a depth-access-system I built to coordinate z-ordering and image caching.

Depth-access here just means that Pixi's containers, its scene-graph, is a parent-child node system and the Map involves a lot of child relationships to correctly display everything.
