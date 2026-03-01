import { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import { api } from "../api";
import "./MainPage.scss";

export default function MainPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      console.error(err);
      alert("Ошибка загрузки товаров");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingProduct(null);
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setModalMode("edit");
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Удалить товар?");
    if (!ok) return;

    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      alert("Ошибка удаления товара");
    }
  };

  const handleSubmitModal = async (payload) => {
    try {
      if (modalMode === "create") {
        const newProduct = await api.createProduct(payload);
        setProducts((prev) => [newProduct, ...prev]);
      } else {
        const updatedProduct = await api.updateProduct(payload.id, payload);
        setProducts((prev) =>
          prev.map((p) => (p.id === payload.id ? updatedProduct : p)),
        );
      }
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Ошибка сохранения товара");
    }
  };

  return (
    <div className="page">
      <header className="header">
        <span className="logo">SNEAKERS SHOP</span>
      </header>

      <button className="adm_add" onClick={openCreate}>
        Добавить
      </button>

      <main className="page_container">
        <div className="product__cards">
          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : products.length === 0 ? (
            <div className="empty">Товаров пока нет</div>
          ) : (
            products.map((item) => (
              <ProductCard
                key={item.id}
                {...item}
                onEdit={openEdit}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>
      </main>

      {modalOpen ? (
        <ProductModal
          key={`${modalMode}-${editingProduct?.id ?? "new"}`}
          mode={modalMode}
          product={editingProduct}
          onClose={closeModal}
          onSubmit={handleSubmitModal}
        />
      ) : null}
    </div>
  );
}
