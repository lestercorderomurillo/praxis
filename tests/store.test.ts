import { describe, it, expect, vi } from "vitest";
import { store } from "../src/core/store";
import { createStore } from "../src/functions/createStore";

describe("store", () => {
  it("should return the initial state", () => {
    const { value } = store({ count: 0 });
    expect(value.count).toBe(0);
  });

  it("should support this.set", () => {
    const { value, setCount } = store({
      count: 0,
      setCount(n: number) { this.set("count", n); },
    });
    setCount(42);
    expect(value.count).toBe(42);
  });

  it("should support this.get with key", () => {
    const { doubled } = store({
      count: 10,
      doubled() { return this.get("count") * 2; },
    });
    expect(doubled()).toBe(20);
  });

  it("should support this.get without key", () => {
    const { sum } = store({
      a: 1,
      b: 2,
      sum() { return this.get().a + this.get().b; },
    });
    expect(sum()).toBe(3);
  });

  it("should support this.delete on a key", () => {
    const { value, clear } = store({
      temp: "hello" as string | undefined,
      clear() { this.delete("temp"); },
    });
    clear();
    expect(value.temp).toBeUndefined();
  });

  it("should support this.delete with predicate on arrays", () => {
    const { value, remove } = store({
      items: [1, 2, 3] as number[],
      remove(n: number) { this.delete("items", (i: number) => i === n); },
    });
    remove(2);
    expect(value.items).toEqual([1, 3]);
  });

  it("should support this.push (end by default)", () => {
    const { value, add } = store({
      items: [1] as number[],
      add(n: number) { this.push("items", n); },
    });
    add(2);
    expect(value.items).toEqual([1, 2]);
  });

  it("should support this.push with 'start' position", () => {
    const { value, prepend } = store({
      items: [2, 3] as number[],
      prepend(n: number) { this.push("items", "start", n); },
    });
    prepend(1);
    expect(value.items).toEqual([1, 2, 3]);
  });

  it("should support this.push with 'end' position", () => {
    const { value, append } = store({
      items: [1, 2] as number[],
      append(n: number) { this.push("items", "end", n); },
    });
    append(3);
    expect(value.items).toEqual([1, 2, 3]);
  });

  it("should support this.push with multiple items", () => {
    const { value, addMany } = store({
      items: [] as number[],
      addMany(...ns: number[]) { this.push("items", ...ns); },
    });
    addMany(1, 2, 3);
    expect(value.items).toEqual([1, 2, 3]);
  });

  it("should support this.pop from end (default)", () => {
    const { value, removeLast } = store({
      items: [1, 2, 3] as number[],
      removeLast() { return this.pop("items"); },
    });
    expect(removeLast()).toBe(3);
    expect(value.items).toEqual([1, 2]);
  });

  it("should support this.pop from start", () => {
    const { value, removeFirst } = store({
      items: [1, 2, 3] as number[],
      removeFirst() { return this.pop("items", "start"); },
    });
    expect(removeFirst()).toBe(1);
    expect(value.items).toEqual([2, 3]);
  });

  it("should support this.reset", () => {
    const { value, increment, reset } = store({
      count: 0,
      increment() { this.set("count", this.count + 1); },
      reset() { this.reset(); },
    });
    increment();
    increment();
    expect(value.count).toBe(2);
    reset();
    expect(value.count).toBe(0);
  });

  it("should support direct state mutation via this", () => {
    const { value, rename } = store({
      name: "old",
      rename(n: string) { this.name = n; },
    });
    rename("new");
    expect(value.name).toBe("new");
  });

  it("should support actions with no parameters", () => {
    const { value, increment } = store({
      count: 0,
      increment() { this.set("count", this.count + 1); },
    });
    increment();
    increment();
    expect(value.count).toBe(2);
  });

  it("should notify subscribers on action", () => {
    const { subscribe, increment } = store({
      count: 0,
      increment() { this.set("count", this.count + 1); },
    });
    const callback = vi.fn();
    subscribe(callback);
    increment();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should stop notifying after unsubscribe", () => {
    const { subscribe, increment } = store({
      count: 0,
      increment() { this.set("count", this.count + 1); },
    });
    const callback = vi.fn();
    const unsub = subscribe(callback);
    increment();
    unsub();
    increment();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle multiple actions chained sequentially", () => {
    const { value, push, pop, reverse } = store({
      queue: [] as string[],
      push(item: string) { this.push("queue", item); },
      pop() { return this.pop("queue"); },
      reverse() { this.set("queue", [...this.queue].reverse()); },
    });
    push("a");
    push("b");
    push("c");
    reverse();
    expect(value.queue).toEqual(["c", "b", "a"]);
    expect(pop()).toBe("a");
    expect(pop()).toBe("b");
    expect(value.queue).toEqual(["c"]);
  });

  it("should handle actions that read and write multiple keys", () => {
    const { value, transfer } = store({
      source: [1, 2, 3, 4, 5] as number[],
      destination: [] as number[],
      transfer(predicate: (n: number) => boolean) {
        const moving = this.source.filter(predicate);
        this.set("source", this.source.filter((n: number) => !predicate(n)));
        this.set("destination", [...this.destination, ...moving]);
      },
    });
    transfer((n: number) => n > 3);
    expect(value.source).toEqual([1, 2, 3]);
    expect(value.destination).toEqual([4, 5]);
    transfer((n: number) => n === 1);
    expect(value.source).toEqual([2, 3]);
    expect(value.destination).toEqual([4, 5, 1]);
  });

  it("should handle nested object state via this.set", () => {
    const { value, updateProfile, addTag } = store({
      user: { name: "Alice", age: 30, tags: ["admin"] as string[] },
      updateProfile(patch: { name?: string; age?: number }) {
        this.set("user", { ...this.user, ...patch });
      },
      addTag(tag: string) {
        this.set("user", { ...this.user, tags: [...this.user.tags, tag] });
      },
    });
    updateProfile({ name: "Bob" });
    expect(value.user.name).toBe("Bob");
    expect(value.user.age).toBe(30);
    addTag("editor");
    expect(value.user.tags).toEqual(["admin", "editor"]);
  });

  it("should reset arrays and nested state to initial values", () => {
    const { value, addItem, setFlag, reset } = store({
      items: ["original"] as string[],
      flag: false,
      addItem(s: string) { this.push("items", s); },
      setFlag(v: boolean) { this.set("flag", v); },
      reset() { this.reset(); },
    });
    addItem("added");
    setFlag(true);
    expect(value.items).toEqual(["original", "added"]);
    expect(value.flag).toBe(true);
    reset();
    expect(value.items).toEqual(["original"]);
    expect(value.flag).toBe(false);
  });

  it("should not share state between reset and initial (deep clone)", () => {
    const { value, addItem, reset } = store({
      items: [{ id: 1 }] as { id: number }[],
      addItem(item: { id: number }) { this.push("items", item); },
      reset() { this.reset(); },
    });
    addItem({ id: 2 });
    reset();
    expect(value.items).toEqual([{ id: 1 }]);
    value.items[0].id = 999;
    reset();
    expect(value.items[0].id).toBe(1);
  });

  it("should handle a FIFO queue with push start and pop end", () => {
    const { value, enqueue, dequeue } = store({
      queue: [] as number[],
      enqueue(n: number) { this.push("queue", "start", n); },
      dequeue() { return this.pop("queue"); },
    });
    enqueue(1);
    enqueue(2);
    enqueue(3);
    expect(value.queue).toEqual([3, 2, 1]);
    expect(dequeue()).toBe(1);
    expect(dequeue()).toBe(2);
    expect(value.queue).toEqual([3]);
  });

  it("should notify once per action even when multiple keys change", () => {
    const { subscribe, swap } = store({
      a: 1,
      b: 2,
      swap() {
        const temp = this.a;
        this.set("a", this.b);
        this.set("b", temp);
      },
    });
    const callback = vi.fn();
    subscribe(callback);
    swap();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should support multiple independent subscribers", () => {
    const { subscribe, increment } = store({
      count: 0,
      increment() { this.set("count", this.count + 1); },
    });
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const cb3 = vi.fn();
    const unsub2 = subscribe(cb2);
    subscribe(cb1);
    subscribe(cb3);
    increment();
    expect(cb1).toHaveBeenCalledTimes(1);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(1);
    unsub2();
    increment();
    expect(cb1).toHaveBeenCalledTimes(2);
    expect(cb2).toHaveBeenCalledTimes(1);
    expect(cb3).toHaveBeenCalledTimes(2);
  });

  it("should handle an action doing multiple operations", () => {
    const { value, addSorted } = store({
      items: [1, 3] as number[],
      addSorted(n: number) {
        this.push("items", n);
        this.set("items", [...this.items].sort((a: number, b: number) => a - b));
      },
    });
    addSorted(2);
    expect(value.items).toEqual([1, 2, 3]);
  });

  it("should handle delete filtering multiple items at once", () => {
    const { value, removeEvens } = store({
      nums: [1, 2, 3, 4, 5, 6, 7, 8] as number[],
      removeEvens() { this.delete("nums", (n: number) => n % 2 === 0); },
    });
    removeEvens();
    expect(value.nums).toEqual([1, 3, 5, 7]);
  });

  it("should handle a todo app with mixed operations", () => {
    type Todo = { id: number; text: string; done: boolean };
    const { value, add, toggle, removeDone, reset } = store({
      todos: [] as Todo[],
      nextId: 1,
      add(text: string) {
        this.push("todos", { id: this.nextId, text, done: false });
        this.set("nextId", this.nextId + 1);
      },
      toggle(id: number) {
        const todo = this.todos.find((t: Todo) => t.id === id);
        if (todo) todo.done = !todo.done;
      },
      removeDone() {
        this.delete("todos", (t: Todo) => t.done);
      },
      reset() { this.reset(); },
    });

    add("Buy milk");
    add("Write tests");
    add("Ship feature");
    expect(value.todos).toHaveLength(3);
    expect(value.nextId).toBe(4);

    toggle(1);
    toggle(3);
    expect(value.todos[0].done).toBe(true);
    expect(value.todos[1].done).toBe(false);
    expect(value.todos[2].done).toBe(true);

    removeDone();
    expect(value.todos).toHaveLength(1);
    expect(value.todos[0].text).toBe("Write tests");

    add("Deploy");
    expect(value.nextId).toBe(5);

    reset();
    expect(value.todos).toEqual([]);
    expect(value.nextId).toBe(1);
  });

  it("should handle a state machine pattern", () => {
    type State = "idle" | "loading" | "success" | "error";
    const { value, load, succeed, fail, reset } = store({
      state: "idle" as State,
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

    expect(value.state).toBe("idle");

    load();
    expect(value.state).toBe("loading");
    expect(value.data).toBeNull();

    succeed("payload");
    expect(value.state).toBe("success");
    expect(value.data).toBe("payload");

    load();
    expect(value.state).toBe("loading");
    expect(value.data).toBeNull();

    fail("network error");
    expect(value.state).toBe("error");
    expect(value.error).toBe("network error");

    reset();
    expect(value.state).toBe("idle");
    expect(value.data).toBeNull();
    expect(value.error).toBeNull();
  });
});

describe("createStore", () => {
  it("should return [useState, useActions] tuple", () => {
    const result = createStore({ count: 0 });
    expect(result).toHaveLength(2);
    expect(typeof result[0]).toBe("function");
    expect(typeof result[1]).toBe("function");
  });

  it("should return state from useState", () => {
    const [useState] = createStore({ count: 42 });
    expect(useState().count).toBe(42);
  });

  it("should return actions from useActions", () => {
    const [useState, useActions] = createStore({
      count: 0,
      increment() { this.set("count", this.count + 1); },
    });
    const { increment } = useActions();
    increment();
    increment();
    expect(useState().count).toBe(2);
  });

  it("should support subscribe on useState", () => {
    const [useState, useActions] = createStore({
      count: 0,
      increment() { this.set("count", this.count + 1); },
    });
    const callback = vi.fn();
    useState.subscribe(callback);
    useActions().increment();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should separate state and actions", () => {
    const [useState, useActions] = createStore({
      items: [] as string[],
      add(item: string) { this.push("items", item); },
      remove(item: string) { this.delete("items", (i: string) => i === item); },
    });
    const { add, remove } = useActions();

    add("a");
    add("b");
    add("c");
    expect(useState().items).toEqual(["a", "b", "c"]);

    remove("b");
    expect(useState().items).toEqual(["a", "c"]);
  });
});
