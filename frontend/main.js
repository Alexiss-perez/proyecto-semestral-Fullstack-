const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=250';
const URL_BFF_PRODUCTOS = 'http://localhost:8000/api/productos';

const CATEGORY_FILTERS = {
  vitaminas: ['vitamina', 'vitaminas', 'vitamin', 'vitaminas-minerales', 'vitamín', 'minerales', 'multivitamina', 'multivitaminas'],
  suplementos: ['suplemento', 'suplementos', 'complemento', 'complementos', 'proteína', 'proteina', 'protein', 'whey', 'amino', 'aminoácido', 'bcaa', 'creatina', 'gainer', 'fuel', 'energía', 'energia', 'performance', 'deporte', 'sport', 'alimentacion', 'salud'],
  probioticos: ['probiótico', 'probióticos', 'probiotico', 'probioticos', 'prebiótico', 'prebióticos', 'prebiotico', 'prebioticos', 'biota', 'digest', 'flora', 'microbiota', 'kefir', 'probio', 'gut']
};

const CATEGORY_LABELS = {
  vitaminas: 'Vitaminas',
  suplementos: 'Suplementos',
  probioticos: 'Probióticos'
};
CATEGORY_LABELS.all = 'Todos';

// Pagination state
const PRODUCTS_PER_PAGE = 9;
let currentPage = 1;
let currentFilteredProducts = [];
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
  const tags = Array.isArray(product.tags) ? product.tags.map(normalizeText) : [];
  const body = normalizeText(product.body_html);

  return filters.some(filter => {
    return title.includes(filter) || type.includes(filter) || body.includes(filter) || tags.some(tag => tag.includes(filter));
  });
}

function buildProductCard(product) {
  const precio = product.variants && product.variants.length > 0 ? Number(product.variants[0].price).toLocaleString('es-CL', { minimumFractionDigits: 0 }) : 'N/D';
  const fallbackImage = 'https://via.placeholder.com/320x180.png?text=Sin+imagen';
  const imagen = product.images?.find(img => img && img.src)?.src || product.featured_image?.src || fallbackImage;
  const description = product.body_html ? product.body_html.replace(/<[^>]+>/g, '').trim() : '';
  const shortDescription = description.length > 90 ? description.slice(0, 90) + '...' : description || 'Excelente producto.';
  const productUrl = product.handle ? `product.html?handle=${encodeURIComponent(product.handle)}` : '#';

  return `
    <article class="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition">
      <div class="block h-full product-card" data-handle="${product.handle}" role="button" tabindex="0">
        <div class="h-48 bg-gradient-to-br from-pastelLavender to-pastelPink flex items-center justify-center overflow-hidden">
          <img src="${imagen}" alt="${product.title}" class="object-cover h-full w-full" loading="lazy">
        </div>
        <div class="p-4">
          <h3 class="font-semibold text-gray-900">${product.title}</h3>
          <p class="text-sm text-gray-500 mt-2">${shortDescription}</p>
          <div class="mt-4 flex items-center justify-between">
            <span class="font-bold text-indigo-600">$${precio}</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

async function fetchMixgreenProducts() {

  // Primer intento: MixGreen
  try {
    const response = await fetch(URL_MIXGREEN);

    if (!response.ok) {
      throw new Error("MixGreen no respondió");
    }

    const data = await response.json();

    if (Array.isArray(data.products)) {
      console.log("✅ Productos cargados desde MixGreen");
      return data.products;
    }

  } catch (error) {

    console.warn("⚠ MixGreen no disponible. Se utilizará el BFF.", error);

    // Segundo intento: BFF
    const response = await fetch(URL_BFF_PRODUCTOS);

    if (!response.ok) {
      throw new Error("No fue posible conectar con el BFF.");
    }

    const productos = await response.json();

    return productos.map(producto => ({
      title: producto.nombre,
      product_type: producto.categoria,
      body_html: producto.marca,
      handle: producto.id.toString(),
      tags: [producto.categoria],
      variants: [
        {
          price: producto.precio_oferta
        }
      ],
      images: [
        {
          src: "https://via.placeholder.com/300x300?text=Producto"
        }
      ]
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

  // Pagination: store filtered set and compute page slice
  currentFilteredProducts = Array.isArray(products) ? products : [];
  const total = currentFilteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
  if (currentPage > totalPages) currentPage = totalPages;
  const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = currentFilteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  if (total === 0) {
    message.innerHTML = `No se encontraron productos para <strong>${CATEGORY_LABELS[categoryKey]}</strong>.`;
    container.innerHTML = `<div class="col-span-full rounded-2xl bg-white shadow p-6 text-center text-gray-600">No se encontraron productos para ${CATEGORY_LABELS[categoryKey]}.</div>`;
  } else {
    const showingFrom = startIndex + 1;
    const showingTo = startIndex + pageItems.length;
    message.innerHTML = `Mostrando ${showingFrom}-${showingTo} de ${total} productos de la categoría <strong>${CATEGORY_LABELS[categoryKey]}</strong>.`;
    container.innerHTML = pageItems.map(buildProductCard).join('');
  }

  // render pagination controls
  renderPaginationControls(total, Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)));

  // Cache products by handle and attach click handlers to open internal product page with data
  try {
    window.__productCache = window.__productCache || {};
    products.forEach(p => { if (p.handle) window.__productCache[p.handle] = p; });
    container.querySelectorAll('.product-link').forEach(a => {
      a.addEventListener('click', (e) => {
        const handle = a.dataset.handle;
        if (handle && window.__productCache && window.__productCache[handle]) {
          try { localStorage.setItem('selectedProduct', JSON.stringify(window.__productCache[handle])); } catch (err) { console.warn('Could not cache product:', err); }
        }
        // allow default navigation to proceed (opens product.html). If you want to ensure cache is set before opening, uncomment the lines below.
        // e.preventDefault(); window.open('product.html?handle=' + encodeURIComponent(handle), '_blank');
      });
    });
    // product-card click should also open product page and cache
    container.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const handle = card.dataset.handle;
        if (handle && window.__productCache && window.__productCache[handle]) {
          try { localStorage.setItem('selectedProduct', JSON.stringify(window.__productCache[handle])); } catch (err) { console.warn('Could not cache product:', err); }
        }
        const url = 'product.html?handle=' + encodeURIComponent(handle || '');
        window.open(url, '_blank');
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
      });
    });
  } catch (err) {
    console.warn('Error attaching product handlers', err);
  }
}

function renderPaginationControls(totalItems, totalPages) {
  const pagination = document.getElementById('pagination-controls');
  if (!pagination) return;
  if (!totalItems || totalPages <= 1) { pagination.innerHTML = ''; return; }

  pagination.innerHTML = `
    <div class="inline-flex items-center gap-3">
      <button type="button" id="prev-page" class="px-3 py-1 bg-white border rounded hover:bg-gray-100">Anterior</button>
      <div class="px-3 py-1 text-sm">Página <span id="page-current">${currentPage}</span> de <span id="page-total">${totalPages}</span></div>
      <button type="button" id="next-page" class="px-3 py-1 bg-white border rounded hover:bg-gray-100">Siguiente</button>
    </div>
  `;

  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');
  const pageCurrent = document.getElementById('page-current');
  const pageTotal = document.getElementById('page-total');

  if (pageCurrent) pageCurrent.textContent = currentPage;
  if (pageTotal) pageTotal.textContent = totalPages;

  currentTotalPages = totalPages;
}

function setupPaginationControls() {
  const pagination = document.getElementById('pagination-controls');
  if (!pagination) return;
  pagination.addEventListener('click', (event) => {
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
  return products.filter(product => matchesFilters(product, filters));
}

function setActiveCategory(categoryKey) {
  document.querySelectorAll('.category-filter').forEach(button => {
    const isActive = button.dataset.category === categoryKey;
    if (isActive) {
      button.classList.add('ring-2', 'ring-indigo-300', 'bg-pastelMint');
      button.classList.remove('bg-white');
    } else {
      button.classList.remove('ring-2', 'ring-indigo-300', 'bg-pastelMint');
      button.classList.add('bg-white');
    }
  });
}

function setupCategoryFilters(allProducts) {
  const categoryButtons = document.querySelectorAll('[data-category]');
  if (!categoryButtons.length) return;
  categoryButtons.forEach(button => {
    button.type = 'button';
    button.addEventListener('click', () => {
      const categoryKey = button.dataset.category;
      if (!categoryKey) return;
      currentPage = 1;
      currentCategoryKey = categoryKey;
      setActiveCategory(categoryKey);
      const filtered = filterProductsByCategory(allProducts, categoryKey);
      if ((!filtered || filtered.length === 0) && allProducts.length > 0) {
        updateDiag(`No se encontraron productos para ${CATEGORY_LABELS[categoryKey] || categoryKey}. Mostrando todos los productos.`, false);
        renderProducts(allProducts, 'all');
      } else {
        updateDiag('');
        renderProducts(filtered, categoryKey);
      }
    });
  });
}

// Attach immediate diagnostics so buttons react even if fetch fails
function addImmediateButtonDiagnostics() {
  document.querySelectorAll('.category-filter').forEach(button => {
    button.addEventListener('click', () => {
      const key = button.dataset.category;
      console.log('[DIAG] category-click', key);
      if (window.__diags && typeof window.__diags.log === 'function') window.__diags.log(`category-click ${key}`);
      button.classList.add('ring-2', 'ring-indigo-300');
      setTimeout(() => button.classList.remove('ring-2', 'ring-indigo-300'), 700);
    });
  });
}

async function initProducts() {
  const categoryButtons = document.querySelectorAll('[data-category]');
  if (!categoryButtons.length) return;

  setLoadingState(true);
  let allProducts = [];
  try {
    allProducts = await fetchMixgreenProducts();
  } catch (err) {
    updateDiag('Error cargando productos. Revisa la consola.', true);
    console.error('fetch error', err);
    // still continue with empty list so buttons are interactive
    allProducts = [];
  }
  let activeCategory = 'vitaminas';

  function updateCategory(categoryKey) {
    if (currentCategoryKey !== categoryKey) {
      currentCategoryKey = categoryKey;
      currentPage = 1;
    }
    activeCategory = categoryKey;
    setActiveCategory(activeCategory);
    const filtered = filterProductsByCategory(allProducts, activeCategory);
    if ((!filtered || filtered.length === 0) && allProducts && allProducts.length > 0) {
      // fallback for debugging: show all products if category yields none
      updateDiag(`No se encontraron productos para ${CATEGORY_LABELS[categoryKey]}. Mostrando todos los productos.`, false);
      renderProducts(allProducts, 'all');
    } else {
      renderProducts(filtered, activeCategory);
    }
  }

  setupCategoryFilters(allProducts);
  updateCategory(activeCategory);
  setLoadingState(false);
}

document.addEventListener('DOMContentLoaded', () => {
  addImmediateButtonDiagnostics();
  setupPaginationControls();
  initProducts();
});