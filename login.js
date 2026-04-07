const ADMIN_EMAIL = 'mateustrgn@gmail.com';

const loginForm = document.querySelector('#login-form');
const registerForm = document.querySelector('#register-form');
const authMessage = document.querySelector('#auth-message');
const loginEmailInput = document.querySelector('#login-email');
const loginPasswordInput = document.querySelector('#login-password');
const registerNameInput = document.querySelector('#register-name');
const registerPhoneInput = document.querySelector('#register-phone');
const registerEmailInput = document.querySelector('#register-email');
const registerPasswordInput = document.querySelector('#register-password');

function showMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.style.color = isError ? '#b43a3a' : '';
}

function getRedirectPath(user) {
  return user?.email === ADMIN_EMAIL ? './admin.html' : './aluno.html';
}

async function ensureStudentProfile(user, profile = {}) {
  if (user.email === ADMIN_EMAIL) {
    return;
  }

  const payload = {
    id: user.id,
    nome: profile.nome || user.user_metadata?.nome || null,
    telefone: profile.telefone || user.user_metadata?.telefone || null,
    email: user.email,
    status: 'ativo'
  };

  const { error } = await window.supabaseClient
    .from('alunos')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    throw error;
  }
}

async function redirectIfLoggedIn() {
  const { data, error } = await window.supabaseClient.auth.getSession();

  if (error) {
    console.error('Erro ao verificar sessao do aluno:', error);
    return;
  }

  if (data.session) {
    window.location.href = getRedirectPath(data.session.user);
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('');

  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value.trim();

  const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    console.error('Erro no login do aluno:', error);
    showMessage('Nao foi possivel entrar. Confira e-mail e senha.', true);
    return;
  }

  try {
    if (data.user) {
      await ensureStudentProfile(data.user);
    }
  } catch (profileError) {
    console.error('Erro ao sincronizar cadastro do aluno:', profileError);
    showMessage('Entrou, mas nao foi possivel sincronizar o cadastro do aluno.', true);
    return;
  }

  showMessage('Login feito com sucesso. Abrindo sua area...');
  window.location.href = getRedirectPath(data.user);
});

registerForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  showMessage('');

  const nome = registerNameInput.value.trim();
  const telefone = registerPhoneInput.value.trim();
  const email = registerEmailInput.value.trim();
  const password = registerPasswordInput.value.trim();

  const { data, error } = await window.supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome,
        telefone
      }
    }
  });

  if (error) {
    console.error('Erro ao criar acesso do aluno:', error);
    showMessage('Nao foi possivel criar o acesso agora.', true);
    return;
  }

  if (data.user) {
    try {
      await ensureStudentProfile(data.user, { nome, telefone });
    } catch (profileError) {
      console.error('Erro ao salvar perfil do aluno:', profileError);
      showMessage('Conta criada, mas nao foi possivel salvar o telefone do aluno.', true);
      return;
    }
  }

  if (!data.session) {
    showMessage('Conta criada. Se o Supabase pedir confirmacao por e-mail, confirme primeiro e depois entre.');
    return;
  }

  showMessage('Conta criada com sucesso. Abrindo sua area...');
  window.location.href = getRedirectPath(data.user);
});

redirectIfLoggedIn();
