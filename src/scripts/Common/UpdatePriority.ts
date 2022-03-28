
// Larger numbers occur before smaller ones; 'Camera' is the last to update.
export enum UpdatePriority {
  Camera = Number.MIN_SAFE_INTEGER,
  General = 0,
  ProxyInput,
  Input,
}