# praxis

![CI](https://img.shields.io/badge/CI-passing-brightgreen) ![Tests](https://img.shields.io/badge/Tests-45_passing-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

Reactive data layer for TypeScript and React. Praxis keeps your frontend in sync with your backend — define your state once, wire up actions that talk to your API, and let the UI reflect reality.

## Install

```bash
yarn add praxis
```

## Quick start

```tsx
import { createStore } from "praxis";

type Book = { id: number; title: string; author: string; year: number };

const [useBooks, useBookActions] = createStore({
  books: [] as Book[],

  async load() {
    const res = await fetch("/api/books");
    this.set("books", await res.json());
  },
  add(book: Book) {
    this.push("books", book);
  },
  remove(id: number) {
    this.delete("books", (b) => b.id === id);
  },
});

function BookList() {
  const { books } = useBooks();
  const { load, remove } = useBookActions();

  useEffect(() => { load(); }, []);

  return (
    <ul>
      {books.map((book) => (
        <li key={book.id}>
          {book.title} — {book.author} ({book.year})
          <button onClick={() => remove(book.id)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}
```

## `createStore(definition)`

Define state and actions in a single object. Returns a `[useState, useActions]` tuple.

- **State** — any non-function property becomes reactive state.
- **Actions** — any function property becomes an action. Actions access state through `this` and can call context methods to mutate it.

```ts
const [useBooks, useBookActions] = createStore({
  // State
  books: [
    { id: 1, title: "1984", author: "George Orwell", year: 1949 },
    { id: 2, title: "Brave New World", author: "Aldous Huxley", year: 1932 },
    { id: 3, title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953 },
  ] as Book[],
  filter: "" as string,

  // Actions
  add(book: Book) {
    this.push("books", book);
  },
  remove(id: number) {
    this.delete("books", (b) => b.id === id);
  },
  setFilter(query: string) {
    this.set("filter", query);
  },
  reset() {
    this.reset();
  },
});
```

### Reading state

```tsx
function BookCount() {
  const { books } = useBooks();
  return <span>{books.length} books</span>;
}
```

### Dispatching actions

```tsx
function AddBookForm() {
  const { add } = useBookActions();

  return (
    <button onClick={() => add({ id: 4, title: "Do Androids Dream of Electric Sheep?", author: "Philip K. Dick", year: 1968 })}>
      Add book
    </button>
  );
}
```

### Subscribing to changes

```ts
useBooks.subscribe(() => {
  console.log("books changed:", useBooks());
});
```

Subscribers fire once per action, even when multiple fields change inside a single action.

## Context methods

Inside actions, `this` gives you the current state plus these methods:

| Method | Description |
|--------|-------------|
| `this.set(key, value)` | Set a field |
| `this.get()` | Get full state |
| `this.get(key)` | Get a single field |
| `this.delete(key)` | Delete a field |
| `this.delete(key, predicate)` | Remove array items matching predicate |
| `this.push(key, ...items)` | Append to an array |
| `this.push(key, "start", ...items)` | Prepend to an array |
| `this.pop(key)` | Remove and return last item |
| `this.pop(key, "start")` | Remove and return first item |
| `this.reset()` | Reset all state to initial values |

## Full example

```tsx
import { createStore } from "praxis";

type Book = { id: number; title: string; author: string; year: number };

const [useBooks, useBookActions] = createStore({
  books: [
    { id: 1, title: "1984", author: "George Orwell", year: 1949 },
    { id: 2, title: "Brave New World", author: "Aldous Huxley", year: 1932 },
    { id: 3, title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953 },
  ] as Book[],

  add(book: Book) {
    this.push("books", book);
  },
  remove(id: number) {
    this.delete("books", (b) => b.id === id);
  },
  reset() {
    this.reset();
  },
});

function App() {
  const { books } = useBooks();
  const { remove, reset } = useBookActions();

  return (
    <div>
      <h1>Library ({books.length})</h1>
      <ul>
        {books.map((book) => (
          <li key={book.id}>
            <strong>{book.title}</strong> by {book.author}, {book.year}
            <button onClick={() => remove(book.id)}>x</button>
          </li>
        ))}
      </ul>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

## License

MIT
