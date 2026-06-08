import React, {useState, useEffect, useCallback} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../api/apiService.js';
import {useWebSockets} from "../hooks/useWebSockets.js";

const Header = ({ userRole, onLogout }) => {
    const [time, setTime] = useState(new Date());
    const [activeDay, setActiveDay] = useState("Ładowanie...");
    const navigate = useNavigate();
    const location = useLocation();

    const isLoginPage = location.pathname === '/login';

    const roleLabels = {
        reception: { desktop: 'Recepcja', mobile: 'Recep.' },
        stage: { desktop: 'Scena', mobile: 'Scena' },
        admin: { desktop: 'Administrator', mobile: 'Admin' }
    };

    const fetchDay = useCallback(async () => {
        try {
            const data = await apiService.getActiveDay();
            if (data && data.name) {
                setActiveDay(data);
            }
        } catch (err) {
            console.error("Błąd pobierania dnia:", err);
            setActiveDay({ name: "2026", date: null });
        }
    }, []);

    useWebSockets('/topic/performances', (message) => {
        if (message === "UPDATE") {
            console.log("Header: Wykryto zmianę dnia, odświeżam...");
            fetchDay();
        }
    });

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);

        fetchDay();

        return () => clearInterval(timer);
    }, [fetchDay]);

    const handleLogoClick = () => {
        if (userRole) {
            onLogout();
            navigate('/');
        } else if (isLoginPage) {
            navigate('/');
        } else {
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
                    title={userRole ? "Wyloguj się" : (isLoginPage ? "Powrót do podglądu" : "Panel logowania")}
                >
                    <img src="/logo.png" alt="Logo MFKiP" className="logo-img" />
                </div>
                <div className="app-title-container">
                    <div className="app-name-wrapper">
                        <span className="app-name-main">Międzynarodowy Festiwal</span>
                        <span className="app-name-main">Kolęd i Pastorałek</span>
                        <span className="app-name-sub">im. ks. Kazimierza Szwarlika</span>
                    </div>
                    {userRole && (
                        <span className="role-badge">
                            {/* DYNAMICZNE PODMIANIANIE TEKSTU */}
                            <span className="text-desktop">{roleLabels[userRole].desktop}</span>
                            <span className="text-mobile">{roleLabels[userRole].mobile}</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="header-center">
                <div className="big-clock">{formatTime(time)}</div>
            </div>

            <div className="header-right">
                <div className="day-info-wrapper">
                    <span className="day-name-main">{activeDay?.name || "2026"}</span>
                    <span className="day-date-sub">
                        {activeDay?.date ? new Date(activeDay.date).toLocaleDateString('pl-PL') : ""}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;