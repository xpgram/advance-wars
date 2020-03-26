- [ ] Re-rip the plasma textures: some of them are clipped by 1px.
- [ ] Sea looks nicer, I think, but my frame-animation skills are a teense lacking. Update it.
- [ ] Refactor unit sprites
    - [ ] (On a different sheet) All have an 'exhibit' image matching the dimensions of landscape images for terrain.

- [ ] Implement Team & CO classes
- [ ] TurnState: Start→Move→Anim→Command→Cancel→Start loses the player-drawn path
- [ ] Activate TravelCar when revealing attack range
- [ ] Square.hideUnit → getter/setter and immediate unit display change
- [ ] Clean up Window UI classes

- [ ] Game loop addition → Request Queue
    This maintains an open list of callable functions which all return a boolean.
These functions are called every loop until they return 'true', in which case they're request is
considered fulfilled and they are removed from the loop.
    This setup saves me the trouble of trying to figure out when an order should to be delayed to
since each one can just keep trying until they work.

Map.generateTravelMapBase sets every reachable tile as attackable since they technically are,
but we need more sophistication.
- [ ] Boats which cannot attack land or air units should not list land tiles as attackable.
- [ ] If a tile is only attackable by spaces already inhabited by allies, it is not attackable.
- [ ] A unit cannot attack tiles with units it can't target. I may have already done this.
- [ ] genMap(), when it has reached the end of a path, should light up all tiles within unit range **if** unit can move and attack.
    - [ ] Else, light up all tiles with manhatten distance in-range. This will have to be a separate loop, probably. We only need to check a square of area (2x+1)^2, where x is max range, though.
        - [ ] In fact, use that formula to speed up genMap() culling in the other methods.

It will be a massive undertaking to scope this out, but:
- [X] Applying masks to every map square sprite is slow as 5 asses.
- [ ] Is it also slow to put graphics in a layer, more in another, and mask the second to the first?
    - [X] This will treat the first layer like one big, flat sheet, though.
- [ ] Spotlight [subtract] (Large Square [subtract] Terrain Shape)
    I doubt this is doable; it's basically masking, and Pixi I _don't think_ lets you play with textures like that. I wonder, though...