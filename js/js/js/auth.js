/**
 * Módulo de Autenticación y Control de Sesión Supabase Auth
 */
import { supabase } from './supabase-client.js';

export class AuthManager {
    constructor(onSessionChangeCallback) {
        this.currentSession = null;
        this.currentUser = null;
        this.userProfile = null;
        this.onSessionChange = onSessionChangeCallback;

        this.initSession();
    }

    async initSession() {
        // Obtenemos sesión inicial
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) console.error("Error al obtener sesión:", error.message);

        await this.handleSessionUpdate(session);

        // Listener de cambios de autenticación en tiempo real
        supabase.auth.onAuthStateChange(async (_event, session) => {
            await this.handleSessionUpdate(session);
        });
    }

    async handleSessionUpdate(session) {
        this.currentSession = session;
        this.currentUser = session?.user || null;

        if (this.currentUser) {
            this.userProfile = await this.fetchUserProfile(this.currentUser.id);
        } else {
            this.userProfile = null;
        }

        if (typeof this.onSessionChange === 'function') {
            this.onSessionChange(this.currentUser, this.userProfile);
        }
    }

    async fetchUserProfile(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error("Error cargando el perfil:", err.message);
            return null;
        }
    }

    // Registro de nuevo usuario
    async signUp({ email, password, firstName, lastName, studentCode }) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    first_name: firstName,
                    last_name: lastName,
                    student_code: studentCode
                }
            }
        });

        if (error) throw error;
        return data;
    }

    // Iniciar Sesión con Correo
    async signIn({ email, password }) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    }

    // Recuperación de contraseña por correo
    async resetPassword(email) {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/#restablecer-password`
        });

        if (error) throw error;
        return data;
    }

    // Cerrar sesión activa
    async signOut() {
        const { error } = await supabase.auth.signOut();
        if (error) console.error("Error al cerrar sesión:", error.message);
    }
}
