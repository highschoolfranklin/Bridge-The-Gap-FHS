/**
 * Shared helpers for safe HTML and URLs (mitigates XSS when using innerHTML).
 */
function escapeHtml(value) {
  if (value == null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

/** Only allow http(s) URLs for links and images */
function safeHttpUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const t = url.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return '';
}

/**
 * Extract object path within the `documents` bucket from a Supabase Storage URL.
 * e.g. .../object/public/documents/college-logos/uuid/file.png → college-logos/uuid/file.png
 */
function documentsStoragePathFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const m = url.trim().match(/\/storage\/v1\/object\/(?:public|sign)\/documents\/([^?#]+)/i);
  if (!m) return '';
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

/**
 * Image URL for display: prefers a long-lived signed URL so private buckets work.
 * Falls back to the stored URL. Uses global `supabase` (loaded before this file in app).
 */
async function resolveCollegeLogoDisplayUrl(logoUrl) {
  const base = safeHttpUrl(logoUrl);
  if (!base) return '';
  if (typeof supabase === 'undefined') return base;
  const path = documentsStoragePathFromUrl(base);
  if (!path) return base;
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (!error && data && data.signedUrl) return data.signedUrl;
    if (error) console.warn('createSignedUrl failed:', error.message, path);
  } catch (e) {
    console.warn('resolveCollegeLogoDisplayUrl:', e);
  }
  return base;
}

function loadingMarkup(message) {
  const msg = escapeHtml(message || 'Loading…');
  return `<div class="loading-spinner" role="status" aria-live="polite" aria-busy="true"><div class="spinner" aria-hidden="true"></div><p>${msg}</p></div>`;
}

function debounce(fn, waitMs) {
  let t;
  return function debounced(...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), waitMs);
  };
}

/** Skeleton grid for listing tabs while JSON loads */
function skeletonListingMarkup(cardCount) {
  const n = Math.max(1, Math.min(12, cardCount || 6));
  let html = '';
  for (let i = 0; i < n; i += 1) {
    html += `
      <div class="skeleton-card" aria-hidden="true">
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line skeleton-line--short"></div>
        <div class="skeleton-actions"><span class="skeleton-pill"></span><span class="skeleton-pill"></span></div>
      </div>`;
  }
  return html;
}

const APP_HASH_ROLES = ['student', 'parent', 'counselor'];

const APP_TABS = {
  student: new Set(['college', 'opportunities', 'scholarships', 'progress', 'sat', 'colleges', 'todo']),
  parent: new Set(['parent-overview', 'parent-scholarships', 'parent-sat', 'parent-colleges', 'parent-todo', 'parent-transcript']),
  counselor: new Set(['counselor-students', 'counselor-scholarships', 'counselor-opportunities', 'counselor-resources', 'counselor-transcript', 'counselor-reminders'])
};

function resolveStartTab(role, defaultTab) {
  const h = getAppHash();
  const allowed = APP_TABS[role];
  if (!h || h.role !== role || !allowed || !allowed.has(h.tab)) return defaultTab;
  return h.tab;
}

function getAppHash() {
  const raw = (typeof location !== 'undefined' && location.hash) ? location.hash.replace(/^#/, '') : '';
  if (!raw) return null;
  const i = raw.indexOf('/');
  if (i <= 0) return null;
  const role = raw.slice(0, i);
  const tab = raw.slice(i + 1);
  if (!role || !tab || APP_HASH_ROLES.indexOf(role) === -1) return null;
  try {
    return { role, tab: decodeURIComponent(tab) };
  } catch {
    return null;
  }
}

function setAppHash(role, tab) {
  if (typeof location === 'undefined' || !role || !tab) return;
  const next = `#${role}/${encodeURIComponent(tab)}`;
  if (location.hash !== next) {
    history.replaceState(null, '', `${location.pathname}${location.search}${next}`);
  }
}

/**
 * Fetch JSON with localStorage fallback. Cache is best-effort (quota, privacy).
 * @returns {Promise<{ ok: boolean, data?: any, stale?: boolean, error?: string, cachedAt?: number }>}
 */
async function fetchJsonWithCache(url, storageKey) {
  try {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error(`Network error (${res.status})`);
    const data = await res.json();
    try {
      localStorage.setItem(storageKey, JSON.stringify({ t: Date.now(), data }));
    } catch (_) { /* ignore */ }
    return { ok: true, data, stale: false };
  } catch (err) {
    const msg = err && err.message ? String(err.message) : 'Load failed';
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.data != null) {
          return {
            ok: true,
            data: parsed.data,
            stale: true,
            error: msg,
            cachedAt: typeof parsed.t === 'number' ? parsed.t : undefined
          };
        }
      }
    } catch (_) { /* ignore */ }
    return { ok: false, error: msg };
  }
}
