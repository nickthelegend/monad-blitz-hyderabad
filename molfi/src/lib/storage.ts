/**
 * Safe localStorage wrapper for Next.js SSR
 * Prevents "localStorage is not defined" errors during server-side rendering
 */

export const safeLocalStorage = {
    /**
     * Get item from localStorage
     */
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            return localStorage.getItem(key);
        } catch (error) {
            console.error(`Error getting localStorage item "${key}":`, error);
            return null;
        }
    },

    /**
     * Set item in localStorage
     */
    setItem: (key: string, value: string): boolean => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Error setting localStorage item "${key}":`, error);
            return false;
        }
    },

    /**
     * Remove item from localStorage
     */
    removeItem: (key: string): boolean => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing localStorage item "${key}":`, error);
            return false;
        }
    },

    /**
     * Clear all localStorage
     */
    clear: (): boolean => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    },

    /**
     * Get and parse JSON from localStorage
     */
    getJSON: <T>(key: string, defaultValue?: T): T | null => {
        const item = safeLocalStorage.getItem(key);
        if (!item) {
            return defaultValue ?? null;
        }
        try {
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error parsing JSON from localStorage "${key}":`, error);
            return defaultValue ?? null;
        }
    },

    /**
     * Stringify and set JSON in localStorage
     */
    setJSON: <T>(key: string, value: T): boolean => {
        try {
            const stringified = JSON.stringify(value);
            return safeLocalStorage.setItem(key, stringified);
        } catch (error) {
            console.error(`Error stringifying JSON for localStorage "${key}":`, error);
            return false;
        }
    },
};

/**
 * Safe sessionStorage wrapper for Next.js SSR
 */
export const safeSessionStorage = {
    getItem: (key: string): string | null => {
        if (typeof window === 'undefined') {
            return null;
        }
        try {
            return sessionStorage.getItem(key);
        } catch (error) {
            console.error(`Error getting sessionStorage item "${key}":`, error);
            return null;
        }
    },

    setItem: (key: string, value: string): boolean => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            sessionStorage.setItem(key, value);
            return true;
        } catch (error) {
            console.error(`Error setting sessionStorage item "${key}":`, error);
            return false;
        }
    },

    removeItem: (key: string): boolean => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing sessionStorage item "${key}":`, error);
            return false;
        }
    },

    clear: (): boolean => {
        if (typeof window === 'undefined') {
            return false;
        }
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing sessionStorage:', error);
            return false;
        }
    },

    getJSON: <T>(key: string, defaultValue?: T): T | null => {
        const item = safeSessionStorage.getItem(key);
        if (!item) {
            return defaultValue ?? null;
        }
        try {
            return JSON.parse(item) as T;
        } catch (error) {
            console.error(`Error parsing JSON from sessionStorage "${key}":`, error);
            return defaultValue ?? null;
        }
    },

    setJSON: <T>(key: string, value: T): boolean => {
        try {
            const stringified = JSON.stringify(value);
            return safeSessionStorage.setItem(key, stringified);
        } catch (error) {
            console.error(`Error stringifying JSON for sessionStorage "${key}":`, error);
            return false;
        }
    },
};
