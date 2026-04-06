const { categories, getMenu } = window.CentralBurguerData;

const storageKey = 'central-burguer-cart';
const deliveryFee = 6;
let currentCategory = 'hamburguer';
const cart = loadCart();

const categoryTabs = document.querySelector('#category-tabs');
const menuGrid = document.querySelector('#menu-grid');
const cartItems = document.querySelector('#cart-items');
const cartCount = document.querySelector('#cart-count');
const subtotalEl = document.querySelector('#subtotal');
const totalEl = document.querySelector('#total');
const deliveryEl = document.querySelector('#delivery');
const checkoutButton = document.querySelector('#checkout-button');

deliveryEl.textContent = formatPrice(deliveryFee);

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

function saveCart() {
  localStorage.setItem(storageKey, JSON.stringify(cart));
}

function renderCategories() {
  categoryTabs.innerHTML = Object.entries(categories)
    .map(([key, label]) => `
      <button class="category-tab ${key === currentCategory ? 'is-active' : ''}" data-category="${key}" type="button">
        ${label}
      </button>
    `)
    .join('');
}

function renderMenu() {
  const menuData = getMenu();
  const items = menuData[currentCategory] || [];

  menuGrid.innerHTML = items
    .map(
      (item) => `
        <article class="product-card">
          <img class="product-card__image" src="${item.image}" alt="${item.name}" />
          <div class="product-card__top">
            <div>
              <h3>${item.name}</h3>
              <p>${item.description}</p>
            </div>
            <span class="product-chip">${item.badge}</span>
          </div>
          <div class="product-card__footer">
            <strong>${formatPrice(item.price)}</strong>
            <button class="add-button" type="button" data-add="${item.id}">Adicionar</button>
          </div>
        </article>
      `
    )
    .join('');
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = `
      <div class="empty-cart">
        <strong>Seu carrinho esta vazio</strong>
        <p>Adicione hamburgueres, combos, bebidas ou pizzas para montar o pedido.</p>
      </div>
    `;
  } else {
    cartItems.innerHTML = cart
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
              <div class="cart-controls">
                <div class="quantity-control">
                  <button class="quantity-button" type="button" data-decrease="${item.id}">-</button>
                  <span>${item.quantity}</span>
                  <button class="quantity-button" type="button" data-increase="${item.id}">+</button>
                </div>
                <button class="remove-button" type="button" data-remove="${item.id}">Remover</button>
              </div>
            </div>
          </article>
        `
      )
      .join('');
  }

  const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const total = subtotal + deliveryFee;

  cartCount.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`;
  subtotalEl.textContent = formatPrice(subtotal);
  totalEl.textContent = formatPrice(total);
  saveCart();
}

function findProductById(productId) {
  const menuData = getMenu();
  return Object.entries(menuData)
    .flatMap(([category, items]) => items.map((item) => ({ ...item, category, categoryLabel: categories[category] })))
    .find((item) => item.id === productId);
}

function addToCart(productId) {
  const product = findProductById(productId);
  if (!product) return;

  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  renderCart();
}

function changeQuantity(productId, delta) {
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  renderCart();
}

function removeFromCart(productId) {
  const itemIndex = cart.findIndex((item) => item.id === productId);
  if (itemIndex === -1) return;

  cart.splice(itemIndex, 1);
  renderCart();
}

function goToCheckout() {
  if (!cart.length) {
    alert('Adicione pelo menos um item antes de finalizar o pedido.');
    return;
  }

  saveCart();
  window.location.href = './checkout.html';
}

categoryTabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;

  currentCategory = button.dataset.category;
  renderCategories();
  renderMenu();
});

menuGrid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-add]');
  if (!button) return;

  addToCart(button.dataset.add);
});

cartItems.addEventListener('click', (event) => {
  const decreaseButton = event.target.closest('[data-decrease]');
  const increaseButton = event.target.closest('[data-increase]');
  const removeButton = event.target.closest('[data-remove]');

  if (decreaseButton) {
    changeQuantity(decreaseButton.dataset.decrease, -1);
    return;
  }

  if (increaseButton) {
    changeQuantity(increaseButton.dataset.increase, 1);
    return;
  }

  if (removeButton) {
    removeFromCart(removeButton.dataset.remove);
  }
});

checkoutButton.addEventListener('click', goToCheckout);

renderCategories();
renderMenu();
renderCart();
