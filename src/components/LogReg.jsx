import React, { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
    fetchSignInMethodsForEmail,
    linkWithCredential,
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
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const email = e.target.email.value;
            const password = e.target.password.value;

            // First try to sign in
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Then update the user document
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

            // Check if email exists with different provider
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
                providers: ['password'], // Add this to track auth method
                originalPassword: password // Store for reference
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

    const handleSocialLogin = async (provider) => {
        setError('');
        setLoading(true);

        try {
            const result = await signInWithPopup(auth, provider);
            const { user } = result;

            // Query Firestore to find existing user by email
            const usersRef = collection(db, 'Users');
            const q = query(usersRef, where("email", "==", user.email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // User exists with this email - preserve original data
                const existingUserDoc = querySnapshot.docs[0];
                const existingUserData = existingUserDoc.data();

                // Only update lastLogin and add provider to the list
                await setDoc(doc(db, 'Users', existingUserDoc.id), {
                    lastLogin: new Date().toISOString(),
                    providers: arrayUnion(provider.providerId)
                }, { merge: true });

                // Update auth profile to maintain original name
                await updateProfile(user, {
                    displayName: existingUserData.name // Keep original name
                });

            } else {
                // New user, create full profile
                await setDoc(doc(db, 'Users', user.uid), {
                    name: user.displayName,
                    email: user.email,
                    photoURL: user.photoURL,
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    providers: [provider.providerId]
                });
            }

            onClose();
        } catch (error) {
            console.error('Social login error:', error);
            if (error.code === 'auth/account-exists-with-different-credential') {
                const email = error.customData?.email;
                if (email) {
                    const methods = await fetchSignInMethodsForEmail(auth, email);
                    setError(`Este email ya está registrado. Por favor, usa ${methods[0]} para iniciar sesión.`);
                }
            } else {
                setError('Error con inicio de sesión social: ' + error.message);
            }
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

                <div className={styles.modalContent}>
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
                                <a href="#">¿Olvidaste tu contraseña?</a>
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
                                    placeholder="Contraseña"
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
                </div>
            </div>
        </div>
    );
};

export default LogReg;