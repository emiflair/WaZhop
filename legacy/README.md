# Legacy & Dormant Assets

This folder holds code and assets that are not part of the active production build but are
retained for possible future use. Keeping them here avoids accidental bundle bloat while making
it clear that these pieces are safe to re-enable if product priorities change.

## Directory Map

| Path | Contents | Notes |
| --- | --- | --- |
| `legacy/pwa/service-worker.js` | Full offline caching service worker | Registration in `client/src/main.jsx` is currently disabled (`if (false && ...)`). Move this file back to `client/public/` before reenabling the block and the `/service-worker.js` headers in `client/vercel.json`. |
| `legacy/backups/client-index.html` | Previous static HTML shell | Historical reference from the pre-glassmorphism landing page; not loaded by Vite or Capacitor bundles. |
| `legacy/backups/icon.png` | Backup storefront icon | Use only if the primary logo in `client/assets/icons/` needs to be restored. |
| `legacy/backups/server-Dockerfile` | Retired Dockerfile | Replaced by the current Railway/Nixpacks flow; keep for reference when containerizing again. |
| `legacy/tools/clear-theme.html` | Manual theme reset helper | Standalone HTML utility used during debugging; not linked anywhere in the app. |

> 📌 **Reactivating dormant code**: Copy the relevant file back to its original location and rewire
> imports/routes before flipping any feature flags. Be sure to rerun `npm run build` and the
> Capacitor syncs so the native shells pick up the restored assets.
