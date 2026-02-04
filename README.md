# ReCalc URL Shortener ⚡

Compress reca.lc calculator URLs to their smallest possible form. All data stays in the URL — no database required.

## Features

- **Domain-aware compression**: Optimized specifically for reca.lc URLs
- **70%+ size reduction**: Large URLs become much more shareable
- **Client-side only**: No server-side processing, works entirely in the browser
- **Self-contained**: All data is encoded in the URL hash

## How It Works

The shortener uses several techniques to compress reca.lc URLs:

1. **Domain stripping** - The `https://www.reca.lc` prefix is not stored
2. **Path indexing** - Calculator types are stored as single bytes
3. **Dictionary encoding** - Known units, motors, etc. are stored as bytes
4. **Binary encoding** - JSON structures are efficiently serialized
5. **gzip compression** - Final data is compressed with gzip

## Project Structure

```
├── public/
│   ├── index.html      # Main shortener UI
│   ├── go.html         # Redirect page
│   ├── styles.css      # Shared styles
│   └── src/
│       ├── config.js   # Dictionaries (paths, units, motors)
│       ├── codec.js    # Binary encoding/decoding
│       ├── compress.js # Gzip compression helpers
│       └── recalc.js   # ReCalc-specific encoding
├── server.ts           # Development server (Bun)
├── _redirects          # Cloudflare Pages routing
├── _headers            # Cloudflare Pages headers
└── package.json
```

## Development

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Open http://localhost:3000
```

## Deployment

### Cloudflare Workers

This repo includes a Worker that serves the static assets and handles the `/go` redirect.

```bash
# Local worker dev server
bun run worker:dev

# Deploy the Worker
bun run deploy
```

### Cloudflare Pages (Alternative)

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Set build command: (none, static site)
4. Set output directory: `.` (root)

Or deploy directly:

```bash
bun run deploy:pages
```

### Manual Deployment

Just upload all files to any static hosting (Netlify, Vercel, S3, etc.).

## Adding New Calculators

To add support for new reca.lc calculator types:

1. Edit `src/config.js`
2. Add the path name to `PATHS` array
3. Add any new units to `UNITS` array
4. Add any new motors to `MOTORS` array

**Important**: Only append to arrays, never reorder or remove existing entries (this would break existing shortened URLs).

## Example Compression

| Calculator | Original | Compressed | Savings |
|------------|----------|------------|---------|
| Belts      | 249 chars | ~100 chars | 60% |
| Flywheel   | 894 chars | 124 chars | **86%** |
| Drivetrain | 1,403 chars | 176 chars | **87%** |

### How V2 Achieves Better Compression

1. **Schema-based encoding** - Parameter names are not stored! Each calculator has a predefined list of parameters, and values are stored in that order.
2. **Raw deflate** - Uses deflate without gzip header (saves 18 bytes)
3. **Compact binary format** - Small integers use 1 byte, units/motors use 1-byte indices
4. **Smart compression** - Skips compression if it doesn't help (for tiny payloads)

## License

MIT
