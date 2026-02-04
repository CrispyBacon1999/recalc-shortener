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
├── index.html          # Main shortener UI
├── go.html             # Redirect page
├── styles.css          # Shared styles
├── src/
│   ├── config.js       # Dictionaries (paths, units, motors)
│   ├── codec.js        # Binary encoding/decoding
│   ├── compress.js     # Gzip compression helpers
│   └── recalc.js       # ReCalc-specific encoding
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

### Cloudflare Pages (Recommended)

1. Push to GitHub
2. Connect to Cloudflare Pages
3. Set build command: (none, static site)
4. Set output directory: `.` (root)

Or deploy directly:

```bash
bun run deploy
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
| Belts      | 249 chars | ~175 chars | 30% |
| Flywheel   | 894 chars | ~310 chars | 65% |
| Drivetrain | 1,403 chars | ~430 chars | 70% |

## License

MIT
