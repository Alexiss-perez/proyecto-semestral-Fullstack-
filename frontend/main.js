const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=50';

async function traerProductosMixgreen() {
    // Capturamos los 3 contenedores del HTML
    const cajaVitaminas = document.getElementById('contenedor-vitaminas');
    const cajaSuplementos = document.getElementById('contenedor-suplementos');
    const cajaAlimentacion = document.getElementById('contenedor-alimentacion');

    if (!cajaVitaminas || !cajaSuplementos || !cajaAlimentacion) return;

    try {
        // Llamamos a la API real
        const respuesta = await fetch(URL_MIXGREEN);
        const data = await respuesta.json();

        // Recorremos los productos que nos mandó Mixgreen
        data.products.forEach(producto => {
            const tipo = producto.product_type.toLowerCase();
            const titulo = producto.title.toLowerCase();

            // Creamos la cajita del producto
            const tarjetaProducto = document.createElement('div');
            tarjetaProducto.classList.add('mini-product-card');

            const precio = Number(producto.variants[0].price).toLocaleString('es-CL');
            const urlImagen = producto.images.length > 0 ? producto.images[0].src : 'https://via.placeholder.com/120';

            tarjetaProducto.innerHTML = `
                <img src="${urlImagen}" alt="${producto.title}">
                <h5>${producto.title}</h5>
                <span>$${precio}</span>
            `;

            // CLASIFICACIÓN: Revisaamos dónde meter el producto según su tipo/nombre
            if (tipo.includes('vitamina') || titulo.includes('vitamina') || tipo.includes('cápsula')) {
                cajaVitaminas.appendChild(tarjetaProducto);
            } else if (tipo.includes('proteína') || tipo.includes('suplemento') || titulo.includes('protein')) {
                cajaSuplementos.appendChild(tarjetaProducto);
            } else {
                // Todo lo demás se va a Cuidado Diario / Alimentación
                cajaAlimentacion.appendChild(tarjetaProducto);
            }
        });

    } catch (error) {
        console.error("Error al cargar los productos de Mixgreen:", error);
    }
}

// Ejecutar apenas cargue la página de inicio
document.addEventListener('DOMContentLoaded', traerProductosMixgreen);