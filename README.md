# praxis

![Version](https://img.shields.io/badge/Version-0.5.0-blue) ![CI](https://img.shields.io/badge/CI-passing-brightgreen) ![Tests](https://img.shields.io/badge/Tests-64_passing-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

Reactive data layer for TypeScript and React Native. Praxis keeps your frontend in sync with your backend — define your state once, wire up actions that talk to your API, and let the UI reflect reality.

## Install

```bash
yarn add praxis
```

## Quick Start

```tsx
import { createStore } from "praxis/react";
import { View, Text, FlatList, Pressable } from "react-native";

const useBooks = createStore(({ push, remove, reset }) => ({
  books: [
    { id: 1, title: "1984", author: "George Orwell", year: 1949 },
    { id: 2, title: "Brave New World", author: "Aldous Huxley", year: 1932 },
    { id: 3, title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953 },
  ],

  addBook: (book) => push("books", book),
  removeBook: (id: number) => remove("books", (b) => b.id === id),
  resetBooks: () => reset(),
}));

function App() {
  const { books, removeBook, resetBooks } = useBooks();

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
      <Pressable onPress={resetBooks}>
        <Text>Reset</Text>
      </Pressable>
    </View>
  );
}
```

## `createStore(definition)`

Define state and actions in a single object. Returns a hook that gives you both state and actions.

- **State** — any non-function property becomes reactive state.
- **Actions** — any function property becomes an action. Destructure the utility methods you need from the factory parameter.

## Fluent API

Destructure the methods you need from the factory parameter:

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
