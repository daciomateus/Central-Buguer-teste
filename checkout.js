const storageKey = 'central-burguer-cart';
const deliveryFee = 6;
const whatsappNumber = '5500000000000';

const checkoutForm = document.querySelector('#checkout-form');
const checkoutItems = document.querySelector('#checkout-items');
const checkoutCount = document.querySelector('#checkout-count');
const subtotalEl = document.querySelector('#checkout-subtotal');
const deliveryEl = document.querySelector('#checkout-delivery');
const totalEl = document.querySelector('#checkout-total');
const paymentMethodEl = document.querySelector('#payment-method');
const changeField = document.querySelector('#change-field');
const changeValueEl = document.querySelector('#change-value');
const checkoutMessage = document.querySelector('#checkout-message');

let currentCart = [];
let currentSubtotal = 0;
let currentTotal = deliveryFee;

function formatPrice(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function loadCart() {
  try {
    const storedCart = localStorage.getItem(storageKey);
    return storedCart ? JSON.parse(storedCart) : [];
  } catch {
    return [];
  }
}

function toggleChangeField() {
  const showChange = paymentMethodEl.value === 'Dinheiro';
  changeField.classList.toggle('hidden', !showChange);
  changeValueEl.required = showChange;

  if (!showChange) {
    changeValueEl.value = '';
  }
}

function renderCheckout() {
  currentCart = loadCart();
  deliveryEl.textContent = formatPrice(deliveryFee);

  if (!currentCart.length) {
    checkoutItems.innerHTML = `
      <div class="empty-cart">
        <strong>Nenhum item no pedido</strong>
        <p>Volte ao cardapio para adicionar produtos antes de finalizar.</p>
      </div>
    `;
    checkoutCount.textContent = '0 itens';
    subtotalEl.textContent = formatPrice(0);
    totalEl.textContent = formatPrice(deliveryFee);
    currentSubtotal = 0;
    currentTotal = deliveryFee;
    return;
  }

  checkoutItems.innerHTML = currentCart
    .map(
      (item) => `
        <article class="cart-item">
          <img src="${item.image}" alt="${item.name}" />
          <div class="cart-item__info">
            <div class="cart-item__title">
              <div>
                <h3>${item.name}</h3>
                <p>${item.categoryLabel}</p>
              </div>
              <strong>${formatPrice(item.price * item.quantity)}</strong>
            </div>
            <div class="summary-row">
              <span>Quantidade</span>
              <strong>${item.quantity}</strong>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  const itemCount = currentCart.reduce((total, item) => total + item.quantity, 0);
  currentSubtotal = currentCart.reduce((total, item) => total + item.price * item.quantity, 0);
  currentTotal = currentSubtotal + deliveryFee;

  checkoutCount.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
  subtotalEl.textContent = formatPrice(currentSubtotal);
  totalEl.textContent = formatPrice(currentTotal);
}

function buildWhatsappMessage({ name, phone, address, payment, change, notes }) {
  const itemsMessage = currentCart
    .map((item) => `- ${item.quantity}x ${item.name} (${formatPrice(item.price * item.quantity)})`)
    .join('%0A');

  const changeLine = payment === 'Dinheiro'
    ? `%0A*Troco para:* ${formatPrice(Number(change))}`
    : '';

  const notesLine = notes
    ? `%0A*Observacoes:* ${encodeURIComponent(notes)}`
    : '';

  return `*Novo pedido - Central Burguer*%0A%0A*Cliente:* ${encodeURIComponent(name)}%0A*Telefone:* ${encodeURIComponent(phone)}%0A*Endereco:* ${encodeURIComponent(address)}%0A%0A*Itens:*%0A${itemsMessage}%0A%0A*Subtotal:* ${encodeURIComponent(formatPrice(currentSubtotal))}%0A*Entrega:* ${encodeURIComponent(formatPrice(deliveryFee))}%0A*Total:* ${encodeURIComponent(formatPrice(currentTotal))}%0A%0A*Pagamento:* ${encodeURIComponent(payment)}${changeLine}${notesLine}`;
}

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();
  checkoutMessage.textContent = '';

  if (!currentCart.length) {
    checkoutMessage.textContent = 'Seu carrinho esta vazio.';
    return;
  }

  const name = document.querySelector('#customer-name').value.trim();
  const phone = document.querySelector('#customer-phone').value.trim();
  const address = document.querySelector('#customer-address').value.trim();
  const payment = paymentMethodEl.value;
  const change = changeValueEl.value.trim();
  const notes = document.querySelector('#customer-notes').value.trim();

  if (!name || !phone || !address) {
    checkoutMessage.textContent = 'Preencha nome, telefone e endereco para continuar.';
    return;
  }

  if (payment === 'Dinheiro' && (!change || Number(change) < currentTotal)) {
    checkoutMessage.textContent = 'Informe um valor valido para o troco.';
    return;
  }

  const message = buildWhatsappMessage({ name, phone, address, payment, change, notes });
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  window.open(whatsappUrl, '_blank');
});

paymentMethodEl.addEventListener('change', toggleChangeField);

renderCheckout();
toggleChangeField();
