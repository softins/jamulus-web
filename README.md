# jamulus-web (Jamulus Explorer)

VueJS front end to display Jamulus servers and participants,
available at http://jamulus.softins.co.uk

Uses `server.php` from [jamulus-php](https://github.com/softins/jamulus-php)
as a back-end to fetch the information from the servers.

Accepts the following query params:

- `central=<centralserver>` - query specified server only
- `auto` - enable auto-refresh (every 15 seconds)
- `hideempty` - hide empty servers, i.e. only show servers with musicians connected.

For example: `http://jamulus.softins.co.uk/?central=worldjam.vip&auto`

---

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
