/*

First, this is entirely unnecessary: Advance Wars doesn't *need* something this robust.
At least, not now. The main benefit to what I describe here is modularity, and more
specifically, context switching. Advance Wars only has one real context: Menu Controls.
I could add one for Debug, but... eh.

All that said, an improved system is never useless, just more work.

(For the record, I knew way back when I implemented the controller class that it was
a naive approach and that an Action—→Listener pattern would have been more complete,
I just didn't care much.)

* A note on usage.
* 
* This button class is designed to be modular and to expand on the input device the
* user might be operating. Put another way, a gamepad has typically no more than 30
* inputs, but your virtual button configuration could be hundreds of inputs long.
* So, this 'button' should describe an action, not a key, and should singularly
* focus on that action's operation.
* 
* Of course, the action in question would not be described here, so this detail may
* be irrelevant.
* 
* As a general rule, a button instance should only control one instance, though it
* technically may inherit callbacks from multiple.
*
* For buttons like 'Cancel' which may control multiple different kinds of actions,
* I recommend either splitting this functionality into more specific VButton contexts,
* or connecting the button to an 'interaction layer' which delegates the input to
* one entity by some sophisticated method rather than to each entity to then hash it
* out amongst themselves.
*
* The reward for all this is that actions can be mapped to input devices from an .ini,
* a .json or an .xml and conflicts can be resolved by input contexts in the same or a
* similar file. So, consolidation, de-coupling, in other words. Entities observe buttons,
* define behavior; button configs define mappings and contexts, the 'on/off' switch.

*/

class Button {

    /** Used to indicate button when instance is unknown. */
    name = "";

    /** Internal button state; whether it is signalling. */
    private down = false;

    /** The time window within which the button must be pressed and released to be "tapped."
     * A multitap is abandoned when the time since last press/release signal has exceeded this value. */
    private tapTime = 0.3;

    /** Counts in instances how many taps have occurred in succession. */
    private tapCounter = 0;

    /** Records in millis the time of the last state change. */
    private timestamp = 0;

    /** Records the last input event's source controller. Useful for identifying controller
     * changes from one kind to another; say, a gamepad to the keyboard. */
    // TODO Prolly make this an enum
    private inputSource: 'playstation' | 'nintendo' | 'standard' | 'keyboard' = 'keyboard'; 

    /** The time window (seconds) in which logical-AND-mapped button signals must coincide
     * to trigger this one. This only matters for certain configurations. */
    private multipressWindow = 0.08;

    /** How long the triggered context will wait in queue before executing.
     * Useful if you'd like to give overriding actions time to queue up before resolving. */
    private actionDelay = 0;

    /** The list of all listeners attached to this button.
     * 'cb' The function to call when the appropriate context has been triggered.
     * 'context' The type of context this listener is waiting for.
     * 'value' Special variance. onTapped is tap count, onHeld is hold time. */
    // TODO List of type: type is not well defined.
    private listeners: {cb: () => void, context: '', value: 0}[] = [];

    /** Priorities are sorted low to high and executed in that order. */
    private priority = 1;

    /** List of button names this button nullifies. This happens before priority sorting:
     * priority 1 may override priority 2 despite occuring with lower precedence. */
    private overrides: ""[] = [];

    /** A list of IKeys which operate this button.
     * IKeys are string signifiers for key or button codes. IK_C, IK_Pad_DigitUp, IK_LeftBracket, etc. */
    // TODO Keys, Buttons and Axes, which yield numbers, should be sufficient.
    // TODO Keys.? will conflict with some Buttons.? though since they don't share ordinal space.
    // TODO Buttons.? will conflict with Buttons.? from two different gamepads. Hm.
    private inputs: ""[] = [];

    /** Returns the number of taps that have occurred in succession. */
    get multitap() { return 0 }

    /** Returns in seconds how long the button has been down. */
    get heldTime() { return Date.now() - this.timestamp; }

    /** The callback instance is removed from all contexts remembered by this button. */
    removeListener(cb: () => void) {}

    /** Removes all callback instances from all contexts remembered by this button. */
    removeAllListeners() {}

    /** A definition for what 'triggered' means.
     * Button inputs may be consumable, or may override each other, so on trigger the
     * associated action is passed to the input manager with some contextual information
     * regarding the signalling button. The callback is not actually called until the
     * input manager gets around to resolving its list of collected inputs. */

    /** Triggered every frame the button is down. */
    onDown(cb: () => void) {}

    /** Triggered every frame the button is up (up is default; I wouldn't recommend). */
    onUp(cb: () => void) {}

    /** Triggered the first frame any of the button's IKeys are down. */
    onPress(cb: () => void) {}

    /** Triggered during the first frame that HoldTimer exceeds TapTime. */
    onLongPress(cb: () => void) {}

    /** Triggered the first frame all of the button's IKeys are up. */
    onRelease(cb: () => void) {}

    /** Triggered on release if HoldTimer exceeds TapTime. */
    onLongRelease(cb: () => void) {}

    /** Triggered on release if HoldTimer is within TapTime, or following this definition,
     * a number of taps equal to 'multitap' have occurred. */
    onTap(cb: () => void, multitap = 1) {}

    /** Triggered every frame that HoldTimer exceeds some multiple of 'time.' */
    onInterval(cb: () => void, time: number, delay = 0) {}

    /** Triggered on button release, passing the number of intervals passed
     * after the initial delay as an int to the callback. */
    onIntervalRelease(cb: (intensity: number) => void, time: number, delay = 0) {}

    /**
     * Refactor
     * 
     * onPress, onRelease; neat as these are, they are unnecessary.
     * They are the wrong direction, more like.
     * 
     * Buttons are configurable from a control script.
     * If I decide a button works on release now, I shouldn't have to search through
     * the code to find which thing invokes it.
     * 
     * Behavior is a configurable setting.
     * The API gets two interacting functions: pulse() and off().
     * 
     * Some examples:
     *   press        : pulse() then off()
     *   release      : on release pulse() then off()
     *   repeater     : pulse() continuously; on release off()
     *   switch       : pulse(); on release off()
     *   long press   : once button is held through tap time, pulse() then off()
     *   long release : if button was held through tap time, pulse() then off()
     *   tap          : if button is pressed and released within tap time, pulse() then off()
     * In most cases, off() is unnecessary, but for completeness is always called. 
     * 
     * Settings:
     *   tap time     : the tap interval
     *   delay        : time before pulse trigger
     *   priority     : list of pulses is sorted by these, executed in order
     *   overrides[]  : which buttons this one negates
     *   inputs[][]   : [[A],[B]] A or B, [[A,B]] A and B; mappings may include other virtual buttons
     *   multiWindow  : time in which logical-AND buttons must be pressed to trigger
     *   
     * Metrics:
     *   time         : time since pressed; if up, zero.
     *   multitaps    : how many taps have occurred in succession
     *   intervals    : how many tap intervals since pressed; literally time / tap time
     * 
     * Button combos. What if A trig 1, B trig 2, A+B trig 3?
     * A is mapped to 'Z' or Pad A
     * B is mapped to 'X' or Pad B
     * AB is mapped to A and B, the virtual buttons
     * So, button mappings have logical operators AND can be mapped to virtual buttons.
     * 
     * This goes without saying, but button combos benefit from a little trigger delay.
     * A triggers on press, but after 0.1 seconds.
     * If B is triggered within that time, so will AB.
     * With three requests in queue, AB must override A and B to prevent them from acting.
     */
}