import { useEffect, useMemo, useState } from "react";
import { api } from "../api/index";
import "./ProductPage.css";

function normalizeError(error) {
  const serverMessage = error?.response?.data?.error;
  if (serverMessage) return serverMessage;
  if (error?.message) return error.message;
  return "Ошибка запроса";
}

const emptyProductForm = {
  title: "",
  category: "",
  description: "",
  price: "",
};

function ProductPage({ onLogout }) {
  const [products, setProducts] = useState([]);
  const [me, setMe] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [createForm, setCreateForm] = useState(emptyProductForm);
  const [updateForm, setUpdateForm] = useState(emptyProductForm);

  const [lookupId, setLookupId] = useState("");
  const [updateId, setUpdateId] = useState("");
  const [deleteId, setDeleteId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const accessToken = localStorage.getItem("accessToken") || "";

  const tokenPreview = useMemo(() => {
    if (!accessToken) return "Токен не найден";
    if (accessToken.length < 24) return accessToken;
    return `${accessToken.slice(0, 18)}...${accessToken.slice(-8)}`;
  }, [accessToken]);

  const runAction = async (fn, successMessage) => {
    setErrorText("");
    setSuccessText("");
    setIsLoading(true);
    try {
      await fn();
      if (successMessage) setSuccessText(successMessage);
    } catch (error) {
      setErrorText(normalizeError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    const response = await api.getProducts();
    setProducts(response);
  };

  useEffect(() => {
    runAction(loadProducts);
  }, []);

  const updateField = (setter, field) => (event) => {
    setter((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleGetMe = () => {
    runAction(async () => {
      const response = await api.getMe();
      setMe(response);
    }, "Профиль загружен");
  };

  const handleGetById = () => {
    if (!lookupId.trim()) {
      setErrorText("Введи id товара");
      return;
    }

    runAction(async () => {
      const product = await api.getProductById(lookupId.trim());
      setSelectedProduct(product);
    }, "Товар найден");
  };

  const handleCreate = (event) => {
    event.preventDefault();

    if (
      !createForm.title ||
      !createForm.category ||
      !createForm.description ||
      !createForm.price
    ) {
      setErrorText("Для создания товара заполни все поля");
      return;
    }

    runAction(async () => {
      await api.addProduct({
        ...createForm,
        price: Number(createForm.price),
      });
      setCreateForm(emptyProductForm);
      await loadProducts();
    }, "Товар создан");
  };

  const handleUpdate = (event) => {
    event.preventDefault();

    if (!updateId.trim()) {
      setErrorText("Укажи id товара для обновления");
      return;
    }

    const payload = {};
    if (updateForm.title.trim()) payload.title = updateForm.title.trim();
    if (updateForm.category.trim())
      payload.category = updateForm.category.trim();
    if (updateForm.description.trim())
      payload.description = updateForm.description.trim();
    if (updateForm.price !== "") payload.price = Number(updateForm.price);

    if (Object.keys(payload).length === 0) {
      setErrorText("Заполни хотя бы одно поле для обновления");
      return;
    }

    runAction(async () => {
      const updated = await api.editProductById(updateId.trim(), payload);
      setSelectedProduct(updated);
      setUpdateForm(emptyProductForm);
      await loadProducts();
    }, "Товар обновлен");
  };

  const handleDelete = () => {
    if (!deleteId.trim()) {
      setErrorText("Укажи id товара для удаления");
      return;
    }

    runAction(async () => {
      await api.deleteProductById(deleteId.trim());
      if (selectedProduct?.id === deleteId.trim()) {
        setSelectedProduct(null);
      }
      setDeleteId("");
      await loadProducts();
    }, "Товар удален");
  };

  return (
    <section className="products-page">
      <header className="products-header">
        <div>
          <h1>Product Control</h1>
        </div>
        <button type="button" className="danger-btn" onClick={onLogout}>
          Выйти
        </button>
      </header>

      <div className="token-card">
        <p className="token-card__title">Access Token</p>
        <code>{tokenPreview}</code>
      </div>

      <div className="products-grid">
        <article className="panel">
          <h2>Проверка /auth/me</h2>
          <button type="button" onClick={handleGetMe} disabled={isLoading}>
            Запросить профиль
          </button>
          {me ? (
            <pre>{JSON.stringify(me, null, 2)}</pre>
          ) : (
            <p className="hint">Нажми кнопку для проверки Bearer токена.</p>
          )}
        </article>

        <article className="panel">
          <h2>Получить товар по id (Bearer)</h2>
          <label>
            ID товара
            <input
              value={lookupId}
              onChange={(e) => setLookupId(e.target.value)}
              placeholder="например: a1b2c3"
            />
          </label>
          <button type="button" onClick={handleGetById} disabled={isLoading}>
            Найти
          </button>
          {selectedProduct ? (
            <pre>{JSON.stringify(selectedProduct, null, 2)}</pre>
          ) : null}
        </article>

        <article className="panel">
          <h2>Создать товар</h2>
          <form onSubmit={handleCreate}>
            <input
              placeholder="Название"
              value={createForm.title}
              onChange={updateField(setCreateForm, "title")}
            />
            <input
              placeholder="Категория"
              value={createForm.category}
              onChange={updateField(setCreateForm, "category")}
            />
            <input
              placeholder="Описание"
              value={createForm.description}
              onChange={updateField(setCreateForm, "description")}
            />
            <input
              placeholder="Цена"
              type="number"
              min="0"
              value={createForm.price}
              onChange={updateField(setCreateForm, "price")}
            />
            <button type="submit" disabled={isLoading}>
              Создать
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Обновить товар по id (Bearer)</h2>
          <form onSubmit={handleUpdate}>
            <input
              placeholder="ID товара"
              value={updateId}
              onChange={(e) => setUpdateId(e.target.value)}
            />
            <input
              placeholder="Новое название"
              value={updateForm.title}
              onChange={updateField(setUpdateForm, "title")}
            />
            <input
              placeholder="Новая категория"
              value={updateForm.category}
              onChange={updateField(setUpdateForm, "category")}
            />
            <input
              placeholder="Новое описание"
              value={updateForm.description}
              onChange={updateField(setUpdateForm, "description")}
            />
            <input
              placeholder="Новая цена"
              type="number"
              min="0"
              value={updateForm.price}
              onChange={updateField(setUpdateForm, "price")}
            />
            <button type="submit" disabled={isLoading}>
              Обновить
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Удалить товар по id (Bearer)</h2>
          <label>
            ID товара
            <input
              value={deleteId}
              onChange={(e) => setDeleteId(e.target.value)}
              placeholder="например: a1b2c3"
            />
          </label>
          <button
            type="button"
            className="danger-btn"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Удалить
          </button>
        </article>

        <article className="panel panel--wide">
          <div className="panel-head">
            <h2>Все товары</h2>
            <button
              type="button"
              onClick={() => runAction(loadProducts, "Список обновлен")}
              disabled={isLoading}
            >
              Обновить список
            </button>
          </div>
          {products.length ? (
            <pre>{JSON.stringify(products, null, 2)}</pre>
          ) : (
            <p className="hint">Пока нет товаров.</p>
          )}
        </article>
      </div>

      {errorText ? <p className="status status--error">{errorText}</p> : null}
      {successText ? <p className="status status--ok">{successText}</p> : null}
    </section>
  );
}

export default ProductPage;
