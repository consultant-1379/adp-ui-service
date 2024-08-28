# GUI Aggregator Service

GUI Aggregator Service (GAS) is the backend for the Launcher and EUI-SDK based microfrontends.

To get a detailed documentation for this service please check: [backend-service](docs/development/backend-service.md)

## Quick NPM task reference

```bash
npm install                 # Install dependencies
npm start                   # start in normal mode
npm run start:watch         # if source is changed the server is reloaded
npm run start:debug         # start in debug mode
npm run lint                # lint source code
npm run test                # run all tests
npm run test:generateReport # generate HTML report
npm run test:coverage       # run mocha tests with coverage report
```

_Note: development server runs on `http://localhost:3000`_
