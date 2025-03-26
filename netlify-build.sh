#!/bin/bash

# Build the frontend
npm run build

# Build the Netlify functions
mkdir -p netlify/functions-build
npx esbuild netlify/functions/api.ts --platform=node --packages=external --bundle --format=cjs --outdir=netlify/functions-build

# Copy the built functions to the correct location
cp -r netlify/functions-build/* netlify/functions/