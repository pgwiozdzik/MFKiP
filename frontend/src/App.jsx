import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Overview from './views/Overview';
import Login from './views/Login';
import Stage from './views/Stage';         // Zaimportuj, gdy stworzysz plik
import Reception from './views/Reception'; // Zaimportuj, gdy stworzysz plik

function App() {
    // Funkcja decydująca, który widok pokazać na stronie głównej
    const renderMainView = () => {
        const userRole = localStorage.getItem('userRole');

        switch (userRole) {
            case 'admin':
                // Admin może widzieć np. panel Sceny z dodatkowymi opcjami
                return <Stage />;
            case 'stage':
                return <Stage />;
            case 'reception':
                return <Reception />;
            default:
                // Brak roli = zwykły podgląd dla widzów
                return <Overview />;
        }
    };

    return (
        <Router>
            <div className="App">
                <Header />
                <Routes>
                    {/* Główny punkt wejścia - dynamiczny */}
                    <Route path="/" element={renderMainView()} />

                    {/* Widok logowania pozostaje osobno */}
                    <Route path="/login" element={<Login />} />

                    {/* Przekierowanie dla nieznanych ścieżek z powrotem na "/" */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;