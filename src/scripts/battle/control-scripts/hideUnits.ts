import { ControlScript } from "../../ControlScript";


/** Hides units on the map, but reveals units based on player input. */
export class HideUnits extends ControlScript {
  defaultEnabled(): boolean { return false; }

  private setUnitsTransparent(hide: boolean) {
    const { gamepad, allInPlayUnits, players } = this.assets;

    const showUnits = (gamepad.button.leftTrigger.down);
    const showStatusUnits = (gamepad.button.rightTrigger.down);

    allInPlayUnits.forEach( unit => {
      const statusUnit = unit.faction === players.current.faction && unit.statusApplied;
      unit.transparent = hide && !showUnits && !(showStatusUnits && statusUnit);
    });
  }

  protected enableScript(): void {
    this.setUnitsTransparent(true);
  }

  protected updateScript(): void {
    const { gamepad } = this.assets;
    const { leftTrigger, rightTrigger } = gamepad.button;
    if (leftTrigger.changed || rightTrigger.changed)
      this.setUnitsTransparent(true);
  }

  protected disableScript(): void {
    this.setUnitsTransparent(false);
  }
  
}