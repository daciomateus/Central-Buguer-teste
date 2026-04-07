const { categories, getMenu, addProduct, removeProduct, login, logout, isAdminLoggedIn } = window.CentralBurguerData;

const loginCard = document.querySelector('#login-card');
const adminPanel = document.querySelector('#admin-panel');
const catalogPanel = document.querySelector('#catalog-panel');
const loginForm = document.querySelector('#login-form');
const productForm = document.querySelector('#product-form');
const loginMessage = document.querySelector('#login-message');
const productMessage = document.querySelector('#product-message');
const adminProducts = document.querySelector('#admin-products');
const productCount = document.querySelector('#product-count');
const logoutButton = document.querySelector('#logout-button');

function formatPrice(value) {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function setAdminView() {
  const loggedIn = isAdminLoggedIn();
  loginCard.classList.toggle('hidden', loggedIn);
  adminPanel.classList.toggle('hidden', !loggedIn);
  catalogPanel.classList.toggle('hidden', !loggedIn);

  if (loggedIn) {
    renderProducts();
  }
}

function renderProducts() {
  const menu = getMenu();
  const items = Object.entries(menu).flatMap(([category, products]) =>
    products.map((product) => ({ ...product, category, categoryLabel: categories[category] }))
  );

  productCount.textContent = `${items.length} ${items.length === 1 ? 'item' : 'itens'}`;

  adminProducts.innerHTML = items
    .map(
      (item) => `
        <article class="cart-item admin-item">
          <img src="${item.image}" alt="${item.name}" />
          <div class="cart-item__info">
            <div class="cart-item__title">
              <div>
                <h3>${item.name}</h3>
                <p>${item.categoryLabel} • ${item.badge}</p>
              </div>
              <strong>${formatPrice(item.price)}</strong>
            </div>
            <p class="admin-item__description">${item.description}</p>
            <div class="cart-controls">
              <span class="product-chip">${item.id}</span>
              <button class="remove-button" type="button" data-delete="${item.id}">Excluir</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const user = String(formData.get('user') || '').trim();
  const password = String(formData.get('password') || '').trim();

  if (login(user, password)) {
    loginMessage.textContent = '';
    loginForm.reset();
    setAdminView();
    return;
  }

  loginMessage.textContent = 'Usuario ou senha invalidos.';
});

productForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(productForm);

  const name = String(formData.get('name') || '').trim();
  const category = String(formData.get('category') || '').trim();
  const description = String(formData.get('description') || '').trim();
  const price = Number(formData.get('price') || 0);
  const badge = String(formData.get('badge') || '').trim();
  const image = String(formData.get('image') || '').trim();

  if (!name || !category || !description || !badge || !image || price <= 0) {
    productMessage.textContent = 'Preencha todos os campos corretamente.';
    return;
  }

  addProduct({
    id: `${category}-${slugify(name)}-${Date.now()}`,
    name,
    category,
    description,
    price,
    badge,
    image
  });

  productMessage.textContent = 'Produto cadastrado com sucesso.';
  productForm.reset();
  renderProducts();
});

adminProducts.addEventListener('click', (event) => {
  const deleteButton = event.target.closest('[data-delete]');
  if (!deleteButton) return;

  removeProduct(deleteButton.dataset.delete);
  renderProducts();
  productMessage.textContent = 'Produto removido do cardapio.';
});

logoutButton.addEventListener('click', () => {
  logout();
  productMessage.textContent = '';
  setAdminView();
});

setAdminView();
