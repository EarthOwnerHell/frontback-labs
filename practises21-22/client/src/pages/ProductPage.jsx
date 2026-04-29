import { useEffect, useMemo, useState } from "react";
import { api } from "../api/index";
import { NavLink } from "react-router-dom";
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
function ProductPage({ isAuthorized, onLogout, onLogin }) {
  const [products, setProducts] = useState([]);
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [createForm, setCreateForm] = useState(emptyProductForm);
  const [updateForm, setUpdateForm] = useState(emptyProductForm);
  const [userUpdateForm, setUserUpdateForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "",
  });

  const [userLookupId, setUserLookupId] = useState("");
  const [userUpdateId, setUserUpdateId] = useState("");
  const [userDeleteId, setUserDeleteId] = useState("");
  const [productLookupId, setProductLookupId] = useState("");
  const [updateId, setUpdateId] = useState("");
  const [deleteId, setDeleteId] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const accessToken = localStorage.getItem("accessToken") || "";
  const refreshToken = localStorage.getItem("refreshToken") || "";

  const accessTokenPreview = useMemo(() => {
    if (!accessToken) return "Токен не найден";
    if (accessToken.length < 24) return accessToken;
    return `${accessToken.slice(0, 18)}...${accessToken.slice(-8)}`;
  }, [accessToken]);

  const refreshTokenPreview = useMemo(() => {
    if (!refreshToken) return "Токен не найден";
    return refreshToken;
  }, [refreshToken]);

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
    const loadInitialProducts = async () => {
      setIsInitialLoading(true);
      setErrorText("");

      try {
        await loadProducts();
      } catch (error) {
        setErrorText(normalizeError(error));
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialProducts();
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

  const handleRefresh = () => {
    runAction(async () => {
      const response = await api.refreshAccessToken();
    }, "Токен обновлен");
  };

  const handleGetById = () => {
    if (!productLookupId.trim()) {
      setErrorText("Введи id товара");
      return;
    }

    runAction(async () => {
      const product = await api.getProductById(productLookupId.trim());
      setSelectedProduct(product);
    }, "Товар найден");
  };

  const handleGetUsers = () => {
    runAction(async () => {
      const response = await api.getUsers();
      setUsers(response);
    });
  };

  const handleGetUserById = () => {
    if (!userLookupId.trim()) {
      setErrorText("Введи id пользователя");
      return;
    }
    runAction(async () => {
      const response = await api.getUserById(userLookupId.trim());
      setSelectedUser(response);
    });
  };

  const handleUpdateUserById = (event) => {
    event.preventDefault();

    if (!userUpdateId.trim()) {
      setErrorText("Укажи id пользователя для обновления");
      return;
    }

    const payload = {};
    if (userUpdateForm.email.trim())
      payload.email = userUpdateForm.email.trim();
    if (userUpdateForm.first_name.trim())
      payload.first_name = userUpdateForm.first_name.trim();
    if (userUpdateForm.last_name.trim())
      payload.last_name = userUpdateForm.last_name.trim();
    if (userUpdateForm.password) payload.password = userUpdateForm.password;
    if (userUpdateForm.role.trim()) payload.role = userUpdateForm.role.trim();

    if (Object.keys(payload).length === 0) {
      setErrorText("Заполни хотя бы одно поле для обновления");
      return;
    }

    runAction(async () => {
      const response = await api.editUserById(userUpdateId.trim(), payload);
      setSelectedUser(response);
      setUserUpdateForm({
        email: "",
        first_name: "",
        last_name: "",
        password: "",
        role: "",
      });
    }, "Пользователь обновлен");
  };

  const handleDeleteUserById = () => {
    if (!userDeleteId.trim()) {
      setErrorText("Укажи id пользователя для удаления");
      return;
    }
    runAction(async () => {
      await api.deleteUserById(userDeleteId.trim());
      if (selectedUser?.id === userDeleteId.trim()) {
        setSelectedUser(null);
      }
      setUserDeleteId("");
    }, "Пользователь заблокирован");
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
        {isAuthorized ? (
          <button type="button" className="danger-btn" onClick={onLogout}>
            Выйти
          </button>
        ) : (
          <NavLink to="/register">
            <button className="primary-btn" type="button">
              Войти
            </button>
          </NavLink>
        )}
      </header>

      <div className="token-card">
        <p className="token-card__title">Access Token</p>
        <code>{accessTokenPreview}</code>
      </div>

      <div className="token-card">
        <p className="token-card__title">Refresh Token</p>
        <code>{refreshTokenPreview}</code>
      </div>
      <button type="button" onClick={handleRefresh}>
        Refresh
      </button>

      <div className="products-grid">
        <article className="panel">
          <h2>Получить список пользователей</h2>

          <button type="button" onClick={handleGetUsers}>
            Получить
          </button>

          {users.length ? <pre>{JSON.stringify(users, null, 2)}</pre> : ""}
        </article>
        <article className="panel">
          <h2>Получить пользователя по ID</h2>
          <label>
            ID пользователя
            <input
              value={userLookupId}
              onChange={(e) => setUserLookupId(e.target.value)}
              placeholder="например: a1b2c3"
            />
          </label>
          <button
            type="button"
            onClick={handleGetUserById}
          >
            Получить
          </button>

          {selectedUser ? (
            <pre>{JSON.stringify(selectedUser, null, 2)}</pre>
          ) : (
            ""
          )}
        </article>
        <article className="panel">
          <h2>Удаление пользователя по ID</h2>
          <label>
            ID пользователя
            <input
              value={userDeleteId}
              onChange={(e) => setUserDeleteId(e.target.value)}
              placeholder="например: a1b2c3"
            />
          </label>
          <button
            type="button"
            className="danger-btn"
            onClick={handleDeleteUserById}
          >
            Удалить
          </button>
        </article>
        <article className="panel">
          <h2>Обновить пользователя по ID</h2>
          <form onSubmit={handleUpdateUserById}>
            <input
              placeholder="ID пользователя"
              value={userUpdateId}
              onChange={(e) => setUserUpdateId(e.target.value)}
            />
            <input
              placeholder="Email"
              value={userUpdateForm.email}
              onChange={updateField(setUserUpdateForm, "email")}
            />
            <input
              placeholder="Имя"
              value={userUpdateForm.first_name}
              onChange={updateField(setUserUpdateForm, "first_name")}
            />
            <input
              placeholder="Фамилия"
              value={userUpdateForm.last_name}
              onChange={updateField(setUserUpdateForm, "last_name")}
            />
            <input
              placeholder="Пароль"
              type="password"
              value={userUpdateForm.password}
              onChange={updateField(setUserUpdateForm, "password")}
            />
            <input
              placeholder="Роль (user/seller/admin)"
              value={userUpdateForm.role}
              onChange={updateField(setUserUpdateForm, "role")}
            />
            <button type="submit">
              Обновить
            </button>
          </form>
        </article>
        <article className="panel">
          <h2>Проверка /auth/me</h2>
          <button type="button" onClick={handleGetMe}>
            Запросить профиль
          </button>
          {me ? <pre>{JSON.stringify(me, null, 2)}</pre> : ""}
        </article>

        <article className="panel">
          <h2>Получить товар по id (Bearer)</h2>
          <label>
            ID товара
            <input
              value={productLookupId}
              onChange={(e) => setProductLookupId(e.target.value)}
              placeholder="например: a1b2c3"
            />
          </label>
          <button type="button" onClick={handleGetById}>
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
            <button type="submit">
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
            <button type="submit">
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
            >
              Обновить список
            </button>
          </div>
          {isInitialLoading ? <p className="hint">Загрузка списка...</p> : null}
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
