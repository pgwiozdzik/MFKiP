import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Overview from './views/Overview';
import Login from './views/Login';
import Stage from './views/Stage';
import Reception from './views/Reception';

function App() {
    // 1. Inicjalizujemy stan z localStorage
    const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));

    // 2. Funkcja obsługująca zmianę autoryzacji
    const handleAuthChange = (role) => {
        if (role) {
            localStorage.setItem('userRole', role);
            setUserRole(role);
        } else {
            localStorage.removeItem('userRole');
            setUserRole(null);
        }
    };

    // 3. Logika wyboru widoku głównego
    const renderMainView = () => {
        switch (userRole) {
            case 'admin':
            case 'stage':
                return <Stage />;
            case 'reception':
                return <Reception />;
            default:
                return <Overview />;
        }
    };

    return (
        <Router>
            <div className="App">
                {/* PRZEKAZUJEMY PROPSY DO HEADERA */}
                <Header userRole={userRole} onLogout={() => handleAuthChange(null)} />

                <Routes>
                    <Route path="/" element={renderMainView()} />

                    {/* PRZEKAZUJEMY PROPSY DO LOGIN */}
                    <Route
                        path="/login"
                        element={<Login onLogin={(role) => handleAuthChange(role)} />}
                    />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;