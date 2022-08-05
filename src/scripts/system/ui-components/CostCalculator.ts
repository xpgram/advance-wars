


/*

This is a temp-space where I can work out an idea. Probably won't make it as an official class, per se.

I have added a FundsCalculator UI component to CommonElements, but it is very hacked together.
I want to see if I can come up with a good refactor strategy that would blend nicely with this
UI ecosystem I'm working on.

The base components might look something like this:
 - Background (with styled borders)
 - 'F' Funds icon
 - Arrow pointing from one value to another
 - Left numeric value
 - Right numeric value

No calculating actually happens here.
However, I do need explicit references after this thing is built to the numeric text elements.
But if I build it like this:
 - UiComponent
   - LeftNumber
   - RightNumber
I can't reference UiComponent.leftNumber.text because UiComponent doesn't know what that is.

So the goal is to figure out *what is* the most comfortable construction here.
Do I expand UiComponent to have inferrable references to important children?
Do I extend UiComponent into a separate class, but separate things like the bg?
What if I wanted a tri-numeric display? Can this new class not accomodate that? Should it?

*/

