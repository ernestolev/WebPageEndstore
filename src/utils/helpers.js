// filepath: /f1-store/f1-store/src/utils/helpers.js

export const formatPrice = (price) => {
    return `$${price.toFixed(2)}`;
};

export const saveToLocalStorage = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

export const getFromLocalStorage = (key) => {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
};

export const removeFromLocalStorage = (key) => {
    localStorage.removeItem(key);
};