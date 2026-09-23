# Amara Health — website

Static website for Amara Health. No build step and no npm dependencies. The live site is served from Netlify (amara1000.netlify.app); `vercel.json` and `api/` also support a Vercel deployment.

```
index.html              Home page (single scrolling page with section anchors)
privacy.html            Privacy notice (served at /privacy via cleanUrls)
assets/css/styles.css   All styles (brand tokens at the top)
assets/js/main.js       Menu, scroll reveals, scroll-spy, form handling
assets/img/             Photography
assets/brand/           Logo mark, favicon, social share image
api/waitlist.js         POST /api/waitlist  (Vercel serverless function)
api/partner.js          POST /api/partner   (Vercel serverless function)
api/_lib/forms.js       Shared validation + delivery logic
vercel.json             Static output + security/caching headers
```

## Deploying

Push to GitHub as before; Vercel serves the repository root and automatically deploys the `api/` functions (Node.js runtime, Node 18+).

## Connecting the forms (required before launch)

### On Netlify (current live site)

Both forms carry `data-netlify="true"`, so Netlify Forms detects them at deploy time. When `/api` is not available (as on Netlify), the site submits to Netlify Forms instead and shows success only if Netlify accepts the submission.

1. In Netlify, open the site → **Forms** and make sure **form detection** is enabled, then redeploy.
2. Submissions appear under **Forms → waitlist** and **Forms → partner**. Add email notifications under **Forms → Form notifications**.

### On Vercel

The waitlist and partnership forms submit to the functions above. **Until at least one delivery integration is configured, both endpoints return `503 not_configured` and the site shows a "not accepting sign-ups yet" message. It never fakes a successful sign-up.**

Set these in Vercel → Project → Settings → Environment Variables, then redeploy:

| Variable | Purpose |
| --- | --- |
| `FORMS_WEBHOOK_URL` | Each submission is POSTed here as JSON. Works with Zapier, Make, Google Apps Script (to a Google Sheet), Airtable, or a CRM/email-platform webhook. |
| `FORMS_WEBHOOK_SECRET` | Optional. Sent as the `X-Amara-Form-Secret` header so your webhook can reject other callers. |
| `RESEND_API_KEY` | Optional. Sends a notification email per submission through [Resend](https://resend.com). |
| `FORMS_NOTIFY_TO` | Comma-separated inbox(es) that receive notifications. |
| `FORMS_FROM_EMAIL` | A sender on a domain verified in Resend, for example `Amara <hello@yourdomain.com>`. |

You can configure either one or both. A submission counts as successful if at least one integration accepts it. Failures are logged in the Vercel function logs.

Webhook payload example:

```json
{ "type": "waitlist", "email": "name@example.com", "consent": true, "submittedAt": "2026-09-23T12:00:00.000Z" }
```

Spam protection is a hidden honeypot field. If spam becomes a problem, add rate limiting or a CAPTCHA.

## Local preview

`npx vercel dev` runs the site and the API functions together. For static-only preview (`npx http-server .`) the forms show their error state because `/api` isn't available.

## Before launch: content checklist

- **Photography.** See `docs/photography-brief.md` for the creative direction, shot list and priorities. Add or replace a photo with `python3 scripts/add_photo.py SOURCE NAME` (applies the campaign grade and writes AVIF and JPEG in two sizes), then update its `srcset` in `index.html`. Sources are recorded in `assets/img/CREDITS.md`.
- **Logo.** `assets/brand/amara-mark.svg` is drawn from the Cormorant Garamond "a" plus the gold dot. Replace it with the official brand-board file if it differs.
- **Social image URL.** `og:image` is a relative path. Once the production domain is known, change it to an absolute URL (`https://yourdomain.com/assets/brand/og-image.jpg`) so every platform picks it up.
- **Privacy notice.** Have `privacy.html` reviewed, and add a contact email.
