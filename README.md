# Hotel View Control

Hotel View Control is a local-only Chrome extension for managing hotel listings already reviewed on Booking.com and Agoda search-result pages. It can hide or dim a card in the current browser, and lets the user restore it later.

It is independent software and is not affiliated with, endorsed by, or sponsored by Booking.com, Agoda, Loom, or any of their parent companies.

Published by King Tide Media. Maintained by Ben Vining.

## What it does

- Adds a small **Hotel View Control** menu to supported hotel-result cards.
- Saves **Hidden** and **Dimmed** preferences locally in `chrome.storage.local`.
- Reapplies preferences when results reload, sort, filter, or append dynamically.
- Offers a page-level **Show hidden hotels** switch and a popup for individual restore, site clear, or global clear.

The extension only changes the local visual display of search-result cards. It does not modify prices, ratings, availability, booking controls, checkout, payments, reviews, rankings, or advertisements.

## Privacy

Hotel names, property identifiers, optional canonical URLs, and visibility preference are stored only in Chrome's local extension storage on the user's device. The extension has no accounts, analytics, tracking, remote code, external database, or outbound network service. It does not sell, share, or transmit user or browsing data.

## Development and loading

Requirements: Node.js 20+ and npm.

```sh
npm install
npm run typecheck
npm run build
```

Then open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select the generated `dist` directory. For a store upload, build first and ZIP the *contents* of `dist` (not the containing folder).

## Site adapter status

### Booking.com

The Booking adapter selects:

```css
[data-testid="property-card"][data-id]
```

`data-id` is the preferred persistent property identifier. For example, a card with `data-id="9938326"` uses storage key `booking:9938326`. Newer Booking cards may omit that attribute; those use the query-free canonical property URL as the stable key. The control mounts over the desktop image area. Result position, dates, pricing, tracking parameters, and rate-block IDs are never used.

### Agoda

The Agoda adapter selects `li[data-hotelid]` and uses `data-hotelid` as the persistent property identifier. For example, `data-hotelid="89989116"` uses storage key `agoda:89989116`. Its control is mounted directly in the card's `property-card-gallery` carousel, while the title is read from `[data-testid="property-name-link"]`. Do not derive identity from card index, price, or search ordering.

## Chrome Web Store draft

Name ideas: **Hotel View Control**, **Reviewed Stay Filter**, **Stay List Manager**.

Short description: *Locally hide or dim hotel results you have already reviewed on Booking.com and Agoda.*

Full description: *Hotel View Control makes hotel search results easier to manage. Mark a result as hidden or dimmed, and restore it whenever you want. Your preferences are stored only in your browser and are reapplied while you browse supported hotel search pages. The extension changes only your local view of result cards; it never changes prices, ratings, availability, booking actions, checkout, payments, reviews, rankings, or ads. Hotel View Control is independent and is not affiliated with Booking.com, Agoda, Loom, or their parent companies.*

Privacy disclosure: *The extension stores hotel visibility preferences locally in Chrome extension storage. It does not collect, transmit, sell, or share personal information, browsing activity, or hotel data.*

## Support site and Chrome Web Store handoff

This repository includes the static support site in `site/` and deploys it with `.github/workflows/deploy-pages.yml` after the repository is pushed to GitHub. Before linking the site from the extension or Chrome Web Store:

1. Configure GitHub Pages to use the GitHub Actions deployment source.
2. Set the custom domain to `hotelviewcontrol.kingtidemedia.com` in GitHub Pages settings.
3. Create the DNS `CNAME` record required by GitHub Pages, verify the domain in GitHub, and enable HTTPS.
4. Confirm the landing page, `privacy.html`, and `support.html` load over HTTPS.
5. Then add the verified URLs to the Chrome Web Store website, support, and privacy-policy fields; set developer/publisher identity to King Tide Media and maintainer/contact to Ben Vining.

Do not add the domain to `homepage_url` or make the in-extension publisher attribution clickable until the custom domain is live and verified.

## Manual test checklist

- [ ] On a Booking.com search results page, hide one hotel card; it is collapsed from the local page.
- [ ] Reload the page and change filters/sorting; the same `data-id` remains hidden.
- [ ] Dim a different hotel; it remains visible and clearly de-emphasized.
- [ ] Use **Show** in the card menu, the page-level **Show hidden hotels** control, and the popup to restore hotels.
- [ ] Test next-page navigation and dynamically appended result cards.
- [ ] Use popup **Clear this site** and **Clear all saved hotels**; verify preferences are removed.
- [ ] Confirm no duplicate controls appear after filtering, scrolling, or mutations.
- [ ] Inspect DevTools Network with the extension installed; verify it initiates no external requests.
- [ ] Confirm injected controls are small, clearly branded “Hotel View Control,” and do not obscure native booking actions.
- [ ] After configuring the Agoda adapter, repeat all site behavior checks on Agoda.
