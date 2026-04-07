const ADMIN_EMAIL = 'mateustrgn@gmail.com';
const bookingsTable = 'reservas';

const adminAuthCard = document.querySelector('#admin-auth-card');
const adminPanel = document.querySelector('#admin-panel');
const adminMessage = document.querySelector('#admin-message');
const adminReservationList = document.querySelector('#admin-reservation-list');
const adminMonthlyList = document.querySelector('#admin-monthly-list');
const monthlyForm = document.querySelector('#monthly-form');
const monthlyStudent = document.querySelector('#monthly-student');
const monthlyReference = document.querySelector('#monthly-reference');
const monthlyValue = document.querySelector('#monthly-value');
const monthlyDueDate = document.querySelector('#monthly-due-date');
const monthlyStatus = document.querySelector('#monthly-status');
const adminLogoutButton = document.querySelector('#admin-logout');
const adminLoginLink = document.querySelector('#admin-login-link');

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

async function getAdminSession() {
  const { data, error } = await window.supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function fetchBookings() {
  const { data, error } = await window.supabaseClient
    .from(bookingsTable)
    .select('*')
    .order('datetime', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchStudents() {
  const { data, error } = await window.supabaseClient
    .from('alunos')
    .select('id, nome, email, telefone, status')
    .order('nome', { ascending: true });

  if (error) throw error;
  return data || [];
}

async function fetchMonthlyPayments() {
  const { data, error } = await window.supabaseClient
    .from('mensalidades')
    .select('*, alunos(nome, email)')
    .order('vencimento', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function deleteBooking(id) {
  const { error } = await window.supabaseClient.from(bookingsTable).delete().eq('id', id);
  if (error) throw error;
}

async function upsertMonthlyPayment(payload) {
  const insertPayload = {
    aluno_id: payload.aluno_id,
    referencia: payload.referencia,
    valor: payload.valor,
    vencimento: payload.vencimento,
    status_pagamento: payload.status_pagamento,
    pago_em: payload.status_pagamento === 'pago' ? new Date().toISOString() : null
  };

  const { error } = await window.supabaseClient.from('mensalidades').insert(insertPayload);
  if (error) throw error;
}

async function updateMonthlyStatus(id, status) {
  const { error } = await window.supabaseClient
    .from('mensalidades')
    .update({
      status_pagamento: status,
      pago_em: status === 'pago' ? new Date().toISOString() : null
    })
    .eq('id', id);

  if (error) throw error;
}

async function renderBookings() {
  const bookings = await fetchBookings();

  if (!bookings.length) {
    adminReservationList.innerHTML = '<div class="checkout-empty">Nenhuma reserva ativa no momento.</div>';
    return;
  }

  adminReservationList.innerHTML = bookings
    .map((booking) => `
      <article class="support-card admin-card">
        <div>
          <strong>Quadra ${booking.court} - ${booking.hour}h</strong>
          <p class="support-copy">${formatDateLong(new Date(booking.datetime))}</p>
          <p class="support-copy">Aluno: ${booking.customer_name}</p>
          <p class="support-copy">Contato: ${booking.phone}</p>
          <p class="support-copy">Valor: ${formatPrice(booking.price)}</p>
        </div>
        <button class="danger-button admin-cancel" type="button" data-booking-id="${booking.id}">Cancelar horario</button>
      </article>
    `)
    .join('');
}

async function renderStudentsSelect() {
  const students = await fetchStudents();
  monthlyStudent.innerHTML = students.length
    ? students.map((student) => `<option value="${student.id}">${student.nome || student.email} | ${student.telefone || 'sem telefone'}</option>`).join('')
    : '<option value="">Nenhum aluno cadastrado</option>';
}

async function renderMonthlyPayments() {
  const monthlyPayments = await fetchMonthlyPayments();

  if (!monthlyPayments.length) {
    adminMonthlyList.innerHTML = '<div class="checkout-empty">Nenhuma mensalidade cadastrada ainda.</div>';
    return;
  }

  adminMonthlyList.innerHTML = monthlyPayments
    .map((item) => `
      <article class="support-card admin-card">
        <div>
          <strong>${item.alunos?.nome || item.alunos?.email || 'Aluno'}</strong>
          <p class="support-copy">Referencia: ${item.referencia}</p>
          <p class="support-copy">Vencimento: ${formatDate(item.vencimento)}</p>
          <p class="support-copy">Valor: ${formatPrice(item.valor)}</p>
          <p class="support-copy">Status: ${item.status_pagamento}</p>
        </div>
        <div class="support-actions">
          <button class="ghost-button admin-monthly-status" type="button" data-monthly-id="${item.id}" data-status="pendente">Pendente</button>
          <button class="ghost-button admin-monthly-status" type="button" data-monthly-id="${item.id}" data-status="pago">Pago</button>
          <button class="ghost-button admin-monthly-status" type="button" data-monthly-id="${item.id}" data-status="atrasado">Atrasado</button>
        </div>
      </article>
    `)
    .join('');
}

async function renderAdminData() {
  await Promise.all([renderBookings(), renderStudentsSelect(), renderMonthlyPayments()]);
}

async function updateView() {
  try {
    const session = await getAdminSession();
    const isAdmin = session?.user?.email === ADMIN_EMAIL;

    adminAuthCard.classList.toggle('hidden', isAdmin);
    adminPanel.classList.toggle('hidden', !isAdmin);

    if (isAdmin) {
      await renderAdminData();
      adminMessage.textContent = '';
      return;
    }

    adminMessage.textContent = session
      ? 'Essa conta nao tem permissao de admin. Entre com mateustrgn@gmail.com.'
      : 'Entre com o e-mail admin para acessar este painel.';
  } catch (error) {
    console.error('Erro ao carregar sessao do admin:', error);
    adminMessage.textContent = 'Nao foi possivel carregar o painel.';
  }
}

adminReservationList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-booking-id]');
  if (!button) return;

  try {
    await deleteBooking(button.dataset.bookingId);
    adminMessage.textContent = 'Horario cancelado com sucesso.';
    await renderBookings();
  } catch (error) {
    console.error('Erro ao cancelar reserva no admin:', error);
    adminMessage.textContent = 'Nao foi possivel cancelar agora.';
  }
});

monthlyForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  adminMessage.textContent = '';

  try {
    await upsertMonthlyPayment({
      aluno_id: monthlyStudent.value,
      referencia: monthlyReference.value.trim(),
      valor: Number(monthlyValue.value),
      vencimento: monthlyDueDate.value,
      status_pagamento: monthlyStatus.value
    });

    monthlyForm.reset();
    adminMessage.textContent = 'Mensalidade salva com sucesso.';
    await renderMonthlyPayments();
  } catch (error) {
    console.error('Erro ao salvar mensalidade:', error);
    adminMessage.textContent = 'Nao foi possivel salvar a mensalidade.';
  }
});

adminMonthlyList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-monthly-id]');
  if (!button) return;

  try {
    await updateMonthlyStatus(button.dataset.monthlyId, button.dataset.status);
    adminMessage.textContent = 'Status da mensalidade atualizado.';
    await renderMonthlyPayments();
  } catch (error) {
    console.error('Erro ao atualizar mensalidade:', error);
    adminMessage.textContent = 'Nao foi possivel atualizar a mensalidade.';
  }
});

adminLogoutButton?.addEventListener('click', async () => {
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) {
    adminMessage.textContent = 'Nao foi possivel sair agora.';
    return;
  }

  window.location.href = './login.html';
});

adminLoginLink?.addEventListener('click', () => {
  window.location.href = './login.html';
});

updateView();
