import type { PraxisStoreOptions } from "../types";
import { PraxisNode } from "../core/PraxisNode";

export function createStore(options?: PraxisStoreOptions): PraxisNode {
  return new PraxisNode(options);
}
