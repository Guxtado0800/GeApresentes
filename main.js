/* ============================================================
   G ♥ A — Shared JS Utilities
   ============================================================ */
'use strict';

/* ── Page Loader ── */
function initLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      loader.addEventListener('transitionend', () => loader.remove(), { once: true });
    }, 700);
  });
}

/* ── Navigation ── */
function initNav() {
  const nav    = document.getElementById('main-nav');
  const toggle = document.querySelector('.nav-toggle');
  const menu   = document.getElementById('nav-menu');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Mark active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href').split('/').pop();
    if (href === path) a.classList.add('active');
  });
}

/* ── Intersection Observer Reveals ── */
function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── Toast Notification ── */
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.background = type === 'error' ? '#7b1d1d' : 'var(--royal)';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => { requestAnimationFrame(() => t.classList.add('show')); });
  setTimeout(() => {
    t.classList.remove('show');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
  }, 4000);
}

/* ── Sanitize user input (strips HTML tags) ── */
function sanitize(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

/* ── Google OAuth (GitHub Pages friendly) ──
   Uses Google Identity Services (GIS) popup flow.
   No server needed — ID token verified client-side for display only.
   IMPORTANT: For production, validate ID token server-side or via
   Google's tokeninfo endpoint if backend is added later. */
const GA_CONFIG = {
  // SUBSTITUA pelos seus dados reais do Google Cloud Console:
  CLIENT_ID:     'SEU_CLIENT_ID.apps.googleusercontent.com',
  ALLOWED_EMAILS: ['noiva@gmail.com', 'noivo@gmail.com'], // emails dos noivos
};

let gaUser = null;

function initGoogleAuth(onSuccess, onFail) {
  if (typeof google === 'undefined') {
    console.warn('Google Identity Services não carregado.');
    if (onFail) onFail('SDK não carregado');
    return;
  }
  google.accounts.id.initialize({
    client_id: GA_CONFIG.CLIENT_ID,
    callback: (response) => {
      try {
        const payload = parseJwt(response.credential);
        if (GA_CONFIG.ALLOWED_EMAILS.includes(payload.email)) {
          gaUser = payload;
          sessionStorage.setItem('ga_user', JSON.stringify({ name: payload.name, email: payload.email, picture: payload.picture }));
          if (onSuccess) onSuccess(gaUser);
        } else {
          if (onFail) onFail('Acesso restrito aos noivos.');
        }
      } catch (e) {
        if (onFail) onFail('Erro de autenticação.');
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });
}

function triggerGoogleLogin(buttonEl, onSuccess, onFail) {
  if (typeof google === 'undefined') { if (onFail) onFail('SDK não carregado'); return; }
  google.accounts.id.renderButton(buttonEl, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    locale: 'pt-BR',
  });
  google.accounts.id.prompt();
}

function getSessionUser() {
  try {
    const s = sessionStorage.getItem('ga_user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

function logoutGoogle() {
  sessionStorage.removeItem('ga_user');
  gaUser = null;
  if (typeof google !== 'undefined') google.accounts.id.revoke();
}

function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

/* ── Google Sheets RSVP Submit ──
   Uses a Google Apps Script Web App as proxy.
   Deploy the Apps Script (see README) and paste the URL below. */
const SHEETS_ENDPOINT = 'https://script.google.com/macros/s/SEU_APPS_SCRIPT_ID/exec';

async function submitRsvpToSheets(data) {
  const res = await fetch(SHEETS_ENDPOINT, {
    method: 'POST',
    mode: 'no-cors', // Apps Script doesn't support CORS with auth
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  // no-cors means we can't read the response body, but the request goes through
  return true;
}

/* ── Gifts JSON helpers ──
   The gifts.json lives in /data/gifts.json (committed to the repo).
   Admins edit it via admin-gifts.html which triggers a GitHub API commit.
   Public page just reads it. */
async function loadGifts() {
  const res = await fetch('../data/gifts.json?v=' + Date.now());
  if (!res.ok) throw new Error('Não foi possível carregar a lista.');
  return res.json();
}

/* ── GitHub API commit (admin only) ──
   Uses a GitHub Personal Access Token stored in sessionStorage after OAuth.
   Token needs: Contents (write) permission on the repo. */
const GITHUB_CONFIG = {
  OWNER: 'SEU_USUARIO_GITHUB',
  REPO:  'SEU_REPOSITORIO',
  PATH:  'data/gifts.json',
  BRANCH:'main',
};

async function saveGiftsToGithub(giftsArray, ghToken) {
  const content = btoa(unescape(encodeURIComponent(JSON.stringify({ gifts: giftsArray }, null, 2))));
  // Get current SHA
  const metaRes = await fetch(
    `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`,
    { headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json' } }
  );
  const meta = metaRes.ok ? await metaRes.json() : null;
  const sha  = meta ? meta.sha : undefined;

  const body = {
    message: '✏️ Atualiza lista de presentes',
    content,
    branch: GITHUB_CONFIG.BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_CONFIG.OWNER}/${GITHUB_CONFIG.REPO}/contents/${GITHUB_CONFIG.PATH}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error('Erro ao salvar no GitHub: ' + res.status);
  return true;
}

/* ── Init on DOMContentLoaded ── */
document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initNav();
  initReveal();
});
