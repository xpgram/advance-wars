import { ControlScript } from "../../ControlScript";


/** Hides units on the map, but reveals units based on player input. */
export class HideUnits extends ControlScript {
  defaultEnabled(): boolean { return false; }

  // props


  protected enableScript(): void {
    // TODO This script takes the other half of the MoveCamera factor-out op I'm doing.
  }

  protected updateScript(): void {
    
  }

  protected disableScript(): void {
    
  }
  
}