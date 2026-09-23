'use strict';

/*
 * Shared form handler for Vercel serverless functions (Node.js runtime).
 *
 * Submissions are validated here, then delivered to whichever integrations are
 * configured through environment variables (see README.md):
 *
 *   FORMS_WEBHOOK_URL      POST the submission as JSON (Zapier, Make, Google Apps
 *                          Script, Airtable automation, a CRM webhook, etc.)
 *   FORMS_WEBHOOK_SECRET   optional; sent as the X-Amara-Form-Secret header
 *
 *   RESEND_API_KEY         send a notification email through Resend
 *   FORMS_NOTIFY_TO        comma-separated recipient address(es)
 *   FORMS_FROM_EMAIL       verified sender, e.g. "Amara <hello@yourdomain.com>"
 *
 * If nothing is configured the endpoint answers 503 { error: "not_configured" }
 * so the site never reports a sign-up as successful when it was not stored.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIMEOUT_MS = 8000;

const ORG_TYPES = [
  'Health system or hospital',
  'Maternal health program',
  'Community health organization',
  'Health plan or payer',
  'Research or academic',
  'Investor or funder',
  'Other'
];

const SCHEMAS = {
  waitlist: {
    subject: 'New Amara waitlist sign-up',
    fields: {
      email: { required: true, max: 254, email: true, label: 'Email' },
      consent: { consent: true, label: 'Consent' }
    }
  },
  partner: {
    subject: 'New Amara partnership inquiry',
    fields: {
      firstName: { required: true, max: 80, label: 'First name' },
      lastName: { required: true, max: 80, label: 'Last name' },
      email: { required: true, max: 254, email: true, label: 'Work email' },
      organization: { required: true, max: 160, label: 'Organization' },
      orgType: { required: true, oneOf: ORG_TYPES, label: 'Organization type' },
      message: { max: 2000, multiline: true, label: 'Message' },
      consent: { consent: true, label: 'Consent' }
    }
  }
};

function clean(value, multiline) {
  if (typeof value !== 'string') return '';
  // Strip control characters (keep newlines/tabs for multi-line fields).
  const pattern = multiline ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return value.replace(pattern, '').trim();
}

function validate(kind, body) {
  const schema = SCHEMAS[kind];
  const data = {};
  const errors = {};

  for (const [name, rule] of Object.entries(schema.fields)) {
    if (rule.consent) {
      if (body[name] !== true) errors[name] = 'Consent is required.';
      else data[name] = true;
      continue;
    }
    const value = clean(body[name], rule.multiline);
    if (rule.required && !value) { errors[name] = `${rule.label} is required.`; continue; }
    if (rule.max && value.length > rule.max) { errors[name] = `${rule.label} is too long.`; continue; }
    if (rule.email && value && !EMAIL_RE.test(value)) { errors[name] = 'Please enter a valid email address.'; continue; }
    if (rule.oneOf && value && !rule.oneOf.includes(value)) { errors[name] = 'Please choose an option.'; continue; }
    data[name] = rule.email ? value.toLowerCase() : value;
  }

  return { data, errors };
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = typeof req.body === 'string' ? req.body : '';
  if (!raw && typeof req.on === 'function') {
    raw = await new Promise((resolve, reject) => {
      let buf = '';
      req.on('data', (chunk) => {
        buf += chunk;
        if (buf.length > 20000) reject(new Error('too_large'));
      });
      req.on('end', () => resolve(buf));
      req.on('error', reject);
    });
  }
  if (!raw) return {};
  return JSON.parse(raw);
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

function formatText(kind, record) {
  const labels = SCHEMAS[kind].fields;
  const lines = Object.keys(labels)
    .filter((k) => k !== 'consent' && record[k])
    .map((k) => `${labels[k].label}: ${record[k]}`);
  lines.push(`Consent given: yes`);
  lines.push(`Submitted: ${record.submittedAt}`);
  return lines.join('\n');
}

async function postJSON(url, body, headers) {
  const res = await fetch(url, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
}

function deliveries(kind, record, env) {
  const jobs = [];

  if (env.FORMS_WEBHOOK_URL) {
    const headers = env.FORMS_WEBHOOK_SECRET ? { 'X-Amara-Form-Secret': env.FORMS_WEBHOOK_SECRET } : {};
    jobs.push({ name: 'webhook', run: () => postJSON(env.FORMS_WEBHOOK_URL, record, headers) });
  }

  if (env.RESEND_API_KEY && env.FORMS_NOTIFY_TO && env.FORMS_FROM_EMAIL) {
    jobs.push({
      name: 'resend',
      run: () => postJSON('https://api.resend.com/emails', {
        from: env.FORMS_FROM_EMAIL,
        to: env.FORMS_NOTIFY_TO.split(',').map((s) => s.trim()).filter(Boolean),
        subject: SCHEMAS[kind].subject,
        text: formatText(kind, record),
        reply_to: record.email
      }, { Authorization: `Bearer ${env.RESEND_API_KEY}` })
    });
  }

  return jobs;
}

async function handleForm(req, res, kind, env = process.env) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, error: 'method_not_allowed' });
  }

  let body;
  try {
    body = await readBody(req);
  } catch (err) {
    return send(res, 400, { ok: false, error: 'invalid_body' });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return send(res, 400, { ok: false, error: 'invalid_body' });
  }

  // Honeypot: real visitors never fill this hidden field. Pretend success for bots.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return send(res, 200, { ok: true });
  }

  const { data, errors } = validate(kind, body);
  if (Object.keys(errors).length) {
    return send(res, 400, { ok: false, error: 'validation', fields: errors });
  }

  const record = Object.assign({ type: kind }, data, { submittedAt: new Date().toISOString() });
  const jobs = deliveries(kind, record, env);
  if (!jobs.length) {
    console.error(`[forms] ${kind}: no delivery integration configured (set FORMS_WEBHOOK_URL and/or RESEND_API_KEY, FORMS_NOTIFY_TO, FORMS_FROM_EMAIL)`);
    return send(res, 503, { ok: false, error: 'not_configured' });
  }

  const results = await Promise.allSettled(jobs.map((j) => j.run()));

  const failed = results
    .map((r, i) => (r.status === 'rejected' ? `${jobs[i].name}: ${r.reason && r.reason.message}` : null))
    .filter(Boolean);
  if (failed.length) console.error(`[forms] ${kind}: delivery failures -> ${failed.join('; ')}`);

  if (failed.length === jobs.length) {
    return send(res, 502, { ok: false, error: 'delivery_failed' });
  }
  return send(res, 200, { ok: true });
}

module.exports = { handleForm, validate, ORG_TYPES };
