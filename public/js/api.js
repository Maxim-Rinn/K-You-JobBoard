const TOKEN_KEY = 'token';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = 'index.html';
}

async function apiFetch(url, options = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const token = getToken();
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401 && token) {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'login.html';
  }

  const body = await response.json();

  return { status: response.status, body };
}


async function updateNav() {
  const linkLogin = document.getElementById('link-login');
  const linkAccount = document.getElementById('link-account');
  const linkAdmin = document.getElementById('link-admin');
  const linkLogout = document.getElementById('link-logout');

  if (!linkLogin) return;

  if (!getToken()) return;

  const { status, body } = await apiFetch('/auth/me');
  if (status !== 200) return;

  linkLogin.style.display = 'none';
  linkAccount.style.display = '';
  linkLogout.style.display = '';

  if (body.data.role === 'admin') {
    linkAdmin.style.display = '';
  }

  linkLogout.addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', updateNav);
