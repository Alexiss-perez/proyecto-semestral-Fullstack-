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
const URL_ALLNUTRITION = 'https://allnutrition.cl/products.json?limit=40';

/**
 * Función auxiliar para estandarizar el mapeo de productos Shopify
 */
function mapearProductoShopify(prod, tiendaNombre, baseUrl) {
    const variante = prod.variants && prod.variants[0] ? prod.variants[0] : null;
    
    const precioFinal = variante ? parseFloat(variante.price) : 0;
    const precioLista = variante && variante.compare_at_price ? parseFloat(variante.compare_at_price) : null;
    
    const tieneDescuento = precioLista && precioLista > precioFinal;
    const precioNormal = tieneDescuento ? precioLista : precioFinal;
    const precioOferta = precioFinal;
    
    let porcentajeDescuento = 0;
    if (tieneDescuento) {
        porcentajeDescuento = Math.round(((precioNormal - precioOferta) / precioNormal) * 100);
    }

    const imagenUrl = prod.images && prod.images[0] ? prod.images[0].src : null;
    const linkTienda = `${baseUrl}/products/${prod.handle}`;

    return {
        nombre: prod.title,
        marca: prod.vendor || tiendaNombre,
        categoria: prod.product_type || "General",
        precio_normal: precioNormal,
        precio_oferta: precioOferta,
        porcentaje_descuento: porcentajeDescuento,
        link_tienda: linkTienda,
        tienda_origen: tiendaNombre,
        imagen_url: imagenUrl
    };
}

app.get('/api/scrape', async (req, res) => {
    try {
        console.log("-> Scraper simultáneo (Mixgreen + AllNutrition)...");

        // Consultar ambas APIs al mismo tiempo de forma eficiente
        const [resMixgreen, resAllNutrition] = await Promise.all([
            fetch(URL_MIXGREEN).catch(err => ({ error: true, msg: err.message })),
            fetch(URL_ALLNUTRITION).catch(err => ({ error: true, msg: err.message }))
        ]);

        let todosLosProductos = [];

        // 1. Procesar Mixgreen
        if (!resMixgreen.error) {
            const dataMix = await resMixgreen.json();
            if (dataMix.products) {
                const mapeadosMix = dataMix.products.map(prod => 
                    mapearProductoShopify(prod, 'Mixgreen', 'https://www.mixgreen.cl')
                );
                todosLosProductos.push(...mapeadosMix);
                console.log(`✅ Mixgreen mapeado: ${mapeadosMix.length} productos.`);
            }
        } else {
            console.error("❌ Error al obtener Mixgreen:", resMixgreen.msg);
        }

        // 2. Procesar AllNutrition
        if (!resAllNutrition.error) {
            const dataAll = await resAllNutrition.json();
            if (dataAll.products) {
                const mapeadosAll = dataAll.products.map(prod => 
                    mapearProductoShopify(prod, 'AllNutrition', 'https://allnutrition.cl')
                );
                todosLosProductos.push(...mapeadosAll);
                console.log(`✅ AllNutrition mapeado: ${mapeadosAll.length} productos.`);
            }
        } else {
            console.error("❌ Error al obtener AllNutrition:", resAllNutrition.msg);
        }

        // Si ninguna API trajo nada, se detiene el proceso
        if (todosLosProductos.length === 0) {
            return res.status(400).json({ success: false, error: "No se obtuvieron productos de ninguna tienda." });
        }

        console.log(`-> Actualizando ${todosLosProductos.length} productos en Supabase usando upsert...`);

        // upsert con  { onConflict: 'link_tienda' }
        const { error: supabaseError } = await supabase
            .from('Productos')
            .upsert(todosLosProductos, { onConflict: 'link_tienda' });

        if (supabaseError) {
            throw supabaseError;
        }

        // se envia un único JSON consolidado
        res.json({ 
            success: true, 
            message: `Scraping Multi-tienda exitoso. Base de datos actualizada sin duplicados.`,
            total_total: todosLosProductos.length,
            total_mixgreen: todosLosProductos.filter(p => p.tienda_origen === 'Mixgreen').length,
            total_allnutrition: todosLosProductos.filter(p => p.tienda_origen === 'AllNutrition').length,
            products: todosLosProductos 
        });

    } catch (error) {
        console.error("Error crítico en el servicio scraper:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 4001;
app.listen(PORT, () => {
    console.log(`🚀 Scraper listo e integrado con Supabase en http://localhost:${PORT}`);
});