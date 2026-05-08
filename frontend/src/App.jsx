import React, {useEffect, useState} from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Overview from './views/Overview';
import Login from './views/Login';
import Stage from './views/Stage';
import Reception from './views/Reception';
import Admin from './views/Admin';

function App() {
    const SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 godziny w milisekundach

    const getInitialAuth = () => {
        const savedAuth = localStorage.getItem('userAuth');
        if (!savedAuth) return null;

        const { role, loginTime } = JSON.parse(savedAuth);
        const now = new Date().getTime();

        // Jeśli czas który upłynął jest większy niż dozwolony - usuń sesję
        if (now - loginTime > SESSION_DURATION) {
            localStorage.removeItem('userAuth');
            return null;
        }
        return role;
    };

    const [userRole, setUserRole] = useState(getInitialAuth());

    const handleAuthChange = (role) => {
        if (role) {
            const authData = {
                role: role,
                loginTime: new Date().getTime()
            };
            localStorage.setItem('userAuth', JSON.stringify(authData));
            setUserRole(role);
        } else {
            localStorage.removeItem('userAuth');
            setUserRole(null);
        }
    };

    // Dodatkowy efekt: sprawdza ważność sesji przy każdym odświeżeniu/akcji
    useEffect(() => {
        const checkSession = () => {
            const savedAuth = localStorage.getItem('userAuth');
            if (savedAuth) {
                const { loginTime } = JSON.parse(savedAuth);
                if (new Date().getTime() - loginTime > SESSION_DURATION) {
                    handleAuthChange(null);
                    alert("Twoja sesja wygasła. Zaloguj się ponownie.");
                }
            }
        };

        // Sprawdzaj co np. 1 minutę
        const interval = setInterval(checkSession, 60000);
        return () => clearInterval(interval);
    }, [SESSION_DURATION]);

    // 3. Logika wyboru widoku głównego
    const renderMainView = () => {
        switch (userRole) {
            case 'admin':
                return <Admin />;
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