const bookingsTable = 'reservas';

const cancelLookupForm = document.querySelector('#cancel-lookup-form');
const cancelPhoneInput = document.querySelector('#cancel-phone');
const cancelMessage = document.querySelector('#cancel-message');
const cancelResults = document.querySelector('#cancel-results');
const cancelSelectionList = document.querySelector('#cancel-selection-list');
const cancelReservationButton = document.querySelector('#cancel-reservation-button');

const params = new URLSearchParams(window.location.search);
const cancelToken = params.get('token') || '';
let matchedBookings = [];

function formatPrice(price) {
  return Number(price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateLong(date) {
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function renderBookings(bookings) {
  cancelSelectionList.innerHTML = bookings
    .sort((first, second) => new Date(first.datetime).getTime() - new Date(second.datetime).getTime())
    .map((booking) => `
      <article class="checkout-selection-item">
        <strong>Quadra ${booking.court} - ${booking.hour}h</strong>
        <span>${formatDateLong(new Date(booking.datetime))}</span>
        <small>${formatPrice(booking.price)}</small>
      </article>
    `)
    .join('');
}

async function fetchBookingsByToken(token) {
  const { data, error } = await window.supabaseClient
    .from(bookingsTable)
    .select('*')
    .eq('cancel_token', token)
    .order('datetime', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function deleteBookings(ids) {
  const { error } = await window.supabaseClient
    .from(bookingsTable)
    .delete()
    .in('id', ids);

  if (error) {
    throw error;
  }
}

if (!cancelToken) {
  cancelMessage.textContent = 'Link de cancelamento invalido. Abra o link completo recebido na sua reserva.';
  cancelLookupForm.classList.add('hidden');
}

cancelLookupForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  cancelMessage.textContent = '';
  cancelResults.classList.add('hidden');

  if (!cancelToken) {
    return;
  }

  try {
    const bookings = await fetchBookingsByToken(cancelToken);
    const phone = normalizePhone(cancelPhoneInput.value);
    matchedBookings = bookings.filter((booking) => normalizePhone(booking.phone) === phone);

    if (!matchedBookings.length) {
      cancelMessage.textContent = 'Nao encontramos reserva com esse contato para este link.';
      return;
    }

    renderBookings(matchedBookings);
    cancelResults.classList.remove('hidden');
    cancelMessage.textContent = 'Reserva localizada. Se estiver tudo certo, confirme o cancelamento abaixo.';
  } catch (error) {
    console.error('Erro ao localizar reserva para cancelamento:', error);
    cancelMessage.textContent = 'Nao foi possivel consultar a reserva agora.';
  }
});

cancelReservationButton?.addEventListener('click', async () => {
  if (!matchedBookings.length) {
    return;
  }

  try {
    await deleteBookings(matchedBookings.map((booking) => booking.id));
    cancelResults.classList.add('hidden');
    cancelSelectionList.innerHTML = '';
    matchedBookings = [];
    cancelMessage.textContent = 'Reserva cancelada com sucesso.';
  } catch (error) {
    console.error('Erro ao cancelar reserva do cliente:', error);
    cancelMessage.textContent = 'Nao foi possivel cancelar agora. Tente novamente.';
  }
});
