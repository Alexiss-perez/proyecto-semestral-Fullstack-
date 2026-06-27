const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=50';

async function cargarProductos() {
    // 1. Detectar qué categoría se pinchó en el index.html
    const params = new URLSearchParams(window.location.search);
    const categoriaSeleccionada = params.get('cat') || '';
    
    document.getElementById('titulo-categoria').innerText = `Categoría: ${categoriaSeleccionada}`;
    const contenedor = document.getElementById('contenedor-productos');

    try {
        // 2. Hacer el fetch real a la URL de Mixgreen
        const respuesta = await fetch(URL_MIXGREEN);
        const data = await respuesta.json();
        contenedor.innerHTML = ""; 

        // 3. Filtrar los productos correspondientes
        data.products.forEach(producto => {
            const tipo = producto.product_type.toLowerCase();
            const titulo = producto.title.toLowerCase();
            let perteneceACategoria = false;

            if (categoriaSeleccionada === 'vitaminas') {
                if (tipo.includes('vitamina') || titulo.includes('vitamina') || tipo.includes('cápsula')) perteneceACategoria = true;
            } else if (categoriaSeleccionada === 'suplementos') {
                if (tipo.includes('proteína') || tipo.includes('suplemento') || titulo.includes('protein')) perteneceACategoria = true;
            } else if (categoriaSeleccionada === 'cuidado') {
                // Todo lo que no sea vitamina ni suplemento se va a cuidado diario
                if (!tipo.includes('vitamina') && !titulo.includes('vitamina') && !tipo.includes('proteína')) perteneceACategoria = true;
            }

            // 4. Inyectar el producto en la fila horizontal
            if (perteneceACategoria) {
                const precio = Number(producto.variants[0].price).toLocaleString('es-CL');
                const img = producto.images.length > 0 ? producto.images[0].src : 'https://via.placeholder.com/120';

                const card = document.createElement('div');
                card.classList.add('mini-product-card');
                card.innerHTML = `
                    <img src="${img}" alt="${producto.title}">
                    <h5>${producto.title}</h5>
                    <span>$${precio}</span>
                `;
                contenedor.appendChild(card);
            }
        });

    } catch (error) {
        console.error("Error cargando la API:", error);
        contenedor.innerHTML = "<p>Error al conectar con el catálogo de Mixgreen.</p>";
    }
}

document.addEventListener('DOMContentLoaded', cargarProductos);