const storageKey = 'central-burguer-cart';
const deliveryFee = 6;
const whatsappNumber = '5591982926051';

const checkoutForm = document.querySelector('#checkout-form');
const checkoutItems = document.querySelector('#checkout-items');
const checkoutCount = document.querySelector('#checkout-count');
const checkoutService = document.querySelector('#checkout-service');
const subtotalEl = document.querySelector('#checkout-subtotal');
const deliveryEl = document.querySelector('#checkout-delivery');
const totalEl = document.querySelector('#checkout-total');
const paymentMethodEl = document.querySelector('#payment-method');
const serviceTypeInputs = document.querySelectorAll('input[name="serviceType"]');
const addressField = document.querySelector('#address-field');
const addressEl = document.querySelector('#customer-address');
const changeField = document.querySelector('#change-field');
const changeValueEl = document.querySelector('#change-value');
const checkoutMessage = document.querySelector('#checkout-message');
const checkoutMobileTotal = document.querySelector('#checkout-mobile-total');
const checkoutMobileSubmit = document.querySelector('#checkout-mobile-submit');

let currentCart = [];
let currentSubtotal = 0;
let currentDeliveryFee = deliveryFee;
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

function getSelectedServiceType() {
  const selected = Array.from(serviceTypeInputs).find((input) => input.checked);
  return selected ? selected.value : 'Entrega';
}

function updateServiceTypeUI() {
  const serviceType = getSelectedServiceType();
  const isDelivery = serviceType === 'Entrega';

  addressField.classList.toggle('hidden', !isDelivery);
  addressEl.required = isDelivery;

  if (!isDelivery) {
    addressEl.value = '';
  }

  document.querySelectorAll('.choice-card').forEach((card) => {
    const input = card.querySelector('input');
    card.classList.toggle('choice-card--active', Boolean(input?.checked));
  });

  renderCheckout();
}

function renderCheckout() {
  currentCart = loadCart();
  const serviceType = getSelectedServiceType();
  currentDeliveryFee = serviceType === 'Retirada' ? 0 : deliveryFee;
  deliveryEl.textContent = serviceType === 'Retirada' ? 'Gratis' : formatPrice(currentDeliveryFee);
  checkoutService.textContent = serviceType;

  if (!currentCart.length) {
    checkoutItems.innerHTML = `
      <div class="empty-cart">
        <strong>Nenhum item no pedido</strong>
        <p>Volte ao cardapio para adicionar produtos antes de finalizar.</p>
      </div>
    `;
    checkoutCount.textContent = '0 itens';
    subtotalEl.textContent = formatPrice(0);
    totalEl.textContent = formatPrice(currentDeliveryFee);
    if (checkoutMobileTotal) checkoutMobileTotal.textContent = formatPrice(currentDeliveryFee);
    currentSubtotal = 0;
    currentTotal = currentDeliveryFee;
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
  currentTotal = currentSubtotal + currentDeliveryFee;

  checkoutCount.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
  subtotalEl.textContent = formatPrice(currentSubtotal);
  totalEl.textContent = formatPrice(currentTotal);
  if (checkoutMobileTotal) checkoutMobileTotal.textContent = formatPrice(currentTotal);
}

function buildWhatsappMessage({ name, phone, address, payment, change, notes, serviceType }) {
  const itemsMessage = currentCart
    .map((item) => `- ${item.quantity}x ${item.name} (${formatPrice(item.price * item.quantity)})`)
    .join('%0A');

  const changeLine = payment === 'Dinheiro'
    ? `%0A*Troco para:* ${formatPrice(Number(change))}`
    : '';

  const notesLine = notes
    ? `%0A*Observacoes:* ${encodeURIComponent(notes)}`
    : '';

  const serviceLine = `%0A*Tipo do pedido:* ${encodeURIComponent(serviceType)}`;
  const addressLine = serviceType === 'Entrega'
    ? `%0A*Endereco:* ${encodeURIComponent(address)}`
    : `%0A*Retirada:* ${encodeURIComponent('Cliente vai buscar na loja')}`;

  return `*Novo pedido - Central Burguer*%0A%0A*Cliente:* ${encodeURIComponent(name)}%0A*Telefone:* ${encodeURIComponent(phone)}${serviceLine}${addressLine}%0A%0A*Itens:*%0A${itemsMessage}%0A%0A*Subtotal:* ${encodeURIComponent(formatPrice(currentSubtotal))}%0A*Entrega:* ${encodeURIComponent(currentDeliveryFee === 0 ? 'Gratis' : formatPrice(currentDeliveryFee))}%0A*Total:* ${encodeURIComponent(formatPrice(currentTotal))}%0A%0A*Pagamento:* ${encodeURIComponent(payment)}${changeLine}${notesLine}`;
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
  const serviceType = getSelectedServiceType();

  if (!name || !phone) {
    checkoutMessage.textContent = 'Preencha nome e telefone para continuar.';
    return;
  }

  if (serviceType === 'Entrega' && !address) {
    checkoutMessage.textContent = 'Informe o endereco para pedidos com entrega.';
    return;
  }

  if (payment === 'Dinheiro' && (!change || Number(change) < currentTotal)) {
    checkoutMessage.textContent = 'Informe um valor valido para o troco.';
    return;
  }

  const message = buildWhatsappMessage({ name, phone, address, payment, change, notes, serviceType });
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;

  window.open(whatsappUrl, '_blank');
});

paymentMethodEl.addEventListener('change', toggleChangeField);

if (checkoutMobileSubmit) {
  checkoutMobileSubmit.addEventListener('click', () => {
    checkoutForm.requestSubmit();
  });
}
serviceTypeInputs.forEach((input) => input.addEventListener('change', updateServiceTypeUI));

renderCheckout();
toggleChangeField();
updateServiceTypeUI();




