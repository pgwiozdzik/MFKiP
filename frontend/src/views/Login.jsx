import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/login.css';

const Login = ({ onLogin }) => {
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
        reception: 'a',
        stage: 'a',
        admin: 'a'
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
            // Wywołujemy funkcję przekazaną w propsach zamiast window.location.href
            onLogin(selectedRole);
            navigate('/');
        } else {
            setError("Błędne hasło dla wybranej roli!");
        }
    };

    return (
        <div className="login-page">
            <div className="login-box">
                <h2>Logowanie</h2>

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
                            <label>Hasło ({roleNames[selectedRole]}):</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                ref={passwordInputRef}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-submit">ZALOGUJ SIĘ</button>
                    </form>
                )}

                <p className="back-link">
                    <span onClick={() => navigate('/')}>&larr; Powrót do podglądu</span>
                </p>
            </div>
        </div>
    );
};

export default Login;