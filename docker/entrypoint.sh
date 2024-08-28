#!/bin/bash

DEV=false

while getopts "d" flag
do
    case "${flag}" in
        d) DEV=true;;
        *) echo "Invalid flag ${flag}"
    esac
done

# Convert to Megabyte. And subtract X Mb for other Nodejs memory sections, as it is only the Heap limit.
NODE_MEMORY_LIMIT=$((K8S_MEMORY_LIMIT / 1024 / 1024 - NODEJS_RUNTIME_RESERVED_MEMORY))
export NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY_LIMIT}"

_term() {
  echo "Caught SIGTERM signal!"
  kill "$child" 2>/dev/null
  wait "$child"
}

trap _term SIGTERM

if [ "$DEV" = true ]
then
node_modules/.bin/nodemon --trace-warnings --inspect=0.0.0.0:9229 ./bin/www.js --watch . --ext js &
else
node ./bin/www.js &
fi

child=$!
wait "$child"
