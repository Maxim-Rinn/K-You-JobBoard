const form = document.getElementById('account-form');
const errorBox = document.getElementById('account-error');
const successBox = document.getElementById('account-success');

const fields = {
  first_name: document.getElementById('account-first-name'),
  last_name: document.getElementById('account-last-name'),
  email: document.getElementById('account-email'),
  phone: document.getElementById('account-phone'),
  main_stack: document.getElementById('account-main-stack'),
  secondary_stack: document.getElementById('account-secondary-stack'),
  work_mode: document.getElementById('account-work-mode'),
};

// Sans jeton : création de compte. Avec jeton : modification de son compte.
let currentUserId = null;

async function loadAccount() {
  if (!getToken()) return;

  const { status, body } = await apiFetch('/auth/me');
  if (status !== 200) {
    errorBox.textContent = body.error;
    return;
  }

  const user = body.data;
  currentUserId = user.id;

  for (const key in fields) {
    fields[key].value = user[key] || '';
  }

  document.getElementById('account-title').textContent = 'Mon compte';
  document.getElementById('account-submit').textContent = 'Enregistrer';
  document.getElementById('password-block').style.display = 'none';
  document.getElementById('profile-block').style.display = '';
  document.getElementById('login-hint').style.display = 'none';
}

// Champ vide -> null, pour ne pas stocker "" dans les colonnes facultatives
function readField(key) {
  const value = fields[key].value.trim();
  return value === '' ? null : value;
}

async function createAccount() {
  const email = readField('email');
  const password = document.getElementById('account-password').value;

  const { status, body } = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      first_name: readField('first_name'),
      last_name: readField('last_name'),
      email,
      phone: readField('phone'),
      password,
    }),
  });

  if (status !== 201) {
    errorBox.textContent = body.error;
    return;
  }

  // Compte créé : on connecte directement la personne avec les mêmes identifiants
  const login = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (login.status !== 200) {
    window.location.href = 'login.html';
    return;
  }

  saveToken(login.body.token);
  window.location.href = 'index.html';
}

async function updateAccount() {
  const data = {};
  for (const key in fields) {
    data[key] = readField(key);
  }

  const { status, body } = await apiFetch('/people/' + currentUserId, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (status !== 200) {
    errorBox.textContent = body.error;
    return;
  }

  successBox.textContent = 'Compte enregistré.';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorBox.textContent = '';
  successBox.textContent = '';

  if (currentUserId) {
    await updateAccount();
  } else {
    await createAccount();
  }
});

loadAccount();
