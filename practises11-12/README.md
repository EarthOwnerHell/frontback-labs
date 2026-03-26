# Practises 11–12

Мини‑проект: авторизация с access/refresh токенами, роли пользователей и управление товарами/пользователями.

## Что реализовано

- JWT access/refresh токены и авто‑обновление access токена
- Роли `user`, `seller`, `admin`
- Защищённые роуты и `roleMiddleware`
- CRUD товаров
- Просмотр пользователей и управление ими (только `admin`)
- Страницы: `ProductPage`, `RegistrationForm`, роутинг через React Router

## Роли и доступ

- `guest`
- регистрация/вход
- `/api/auth/refresh`

- `user`
- `/api/auth/me`
- просмотр товаров

- `seller`
- всё как у `user`
- создание товаров

- `admin`
- всё как у `seller`
- просмотр/обновление/удаление пользователей
- доступ к admin‑роутам

## API (основное)

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

- `GET /api/products`
- `POST /api/products` (seller/admin)
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

- `GET /api/users` (admin)
- `GET /api/users/:id` (admin)
- `PUT /api/users/:id` (admin)
- `DELETE /api/users/:id` (admin)

- `GET /api/protected-route` (seller/admin)
- `GET /api/protected-admin-route` (admin)

## Как устроен refresh

- При `401` в ответе срабатывает response‑interceptor.
- Выполняется `POST /api/auth/refresh` с `refreshToken`.
- Токены обновляются и исходный запрос повторяется.
- Если refresh невалиден, токены очищаются.

## Клиент

- `RegistrationForm` умеет регистрировать пользователя с выбранной ролью.
- `ProductPage` показывает токены, товары, пользователей и кнопки проверки ролей.

## Запуск

1. Сервер:
```
cd practises11-12/server
node server.js
```

2. Клиент:
```
cd practises11-12/client
npm install
npm run dev
```
