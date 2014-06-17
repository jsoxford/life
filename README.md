# life

This is a game of life app server to combine multiple implementations (in different languages) of game of life.

### Layout

the main app stores the internal board state, serves it to clients, and queries the (possibly other language) runners.

It's the brains of the operation.

```
npm install
node app
```