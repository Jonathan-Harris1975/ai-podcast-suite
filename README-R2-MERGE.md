# Shared R2/S3 Client & Env Checker

This folder contains the single sources of truth for:
- Cloudflare R2 client (`r2-client.js`)
- Environment validator (`env-checker.js`)
- Legacy alias (`s3client.js`)

## Usage in services

Replace any service-local clients and pings with:

```js
import { validateEnv } from "../services/env-checker.js";
import { validateR2Once, s3, R2_BUCKETS, uploadBuffer } from "../services/r2-client.js";

validateEnv();          // hard-stop if any env var is missing
await validateR2Once(); // single HeadBucket probe (no retries/ping)
```

Remove all retry loops ("Attempt 1/3", "Retrying in")
and any direct `fetch(R2_ENDPOINT)` calls.
