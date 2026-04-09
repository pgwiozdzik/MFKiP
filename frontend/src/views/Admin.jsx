import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';
import DaysTab from './Admin/DaysTab';
import Volunteers from './Admin/Volunteers';
import { useWebSockets } from '../hooks/useWebSockets.js';
import '../assets/styles/views.css';

const Admin = () => {
    const [days, setDays] = useState([]);
    const [activeTab, setActiveTab] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isPassModalOpen, setIsPassModalOpen] = useState(false);
    const [pendingDayId, setPendingDayId] = useState(null);
    const [password, setPassword] = useState("");

    const fetchConfig = useCallback(async () => {
        try {
            const daysData = await apiService.getAllDays();
            const sortedDays = [...daysData].sort((a, b) => a.id - b.id);
            setDays(sortedDays);

            if (!activeTab && sortedDays.length > 0) {
                const activeFromDb = sortedDays.find(d => d.active || d.isActive);
                setActiveTab(activeFromDb ? activeFromDb.name : sortedDays[0].name);
            }
            setLoading(false);
        } catch (error) {
            console.error("Błąd Admina:", error);
            setLoading(false);
        }
    }, [activeTab]);

    useWebSockets('/topic/performances', (message) => {
        if (message === "UPDATE") fetchConfig();
    });

    useEffect(() => {
        fetchConfig();
    }, [fetchConfig]);

    const triggerDayChange = (id) => {
        setPendingDayId(id);
        setIsPassModalOpen(true);
    };

    const handlePasswordSubmit = async () => {
        if (password === "a") {
            try {
                await apiService.setActiveDay(pendingDayId);
                setIsPassModalOpen(false);
                setPassword("");
                await fetchConfig();
            } catch (error) {
                alert("Błąd zmiany dnia.");
            }
        } else {
            alert("Niepoprawne hasło!");
        }
    };

    if (loading) return <div className="wrapper">Inicjalizacja systemu...</div>;

    return (
        <div className="wrapper">
            <div className="admin-header-tabs">
                <div className="admin-tabs">
                    {days.map(day => (
                        <button
                            key={day.id}
                            className={`tab-btn ${activeTab === day.name ? 'active' : ''} ${(day.active || day.isActive) ? 'tab-online' : ''}`}
                            onClick={() => setActiveTab(day.name)}
                        >
                            {day.name} {(day.active || day.isActive) }
                        </button>
                    ))}
                    <button
                        className={`tab-btn ${activeTab === 'volunteers' ? 'active' : ''}`}
                        onClick={() => setActiveTab('volunteers')}
                    >
                        Wolontariusze
                    </button>
                </div>
            </div>

            <div className="admin-main-content">
                {activeTab === 'volunteers' ? (
                    <Volunteers />
                ) : (
                    <DaysTab
                        dayName={activeTab}
                        onSetActiveRequest={triggerDayChange}
                    />
                )}
            </div>

            {isPassModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Potwierdź zmianę dnia</h3>
                        <p>Podaj hasło administratora:</p>
                        <input
                            type="password"
                            className="input-field"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button className="btn-ok" onClick={handlePasswordSubmit}>POTWIERDŹ</button>
                            <button className="btn-cancel" onClick={() => setIsPassModalOpen(false)}>ANULUJ</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;