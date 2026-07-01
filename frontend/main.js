const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=250';
const URL_BFF_PRODUCTOS = 'http://localhost:8000/api/productos';

const CATEGORY_FILTERS = {
  vitaminas: ['vitamina', 'vitaminas', 'vitamin', 'minerales', 'multivitamina'],
  suplementos: ['suplemento', 'proteína', 'proteina', 'whey', 'amino', 'bcaa', 'creatina', 'deporte', 'sport', 'salud'],
  probioticos: ['probiótico', 'probiotico', 'prebiótico', 'prebiotico', 'biota', 'digest', 'flora', 'microbiota', 'kefir'],
  general: ['general']
};

const CATEGORY_LABELS = {
  vitaminas: 'Vitaminas',
  suplementos: 'Suplementos',
  probioticos: 'Probióticos',
  general: 'General',
  all: 'Todos'
};

const PRODUCTS_PER_PAGE = 9;

let allProductsGlobal = [];
let currentFilteredProducts = [];
let currentPage = 1;
let currentCategoryKey = 'all';
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
  // 1. Extraer los precios directamente de las propiedades planas
  const precioOfertaNum = Number(product.precio_oferta || 0);
  const precioNormalNum = Number(product.precio_normal || precioOfertaNum);
  const descuento = Number(product.porcentaje_descuento || 0);

  // Formatear precios para Chile
  const txtPrecioOferta = precioOfertaNum ? `$${precioOfertaNum.toLocaleString('es-CL')}` : 'N/D';
  const txtPrecioNormal = precioNormalNum ? `$${precioNormalNum.toLocaleString('es-CL')}` : '';

  const fallbackImage = 'https://via.placeholder.com/320x180.png?text=Sin+imagen';
  const imagen = product.imagen_url || product.images?.find(img => img?.src)?.src || fallbackImage;

  const description = product.body_html ? product.body_html.replace(/<[^>]+>/g, '').trim() : '';
  const shortDescription = description.length > 90 ? description.slice(0, 90) + '...' : description || 'Excelente producto.';

  // Mantener el objeto seguro para agregar al comparador
  const safeProduct = encodeURIComponent(JSON.stringify({
    handle: product.handle,
    title: product.title,
    price: precioOfertaNum,
    image: imagen
  }));

  return `
    <article class="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition flex flex-col justify-between relative">
      
      ${descuento > 0 ? `
        <div class="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">
          -${descuento}% DCTO
        </div>
      ` : ''}

      <div class="block h-full product-card cursor-pointer" data-handle="${product.handle}" role="button" tabindex="0">
        <div class="h-48 bg-gradient-to-br from-pastelLavender to-pastelPink flex items-center justify-center overflow-hidden p-4">
          <img src="${imagen}" alt="${product.title}" class="object-contain h-full w-full" loading="lazy">
        </div>

        <div class="p-4 flex flex-col justify-between h-48">
          <div>
            <h3 class="font-semibold text-gray-900 line-clamp-2">${product.title}</h3>
            <p class="text-sm text-gray-500 mt-1 line-clamp-2">${shortDescription}</p>
          </div>

          <div>
            <div class="mt-3 flex items-baseline gap-2 flex-wrap">
              <span class="font-extrabold text-indigo-600 text-xl">${txtPrecioOferta}</span>
              ${descuento > 0 ? `
                <span class="text-xs line-through text-slate-400 font-medium">${txtPrecioNormal}</span>
              ` : ''}
            </div>

            <div class="mt-3 flex items-center gap-2">
              <input 
                type="number" 
                min="1" 
                value="1" 
                class="cart-qty w-16 rounded-xl border border-slate-200 px-2 py-1.5 text-sm text-center"
              />

              <button 
                type="button"
                class="add-cart-btn flex-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                data-product="${safeProduct}"
              >
                Comparar
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function fetchMixgreenProducts() {
  try {
    console.log('⚡ Conectando directo al BFF para traer productos desde Supabase...');
    // Llamada directa a tu BFF en Python
    const response = await fetch(URL_BFF_PRODUCTOS);

    if (!response.ok) {
      throw new Error('El BFF de microservicios no respondió de forma correcta.');
    }

    const productosBD = await response.json();

    if (!Array.isArray(productosBD)) {
      return [];
    }

    console.log(`✅ ${productosBD.length} productos recuperados exitosamente desde la BD vía BFF`);

    // Mapeamos las columnas de Supabase al formato que el HTML del front espera usar
    return productosBD.map(producto => ({
      title: producto.nombre,
      product_type: producto.categoria || 'General',
      body_html: producto.marca || 'Mixgreen',
      handle: producto.id.toString(),
      tags: [producto.categoria || 'General'],

      // Se mapean los campos de Supabase a los que el front espera en product.html
      precio_normal: producto.precio_normal,
      precio_oferta: producto.precio_oferta,
      porcentaje_descuento: producto.porcentaje_descuento,
      tienda_origen: producto.tienda_origen || 'Mixgreen',
      link_tienda: producto.link_tienda || '#',
      imagen_url: producto.imagen_url,

      // Ajuste de variantes: se usan las columnas de Supabase precio_oferta y precio_normal
      variants: [{ price: producto.precio_oferta || producto.precio_normal || 0, compare_at_price: producto.precio_normal || 0 }],
      // Ajuste de imagen: se usa la columna imagen_url poblada por el scraper
      images: [{ src: producto.imagen_url || 'https://via.placeholder.com/320x180.png?text=Sin+imagen' }],
      featured_image: { src: producto.imagen_url }
    }));

  } catch (error) {
    console.error('❌ Error crítico en el circuito del Frontend con el BFF:', error);
    updateDiag('Error de conexión con los microservicios del ecosistema.', true);
    return [];
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
  alert('Producto agregado al comparador');
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