import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=40';

app.get('/api/scrape', async (req, res) => {
    try {
        console.log("-> Scraper consumiendo Mixgreen API...");
        const respuesta = await fetch(URL_MIXGREEN);
        const data = await respuesta.json();

        if (!data.products || data.products.length === 0) {
            return res.status(400).json({ success: false, error: "No se obtuvieron productos de la API" });
        }

        // Mapear los productos de Mixgreen a la estructura de la tabla "Productos" en Supabase
        const productosMapeados = data.products.map(prod => {
            const variante = prod.variants && prod.variants[0] ? prod.variants[0] : null;
            
            // 1.- Extrae precio final que se paga en la tienda (Shopify usa 'price')
            const precioFinal = variante ? parseFloat(variante.price) : 0;
            
            // 2.- Extrae precio normal o de comparación ('compare_at_price')
            const precioLista = variante && variante.compare_at_price ? parseFloat(variante.compare_at_price) : null;
            
            // 3.- Determina precio normal y precio oferta
            // Si tiene compare_at_price y es mayor que el precio final, hay una oferta real.
            const tieneDescuento = precioLista && precioLista > precioFinal;
            const precioNormal = tieneDescuento ? precioLista : precioFinal;
            const precioOferta = precioFinal;
            
            // 4.- Calcula porcentaje de descuento
            let porcentajeDescuento = 0;
            if (tieneDescuento) {
                porcentajeDescuento = Math.round(((precioNormal - precioOferta) / precioNormal) * 100);
            }

            // Extraee URL de la primera imagen si es q existe
            const imagenUrl = prod.images && prod.images[0] ? prod.images[0].src : null;
            // Genera enlace del producto usando handle de Mixgreen
            const linkTienda = `https://www.mixgreen.cl/products/${prod.handle}`;

            return {
                nombre: prod.title,
                marca: prod.vendor,
                categoria: prod.product_type || "General",
                precio_normal: precioNormal,
                precio_oferta: precioOferta,
                porcentaje_descuento: porcentajeDescuento,
                link_tienda: linkTienda,
                tienda_origen: 'Mixgreen',
                imagen_url: imagenUrl
            };
        });

        console.log(`-> Guardando ${productosMapeados.length} productos en Supabase...`);

        // Insertar masivamente los productos mapeados en la tabla "Productos"
        // Nota: Al usar insert() directo, se agregarán registros nuevos con IDs autogenerados.
        const { error: supabaseError } = await supabase
            .from('Productos')
            .insert(productosMapeados);

        if (supabaseError) {
            throw supabaseError;
        }

        res.json({ 
            success: true, 
            message: `Scraping exitoso. ${productosMapeados.length} productos guardados en Supabase.`,
            products: productosMapeados 
        });

    } catch (error) {
        console.error("Error en el servicio scraper:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 4001;
app.listen(PORT, () => {
    console.log(`🚀 Scraper listo e integrado con Supabase en http://localhost:${PORT}`);
});