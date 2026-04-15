export type Widen<T> =
  T extends readonly (infer U)[]
    ? [U] extends [never] ? any[] : Widen<U>[]
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type StoreOptions = {
};

export type Watcher = {
    stop: () => void;
};
