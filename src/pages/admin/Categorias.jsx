import React, { useState } from 'react';
import styles from '../../styles/Admin.module.css';
import CategoryList from '../../components/CategoryList';
import CategoryForm from '../../components/CategoryForm';

const Categorias = () => {
  const [isCategoryFormOpen, setCategoryFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);

  const handleEdit = (category) => {
    setEditCategory(category);
    setCategoryFormOpen(true);
  };

  return (
    <>
      <header className={styles.contentHeader}>
        <h1>Categorías</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.addButton}
            onClick={() => setCategoryFormOpen(true)}
          >
            <i className="fas fa-plus"></i>
            Nueva Categoría
          </button>
        </div>
      </header>
      
      <CategoryList onEdit={handleEdit} />
      
      <CategoryForm
        isOpen={isCategoryFormOpen}
        onClose={() => {
          setCategoryFormOpen(false);
          setEditCategory(null);
        }}
        editCategory={editCategory}
      />
    </>
  );
};

export default Categorias;