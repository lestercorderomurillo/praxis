# praxis

![CI](https://img.shields.io/badge/CI-passing-brightgreen) ![Tests](https://img.shields.io/badge/Tests-45_passing-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

Lightweight reactive state management for TypeScript.

## Install

```bash
yarn add praxis
```

## API

### `signal<T>(initialValue)`

Creates a reactive value with automatic subscriber notifications.

```ts
import { signal } from "praxis/core/signal";

const counter = signal(0);

// Read
console.log(counter.value); // 0

// Write (notifies all subscribers)
counter.value = 5;

// Subscribe to changes
const unsubscribe = counter.subscribe(() => {
  console.log("counter changed:", counter.value);
});

counter.value = 10; // logs: "counter changed: 10"

unsubscribe();
counter.value = 20; // no log
```

### `watch(fn)`

Creates an effect that auto-tracks signal dependencies and re-runs when they change.

```ts
import { signal, watch } from "praxis/core/signal";

const firstName = signal("John");
const lastName = signal("Doe");

// Runs immediately, then re-runs whenever firstName or lastName change
watch(() => {
  console.log(`${firstName.value} ${lastName.value}`);
});
// logs: "John Doe"

firstName.value = "Jane";
// logs: "Jane Doe"
```

Stop watching from the outside:

```ts
const watcher = watch(() => {
  console.log(counter.value);
});

watcher.stop();
```

Or stop from the inside:

```ts
watch((self) => {
  console.log(counter.value);
  if (counter.value >= 10) {
    self.stop();
  }
});
```

### `store(definition)`

Creates a reactive store. State fields and action methods are defined together in a single object. Actions have access to the full state via `this` and a set of built-in context methods.

```ts
import { store } from "praxis";

const counter = store({
  // State
  count: 0,

  // Actions
  increment() {
    this.set("count", this.count + 1);
  },
  decrement() {
    this.set("count", this.count - 1);
  },
  reset() {
    this.reset();
  },
});

counter.increment();
counter.increment();
console.log(counter.value.count); // 2

counter.reset();
console.log(counter.value.count); // 0
```

#### Store context methods

Inside actions, `this` gives you access to both the current state and these methods:

| Method | Description |
|--------|-------------|
| `this.set(key, value)` | Set a state field |
| `this.get()` | Get entire state |
| `this.get(key)` | Get a single field |
| `this.delete(key)` | Delete a state field |
| `this.delete(key, predicate)` | Remove array items matching predicate |
| `this.push(key, ...items)` | Append items to an array |
| `this.push(key, "start", ...items)` | Prepend items to an array |
| `this.pop(key)` | Remove and return last item |
| `this.pop(key, "start")` | Remove and return first item |
| `this.reset()` | Reset all state to initial values |

#### Subscribing to store changes

```ts
const { subscribe, increment } = store({
  count: 0,
  increment() { this.set("count", this.count + 1); },
});

const unsubscribe = subscribe(() => {
  console.log("store updated");
});

increment(); // logs: "store updated"
unsubscribe();
```

Subscribers are notified once per action, even if multiple fields change inside a single action.

### `createStore(definition)`

Factory that returns a `[useState, useActions]` tuple, separating state reads from mutations.

```ts
import { createStore } from "praxis";

const [useState, useActions] = createStore({
  todos: [] as Todo[],
  nextId: 1,

  add(text: string) {
    this.push("todos", { id: this.nextId, text, done: false });
    this.set("nextId", this.nextId + 1);
  },
  toggle(id: number) {
    const todo = this.todos.find(t => t.id === id);
    if (todo) todo.done = !todo.done;
  },
  removeDone() {
    this.delete("todos", t => t.done);
  },
  reset() {
    this.reset();
  },
});

// Read state
const state = useState();
console.log(state.todos);

// Dispatch actions
const { add, toggle, removeDone } = useActions();
add("Buy milk");
add("Write tests");
toggle(1);
removeDone();

// Subscribe to changes
useState.subscribe(() => {
  console.log("state changed:", useState());
});
```

## Examples

### State machine

```ts
const machine = store({
  state: "idle" as "idle" | "loading" | "success" | "error",
  data: null as string | null,
  error: null as string | null,

  load() {
    this.set("state", "loading");
    this.set("data", null);
    this.set("error", null);
  },
  succeed(data: string) {
    this.set("state", "success");
    this.set("data", data);
  },
  fail(error: string) {
    this.set("state", "error");
    this.set("error", error);
  },
  reset() { this.reset(); },
});

machine.load();
machine.succeed("payload");
console.log(machine.value.state); // "success"
console.log(machine.value.data);  // "payload"
```

### FIFO queue

```ts
const queue = store({
  items: [] as number[],
  enqueue(n: number) { this.push("items", "start", n); },
  dequeue() { return this.pop("items"); },
});

queue.enqueue(1);
queue.enqueue(2);
queue.enqueue(3);
console.log(queue.dequeue()); // 1
console.log(queue.dequeue()); // 2
```

### Transfer between arrays

```ts
const { value, transfer } = store({
  source: [1, 2, 3, 4, 5] as number[],
  destination: [] as number[],
  transfer(predicate: (n: number) => boolean) {
    const moving = this.source.filter(predicate);
    this.set("source", this.source.filter(n => !predicate(n)));
    this.set("destination", [...this.destination, ...moving]);
  },
});

transfer(n => n > 3);
console.log(value.source);      // [1, 2, 3]
console.log(value.destination); // [4, 5]
```

## License

MIT
