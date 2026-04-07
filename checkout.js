const pendingSelectionKey = 'arena-abs-pending-selection';
const bookingsTable = 'reservas';
const adminWhatsappNumber = '5591982926051';

const checkoutSelectionList = document.querySelector('#checkout-selection-list');
const checkoutTotal = document.querySelector('#checkout-total');
const checkoutForm = document.querySelector('#checkout-form');
const checkoutMessage = document.querySelector('#checkout-message');
const checkoutSuccess = document.querySelector('#checkout-success');
const openWhatsappButton = document.querySelector('#open-whatsapp-button');
const checkoutStudentName = document.querySelector('#checkout-student-name');
const checkoutStudentMeta = document.querySelector('#checkout-student-meta');

let currentSession = null;
let currentStudent = null;

function loadPendingSelections() {
  try {
    return JSON.parse(localStorage.getItem(pendingSelectionKey)) || [];
  } catch {
    return [];
  }
}

function clearPendingSelections() {
  localStorage.removeItem(pendingSelectionKey);
}

function formatPrice(price) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function buildSlotDate(date, hour) {
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);
  return slotDate;
}

function buildAdminWhatsappMessage(bookings, student) {
  const lines = bookings
    .sort((first, second) => new Date(first.datetime).getTime() - new Date(second.datetime).getTime())
    .map((booking) => `- Quadra ${booking.court} | ${formatDateLong(new Date(booking.datetime))} | ${booking.hour}h | ${formatPrice(booking.price)}`)
    .join('\n');

  return encodeURIComponent(
    `Nova reserva - Arena ABS\n\n` +
    `Aluno: ${student.nome || student.email}\n` +
    `Contato: ${student.telefone || 'nao informado'}\n` +
    `E-mail: ${student.email}\n\n` +
    `Horarios reservados:\n${lines}\n\n` +
    `Total: ${formatPrice(bookings.reduce((total, booking) => total + booking.price, 0))}`
  );
}

function getWhatsappUrl(bookings, student) {
  return `https://wa.me/${adminWhatsappNumber}?text=${buildAdminWhatsappMessage(bookings, student)}`;
}

function openWhatsappAfterSave(whatsappUrl) {
  window.location.href = whatsappUrl;
}

function serializeBooking(booking) {
  return {
    id: booking.id,
    customer_name: booking.customerName,
    phone: booking.phone,
    court: booking.court,
    hour: booking.hour,
    price: booking.price,
    datetime: booking.datetime,
    aluno_id: booking.alunoId,
    cancel_token: null
  };
}

async function findExistingReservations(ids) {
  const { data, error } = await window.supabaseClient
    .from(bookingsTable)
    .select('id')
    .in('id', ids);

  if (error) throw error;
  return data || [];
}

async function insertReservations(bookings) {
  const { error } = await window.supabaseClient
    .from(bookingsTable)
    .insert(bookings.map(serializeBooking));

  if (error) throw error;
}

function showSuccessState(whatsappUrl) {
  checkoutForm.classList.add('hidden');
  checkoutSuccess.classList.remove('hidden');
  openWhatsappButton.href = whatsappUrl;
  checkoutMessage.textContent = 'Reserva salva. Se o WhatsApp nao abrir sozinho, toque no botao abaixo.';
}

async function loadStudentContext() {
  const { data, error } = await window.supabaseClient.auth.getSession();

  if (error) {
    throw error;
  }

  currentSession = data.session;

  if (!currentSession) {
    window.location.href = './login.html';
    return false;
  }

  const { data: student, error: studentError } = await window.supabaseClient
    .from('alunos')
    .select('id, nome, telefone, email, status')
    .eq('id', currentSession.user.id)
    .single();

  if (studentError) {
    throw studentError;
  }

  currentStudent = student;
  checkoutStudentName.textContent = student.nome || student.email;
  checkoutStudentMeta.textContent = `Telefone: ${student.telefone || 'nao informado'} | Status: ${student.status || 'ativo'}`;
  return true;
}

const pendingSelections = loadPendingSelections();

if (!pendingSelections.length) {
  checkoutSelectionList.innerHTML = '<div class="checkout-empty">Nenhum horario foi selecionado ainda.</div>';
  checkoutTotal.textContent = '';
  checkoutForm.classList.add('hidden');
} else {
  checkoutSelectionList.innerHTML = pendingSelections
    .sort((first, second) => buildSlotDate(first.date, first.hour).getTime() - buildSlotDate(second.date, second.hour).getTime())
    .map((selection) => `
      <article class="checkout-selection-item">
        <strong>Quadra ${selection.court} - ${selection.hour}h</strong>
        <span>${formatDateLong(new Date(selection.date))}</span>
        <small>${formatPrice(selection.price)}</small>
      </article>
    `)
    .join('');

  checkoutTotal.textContent = `Total: ${formatPrice(pendingSelections.reduce((total, selection) => total + selection.price, 0))}`;
}

checkoutForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  checkoutMessage.textContent = '';

  if (!pendingSelections.length) {
    checkoutMessage.textContent = 'Volte para a agenda e escolha pelo menos um horario.';
    return;
  }

  if (!currentSession || !currentStudent) {
    checkoutMessage.textContent = 'Entre como aluno para confirmar a reserva.';
    window.location.href = './login.html';
    return;
  }

  const newBookings = pendingSelections.map((selection) => ({
    id: selection.id,
    customerName: currentStudent.nome || currentStudent.email,
    phone: currentStudent.telefone || '',
    court: selection.court,
    hour: selection.hour,
    price: selection.price,
    datetime: buildSlotDate(new Date(selection.date), selection.hour).toISOString(),
    alunoId: currentSession.user.id
  }));

  try {
    const existingReservations = await findExistingReservations(newBookings.map((booking) => booking.id));
    if (existingReservations.length) {
      checkoutMessage.textContent = 'Um dos horarios acabou de ser reservado. Volte para a agenda e escolha novamente.';
      return;
    }

    const whatsappUrl = getWhatsappUrl(newBookings, currentStudent);
    await insertReservations(newBookings);
    clearPendingSelections();
    showSuccessState(whatsappUrl);
    openWhatsappAfterSave(whatsappUrl);
  } catch (error) {
    console.error('Erro ao salvar reserva no Supabase:', error);
    checkoutMessage.textContent = 'Nao foi possivel salvar a reserva agora. Tente novamente.';
  }
});

loadStudentContext().catch((error) => {
  console.error('Erro ao carregar contexto do aluno no checkout:', error);
  checkoutMessage.textContent = 'Entre como aluno para continuar.';
});
