- [ ] Bridges don't spawn anymore?
- [ ] Plasma textures: some of them are clipped by 1px.
  - [ ] The horizontal beam
  - [ ] Any others?
    Check the source image. That'll tell me.
- [ ] Debug information (FPS, etc.) needs to go into a debug class that populates a debug visual layer.
  - [ ] Game.init()'s process should look like this:
    - [x] Setup Pixi app
    - [ ] pre(): Load universally useful resources and save them as Game.resources
    - [ ] On completion, do some post setup (new DebugLayer()), assign the first scene and start the game loop.
- [ ] Add gamepad/keyboard support
  Keyboard should be so easy. Gamepad is the tough one (but it looks easy-ish, anyway.)
- [ ] Add a cursor and a Terrain Info dialog window.