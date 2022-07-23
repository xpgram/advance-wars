
// class Assets {
//   one = 1;
// }

// type PackageData<A extends Assets, D extends {}> = {
//   type: new (...args: any) => StateObject<A,D>;
//   data: D;
// }

// type StateConcatable<A extends Assets, D extends {}> = (new (...args: any) => StateObject<A,{}>) | (PackageData<A,D>);

// function isPackageData<A extends Assets, D extends {}>(o: StateConcatable<A,D>): o is PackageData<A,D> {
//   return ((o as PackageData<A,D>).type !== undefined && (o as PackageData<A,D>).data !== undefined);
// }

// class StateMaster<A extends Assets> {
//   assets: A;
//   private queue: PackageData<A,object>[] = [];
//   private stack: StateObject<A,object>[] = [];
  
//   constructor(assets: A) {
//     this.assets = assets;
//   }

//   add(...li: StateConcatable<A,{}>[]) {
//     this.queue.unshift(
//       ...li.map( o => isPackageData(o) ? o : {type: o, data: {}} )

//       // Once objects are instantiated, they lose access to their settings.

//       // Probably what makes the most sense is just 'constructor' and later 'build'
//       // What was the problem with that again? Mutable states on redo?
//     )
//   }
// }

// abstract class StateObject<T,Y={}> {
//   readonly master: StateMaster<T>;
//   readonly settings: Y;

//   constructor(master: StateMaster<T>, settings: Y) {
//     this.master = master;
//     this.settings = settings;
//   }
//   abstract config(): void;
// }

// class Menu extends StateObject<Assets> {
//   menuObj!: number;
//   config() {
//     // this.settings.which;
//   }
// }

// class SubMenu extends StateObject<Assets, {which: number}> {
//   config() {
//     this.settings.which;
//   }
// }


// const assets = {one: 10};
// const master = new StateMaster(assets);
// master.add(
//   Start,
//   new Start(),
//   Menu,
//   new Menu(true),
//   new Menu(false),
//   new SubMenu({which: 10}),
//   // SubMenu,
//   End,
//   AltSubMenu,
// )

// master.add(Start, Menu, new SubMenu({which: 10}), End);


// /*
// So, this annoys me, I think.

// But I literally *can't* deny that it does exactly what I want without being too verbose and difficult to read.
// So, queue should contain StateObjects and not their types. Naming the types then is only a convenience
// for states which do not require or need any options.

// */