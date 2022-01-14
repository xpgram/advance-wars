
/** A list-item title which features a sprite, a name string and a numeric value. */
export type ShopItemTitle = {
  icon: PIXI.Container,
  title: string,
  cost: number,
}

/** A list-item title which features a sprite and a string. */
export type IconTitle = {
  icon?: PIXI.Container,
  title: string,
}