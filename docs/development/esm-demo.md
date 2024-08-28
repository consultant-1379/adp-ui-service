# ESM Demo

## Goal

The main reason of this demo is to demonstrate the capabilities of the new expose and
import-map APIs.

## Implementation

The ESM mock services can be found in the `mock/domain-ui-generic/public` folder. The
`container` contains the HTML file. The `package.config.json` files are included in the service-1 and
service-2 folders. Both mock services contain a modules folder in which more files can be
added for future purposes. As now the `utility.js` files are quite simple.

## Usage & expected behaviour

!> To use the demo,set the `deployEsmServices` option to true and `deployMockServices` to false
in the tilt.options.json file.

The implementation uses the import-map which is generated from the mock services' json files.
From this import-map, the various modules should be displayed in the
`<gas-path>/ui-serve/v1/static/domain-ui-generic-esma-esma/index.html` endpoint.
