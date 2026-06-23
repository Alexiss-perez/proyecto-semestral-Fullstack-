const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=50';

async function cargarProductosCategoria() {
    // 1. Capturamos si la URL dice ?categoria=vitaminas, ?categoria=suplementos, etc.
    const parametros = new URLSearchParams(window.location.search);
    const categoriaFiltro = parametros.get('categoria') ? parametros.get('categoria').toLowerCase() : '';

    const contenedor = document.querySelector('.fila-productos-horizontal');
    if (!contenedor) return;

    try {
        // 2. Llamamos los datos de Mixgreen
        const respuesta = await fetch(URL_MIXGREEN);
        const data = await respuesta.json();

        // Limpiamos los placeholders de prueba
        contenedor.innerHTML = "";

        // 3. Filtramos y creamos las tarjetas dinámicamente
        data.products.forEach(producto => {
            const tipo = producto.product_type.toLowerCase();
            const titulo = producto.title.toLowerCase();
            let calzaConFiltro = false;

            if (categoriaFiltro === 'vitaminas') {
                if (tipo.includes('vitamina') || titulo.includes('vitamina') || tipo.includes('cápsula')) {
                    calzaConFiltro = true;
                }
            } else if (categoriaFiltro === 'suplementos') {
                if (tipo.includes('proteína') || tipo.includes('suplemento') || titulo.includes('protein')) {
                    calzaConFiltro = true;
                }
            } else if (categoriaFiltro === 'alimentacion') {
                if (!tipo.includes('vitamina') && !titulo.includes('vitamina') && !tipo.includes('proteína')) {
                    calzaConFiltro = true;
                }
            }

            // 4. Si calza, armamos la estructura con sus datos reales
            if (calzaConFiltro) {
                const card = document.createElement('div');
                card.classList.add('mini-product-card');

                const precio = Number(producto.variants[0].price).toLocaleString('es-CL');
                const urlImagen = producto.images.length > 0 ? producto.images[0].src : 'https://via.placeholder.com/120';

                card.innerHTML = `
                    <img src="${urlImagen}" alt="${producto.title}">
                    <h5>${producto.title}</h5>
                    <span>$${precio}</span>
                `;
                contenedor.appendChild(card);
            }
        });

        if (contenedor.children.length === 0) {
            contenedor.innerHTML = `<p style="padding: 20px; color: #666;">No hay productos disponibles en este momento.</p>`;
        }

    } catch (error) {
        console.error("Error con Mixgreen:", error);
        contenedor.innerHTML = `<p style="padding: 20px; color: red;">Error al conectar con Mixgreen.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', cargarProductosCategoria);