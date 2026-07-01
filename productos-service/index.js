import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Cargar variables de entorno (.env)
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar cliente de Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: Falta configurar SUPABASE_URL o SUPABASE_KEY en el .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/productos -> Endpoint para obtener todos los productos desde Supabase
app.get('/api/productos', async (req, res) => {
    try {
        console.log("-> Productos Service consultando datos a Supabase...");
        
        // Consulta a la tabla 'Productos' en Supabase
        const { data, error } = await supabase
            .from('Productos')
            .select('*');

        if (error) {
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error("Error al obtener productos de Supabase:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 4002;
app.listen(PORT, () => {
    console.log(`🚀 Productos Service conectado a Supabase y listo en http://localhost:${PORT}`);
});