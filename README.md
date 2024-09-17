# jamulus-web (Jamulus Explorer)

VueJS front end to display Jamulus servers and participants,
available at https://explorer.jamulus.io

It was originally available at http://jamulus.softins.co.uk, but is no longer at that address.


Uses `servers.php` from [jamulus-php](https://github.com/softins/jamulus-php)
as a back-end to fetch the information from the servers.

Accepts the following query params:

- `directory=<directoryserver>` - query specified server only
- `central=<directoryserver>` - same, for backward compatibility
- `auto` - enable auto-refresh (every 15 seconds)
- `hideempty` - hide empty servers, i.e. only show servers with musicians connected.

For example: https://explorer.jamulus.io/?directory=worldjam.vip&auto

---

**Note that this project now uses VueJS 3, with Vite as the build tool. Vite requires nodejs version 18+ on the dev system.**

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
