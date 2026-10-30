# Task 2 – Website Performance and Optimization Report

**Application:** Shelfmark  **URL tested:** _https://…_  **Date tested:** _YYYY-MM-DD_  **Tool:** _PageSpeed Insights / Lighthouse in Chrome DevTools_

## How to run the test

**PageSpeed Insights:** open https://pagespeed.web.dev, paste the deployed URL, click Analyze. Record both the Mobile and Desktop tabs.

**Lighthouse in Chrome:** open the deployed URL in an Incognito window, press F12, choose the Lighthouse tab, tick Performance, Accessibility, Best practices and SEO, choose Mobile, click Analyze page load. Repeat for Desktop.

If the backend is on Render's free plan, wake it first by opening the URL once and waiting for it to load. Otherwise the cold start will inflate the server response time.

## Scores (fill in)

| Category | Mobile | Desktop |
|---|---|---|
| Performance | | |
| Accessibility | | |
| Best practices | | |
| SEO | | |

## Page loading time and performance metrics (fill in)

| Metric | Mobile | Desktop | Good target |
|---|---|---|---|
| First Contentful Paint (FCP) | | | under 1.8 s |
| Largest Contentful Paint (LCP) | | | under 2.5 s |
| Total Blocking Time (TBT) | | | under 200 ms |
| Cumulative Layout Shift (CLS) | | | under 0.1 |
| Speed Index | | | under 3.4 s |

## Checklist: what to check and what Shelfmark already does

| Area | What to look for in the report | Shelfmark's design | Your finding |
|---|---|---|---|
| Large images and unoptimized media | "Properly size images", "Efficiently encode images", "Serve images in next-gen formats" | The app uses no image files. Book covers are CSS-drawn spines and the favicon is an inline SVG, so there is nothing to compress. If you later add cover photos, use WebP or AVIF, set `width`/`height`, and add `loading="lazy"`. | |
| Excessive JavaScript or CSS | "Reduce unused JavaScript/CSS", "Minify JavaScript/CSS", "Avoid enormous network payloads" | One 12.7 KB script (4.6 KB gzipped) and one 7.2 KB stylesheet (2.6 KB gzipped). No frameworks or libraries. Minifying would shrink them further (see recommendations). | |
| Render-blocking resources | "Eliminate render-blocking resources" | The script is a `type="module"` (deferred by default) and `config.js` uses `defer`. The one remaining blocker is `styles.css` (small, so expect a very small saving). Inlining it in `<head>` removes this entirely. | |
| Missing compression | "Enable text compression" | The Express server uses gzip (`compression` middleware). Measured locally: index 6.0 KB to 2.0 KB, CSS 7.2 KB to 2.6 KB, JS 12.8 KB to 4.6 KB. GitHub Pages also gzips text files. | |
| Caching | "Serve static assets with an efficient cache policy" | Express sends `Cache-Control: public, max-age=604800` for CSS/JS and `no-cache` for HTML, API responses use `no-store`. GitHub Pages sets its own 10-minute cache, so it may flag this. | |
| Server response time | "Reduce initial server response time" | Static files plus a tiny JSON API. On Render's free plan the first request after idle can take 30 to 60 seconds. This is a hosting limit, not a code problem. | |
| Layout shift | CLS value | Spines and rows have fixed sizes and the page does not insert content above existing content after load. No web fonts are loaded, so there is no font-swap shift. | |
| Fonts | "Ensure text remains visible during webfont load" | System font stacks only, so no font requests. | |
| Accessibility and SEO | Labels, contrast, `lang`, meta description, viewport | Every field has a label, visible focus rings, `lang="en"`, a meta description, viewport tag, skip link, ARIA labels on spines, reduced-motion support. | |

## Recommendations to try and re-test (optional improvements)

1. **Inline the CSS** in `index.html` (it is about 2.6 KB gzipped) to remove the last render-blocking request.
2. **Minify** `app.js` and `styles.css` (for example `npx esbuild js/app.js --minify` and `npx esbuild css/styles.css --minify`). Typical saving is 30 to 40%.
3. **Add a version query string** (`app.js?v=2`) whenever you change an asset, because assets are cached for 7 days.
4. **Use a CDN or Render paid plan** to avoid cold starts and reduce time to first byte.
5. **Add `<link rel="preconnect">`** to the API origin in `index.html` when the API lives on a different domain than the frontend (Option B).
6. If you add book cover images, lazy-load them and serve WebP.

## Results after optimization (fill in if you apply any changes)

| Change made | Before | After |
|---|---|---|
| | | |

## Conclusion

_Summarize in 3 to 5 sentences: the overall scores, the biggest issue the tool found, and what you changed or would change._
