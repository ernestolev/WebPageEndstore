import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import {
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential
} from 'firebase/auth';
import { db } from '../Firebase';
import styles from '../styles/Profile.module.css';
import AnnouncementBar from '../components/AnnouncementBar';


const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: ''
    });
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        isDefault: false
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const docRef = doc(db, 'Users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserData(data);
                        setFormData({
                            name: data.name || '',
                            phone: data.phone || ''
                        });
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [user]);

    const handleUpdateProfile = async () => {
        if (!formData.name.trim()) {
            setError('El nombre es requerido');
            return;
        }

        try {
            setError('');
            const docRef = doc(db, 'Users', user.uid);
            await updateDoc(docRef, formData);
            setUserData({ ...userData, ...formData });
            setIsEditing(false);
            setSuccess('Perfil actualizado exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Error al actualizar el perfil');
        }
    };

    const handleAddAddress = async () => {
        // Validate address fields
        if (!newAddress.street.trim() || !newAddress.city.trim() ||
            !newAddress.state.trim() || !newAddress.zipCode.trim()) {
            setError('Todos los campos de la dirección son requeridos');
            return;
        }

        try {
            setError('');
            const docRef = doc(db, 'Users', user.uid);
            const address = {
                ...newAddress,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            };

            // If this is the first address, make it default
            const shouldBeDefault = newAddress.isDefault || !userData.addresses?.length;

            if (shouldBeDefault) {
                const updatedAddresses = userData.addresses?.map(addr => ({
                    ...addr,
                    isDefault: false
                })) || [];
                await updateDoc(docRef, {
                    addresses: [...updatedAddresses, { ...address, isDefault: true }]
                });
            } else {
                await updateDoc(docRef, {
                    addresses: arrayUnion(address)
                });
            }

            // Update local state
            setUserData({
                ...userData,
                addresses: [
                    ...(userData.addresses || []).map(addr => ({
                        ...addr,
                        isDefault: shouldBeDefault ? false : addr.isDefault
                    })),
                    { ...address, isDefault: shouldBeDefault }
                ]
            });

            // Reset form
            setNewAddress({
                street: '',
                city: '',
                state: '',
                zipCode: '',
                isDefault: false
            });
            setSuccess('Dirección agregada exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Error al agregar la dirección');
        }
    };

    const handleRemoveAddress = async (addressId) => {
        try {
            setError('');
            const address = userData.addresses.find(addr => addr.id === addressId);
            if (!address) return;

            const docRef = doc(db, 'Users', user.uid);
            const updatedAddresses = userData.addresses.filter(addr => addr.id !== addressId);

            // If we're removing the default address, make the first remaining address default
            if (address.isDefault && updatedAddresses.length > 0) {
                updatedAddresses[0].isDefault = true;
            }

            await updateDoc(docRef, { addresses: updatedAddresses });
            setUserData({ ...userData, addresses: updatedAddresses });
            setSuccess('Dirección eliminada exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            setError('Error al eliminar la dirección');
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        try {
            const updatedAddresses = userData.addresses.map(addr => ({
                ...addr,
                isDefault: addr.id === addressId
            }));
            const docRef = doc(db, 'Users', user.uid);
            await updateDoc(docRef, { addresses: updatedAddresses });
            setUserData({ ...userData, addresses: updatedAddresses });
            setSuccess('Dirección predeterminada actualizada');
        } catch (error) {
            setError('Error al actualizar la dirección predeterminada');
        }
    };

    const handleChangePassword = async () => {
        // Validate password fields
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setError('Todos los campos son requeridos');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('Las contraseñas nuevas no coinciden');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        try {
            setError('');
            // Reauthenticate user
            const credential = EmailAuthProvider.credential(
                user.email,
                passwordData.currentPassword
            );
            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, passwordData.newPassword);

            // Reset form
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            setSuccess('Contraseña actualizada exitosamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                setError('La contraseña actual es incorrecta');
            } else {
                setError('Error al actualizar la contraseña');
            }
        }
    };

    if (loading) {
        return <div className={styles.loading}>Cargando...</div>;
    }

    return (
        <>
            <AnnouncementBar />
            <div className={styles.profilePage}>
                <div className={styles.container}>
                    <div className={styles.sidebar}>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'profile' ? styles.active : ''}`}
                            onClick={() => setActiveTab('profile')}
                        >
                            <i className="fas fa-user"></i>
                            Perfil
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'addresses' ? styles.active : ''}`}
                            onClick={() => setActiveTab('addresses')}
                        >
                            <i className="fas fa-map-marker-alt"></i>
                            Direcciones
                        </button>
                        <button
                            className={`${styles.tabButton} ${activeTab === 'security' ? styles.active : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="fas fa-lock"></i>
                            Seguridad
                        </button>
                    </div>

                    <div className={styles.content}>
                        {error && <div className={styles.error}>{error}</div>}
                        {success && <div className={styles.success}>{success}</div>}

                        {activeTab === 'profile' && (
                            <div className={styles.profileSection}>
                                <h2>Información Personal</h2>
                                <div className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Nombre</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                name: e.target.value
                                            })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={user.email}
                                            disabled
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Teléfono</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                phone: e.target.value
                                            })}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    {isEditing ? (
                                        <div className={styles.buttonGroup}>
                                            <button
                                                className={styles.saveButton}
                                                onClick={handleUpdateProfile}
                                            >
                                                Guardar Cambios
                                            </button>
                                            <button
                                                className={styles.cancelButton}
                                                onClick={() => setIsEditing(false)}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className={styles.editButton}
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Editar Perfil
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div className={styles.addressesSection}>
                                <h2>Mis Direcciones</h2>
                                <div className={styles.addressList}>
                                    {userData.addresses?.map((address) => (
                                        <div key={address.id} className={styles.addressCard}>
                                            <div className={styles.addressInfo}>
                                                <p>{address.street}</p>
                                                <p>{address.city}, {address.state} {address.zipCode}</p>
                                                {address.isDefault && (
                                                    <span className={styles.defaultBadge}>
                                                        Predeterminada
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.addressActions}>
                                                {!address.isDefault && (
                                                    <button
                                                        onClick={() => handleSetDefaultAddress(address.id)}
                                                        className={styles.setDefaultButton}
                                                    >
                                                        Establecer como predeterminada
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleRemoveAddress(address.id)}
                                                    className={styles.removeButton}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <h3>Agregar Nueva Dirección</h3>
                                <div className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Calle</label>
                                        <input
                                            type="text"
                                            value={newAddress.street}
                                            onChange={(e) => setNewAddress({
                                                ...newAddress,
                                                street: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <label>Ciudad</label>
                                            <input
                                                type="text"
                                                value={newAddress.city}
                                                onChange={(e) => setNewAddress({
                                                    ...newAddress,
                                                    city: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Estado/Provincia</label>
                                            <input
                                                type="text"
                                                value={newAddress.state}
                                                onChange={(e) => setNewAddress({
                                                    ...newAddress,
                                                    state: e.target.value
                                                })}
                                            />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label>Código Postal</label>
                                            <input
                                                type="text"
                                                value={newAddress.zipCode}
                                                onChange={(e) => setNewAddress({
                                                    ...newAddress,
                                                    zipCode: e.target.value
                                                })}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.checkbox}>
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            checked={newAddress.isDefault}
                                            onChange={(e) => setNewAddress({
                                                ...newAddress,
                                                isDefault: e.target.checked
                                            })}
                                        />
                                        <label htmlFor="isDefault">
                                            Establecer como dirección predeterminada
                                        </label>
                                    </div>
                                    <button
                                        className={styles.addButton}
                                        onClick={handleAddAddress}
                                    >
                                        Agregar Dirección
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className={styles.securitySection}>
                                <h2>Cambiar Contraseña</h2>
                                <div className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label>Contraseña Actual</label>
                                        <input
                                            type="password"
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({
                                                ...passwordData,
                                                currentPassword: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({
                                                ...passwordData,
                                                newPassword: e.target.value
                                            })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Confirmar Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({
                                                ...passwordData,
                                                confirmPassword: e.target.value
                                            })}
                                        />
                                    </div>
                                    <button
                                        className={styles.changePasswordButton}
                                        onClick={handleChangePassword}
                                    >
                                        Actualizar Contraseña
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;