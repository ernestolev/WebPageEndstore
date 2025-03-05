import React, { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
    fetchSignInMethodsForEmail,
    linkWithCredential,
    sendPasswordResetEmail,
    EmailAuthProvider
} from 'firebase/auth';
import {
    doc, setDoc, getDoc, collection,
    query,
    where,
    getDocs,
    arrayUnion
} from 'firebase/firestore';
import { auth, db } from '../Firebase';
import styles from '../styles/LogReg.module.css';
import LoadingSpinner from './LoadingSpinner';

const LogReg = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
    
        try {
            const email = e.target.resetEmail.value;
    
            // Verificar email en Users collection
            const usersRef = collection(db, 'Users');
            const q = query(usersRef, where("email", "==", email));
            const querySnapshot = await getDocs(q);
    
            if (querySnapshot.empty) {
                setError('No existe una cuenta con este email');
                setLoading(false);
                return;
            }
    
            // Configuración del email de reseteo
            const actionCodeSettings = {
                // Reemplaza esto con tu URL real
                url: `${window.location.origin}/reset-password`,
                handleCodeInApp: false // Cambiado a false para usar el flujo web
            };
    
            await sendPasswordResetEmail(auth, email, actionCodeSettings);
            setSuccess('Se ha enviado un enlace de recuperación a tu email');
    
            setTimeout(() => {
                setSuccess('');
                setIsForgotPassword(false);
            }, 3000);
    
        } catch (error) {
            console.error('Password reset error:', error);
            if (error.code === 'auth/too-many-requests') {
                setError('Demasiados intentos. Intenta más tarde');
            } else {
                setError('Error al enviar el email de recuperación');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const email = e.target.email.value;
            const password = e.target.password.value;

            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, 'Users', userCredential.user.uid), {
                lastLogin: new Date().toISOString()
            }, { merge: true });

            onClose();
        } catch (error) {
            console.error('Login error:', error);
            if (error.code === 'auth/invalid-credential') {
                setError('Email o contraseña incorrectos');
            } else if (error.code === 'auth/user-not-found') {
                setError('Usuario no encontrado');
            } else {
                setError('Error al iniciar sesión: ' + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const name = e.target.regName.value;
            const email = e.target.regEmail.value;
            const password = e.target.regPassword.value;

            if (password.length < 6) {
                throw new Error('La contraseña debe tener al menos 6 caracteres');
            }

            const methods = await fetchSignInMethodsForEmail(auth, email);

            if (methods.length > 0) {
                setError(`Este email ya está registrado. Por favor, inicia sesión con el método correspondiente.`);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);

            await setDoc(doc(db, 'Users', userCredential.user.uid), {
                name,
                email,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                providers: ['password']
            });

            await updateProfile(userCredential.user, {
                displayName: name
            });

            onClose();
        } catch (error) {
            console.error('Registration error:', error);
            setError(
                error.code === 'auth/email-already-in-use'
                    ? 'Este email ya está registrado'
                    : error.message
            );
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            {loading && <LoadingSpinner />}

            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>
                    <i className="fas fa-times"></i>
                </button>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <div className={styles.modalContent}>
                    {!isForgotPassword ? (
                        <>
                            <div className={styles.tabs}>
                                <button
                                    className={`${styles.tab} ${isLogin ? styles.active : ''}`}
                                    onClick={() => setIsLogin(true)}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    className={`${styles.tab} ${!isLogin ? styles.active : ''}`}
                                    onClick={() => setIsLogin(false)}
                                >
                                    Registrarse
                                </button>
                            </div>

                            {isLogin ? (
                                <form className={styles.form} onSubmit={handleLogin}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="email">Email</label>
                                        <input
                                            type="email"
                                            id="email"
                                            placeholder="tu@email.com"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="password">Contraseña</label>
                                        <input
                                            type="password"
                                            id="password"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className={styles.forgotPassword}>
                                        <button
                                            type="button"
                                            className={styles.forgotPasswordLink}
                                            onClick={() => setIsForgotPassword(true)}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        className={styles.submitButton}
                                        disabled={loading}
                                    >
                                        {loading ? 'Cargando...' : 'Iniciar Sesión'}
                                    </button>
                                </form>
                            ) : (
                                <form className={styles.form} onSubmit={handleRegister}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="regName">Nombre completo</label>
                                        <input
                                            type="text"
                                            id="regName"
                                            placeholder="Juan Pérez"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="regEmail">Email</label>
                                        <input
                                            type="email"
                                            id="regEmail"
                                            placeholder="tu@email.com"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="regPassword">Contraseña</label>
                                        <input
                                            type="password"
                                            id="regPassword"
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                        />
                                    </div>
                                    <div className={styles.terms}>
                                        <input type="checkbox" id="terms" required />
                                        <label htmlFor="terms">
                                            Acepto los términos y condiciones
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className={styles.submitButton}
                                        disabled={loading}
                                    >
                                        {loading ? 'Cargando...' : 'Crear cuenta'}
                                    </button>
                                </form>
                            )}
                        </>
                    ) : (
                        <div className={styles.forgotPasswordContainer}>
                            <h2>Recuperar Contraseña</h2>
                            <p>Ingresa tu email para recibir un enlace de recuperación</p>

                            <form className={styles.form} onSubmit={handleForgotPassword}>
                                <div className={styles.formGroup}>
                                    <label htmlFor="resetEmail">Email</label>
                                    <input
                                        type="email"
                                        id="resetEmail"
                                        placeholder="tu@email.com"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={styles.submitButton}
                                    disabled={loading}
                                >
                                    {loading ? 'Enviando...' : 'Enviar enlace'}
                                </button>
                                <button
                                    type="button"
                                    className={styles.backButton}
                                    onClick={() => setIsForgotPassword(false)}
                                >
                                    Volver al inicio de sesión
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogReg;