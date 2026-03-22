# API Layer (practises9-10/client/src/api)

Этот модуль содержит клиент для работы с backend API (`http://localhost:3000/api`) и централизованную обработку access/refresh токенов.

## Что реализовано

- `axios`-клиент с `baseURL`
- Методы авторизации:
- `userRegister(user)`
- `userLogin(user)`
- `getMe()`
- Методы для товаров:
- `getProducts()`
- `addProduct(product)`
- `getProductById(id)`
- `editProductById(id, product)`
- `deleteProductById(id)`
- Управление токенами:
- `setAccessToken(token)`
- `clearAccessToken()`
- `setRefreshToken(token)`
- `refreshAccessToken()`

## Как работает access-токен

1. При успешном `userLogin` сервер возвращает `accessToken` и `refreshToken`.
2. Оба токена сохраняются в `localStorage` (`accessToken`, `refreshToken`).
3. `axios` request interceptor автоматически добавляет заголовок:
- `Authorization: Bearer <token>`
4. Защищенные endpoint'ы backend (`/auth/me`, `/products/:id`, `PUT`, `DELETE`) работают без ручной передачи токена в каждом запросе.

## Как работает refresh-токен

1. Если защищенный запрос возвращает `401`, response interceptor запускает refresh.
2. Выполняется `POST /auth/refresh` с `refreshToken`.
3. Если refresh успешен, обновляются оба токена в `localStorage`.
4. Исходный запрос повторяется.
5. Если refresh невалиден или истек, токены очищаются, запрос отклоняется.

## Как это используется на фронте

- `RegistrationForm`:
- регистрация через `api.userRegister(...)`
- вход через `api.userLogin(...)`
- `App`:
- проверяет наличие токенов в `localStorage`
- переключает UI между формой входа и страницей товаров
- `ProductPage`:
- вызывает `api.getMe()` для проверки авторизации
- использует CRUD-методы товаров
- показывает текущие access/refresh токены
- при выходе очищает токены

## Пример использования

```js
import { api } from "./index";

await api.userLogin({ email, password });
const me = await api.getMe();
const products = await api.getProducts();
```
