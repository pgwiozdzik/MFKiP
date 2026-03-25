// src/api/apiService.js
import axios from "axios";

const API_BASE_URL = 'http://localhost:8081/api';

export const apiService = {
    // Sekcja: Występy
    getAllPerformances: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/performances/all`);
            if (!response.ok) throw new Error('Błąd pobierania harmonogramu');
            return await response.json();
        } catch (error) {
            console.error("API Error [getAllPerformances]:", error);
            throw error;
        }
    },

    getAllVolunteers: async () => {
        const response = await axios.get(`${API_BASE_URL}/volunteers/all`);
        return response.data;
    },

    // Sekcja: Dni
    getActiveDay: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/days/active`);
            if (!response.ok) throw new Error('Błąd pobierania aktywnego dnia');
            return await response.json();
        } catch (error) {
            console.error("API Error [getActiveDay]:", error);
            throw error;
        }
    },

    // Sekcja: Statusy (używane przez Scenę/Recepcję)
    updatePerformanceStatus: async (id, status) => {
        try {
            const response = await fetch(`${API_BASE_URL}/performances/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!response.ok) throw new Error('Błąd aktualizacji statusu');
            return await response.json();
        } catch (error) {
            console.error("API Error [updatePerformanceStatus]:", error);
            throw error;
        }
    }
};