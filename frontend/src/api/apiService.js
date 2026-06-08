import axios from "axios";

const API_BASE_URL = 'http://localhost:8081/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

export const apiService = {
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
    },

    login: async (role, password) => {
        const response = await apiClient.post('/auth/login', { role, password });
        return response.data;
    }
};