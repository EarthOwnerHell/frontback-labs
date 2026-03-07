import { useMemo, useState } from "react";
import "./RegistrationForm.css";
import { api } from "../api/index";

const MODE = {
  LOGIN: "login",
  REGISTER: "register",
};

function normalizeError(error) {
  if (!error) return "Что-то пошло не так. Попробуйте ещё раз.";
  if (typeof error === "string") return error;
  if (error?.message) return error.message;
  return "Что-то пошло не так. Попробуйте ещё раз.";
}

function RegistrationForm({
  isLoading = false,
  title = "Добро пожаловать",
  onAuthSuccess,
}) {
  const [mode, setMode] = useState(MODE.LOGIN);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [errorText, setErrorText] = useState("");
  const [successText, setSuccessText] = useState("");

  const isRegisterMode = mode === MODE.REGISTER;

  const submitLabel = useMemo(
    () => (isRegisterMode ? "Создать аккаунт" : "Войти в аккаунт"),
    [isRegisterMode],
  );

  const subtitle = useMemo(
    () =>
      isRegisterMode
        ? "Создай профиль, чтобы начать работу с сервисом."
        : "Войди в аккаунт, чтобы продолжить.",
    [isRegisterMode],
  );

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errorText) setErrorText("");
  };

  const handleSwitchMode = (nextMode) => {
    setMode(nextMode);
    setErrorText("");
    setSuccessText("");
  };

  const validate = () => {
    if (!form.email || !form.password) {
      return "Email и пароль обязательны.";
    }
    if (isRegisterMode && (!form.first_name || !form.last_name)) {
      return "Для регистрации укажи имя и фамилию.";
    }
    if (form.password.length < 6) {
      return "Пароль должен быть не короче 6 символов.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorText("");
    setSuccessText("");

    const validationError = validate();
    if (validationError) {
      setErrorText(validationError);
      return;
    }

    const payload = isRegisterMode
      ? {
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          email: form.email.trim(),
          password: form.password,
        }
      : {
          email: form.email.trim(),
          password: form.password,
        };

    try {
      if (isRegisterMode) {
        await api.userRegister(payload);
        setSuccessText("Аккаунт создан. Теперь можно войти.");
        setMode(MODE.LOGIN);
      } else {
        await api.userLogin(payload);
        setSuccessText("Вход выполнен успешно.");
        if (typeof onAuthSuccess === "function") {
          onAuthSuccess();
        }
      }
    } catch (error) {
      setErrorText(normalizeError(error));
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-glow auth-glow--one" />
      <div className="auth-glow auth-glow--two" />

      <article className="auth-card">
        <span className="auth-badge">Account Access</span>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>

        <div
          className="auth-tabs"
          role="tablist"
          aria-label="Переключение режима"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isRegisterMode}
            className={`auth-tab ${!isRegisterMode ? "auth-tab--active" : ""}`}
            onClick={() => handleSwitchMode(MODE.LOGIN)}
          >
            Войти
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isRegisterMode}
            className={`auth-tab ${isRegisterMode ? "auth-tab--active" : ""}`}
            onClick={() => handleSwitchMode(MODE.REGISTER)}
          >
            Зарегистрироваться
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isRegisterMode && (
            <>
              <label htmlFor="first_name">
                Имя
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Иван"
                  value={form.first_name}
                  onChange={updateField("first_name")}
                />
              </label>

              <label htmlFor="last_name">
                Фамилия
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  autoComplete="family-name"
                  placeholder="Иванов"
                  value={form.last_name}
                  onChange={updateField("last_name")}
                />
              </label>
            </>
          )}

          <label htmlFor="email">
            Email
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={updateField("email")}
            />
          </label>

          <label htmlFor="password">
            Пароль
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={
                isRegisterMode ? "new-password" : "current-password"
              }
              placeholder="Минимум 6 символов"
              value={form.password}
              onChange={updateField("password")}
            />
          </label>

          <button className="auth-submit" type="submit" disabled={isLoading}>
            {isLoading ? "Загрузка..." : submitLabel}
          </button>
        </form>

        {errorText ? (
          <p className="auth-error" role="alert">
            {errorText}
          </p>
        ) : null}
        {successText ? <p className="auth-message">{successText}</p> : null}
      </article>
    </section>
  );
}

export default RegistrationForm;
