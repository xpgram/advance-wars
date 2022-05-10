
// Larger numbers occur before smaller ones; 'Camera' is the last to update.
export enum UpdatePriority {
  Camera = -100,
  Utility,
  General = 0,
  ProxyInput,
  Input,
}
