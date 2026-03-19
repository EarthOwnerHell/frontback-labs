# API Layer (practises7-8/client/src/api)

Этот модуль содержит клиент для работы с backend API (`http://localhost:3000/api`) и централизованную обработку Bearer-токена.

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
- Управление токеном:
  - `setAccessToken(token)`
  - `clearAccessToken()`

## Как работает Bearer-токен

1. При успешном `userLogin` сервер возвращает `accessToken`.
2. Токен сохраняется в `localStorage` (`accessToken`).
3. `axios` interceptor автоматически добавляет заголовок:
   - `Authorization: Bearer <token>`
4. Защищенные endpoint'ы backend (`/auth/me`, `/products/:id`, `PUT`, `DELETE`) начинают работать без ручной передачи токена в каждом запросе.

## Как это используется на фронте

- `RegistrationForm`:
  - регистрация через `api.userRegister(...)`
  - вход через `api.userLogin(...)`
- `App`:
  - проверяет наличие токена в `localStorage`
  - переключает UI между формой входа и страницей товаров
- `ProductPage`:
  - вызывает `api.getMe()` для проверки авторизации
  - использует CRUD-методы товаров
  - при выходе вызывает `api.clearAccessToken()`

## Поведение при истечении токена

Если токен истек (в backend `ACCESS_EXPIRES_IN = "15m"`), защищенные методы вернут `401`.
В текущей реализации это означает необходимость повторного входа.
(Механизм refresh token не реализован.)

## Пример использования

```js
import { api } from "./index";

await api.userLogin({ email, password });
const me = await api.getMe();
const products = await api.getProducts();
```
