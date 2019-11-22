
type SlidingWindowOptions = {
    width: number,
    height: number,
    verticalDistance?: number,
    visualBoundaryWidth: number,
    drawBackground?: boolean,
    drawMask?: boolean,
    show?: boolean,
    color?: number,
    borderColor?: number,
    borderSize?: {
        top: number,
        bottom: number,
        left: number,
        right: number
    }
}