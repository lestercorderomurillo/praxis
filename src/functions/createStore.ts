import type { Widen } from "../types";
import { store, type StateOf, type ActionsOf, type StoreContext } from "../core/store";

type UseState<T> = {
  (): Widen<StateOf<T>>;
  subscribe(callback: () => void): () => void;
};

export function createStore<T extends Record<string, any>>(
  definition: T & ThisType<Widen<StateOf<T>> & StoreContext<Widen<StateOf<T>>>>,
  options?: any,
): [UseState<T>, () => ActionsOf<T>] {
  const s = store(definition, options);

  const actionKeys = Object.keys(definition).filter(k => typeof definition[k] === "function");
  const actions: Record<string, any> = {};
  for (const k of actionKeys) {
    actions[k] = (s as any)[k];
  }

  const useState = (() => s.value) as UseState<T>;
  useState.subscribe = s.subscribe;

  const useActions = () => actions as ActionsOf<T>;

  return [useState, useActions];
}
