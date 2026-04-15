import type { Widen } from "../types";
import { signal } from "./signal";

export type StateOf<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? never : K]: T[K];
};

export type ActionsOf<T> = {
  [K in keyof T as T[K] extends (...args: any[]) => any ? K : never]:
    T[K] extends (...args: infer A) => infer R ? (...args: A) => R : never;
};

type ElementOf<T> = T extends (infer U)[] ? U : never;
type ArrayKeys<S> = { [K in keyof S]: S[K] extends any[] ? K : never }[keyof S];

export type StoreContext<S> = {
  set<K extends keyof S>(key: K, value: S[K]): void;
  get(): S;
  get<K extends keyof S>(key: K): S[K];
  delete<K extends keyof S>(key: K): void;
  delete<K extends ArrayKeys<S>>(key: K, predicate: (item: ElementOf<S[K]>) => boolean): void;
  push<K extends ArrayKeys<S>>(key: K, ...items: ElementOf<S[K]>[]): void;
  push<K extends ArrayKeys<S>>(key: K, position: "start" | "end", ...items: ElementOf<S[K]>[]): void;
  pop<K extends ArrayKeys<S>>(key: K): ElementOf<S[K]>;
  pop<K extends ArrayKeys<S>>(key: K, position: "start" | "end"): ElementOf<S[K]>;
  reset(): void;
};

type Store<T> = {
  value: Widen<StateOf<T>>;
  subscribe(callback: () => void): () => void;
} & ActionsOf<T>;

export const store = <T extends Record<string, any>>(
  definitionOrFactory: (T & ThisType<Widen<StateOf<T>> & StoreContext<Widen<StateOf<T>>>>) | (($: StoreContext<any> & Record<string, any>) => T),
  options?: any,
): Store<T> => {
  const state: Record<string, any> = {};
  const actions: Record<string, Function> = {};

  let realProxy: any = null;
  const deferred = new Proxy({} as any, {
    get(_, prop) { return realProxy[prop]; },
    set(_, prop, value) { realProxy[prop] = value; return true; },
  });

  const definition = typeof definitionOrFactory === "function"
    ? (definitionOrFactory as Function)(deferred)
    : definitionOrFactory;

  for (const [key, value] of Object.entries(definition)) {
    if (typeof value === "function") {
      actions[key] = value;
    } else {
      state[key] = value;
    }
  }

  const initialState = structuredClone(state);
  const reactive = signal(state);

  const context: Record<string, (key: string, ...args: any[]) => any> = {
    set(key: string, value: any) {
      state[key] = value;
    },

    get(key?: string) {
      if (key !== undefined) return state[key];
      return state;
    },

    delete(key: string, predicate?: (item: any) => boolean) {
      if (predicate) {
        state[key] = state[key].filter((item: any) => !predicate(item));
      } else {
        delete state[key];
      }
    },

    push(key: string, ...items: any[]) {
      const first = items[0];
      const isPosition = first === "start" || first === "end";
      const position = isPosition ? items.shift() : "end";

      if (position === "start") {
        state[key].unshift(...items);
      } else {
        state[key].push(...items);
      }
    },

    pop(key: string, position: "start" | "end" = "end") {
      if (position === "start") return state[key].shift();
      return state[key].pop();
    },

    reset() {
      for (const key of Object.keys(state)) {
        delete state[key];
      }
      Object.assign(state, structuredClone(initialState));
    },
  };

  const proxy = new Proxy(state, {
    get(target, property) {
      if (property in context) return context[property as string];
      return target[property as string];
    },
    set(target, property, value) {
      target[property as string] = value;
      return true;
    },
  });

  realProxy = proxy;

  const instance: Record<string, any> = {
    get value() {
      return reactive.value;
    },
    set value(newValue: any) {
      reactive.value = newValue;
    },
    subscribe: reactive.subscribe,
  };

  for (const [name, action] of Object.entries(actions)) {
    instance[name] = (...args: any[]) => {
      const result = action.call(proxy, ...args);
      reactive.value = reactive.value;
      return result;
    };
  }

  return instance as Store<T>;
}
