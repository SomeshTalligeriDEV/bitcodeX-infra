#!/bin/bash

vercel link --yes --scope=keplrwallet --project=bitcodex-demo-web
vercel build
vercel deploy --prebuilt
