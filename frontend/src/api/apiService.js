// src/api/apiService.js
import axios from "axios";

const API_BASE_URL = 'http://localhost:8081/api';

// Tworzymy instancję klienta, aby nie powtarzać adresu URL i nagłówków
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // ważne, jeśli używasz sesji/cookies
});

export const apiService = {
    // --- SEKCJA: WYSTĘPY (PERFORMANCES) ---
    getAllPerformances: async () => {
        const response = await apiClient.get('/performances/all');
        return response.data;
    },

    getPerformancesByDay: async (dayId) => {
        const response = await apiClient.get(`/performances/day/${dayId}`);
        return response.data;
    },

    updatePerformance: async (id, performanceData) => {
        const response = await apiClient.put(`/performances/${id}`, performanceData);
        return response.data;
    },

    updatePerformanceStatus: async (id, status) => {
        const response = await apiClient.patch(`/performances/${id}/status`, { status });
        return response.data;
    },

    addPerformance: async (performanceData) => {
        const response = await apiClient.post('/performances/add', performanceData);
        return response.data;
    },

    deletePerformance: async (id) => {
        const response = await apiClient.delete(`/performances/${id}`);
        return response.data;
    },

    reorderPerformance: async (id, direction) => {
        const response = await apiClient.patch(`/performances/${id}/reorder`, { direction });
        return response.data;
    },

    // --- SEKCJA: DNI (DAYS) ---

    // TA METODA BYŁA POWODEM BŁĘDU 404/TYPEERROR
    getAllDays: async () => {
        const response = await apiClient.get('/days/all');
        return response.data;
    },

    getActiveDay: async () => {
        const response = await apiClient.get('/days/active');
        return response.data;
    },

    setActiveDay: async (id) => {
        const response = await apiClient.patch(`/days/${id}/activate`);
        return response.data;
    },

    // --- SEKCJA: WOLONTARIUSZE (VOLUNTEERS) ---
    getAllVolunteers: async () => {
        const response = await apiClient.get('/volunteers/all');
        return response.data;
    },

    createVolunteer: async (volunteerData) => {
        const response = await apiClient.post('/volunteers/add', volunteerData);
        return response.data;
    },

    deleteVolunteer: async (id) => {
        const response = await apiClient.delete(`/volunteers/${id}`);
        return response.data;
    }
};