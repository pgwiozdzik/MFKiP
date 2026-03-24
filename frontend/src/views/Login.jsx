import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/login.css';

const Login = () => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const passwordInputRef = useRef(null);

    const roleNames = {
        reception: 'Recepcja',
        stage: 'Scena',
        admin: 'Administrator'
    };

    const PASSWORDS = {
        reception: 'recepcja123',
        stage: 'scena123',
        admin: 'admin123'
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setError('');
        setPassword('');
        setTimeout(() => passwordInputRef.current?.focus(), 50);
    };

    const handleLogin = (e) => {
        e.preventDefault();

        if (PASSWORDS[selectedRole] === password) {
            // 1. Zapisujemy rolę
            localStorage.setItem('userRole', selectedRole);

            // 2. Twarde przekierowanie, aby App.jsx przeładował switch(userRole)
            window.location.href = '/';
        } else {
            setError("Błędne hasło dla wybranej roli!");
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <h2 style={{ textAlign: 'center', marginTop: 0 }}>Logowanie</h2>

                {error && <p className="login-error">{error}</p>}

                <div className="role-buttons">
                    <button
                        type="button"
                        className={`btn-role ${selectedRole === 'reception' ? 'active' : ''}`}
                        onClick={() => handleRoleSelect('reception')}
                    >
                        RECEPCJA
                    </button>
                    <button
                        type="button"
                        className={`btn-role ${selectedRole === 'stage' ? 'active' : ''}`}
                        onClick={() => handleRoleSelect('stage')}
                    >
                        SCENA
                    </button>
                    <button
                        type="button"
                        className={`btn-role ${selectedRole === 'admin' ? 'active' : ''}`}
                        onClick={() => handleRoleSelect('admin')}
                    >
                        ADMINISTRATOR
                    </button>
                </div>

                {selectedRole && (
                    <form onSubmit={handleLogin} className="password-section">
                        <div className="form-group">
                            <label style={{ fontWeight: 'bold', fontSize: '0.9em' }}>
                                Hasło ({roleNames[selectedRole]}):
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                ref={passwordInputRef}
                                required
                                autoFocus
                            />
                        </div>
                        <button type="submit" className="btn-submit">ZALOGUJ SIĘ</button>
                    </form>
                )}

                <p className="back-link">
                    <span onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                        &larr; Powrót do podglądu
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Login;