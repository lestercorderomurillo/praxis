# praxis

![Version](https://img.shields.io/badge/Version-0.2.0-blue) ![CI](https://img.shields.io/badge/CI-passing-brightgreen) ![Tests](https://img.shields.io/badge/Tests-45_passing-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

Reactive data layer for TypeScript and React Native. Praxis keeps your frontend in sync with your backend — define your state once, wire up actions that talk to your API, and let the UI reflect reality.

## Install

```bash
yarn add praxis
```

## Quick start

```tsx
import { createStore } from "praxis";
import { View, Text, FlatList, Pressable } from "react-native";

type Book = { id: number; title: string; author: string; year: number };

const [useBooks, useBookActions] = createStore({
  books: [
    { id: 1, title: "1984", author: "George Orwell", year: 1949 },
    { id: 2, title: "Brave New World", author: "Aldous Huxley", year: 1932 },
    { id: 3, title: "Fahrenheit 451", author: "Ray Bradbury", year: 1953 },
  ] as Book[],

  addBook(book: Book) {
    this.push("books", book);
  },
  removeBook(id: number) {
    this.delete("books", (b) => b.id === id);
  },
  resetBooks() {
    this.reset();
  },
});

function App() {
  const { books } = useBooks();
  const { removeBook, resetBooks } = useBookActions();

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

Define state and actions in a single object. Returns a `[useState, useActions]` tuple.

- **State** — any non-function property becomes reactive state.
- **Actions** — any function property becomes an action. Actions access state through `this` and can call context methods to mutate it.

### Reading state

```tsx
function BookCount() {
  const { books } = useBooks();
  return <Text>{books.length} books</Text>;
}
```

### Dispatching actions

```tsx
function AddBookButton() {
  const { addBook } = useBookActions();

  return (
    <Pressable onPress={() => addBook({ id: 4, title: "Do Androids Dream of Electric Sheep?", author: "Philip K. Dick", year: 1968 })}>
      <Text>Add book</Text>
    </Pressable>
  );
}
```

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
