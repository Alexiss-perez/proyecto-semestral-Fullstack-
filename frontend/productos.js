const URL_BFF_PRODUCTOS = 'http://localhost:8000/api/productos';

// 1. FUNCIÓN NUEVA: Renderiza el producto principal seleccionado en product.html
function cargarDetalleProductoPrincipal() {
    // Intentamos recuperar el producto guardado en LocalStorage
    const productoGuardado = localStorage.getItem('selectedProduct');
    if (!productoGuardado) return;

    try {
        const producto = JSON.parse(productoGuardado);
        console.log("📦 Datos cargados para el detalle:", producto);

        // Mapeamos los campos considerando el formato de Supabase/BFF y el formato de caché
        const nombre = producto.nombre || producto.title || 'Producto sin nombre';
        const marca = producto.marca || producto.body_html || 'Mixgreen';
        const categoria = producto.categoria || producto.product_type || 'General';
        
        const precioNormalNum = producto.precio_normal || (producto.variants?.[0]?.compare_at_price || 0);
        const precioOfertaNum = producto.precio_oferta || (producto.variants?.[0]?.price || 0);
        const descuento = Number(producto.porcentaje_descuento || 0);
        
        const tiendaOrigen = producto.tienda_origen || 'Mixgreen';
        const linkTienda = producto.link_tienda || '#';
        const imagen = producto.imagen_url || (producto.images?.[0]?.src || 'https://via.placeholder.com/320x180.png?text=Sin+imagen');

        // Formateo de moneda
        const txtPrecioNormal = `$${Number(precioNormalNum).toLocaleString('es-CL')}`;
        const txtPrecioOferta = `$${Number(precioOfertaNum).toLocaleString('es-CL')}`;

        // Buscamos contenedores comunes en tu HTML para inyectar dinámicamente la data
        const elTitulo = document.querySelector('h1, .product-title');
        const elMarca = document.querySelector('.product-brand, p text-gray-500');
        const elImagen = document.querySelector('img, .product-image');
        
        // Como alternativa dinámica que se adapta al HTML actual:
        const mainContainer = document.querySelector('.grid'); 
        if (mainContainer) {
            mainContainer.innerHTML = `
                <div class="flex justify-center bg-white p-4 rounded-2xl shadow-sm">
                    <img src="${imagen}" alt="${nombre}" class="rounded-xl max-h-96 object-contain">
                </div>
                
                <div class="bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                    <div>
                        <div class="flex gap-2 mb-3">
                            <span class="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                Categoría: ${categoria}
                            </span>
                            <span class="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                Origen: ${tiendaOrigen}
                            </span>
                        </div>
                        
                        <h1 class="text-3xl font-bold text-gray-900 mb-1">${nombre}</h1>
                        <p class="text-gray-500 font-medium mb-6">Marca: <span class="text-gray-800 font-semibold">${marca}</span></p>
                        
                        <div class="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                            <div class="flex items-center gap-4">
                                <span class="text-3xl font-extrabold text-indigo-600">${txtPrecioOferta}</span>
                                <span class="text-sm line-through text-gray-400">${txtPrecioNormal}</span>
                                <span class="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-md">-${descuento}% Dcto.</span>
                            </div>
                            <p class="text-xs text-gray-400 mt-2">Sincronizado de forma automatizada por microservicios.</p>
                        </div>
                    </div>

                    <div class="border-t pt-4">
                        <div class="flex flex-col gap-3">
                            <a href="${linkTienda}" target="_blank" rel="noopener noreferrer" class="w-full text-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-sm">
                                Visitar en tienda origen (${tiendaOrigen}) ↗
                            </a>
                            <button type="button" class="w-full text-center rounded-xl border border-indigo-600 text-indigo-600 px-4 py-3 text-sm font-semibold hover:bg-indigo-50 transition">
                                Agregar al Comparador
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (e) {
        console.error("Error al renderizar el producto principal:", e);
    }
}

// 2. FUNCIÓN ACTUALIZADA: Carga las recomendaciones horizontales consumiendo el BFF
async function cargarProductosCategoria() {
    const parametros = new URLSearchParams(window.location.search);
    const categoriaFiltro = parametros.get('categoria') ? parametros.get('categoria').toLowerCase() : '';

    const contenedor = document.querySelector('.fila-productos-horizontal');
    if (!contenedor) return;

    try {
        console.log('⚡ Cargando sugerencias horizontales desde el BFF...');
        // Llamada al BFF
        const respuesta = await fetch(URL_BFF_PRODUCTOS);
        const productosBD = await respuesta.json();

        contenedor.innerHTML = "";

        // Slices para no saturar la fila horizontal de recomendaciones (máximo 6 sugerencias)
        productosBD.slice(0, 15).forEach(producto => {
            const categoriaProd = (producto.categoria || '').toLowerCase();
            const nombreProd = (producto.nombre || '').toLowerCase();
            let calzaConFiltro = false;

            // Filtros de coincidencia 
            if (!categoriaFiltro) {
                calzaConFiltro = true; // Si no hay filtro en la URL, muestra sugerencias generales
            } else if (categoriaFiltro === 'vitaminas') {
                if (categoriaProd.includes('vitamina') || nombreProd.includes('vitamina') || nombreProd.includes('capsula') || nombreProd.includes('vitamin')) {
                    calzaConFiltro = true;
                }
            } else if (categoriaFiltro === 'suplementos') {
                if (categoriaProd.includes('proteína') || categoriaProd.includes('suplemento') || nombreProd.includes('protein') || nombreProd.includes('colageno')) {
                    calzaConFiltro = true;
                }
            } else if (categoriaFiltro === 'alimentacion') {
                if (!nombreProd.includes('vitamina') && !nombreProd.includes('protein') && !nombreProd.includes('colageno')) {
                    calzaConFiltro = true;
                }
            }

            if (calzaConFiltro) {
                const card = document.createElement('div');
                card.classList.add('mini-product-card');
                card.style.cursor = 'pointer';

                const precio = Number(producto.precio_oferta || producto.precio_normal || 0).toLocaleString('es-CL');
                const urlImagen = producto.imagen_url || 'https://via.placeholder.com/120';

                card.innerHTML = `
                    <img src="${urlImagen}" alt="${producto.nombre}">
                    <h5>${producto.nombre}</h5>
                    <span>$${precio}</span>
                `;

                // Al hacer clic en un recomendado, actualiza el detalle
                card.addEventListener('click', () => {
                    localStorage.setItem('selectedProduct', JSON.stringify(producto));
                    window.location.href = `product.html?handle=${producto.id}&categoria=${producto.categoria || 'General'}`;
                });

                contenedor.appendChild(card);
            }
        });

        if (contenedor.children.length === 0) {
            contenedor.innerHTML = `<p style="padding: 20px; color: #666;">No hay recomendaciones disponibles en esta categoría.</p>`;
        }

    } catch (error) {
        console.error("Error al alimentar recomendaciones desde BFF:", error);
        contenedor.innerHTML = `<p style="padding: 20px; color: red;">Error al sincronizar catálogo alternativo.</p>`;
    }
}

// Inicialización coordinada cuando el DOM está listo
document.addEventListener('DOMContentLoaded', () => {
    cargarDetalleProductoPrincipal();
    cargarProductosCategoria();
});