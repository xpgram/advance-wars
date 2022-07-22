
class Assets {
  one = 1;
}

class StateMaster<T> {
  assets: T;
  stack: typeof StateObject<T>[] = [];
  
  constructor(assets: T) {
    this.assets = assets;
  }

  add(...li: (StateObject<T> | {new(): StateObject<T>})[]) {
    
  }
}

abstract class StateObject<T> {
  master!: StateMaster<T>;
  sysinit(master: StateMaster<T>) {
    this.master = master;
  }
}


class Start extends StateObject<Assets> {}
class End extends StateObject<Assets> {}

class Menu extends StateObject<Assets> {
  constructor(openWithAnimation: boolean = false) {
    super();
    if (openWithAnimation)
      1;
    else
      2;
  }
}

class SubMenu extends StateObject<Assets> {

  constructor(op: {which: number}) {
    super();
  }

}

class Ass {

}

class AltStart extends StateObject<Ass> {}
class AltSubMenu extends StateObject<Ass> {
  constructor(op: {which: number}) {
    super();
  }
}

const assets = {one: 10};
const master = new StateMaster(assets);
master.add(
  Start,
  new Start(),
  Menu,
  new Menu(true),
  new Menu(false),
  new SubMenu({which: 10}),
  // SubMenu,
  End,
  AltSubMenu,
)

master.add(Start, Menu, new SubMenu({which: 10}), End);


/*
So, this annoys me, I think.

But I literally *can't* deny that it does exactly what I want without being too verbose and difficult to read.
So, queue should contain StateObjects and not their types. Naming the types then is only a convenience
for states which do not require or need any options.

*/