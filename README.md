# P R A X I S

![Version](https://img.shields.io/badge/Version-0.5.0-blue) ![CI](https://img.shields.io/badge/CI-passing-brightgreen) ![Tests](https://img.shields.io/badge/Tests-64_passing-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

Praxis keeps your frontend in sync with your backend — define your state once, wire up actions that talk to your API, and let the UI reflect reality.

## Key features

- **Optimistic updates** — first-class primitive for writing UI that responds before the network does, with automatic rollback on failure.

- **Signal-based reactivity** — fine-grained updates, no providers, no context, no re-render storms.

- **Centralized state** — predictable global stores you can reach from anywhere, with mutations as the single source of change.

- **Hook-ready syntax** — every store is a hook, drop it straight into a component and destructure what you need.

- **Type-safe by design** — full typescript support.

## Install

```bash
yarn add praxis
```

## Quick Start

Call `createStore` with a factory that returns your initial state and actions. 

Every function property becomes an action, everything else becomes reactive state, simple.

```tsx
import { createStore } from "praxis/react";

type Book = {
  id: number;
  title: string;
  author: string;
  year: number;
};

const useBooks = createStore(({ push, remove, reset, optimistic }) => ({
  books: [
    { id: 1, title: "1984", author: "George Orwell", year: 1949 },
    { id: 2, title: "Brave New World", author: "Aldous Huxley", year: 1932 },
    { id: 3, title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953 },
  ] as Book[],

  addBook: (book: Omit<Book, "id">) =>
    optimistic(
      ({ isDraft }) => push("books", { ...book, id: Date.now(), isLoading: isDraft }),
      fetch("https://api.example.com/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(book),
      }),
    ),
  removeBook: (id: number) => remove("books", (b) => b.id === id),
  resetBooks: () => reset(),
}));
```

### Using the hook in components

Drop the hook into any component and destructure the slices you care about. Mutations update global state and the UI tracks the change automatically.

```tsx
import { View, Text, FlatList, Pressable } from "react-native";
import { useBooks } from "./useBooks";

function Library() {
  const { books, addBook, removeBook, resetBooks } = useBooks();

  return (
    <View>
      <Text>Library ({books.length})</Text>
      <FlatList
        data={books}
        keyExtractor={(book) => String(book.id)}
        renderItem={({ item: book }) => (
          <View>
            <Text>{book.title} by {book.author}, {book.year}</Text>
            <Pressable onPress={() => removeBook(book.id)}>
              <Text>Remove</Text>
            </Pressable>
          </View>
        )}
      />
      <Pressable
        onPress={() =>
          addBook({ title: "New Book", author: "New Author", year: 2026 })
        }
      >
        <Text>Add Book</Text>
      </Pressable>
      <Pressable onPress={resetBooks}>
        <Text>Reset</Text>
      </Pressable>
    </View>
  );
}
```

## API reference

### `createStore(factory)`

Define state and actions in a single object. Returns a hook that gives you both.

- **State** — any non-function property becomes reactive state.
- **Actions** — any function property becomes an action. Destructure the helpers you need from the factory parameter.

### Helpers

| | |
|---|---|
| `set(key, value)` | Set a field |
| `get()` | Get full state |
| `get(key)` | Get a single field |
| `remove(key)` | Remove a field |
| `remove(key, predicate)` | Remove array items matching a predicate |
| `push(key, ...items)` | Append to an array |
| `push(key, "start", ...items)` | Prepend to an array |
| `pop(key)` | Remove and return the last item |
| `pop(key, "start")` | Remove and return the first item |
| `reset()` | Reset all state to initial values |
| `optimistic(mutation, promise)` | Apply mutation optimistically; finalize on resolve, rollback on reject |
