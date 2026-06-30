const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=250';
const URL_BFF_PRODUCTOS = 'http://localhost:8000/api/productos';

const CATEGORY_FILTERS = {
  vitaminas: ['vitamina', 'vitaminas', 'vitamin', 'minerales', 'multivitamina'],
  suplementos: ['suplemento', 'proteína', 'proteina', 'whey', 'amino', 'bcaa', 'creatina', 'deporte', 'sport', 'salud'],
  probioticos: ['probiótico', 'probiotico', 'prebiótico', 'prebiotico', 'biota', 'digest', 'flora', 'microbiota', 'kefir']
};

const CATEGORY_LABELS = {
  vitaminas: 'Vitaminas',
  suplementos: 'Suplementos',
  probioticos: 'Probióticos',
  all: 'Todos'
};

const PRODUCTS_PER_PAGE = 9;

let allProductsGlobal = [];
let currentFilteredProducts = [];
let currentPage = 1;
let currentCategoryKey = 'vitaminas';
let currentTotalPages = 1;

function normalizeText(value = '') {
  return value.toString().toLowerCase();
}

function updateDiag(msg, isError = false) {
  const el = document.getElementById('diag-status');
  if (!el) return;

  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
  el.classList.toggle('bg-red-50', !!isError);
  el.classList.toggle('text-red-700', !!isError);
  el.classList.toggle('bg-yellow-50', !isError);
  el.classList.toggle('text-yellow-800', !isError);
}

function matchesFilters(product, filters) {
  const title = normalizeText(product.title);
  const type = normalizeText(product.product_type);
  const body = normalizeText(product.body_html);
  const tags = Array.isArray(product.tags) ? product.tags.map(normalizeText) : [];

  return filters.some(filter =>
    title.includes(filter) ||
    type.includes(filter) ||
    body.includes(filter) ||
    tags.some(tag => tag.includes(filter))
  );
}

function buildProductCard(product) {
  const precioNumero = product.variants?.[0] ? Number(product.variants[0].price) : 0;
  const precio = precioNumero ? precioNumero.toLocaleString('es-CL') : 'N/D';

  const fallbackImage = 'https://via.placeholder.com/320x180.png?text=Sin+imagen';
  const imagen = product.images?.find(img => img?.src)?.src || product.featured_image?.src || fallbackImage;

  const description = product.body_html ? product.body_html.replace(/<[^>]+>/g, '').trim() : '';
  const shortDescription = description.length > 90 ? description.slice(0, 90) + '...' : description || 'Excelente producto.';

  const safeProduct = encodeURIComponent(JSON.stringify({
    handle: product.handle,
    title: product.title,
    price: precioNumero,
    image: imagen
  }));

  return `
    <article class="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition">
      <div class="block h-full product-card cursor-pointer" data-handle="${product.handle}" role="button" tabindex="0">
        <div class="h-48 bg-gradient-to-br from-pastelLavender to-pastelPink flex items-center justify-center overflow-hidden">
          <img src="${imagen}" alt="${product.title}" class="object-cover h-full w-full" loading="lazy">
        </div>

        <div class="p-4">
          <h3 class="font-semibold text-gray-900">${product.title}</h3>
          <p class="text-sm text-gray-500 mt-2">${shortDescription}</p>

          <div class="mt-4">
            <span class="font-bold text-indigo-600">$${precio}</span>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <input 
              type="number" 
              min="1" 
              value="1" 
              class="cart-qty w-20 rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />

            <button 
              type="button"
              class="add-cart-btn flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              data-product="${safeProduct}"
            >
              Agregar al carrito
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function fetchMixgreenProducts() {
  try {
    const response = await fetch(URL_MIXGREEN);

    if (!response.ok) {
      throw new Error('MixGreen no respondió');
    }

    const data = await response.json();

    if (Array.isArray(data.products)) {
      console.log('✅ Productos cargados desde MixGreen');
      return data.products;
    }

    return [];
  } catch (error) {
    console.warn('⚠ MixGreen no disponible. Se utilizará el BFF.', error);

    const response = await fetch(URL_BFF_PRODUCTOS);

    if (!response.ok) {
      throw new Error('No fue posible conectar con el BFF.');
    }

    const productos = await response.json();

    return productos.map(producto => ({
      title: producto.nombre,
      product_type: producto.categoria,
      body_html: producto.marca,
      handle: producto.id.toString(),
      tags: [producto.categoria],
      variants: [{ price: producto.precio_oferta }],
      images: [{ src: 'https://via.placeholder.com/300x300?text=Producto' }]
    }));
  }
}

function renderProducts(products, categoryKey) {
  const container = document.getElementById('contenedor-productos');
  const loader = document.getElementById('productos-loader');
  const message = document.getElementById('product-message');

  if (!container || !message || !loader) return;

  loader.classList.add('hidden');
  container.classList.remove('hidden');

  currentFilteredProducts = Array.isArray(products) ? products : [];

  const total = currentFilteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));

  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = currentFilteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  if (total === 0) {
    message.innerHTML = `No se encontraron productos para <strong>${CATEGORY_LABELS[categoryKey]}</strong>.`;
    container.innerHTML = `
      <div class="col-span-full rounded-2xl bg-white shadow p-6 text-center text-gray-600">
        No se encontraron productos.
      </div>
    `;
  } else {
    const showingFrom = startIndex + 1;
    const showingTo = startIndex + pageItems.length;

    message.innerHTML = `Mostrando ${showingFrom}-${showingTo} de ${total} productos de la categoría <strong>${CATEGORY_LABELS[categoryKey]}</strong>.`;
    container.innerHTML = pageItems.map(buildProductCard).join('');
  }

  renderPaginationControls(total, totalPages);
  attachProductEvents(container, products);
}

function attachProductEvents(container, products) {
  window.__productCache = window.__productCache || {};

  products.forEach(product => {
    if (product.handle) {
      window.__productCache[product.handle] = product;
    }
  });

  container.querySelectorAll('.add-cart-btn').forEach(button => {
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const card = button.closest('article');
      const qtyInput = card.querySelector('.cart-qty');
      const cantidad = parseInt(qtyInput.value) || 1;
      const product = JSON.parse(decodeURIComponent(button.dataset.product));

      addToCart(product, cantidad);
    });
  });

  container.querySelectorAll('.cart-qty').forEach(input => {
    ['click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'keydown', 'keyup', 'keypress', 'input', 'change', 'focus'].forEach(eventName => {
      input.addEventListener(eventName, event => {
        event.stopPropagation();
      });
    });
  });

  container.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('.add-cart-btn') || event.target.closest('.cart-qty')) {
        return;
      }

      const handle = card.dataset.handle;

      if (handle && window.__productCache[handle]) {
        localStorage.setItem('selectedProduct', JSON.stringify(window.__productCache[handle]));
      }

      window.location.href = 'product.html?handle=' + encodeURIComponent(handle || '');
    });

    card.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        card.click();
      }
    });
  });
}

function renderPaginationControls(totalItems, totalPages) {
  const pagination = document.getElementById('pagination-controls');
  if (!pagination) return;

  if (!totalItems || totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  pagination.innerHTML = `
    <div class="inline-flex items-center gap-3">
      <button type="button" id="prev-page" class="px-3 py-1 bg-white border rounded hover:bg-gray-100">Anterior</button>
      <div class="px-3 py-1 text-sm">Página <span id="page-current">${currentPage}</span> de <span id="page-total">${totalPages}</span></div>
      <button type="button" id="next-page" class="px-3 py-1 bg-white border rounded hover:bg-gray-100">Siguiente</button>
    </div>
  `;

  document.getElementById('page-current').textContent = currentPage;
  document.getElementById('page-total').textContent = totalPages;

  currentTotalPages = totalPages;
}

function setupPaginationControls() {
  const pagination = document.getElementById('pagination-controls');
  if (!pagination) return;

  pagination.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;

    if (button.id === 'prev-page' && currentPage > 1) {
      currentPage -= 1;
      renderProducts(currentFilteredProducts, currentCategoryKey);
    }

    if (button.id === 'next-page' && currentPage < currentTotalPages) {
      currentPage += 1;
      renderProducts(currentFilteredProducts, currentCategoryKey);
    }
  });
}

function setLoadingState(isLoading) {
  const loader = document.getElementById('productos-loader');
  const container = document.getElementById('contenedor-productos');

  if (!loader || !container) return;

  loader.classList.toggle('hidden', !isLoading);
  container.classList.toggle('hidden', isLoading);
}

function filterProductsByCategory(products, categoryKey) {
  const filters = CATEGORY_FILTERS[categoryKey] || [];

  if (categoryKey === 'all') return products;

  return products.filter(product => matchesFilters(product, filters));
}

function setActiveCategory(categoryKey) {
  document.querySelectorAll('.category-filter').forEach(button => {
    const isActive = button.dataset.category === categoryKey;

    button.classList.toggle('ring-2', isActive);
    button.classList.toggle('ring-indigo-300', isActive);
    button.classList.toggle('bg-pastelMint', isActive);
    button.classList.toggle('bg-white', !isActive);
  });
}

function setupCategoryFilters(allProducts) {
  document.querySelectorAll('[data-category]').forEach(button => {
    button.type = 'button';

    button.addEventListener('click', () => {
      const categoryKey = button.dataset.category;
      if (!categoryKey) return;

      currentPage = 1;
      currentCategoryKey = categoryKey;

      setActiveCategory(categoryKey);

      const filtered = filterProductsByCategory(allProducts, categoryKey);

      if (filtered.length === 0 && allProducts.length > 0) {
        updateDiag(`No se encontraron productos para ${CATEGORY_LABELS[categoryKey]}. Mostrando todos los productos.`, false);
        renderProducts(allProducts, 'all');
      } else {
        updateDiag('');
        renderProducts(filtered, categoryKey);
      }
    });
  });
}

function setupSearch(allProducts) {
  const input = document.getElementById('search-input');
  const button = document.getElementById('search-button');

  if (!input || !button) return;

  function search() {
    const query = normalizeText(input.value.trim());

    currentPage = 1;

    if (!query) {
      const filtered = filterProductsByCategory(allProducts, currentCategoryKey);
      renderProducts(filtered, currentCategoryKey);
      return;
    }

    const filtered = allProducts.filter(product => {
      const title = normalizeText(product.title);
      const type = normalizeText(product.product_type);
      const body = normalizeText(product.body_html);

      return title.includes(query) || type.includes(query) || body.includes(query);
    });

    updateDiag('');
    renderProducts(filtered, 'all');
  }

  button.addEventListener('click', search);

  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') {
      search();
    }
  });
}

function getCart() {
  return JSON.parse(localStorage.getItem('medivitaCart')) || [];
}

function saveCart(cart) {
  localStorage.setItem('medivitaCart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const countElement = document.getElementById('cart-count');
  if (!countElement) return;

  const cart = getCart();
  const totalItems = cart.reduce((total, item) => total + Number(item.cantidad || 0), 0);
  countElement.textContent = totalItems;
}

function addToCart(product, cantidad) {
  const cart = getCart();
  const existing = cart.find(item => item.handle === product.handle);

  if (existing) {
    existing.cantidad += cantidad;
  } else {
    cart.push({
      handle: product.handle,
      title: product.title,
      price: product.price,
      image: product.image,
      cantidad: cantidad
    });
  }

  saveCart(cart);
  alert('Producto agregado al carrito');
}

async function initProducts() {
  const categoryButtons = document.querySelectorAll('[data-category]');
  if (!categoryButtons.length) return;

  setLoadingState(true);

  try {
    allProductsGlobal = await fetchMixgreenProducts();
  } catch (err) {
    updateDiag('Error cargando productos. Revisa la consola.', true);
    console.error('fetch error', err);
    allProductsGlobal = [];
  }

  setupCategoryFilters(allProductsGlobal);
  setupSearch(allProductsGlobal);

  setActiveCategory(currentCategoryKey);

  const initialProducts = filterProductsByCategory(allProductsGlobal, currentCategoryKey);
  renderProducts(initialProducts, currentCategoryKey);

  setLoadingState(false);
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  setupPaginationControls();
  initProducts();
});