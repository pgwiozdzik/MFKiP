import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Dodano useLocation
import { apiService } from '../api/apiService.js';

const Header = ({ userRole, onLogout }) => {
    const [time, setTime] = useState(new Date());
    const [activeDay, setActiveDay] = useState("Ładowanie...");
    const navigate = useNavigate();
    const location = useLocation(); // Pobieramy aktualną ścieżkę

    const isLoginPage = location.pathname === '/login';

    const roleLabels = {
        reception: 'Recepcja',
        stage: 'Scena',
        admin: 'Administrator'
    };

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);

        const fetchDay = async () => {
            try {
                const data = await apiService.getActiveDay();
                if (data && data.name) {
                    setActiveDay(data);
                }
            } catch (err) {
                console.error("Błąd pobierania dnia:", err);
                setActiveDay("2026");
            }
        };

        fetchDay();
        return () => clearInterval(timer);
    }, []);

    const handleLogoClick = () => {
        if (userRole) {
            // 1. Jeśli zalogowany -> Wyloguj
            onLogout();
            navigate('/');
        } else if (isLoginPage) {
            // 2. Jeśli niezalogowany i na stronie logowania -> Wróć do podglądu
            navigate('/');
        } else {
            // 3. Jeśli niezalogowany i gdzie indziej -> Idź do logowania
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
                    // Dynamiczny opis w zależności od miejsca i stanu
                    title={userRole ? "Wyloguj się" : (isLoginPage ? "Powrót do podglądu" : "Panel logowania")}
                >
                    <img src="/logo.png" alt="Logo MFKiP" className="logo-img" />
                </div>
                <div className="app-title-container">
                    <div className="app-name-wrapper">
                        <span className="app-name-main">Międzynarodowy Festiwal</span>
                        <span className="app-name-main">Kolęd i Pastorałek</span>
                        <span className="app-name-sub">
            im. ks. Kazimierza Szwarlika
        </span>
                    </div>
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
                <div className="day-info-wrapper">
                    {/* Nazwa dnia (np. Czwartek) - analogicznie do nazwy głównej */}
                    <span className="day-name-main">{activeDay?.name || "Brak dnia"}</span>

                    {/* Data (np. 26.03.2026) - analogicznie do imienia patrona */}
                    <span className="day-date-sub">
            {activeDay?.date ? new Date(activeDay.date).toLocaleDateString('pl-PL') : ""}
        </span>
                </div>
            </div>
        </header>
    );
};

export default Header;