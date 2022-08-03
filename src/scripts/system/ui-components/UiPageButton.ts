import { Facing } from "../../battle/EnumTypes";
import { RelativeDirection } from "../../Common/CardinalDirection";
import { UiButton, UiButtonTextureSet } from "./UiButton";


// Extends UiButton.
// Differentiates between left and right direction.
// Right flips the texture.
// Otherwise exactly the same.


export class UiPageButton extends UiButton {

  protected facing: Facing;

  constructor(facing: Facing, textures: UiButtonTextureSet) {
    super(textures);
    this.facing = facing;

    if (this.facing === Facing.Right) {
      this.sprite.anchor.x = 1;
      this.sprite.scale.x = -1;
    }
  }

}