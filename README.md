# Challonger

Hastily thrown together utility primarily for making group stage seeding in [Challonge](https://challonge.com) easier.

It has various bugs, is inconvenient to set up and should only be used at one's own peril.

## Requirements

- [Python 3](https://www.python.org/)
- [NPM](https://nodejs.org/) (or another [`npmjs.com`](https://npmjs.com)-based package manager like [Yarn](https://yarnpkg.com/))
- [CGI](https://en.wikipedia.org/wiki/Common_Gateway_Interface)-capable Web Server (e.g. Apache)

## Installation

The application requires a backend component to communicate with Challonge. This is the CGI-based script `./api/api-proxy.py` which has to be served accordingly on the same origin as the client-side code. If the root directory is not served as is, the URL path of the API script needs to be set in `config.ts`.

After setting up the backend, the client-side code can be built using `npm` or another package manager like `yarn`. After installing dependencies run the build script:

```shell
npm run build
```

The resulting bundle (`./out/app.js`) will contain all JS and CSS, though some external files (HTML & Fonts) are not included. Simply serving the root directly with the main entry point (`index.html`) should work.