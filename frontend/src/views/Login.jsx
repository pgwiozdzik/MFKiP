import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../api/apiService.js';
import '../assets/styles/login.css';

const Login = ({ onLogin }) => {
    const [selectedRole, setSelectedRole] = useState(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Blokada przycisku podczas ładowania
    const navigate = useNavigate();
    const passwordInputRef = useRef(null);

    const roleNames = {
        reception: 'Recepcja',
        stage: 'Scena',
        admin: 'Administrator'
    };

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setError('');
        setPassword('');
        setTimeout(() => passwordInputRef.current?.focus(), 50);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await apiService.login(selectedRole, password);

            onLogin(selectedRole);
            navigate('/');
        } catch (err) {
            setError("Błędne hasło dla wybranej roli!");
            setPassword('');
            passwordInputRef.current?.focus();
        } finally {
            setIsLoading(false);
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

                <form
                    onSubmit={handleLogin}
                    className={`password-section ${selectedRole ? 'visible' : ''}`}
                >
                    <div className="form-group">
                        <label>Hasło ({selectedRole ? roleNames[selectedRole] : ''}):</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            ref={passwordInputRef}
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="btn btn-submit" disabled={isLoading}>
                        {isLoading ? 'LOGOWANIE...' : 'ZALOGUJ SIĘ'}
                    </button>
                </form>

                <p className="back-link">
                    <span onClick={() => navigate('/')}>&larr; Powrót do podglądu</span>
                </p>
            </div>
        </div>
    );
};

export default Login;