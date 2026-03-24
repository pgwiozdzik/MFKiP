import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../api/apiService.js';

const Header = () => {
    const [time, setTime] = useState(new Date());
    const [activeDay, setActiveDay] = useState("Ładowanie...");
    const navigate = useNavigate();
    const location = useLocation();

    const roleLabels = {
        reception: 'Recepcja',
        stage: 'Scena',
        admin: 'Administrator'
    };

    const userRole = localStorage.getItem('userRole');

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);

        const fetchDay = async () => {
            try {
                const data = await apiService.getActiveDay();
                if (data && data.name) {
                    setActiveDay(data.name);
                } else {
                    setActiveDay("Brak aktywnego dnia");
                }
            } catch (err) {
                console.error("Nie udało się ustawić dnia:", err);
                setActiveDay("2026");
            }
        };

        fetchDay();
        return () => clearInterval(timer);
    }, []);

    // Logika kliknięcia w logo
    const handleLogoClick = () => {
        if (userRole) {
            // Jeśli rola istnieje -> Wyloguj i odśwież
            localStorage.removeItem('userRole');
            // Przekierowanie na stronę główną z twardym odświeżeniem
            window.location.href = '/';
        } else {
            // Jeśli brak roli -> Idź do logowania
            navigate('/login');
        }
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('pl-PL', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <header className="main-header">
            <div className="header-left">
                <div
                    className={`logo-link ${userRole ? 'is-logged' : ''}`}
                    onClick={handleLogoClick}
                    title={userRole ? "Wyloguj się" : "Panel logowania"}
                >
                    <img src="/logo.png" alt="Logo MFKiP" className="logo-img" />
                </div>
                <div className="app-title-container">
                    <span className="app-name">MFKiP LIVE</span>
                    {userRole && (
                        <span className="role-badge">
                            <span className="separator">|</span>
                            {roleLabels[userRole]}
                        </span>
                    )}
                </div>
            </div>

            <div className="header-center">
                <div className="big-clock">{formatTime(time)}</div>
            </div>

            <div className="header-right">
                <span className="day-name">{activeDay}</span>
            </div>
        </header>
    );
};

export default Header;