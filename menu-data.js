window.CentralBurguerData = (() => {
  const menuStorageKey = 'central-burguer-menu';
  const adminSessionKey = 'central-burguer-admin-session';
  const adminCredentials = {
    user: 'admin',
    password: '123456'
  };

  const defaultMenu = {
    hamburguer: [
      {
        id: 'hamb-smash',
        name: 'Smash Bacon',
        description: 'Burger de 150g, queijo cheddar, bacon crocante e maionese da casa.',
        price: 24.9,
        badge: 'Mais pedido',
        image: './assets/hamb-1.png'
      },
      {
        id: 'hamb-salada',
        name: 'Cheese Salada',
        description: 'Hamburguer artesanal, alface, tomate, queijo prato e molho especial.',
        price: 22.5,
        badge: 'Classico',
        image: './assets/hamb-2.png'
      },
      {
        id: 'hamb-duplo',
        name: 'Duplo Burguer',
        description: 'Dois burgers, cebola caramelizada, cheddar cremoso e pao brioche.',
        price: 29.9,
        badge: 'Reforcado',
        image: './assets/hamb-3.png'
      }
    ],
    combos: [
      {
        id: 'combo-casa',
        name: 'Combo da Casa',
        description: 'Smash burger, fritas media e refrigerante lata.',
        price: 34.9,
        badge: 'Completo',
        image: './assets/hamb-4.png'
      },
      {
        id: 'combo-duplo',
        name: 'Combo Duplo',
        description: 'Duplo burguer, onion rings e bebida 600ml.',
        price: 42.9,
        badge: 'Fome grande',
        image: './assets/hamb-5.png'
      },
      {
        id: 'combo-familia',
        name: 'Combo Familia',
        description: '2 hamburgueres, 1 porcao grande de fritas e 2 refrigerantes.',
        price: 69.9,
        badge: 'Compartilhar',
        image: './assets/hamb-6.png'
      }
    ],
    bebidas: [
      {
        id: 'bebida-cola',
        name: 'Refrigerante Cola',
        description: 'Lata 350ml bem gelada para acompanhar seu lanche.',
        price: 7.5,
        badge: '350ml',
        image: './assets/refri-1.png'
      },
      {
        id: 'bebida-guarana',
        name: 'Guarana',
        description: 'Sabor nacional, lata 350ml servida gelada.',
        price: 7,
        badge: 'Gelado',
        image: './assets/refri-2.png'
      },
      {
        id: 'bebida-suco',
        name: 'Suco Natural',
        description: 'Copo de 400ml nos sabores laranja, maracuja ou limao.',
        price: 9.9,
        badge: 'Natural',
        image: './assets/refri-1.png'
      }
    ],
    pizzas: [
      {
        id: 'pizza-calabresa',
        name: 'Pizza Calabresa',
        description: 'Molho artesanal, mussarela, calabresa fatiada e cebola roxa.',
        price: 49.9,
        badge: '8 fatias',
        image: './assets/hamb-7.png'
      },
      {
        id: 'pizza-frango',
        name: 'Pizza Frango Catupiry',
        description: 'Frango temperado, catupiry cremoso e toque de oregano.',
        price: 52.9,
        badge: 'Cremosa',
        image: './assets/hamb-8.png'
      },
      {
        id: 'pizza-marguerita',
        name: 'Pizza Marguerita',
        description: 'Mussarela, tomate fresco, manjericao e azeite especial.',
        price: 47.9,
        badge: 'Leve',
        image: './assets/hamb-3.png'
      }
    ]
  };

  const categories = {
    hamburguer: 'Hamburguer',
    combos: 'Combos',
    bebidas: 'Bebidas',
    pizzas: 'Pizzas'
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function ensureMenuShape(menu) {
    const safeMenu = clone(defaultMenu);

    if (!menu || typeof menu !== 'object') {
      return safeMenu;
    }

    Object.keys(categories).forEach((category) => {
      if (Array.isArray(menu[category])) {
        safeMenu[category] = menu[category];
      }
    });

    return safeMenu;
  }

  function getMenu() {
    try {
      const stored = localStorage.getItem(menuStorageKey);
      if (!stored) {
        return clone(defaultMenu);
      }

      return ensureMenuShape(JSON.parse(stored));
    } catch {
      return clone(defaultMenu);
    }
  }

  function saveMenu(menu) {
    const safeMenu = ensureMenuShape(menu);
    localStorage.setItem(menuStorageKey, JSON.stringify(safeMenu));
    return safeMenu;
  }

  function addProduct(product) {
    const menu = getMenu();
    const category = product.category;
    if (!menu[category]) return menu;

    menu[category].push({
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      badge: product.badge,
      image: product.image
    });

    return saveMenu(menu);
  }

  function removeProduct(productId) {
    const menu = getMenu();

    Object.keys(menu).forEach((category) => {
      menu[category] = menu[category].filter((item) => item.id !== productId);
    });

    return saveMenu(menu);
  }

  function isAdminLoggedIn() {
    return localStorage.getItem(adminSessionKey) === 'true';
  }

  function login(user, password) {
    const isValid = user === adminCredentials.user && password === adminCredentials.password;
    if (isValid) {
      localStorage.setItem(adminSessionKey, 'true');
    }
    return isValid;
  }

  function logout() {
    localStorage.removeItem(adminSessionKey);
  }

  return {
    categories,
    defaultMenu: clone(defaultMenu),
    getMenu,
    saveMenu,
    addProduct,
    removeProduct,
    isAdminLoggedIn,
    login,
    logout,
    adminCredentials
  };
})();
