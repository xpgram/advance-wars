
export interface CommandingOfficerType {
  new (): CommandingOfficerObject;
  readonly serial: number;
}

export abstract class CommandingOfficerObject {
  abstract readonly type: CommandingOfficerType;
  static readonly serial: number = -1;
  get serial(): number { return this.type.serial; }
}