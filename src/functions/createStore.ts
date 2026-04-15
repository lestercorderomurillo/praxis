import type { Widen } from "../types";
import { store, type StateOf, type ActionsOf, type StoreContext } from "../core/store";

type UseState<T> = {
  (): Widen<StateOf<T>>;
  subscribe(callback: () => void): () => void;
};

export function createStore<T extends Record<string, any>>(
  definitionOrFactory: (T & ThisType<Widen<StateOf<T>> & StoreContext<Widen<StateOf<T>>>>) | (($: StoreContext<any> & Record<string, any>) => T),
  options?: any,
): [UseState<T>, () => ActionsOf<T>] {
  const s = store(definitionOrFactory as any, options);

  const reserved = new Set(["value", "subscribe"]);
  const actions: Record<string, any> = {};
  for (const k of Object.keys(s as any)) {
    if (!reserved.has(k)) {
      actions[k] = (s as any)[k];
    }
  }

  const useState = (() => s.value) as UseState<T>;
  useState.subscribe = s.subscribe;

  const useActions = () => actions as ActionsOf<T>;

  return [useState, useActions];
}
