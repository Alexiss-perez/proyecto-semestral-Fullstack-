import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const URL_MIXGREEN = 'https://www.mixgreen.cl/products.json?limit=40';

app.get('/api/scrape', async (req, res) => {
    try {
        console.log("-> Scraper consumiendo Mixgreen API...");
        const respuesta = await fetch(URL_MIXGREEN);
        const data = await respuesta.json();
        res.json({ success: true, products: data.products });
    } catch (error) {
        console.error("Error en el servicio scraper:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = 4001;
app.listen(PORT, () => {
    console.log(`🚀 Scraper listo en http://localhost:${PORT}`);
});