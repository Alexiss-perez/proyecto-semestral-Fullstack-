const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=250';

const CATEGORY_FILTERS = {
  vitaminas: ['vitamina', 'vitamin', 'capsula', 'cápsula', 'vitamín'],
  suplementos: ['suplemento', 'protein', 'proteína', 'whey', 'amino', 'pre-workout', 'bcaa', 'creatina', 'gainer', 'fuel'],
  probioticos: ['probiótico', 'prebiótico', 'biota', 'digest', 'flora', 'microbiota', 'kefir', 'probio', 'gut']
};

const CATEGORY_LABELS = {
  vitaminas: 'Vitaminas',
  suplementos: 'Suplementos',
  probioticos: 'Probióticos'
};

function normalizeText(value = '') {
  return value.toString().toLowerCase();
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
  const imagen = product.images && product.images.length > 0 ? product.images[0].src : 'https://via.placeholder.com/320x180.png?text=Sin+imagen';
  const description = product.body_html ? product.body_html.replace(/<[^>]+>/g, '').trim() : '';
  const shortDescription = description.length > 90 ? description.slice(0, 90) + '...' : description || 'Excelente producto.';

  return `
    <article class="bg-white rounded-2xl shadow-md overflow-hidden transform hover:-translate-y-1 hover:shadow-xl transition">
      <div class="h-48 bg-gradient-to-br from-pastelLavender to-pastelPink flex items-center justify-center overflow-hidden">
        <img src="${imagen}" alt="${product.title}" class="object-cover h-full w-full">
      </div>
      <div class="p-4">
        <h3 class="font-semibold text-gray-900">${product.title}</h3>
        <p class="text-sm text-gray-500 mt-2">${shortDescription}</p>
        <div class="mt-4 flex items-center justify-between">
          <span class="font-bold text-indigo-600">$${precio}</span>
          <button class="bg-pastelYellow px-3 py-1 rounded-lg text-sm hover:brightness-95 transition">Comprar</button>
        </div>
      </div>
    </article>
  `;
}

async function fetchMixgreenProducts() {
  const response = await fetch(URL_MIXGREEN);
  if (!response.ok) throw new Error(`MixGreen request failed: ${response.status}`);
  const data = await response.json();
  return Array.isArray(data.products) ? data.products : [];
}

function renderProducts(products, categoryKey) {
  const container = document.getElementById('contenedor-productos');
  const currentCategory = document.getElementById('current-category');
  const message = document.getElementById('product-message');

  if (!container || !currentCategory || !message) return;

  currentCategory.textContent = CATEGORY_LABELS[categoryKey] || 'Productos';
  message.textContent = `Mostrando ${products.length} productos de la categoría ${CATEGORY_LABELS[categoryKey]}.`;
  container.innerHTML = products.length
    ? products.map(buildProductCard).join('')
    : `<div class="col-span-full rounded-2xl bg-white shadow p-6 text-center text-gray-600">No se encontraron productos para ${CATEGORY_LABELS[categoryKey]}.</div>`;
}

function filterProductsByCategory(products, categoryKey) {
  const filters = CATEGORY_FILTERS[categoryKey] || [];
  return products.filter(product => matchesFilters(product, filters));
}

function setActiveCategory(categoryKey) {
  document.querySelectorAll('.category-filter').forEach(button => {
    const isActive = button.dataset.category === categoryKey;
    button.classList.toggle('ring-2 ring-indigo-300', isActive);
    button.classList.toggle('bg-pastelMint', isActive);
    button.classList.toggle('bg-white', !isActive);
  });
}

async function initProducts() {
  const categoryButtons = document.querySelectorAll('[data-category]');
  if (!categoryButtons.length) return;

  const allProducts = await fetchMixgreenProducts();
  let activeCategory = 'vitaminas';

  function updateCategory(categoryKey) {
    activeCategory = categoryKey;
    setActiveCategory(activeCategory);
    const filtered = filterProductsByCategory(allProducts, activeCategory);
    renderProducts(filtered, activeCategory);
  }

  categoryButtons.forEach(button => {
    button.addEventListener('click', () => updateCategory(button.dataset.category));
  });

  updateCategory(activeCategory);
}

document.addEventListener('DOMContentLoaded', () => {
  initProducts().catch(error => {
    console.error('Error cargando productos MixGreen:', error);
    const container = document.getElementById('contenedor-productos');
    if (container) {
      container.innerHTML = `<div class="col-span-full rounded-2xl bg-white shadow p-6 text-center text-red-500">No se pudieron cargar los productos. Intenta recargar más tarde.</div>`;
    }
  });
});