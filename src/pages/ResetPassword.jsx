import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../Firebase';
import styles from '../styles/ResetPassword.module.css';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const oobCode = new URLSearchParams(location.search).get('oobCode');
        if (oobCode) {
            verifyPasswordResetCode(auth, oobCode)
                .then(email => setEmail(email))
                .catch(() => {
                    setError('El enlace ha expirado o no es válido');
                });
        }
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const oobCode = new URLSearchParams(location.search).get('oobCode');
            await confirmPasswordReset(auth, oobCode, newPassword);
            navigate('/login', { 
                state: { message: 'Contraseña actualizada exitosamente' } 
            });
        } catch (error) {
            setError('Error al restablecer la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.resetContainer}>
            <div className={styles.resetCard}>
                <h2>Restablecer Contraseña</h2>
                {email && <p>Para: {email}</p>}
                
                {error ? (
                    <div className={styles.error}>{error}</div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label>Nueva contraseña</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Confirmar contraseña</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Repite la contraseña"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className={styles.submitButton}
                            disabled={loading}
                        >
                            {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;