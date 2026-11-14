# IIS Deployment (Next.js Standalone)

## Why the app was stuck on loading

If the browser logs show many `404` errors for `/_next/static/chunks/*.js`, the deployment is incomplete.

For `output: 'standalone'`, you must deploy all of these together:

1. `.next/standalone/*`
2. `.next/static/*` (copied into `.next/standalone/.next/static`)
3. `public/*` (copied into `.next/standalone/public`)
4. `web.config` (in the deployed root next to `server.js`)

If only `.next/standalone` is deployed, HTML may load but JS chunks fail with 404 and the page stays on the loading screen.

## Recommended build command (for IIS package)

Run in project root:

```powershell
npm.cmd ci
npm.cmd run build:iis
```

This creates a ready-to-deploy folder:

```text
.iis-dist\
```

Upload the contents of `.iis-dist` to your IIS site root.

`build:iis` also removes stale `public/robots.txt` and `public/sitemap*.xml` files before build, so your `app/robots.ts` and `app/sitemap.ts` remain the single source of truth.

## Environment variables (Production)

Set these in IIS (Site/Application -> Configuration Editor / system.webServer/aspNetCore env vars, or system env vars), or place an `.env` file in deploy root:

```env
NODE_ENV=production
PORT=3000
HOSTNAME=127.0.0.1
NEXT_PUBLIC_SITE_URL=https://arkasoftware.ir
NEXT_PUBLIC_API_URL=https://api.arkasoftware.ir
# Optional temporary troubleshooting switch:
# NEXT_PUBLIC_DISABLE_PWA=true
```

## IIS prerequisites

Install on the server:

1. Node.js LTS
2. IIS URL Rewrite Module
3. iisnode (for running `server.js` under IIS)

IIS site settings:

1. Application Pool: `No Managed Code`
2. Pipeline mode: `Integrated`
3. 64-bit enabled
4. Site bindings:
   - `https://arkasoftware.ir` (443)
   - `https://www.arkasoftware.ir` (443) (optional, for redirect)
   - `http://arkasoftware.ir` (80) (optional, for redirect)
   - `http://www.arkasoftware.ir` (80) (optional, for redirect)

## What `web.config` handles

The included `web.config`:

1. Redirects `www` -> apex (`arkasoftware.ir`)
2. Redirects `http` -> `https`
3. Redirects `index.html` -> `/`
4. Redirects `:8443` -> normal HTTPS (443)
5. Routes all requests to Next.js `server.js` via `iisnode`
6. Passes Next.js responses through unchanged (`<httpErrors existingResponse="PassThrough" />`) so the site's own custom 404/500 pages are shown instead of raw IIS error pages

The rule that routes requests to `server.js` deliberately has **no** file/directory
exclusion conditions. If you add conditions like `IsFile`/`IsDirectory`, any physical
folder in the site root (for example a leftover `projects` folder from an old
deployment) will shadow app routes and deep links such as `/projects/<slug>` will
return IIS 404 pages instead of reaching Next.js.

## Troubleshooting: project detail pages show an IIS error (404 - File or directory not found)

Root cause (fixed 2026-09): two separate problems produced this.

1. **`next.config.ts` rewrite shadowing.** The static-asset proxy
   `source: '/projects/:path*' -> msg.arkasoftware.ir/public/projects/:path*` was
   registered as an `afterFiles` rewrite. `afterFiles` rewrites run **before dynamic
   routes**, so `/projects/<slug>` was proxied to the storage host (which has no such
   file and answered with its own IIS error page) and the `/projects/[slug]` page never
   rendered. The proxy now lives in the `fallback` rewrite group, which only runs when
   no page/dynamic route matched, so app routes always win. Static project media
   (`/projects/video/<file>.mp4`, ...) is still proxied to the storage host.
2. **Missing `web.config` in the deployment package.** `prepare-iis-standalone.cjs`
   used to only *warn* when `web.config` was absent and still produced a package
   without it, leaving whatever stale config existed on the server in charge. The
   script now fails unless `web.config` exists in the project root, and it is copied
   into `.iis-dist` on every build.

After deploying a fixed build, verify in this order:

1. `https://arkasoftware.ir/projects` renders the list.
2. `https://arkasoftware.ir/projects/<slug>` renders the detail page.
3. `https://arkasoftware.ir/projects/<unknown-slug>` shows the site's own 404 page
   (not an IIS error page).

## After each deployment (important for PWA)

Because service-worker caching is enabled, do this after deploy:

1. Hard refresh (`Ctrl+F5`)
2. If still broken, unregister the service worker and clear site storage
3. Reopen the site

If you need to quickly verify deployment without PWA caching interference, set:

```env
NEXT_PUBLIC_DISABLE_PWA=true
```

Then rebuild and redeploy.
