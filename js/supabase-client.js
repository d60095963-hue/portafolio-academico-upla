/**
 * Inicializador y Exportador del Cliente de Supabase
 */
import { SUPABASE_CONFIG } from '../config.example.js'; // O config.js

if (!window.supabase) {
    console.error("El SDK de Supabase no se cargó correctamente desde el CDN.");
}

export const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.SUPABASE_URL,
    SUPABASE_CONFIG.SUPABASE_ANON_KEY
);
