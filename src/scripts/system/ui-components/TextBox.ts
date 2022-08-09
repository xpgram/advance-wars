import { UiComponent } from "./UiComponent";

/*

I have to pee, so I'll write this pseudo-code quick.

[ ] Background
[ ] Text
[ ] Room for character portraits (probably above, right?)
[ ] Text is word-wrapped 
  [ ] A mask and a separate, hidden bitmaptext object is used to measure which
      letters should be shown during the typewriter effect.
[ ] Text that is measured to extend beyond the textbox bounds is seperated into seperate
    lines or textbox panels. Some pre-caculation is needed here.
[ ] Press A advances the text box.
[ ] Press A during typewriter skips the typewriter effect.
[ ] Hold B during typewriter speeds up typewriter effect.
[ ] Each advanced text panel adds to a text-log history.
[ ] text panels can be accompanied by function callbacks, like to move the mapcursor.

[ ] I'll worry about this later, but I want a paragraph style. Long lines of text that are
    automatically split do a scroll thing instead of wiping the entire box each panel.

[ ] After advancing the last text panel, the textbox does its closing animation
[ ] After its closing animation, it signals that it's done working (tells the
    turnstate to move on or w/e)
[ ] Press start skips all text and closes the textbox

*/

class TextBox extends UiComponent {

  constructor() {
    super();
  }

}