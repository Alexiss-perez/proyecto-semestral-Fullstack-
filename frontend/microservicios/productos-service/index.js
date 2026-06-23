import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

const SCRAPER_URL = 'http://localhost:4001/api/scrape';

app.get('/api/productos', async (req, res) => {
    try {
        console.log("-> Productos Service pidiendo datos al Scraper...");
        const respuesta = await fetch(SCRAPER_URL);
        const data = await respuesta.json();

        if (!data.success) {
            return res.status(502).json({ error: "El scraper falló" });
        }

        res.json(data.products);
    } catch (error) {
        console.error("Error en Productos Service:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 4002;
app.listen(PORT, () => {
    console.log(`🚀 Productos Service listo en http://localhost:${PORT}`);
});