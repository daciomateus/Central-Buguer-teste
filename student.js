const ADMIN_EMAIL = 'mateustrgn@gmail.com';

const studentEmail = document.querySelector('#student-email');
const studentProfileCopy = document.querySelector('#student-profile-copy');
const studentMonthlyStatus = document.querySelector('#student-monthly-status');
const studentMonthlyCopy = document.querySelector('#student-monthly-copy');
const studentMonthlyList = document.querySelector('#student-monthly-list');
const studentReservationStatus = document.querySelector('#student-reservation-status');
const studentReservationCopy = document.querySelector('#student-reservation-copy');
const studentReservationList = document.querySelector('#student-reservation-list');
const studentLogoutButton = document.querySelector('#student-logout');
const studentMessage = document.querySelector('#student-message');

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateLong(date) {
  return new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function canCancelBooking(bookingDate) {
  return new Date(bookingDate).getTime() - Date.now() >= 60 * 60 * 1000;
}

async function loadStudentSession() {
  const { data, error } = await window.supabaseClient.auth.getSession();

  if (error) {
    console.error('Erro ao carregar sessao do aluno:', error);
    studentMessage.textContent = 'Nao foi possivel carregar sua sessao.';
    return;
  }

  const session = data.session;

  if (!session) {
    window.location.href = './login.html';
    return;
  }

  if (session.user.email === ADMIN_EMAIL) {
    window.location.href = './admin.html';
    return;
  }

  const { data: aluno, error: alunoError } = await window.supabaseClient
    .from('alunos')
    .select('nome, telefone, email, status')
    .eq('id', session.user.id)
    .single();

  if (alunoError) {
    console.error('Erro ao carregar cadastro do aluno:', alunoError);
    studentEmail.textContent = session.user.email || 'Aluno conectado';
    studentMessage.textContent = 'Sessao carregada, mas ainda nao consegui ler seu cadastro completo.';
    return;
  }

  studentEmail.textContent = aluno.nome
    ? `${aluno.nome} | ${aluno.email}`
    : (aluno.email || session.user.email || 'Aluno conectado');

  studentProfileCopy.textContent = `Telefone: ${aluno.telefone || 'nao informado'} | Status: ${aluno.status || 'ativo'}`;

  const { data: reservas, error: reservaError } = await window.supabaseClient
    .from('reservas')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('datetime', { ascending: true });

  if (reservaError) {
    console.error('Erro ao carregar reservas do aluno:', reservaError);
    studentReservationStatus.textContent = 'Nao foi possivel carregar';
    studentReservationCopy.textContent = 'Tente atualizar a pagina em instantes.';
  } else if (!reservas.length) {
    studentReservationStatus.textContent = 'Sem reservas ativas';
    studentReservationCopy.textContent = 'Quando voce reservar, os horarios aparecerao aqui.';
    studentReservationList.innerHTML = '<div class="checkout-empty">Nenhuma reserva vinculada ao seu login.</div>';
  } else {
    studentReservationStatus.textContent = `${reservas.length} reserva(s)`;
    studentReservationCopy.textContent = 'Esses horarios podem ser cancelados apenas pela sua conta ou pelo admin.';
    studentReservationList.innerHTML = reservas
      .map((item) => {
        const canCancel = canCancelBooking(item.datetime);
        return `
          <article class="support-card admin-card">
            <div>
              <strong>Quadra ${item.court} - ${item.hour}h</strong>
              <p class="support-copy">${formatDateLong(item.datetime)}</p>
              <p class="support-copy">Valor: ${formatPrice(item.price)}</p>
            </div>
            <button class="danger-button student-cancel-booking" type="button" data-booking-id="${item.id}" ${canCancel ? '' : 'disabled'}>${canCancel ? 'Cancelar horario' : 'Cancelamento bloqueado'}</button>
          </article>
        `;
      })
      .join('');
  }

  const { data: mensalidades, error: mensalidadeError } = await window.supabaseClient
    .from('mensalidades')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('vencimento', { ascending: false });

  if (mensalidadeError) {
    console.error('Erro ao carregar mensalidades do aluno:', mensalidadeError);
    studentMonthlyStatus.textContent = 'Nao foi possivel carregar';
    studentMonthlyCopy.textContent = 'Tente atualizar a pagina em instantes.';
    return;
  }

  if (!mensalidades.length) {
    studentMonthlyStatus.textContent = 'Sem mensalidades cadastradas';
    studentMonthlyCopy.textContent = 'Assim que a administracao cadastrar, elas aparecerao aqui.';
    studentMonthlyList.innerHTML = '<div class="checkout-empty">Nenhuma mensalidade vinculada ao seu cadastro.</div>';
    return;
  }

  const atual = mensalidades[0];
  studentMonthlyStatus.textContent = atual.status_pagamento === 'pago' ? 'Em dia' : atual.status_pagamento === 'atrasado' ? 'Atrasado' : 'Pendente';
  studentMonthlyCopy.textContent = `Referencia: ${atual.referencia} | Vencimento: ${formatDate(atual.vencimento)} | Valor: ${formatPrice(atual.valor)}`;

  studentMonthlyList.innerHTML = mensalidades
    .map((item) => `
      <article class="checkout-selection-item">
        <strong>${item.referencia}</strong>
        <span>Vencimento: ${formatDate(item.vencimento)}</span>
        <small>${formatPrice(item.valor)} | ${item.status_pagamento}</small>
      </article>
    `)
    .join('');
}

studentReservationList?.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-booking-id]');
  if (!button) return;

  try {
    const { error } = await window.supabaseClient.from('reservas').delete().eq('id', button.dataset.bookingId);
    if (error) throw error;
    studentMessage.textContent = 'Horario cancelado com sucesso.';
    await loadStudentSession();
  } catch (error) {
    console.error('Erro ao cancelar reserva do aluno:', error);
    studentMessage.textContent = 'Nao foi possivel cancelar esse horario agora.';
  }
});

studentLogoutButton?.addEventListener('click', async () => {
  const { error } = await window.supabaseClient.auth.signOut();

  if (error) {
    console.error('Erro ao sair da area do aluno:', error);
    studentMessage.textContent = 'Nao foi possivel sair agora.';
    return;
  }

  window.location.href = './login.html';
});

loadStudentSession();
