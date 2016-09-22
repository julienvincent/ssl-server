# usage

```javascript
server({
    email: 'julienlucvincent@gmail.com',
    domain: 'example.com',
    token: SERVER_TOKEN,
    api: "http://localhost:8080/graphql",
    server: "staging" | "production",
    production: false,
    app: express()
}).listen(80, 3000)
```