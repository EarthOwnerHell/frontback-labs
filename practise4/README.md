# frontback-kr1

Учебный fullstack-проект: витрина кроссовок на React + Vite и API на Express.

## Что реализовано

- Каталог товаров на главной странице.
- Карточка товара с полями:
  - название,
  - категория,
  - описание,
  - цена,
  - остаток на складе,
  - опционально рейтинг,
  - опционально изображение.
- Кнопки управления в карточке: `Редактировать` и `Удалить`.
- Модальное окно (`ProductModal`) для:
  - создания товара,
  - редактирования товара.
- CRUD на клиенте через `axios` (`client/src/api/index.js`).
- CRUD API на сервере (`server/server.js`):
  - `POST /api/products`
  - `GET /api/products`
  - `GET /api/products/:id`
  - `PATCH /api/products/:id`
  - `DELETE /api/products/:id`
- Swagger/OpenAPI документация на сервере: `GET /api-docs`.

## Стек

- Frontend: React 19, Vite, SCSS, Axios
- Backend: Node.js, Express, CORS, NanoID
- Docs: swagger-jsdoc, swagger-ui-express

## Структура проекта

```text
frontback-kr1/
  client/
    src/
      api/index.js
      components/
        ProductCard.jsx
        ProductCard.scss
        ProductModal.jsx
        ProductModal.scss
      pages/
        MainPage.jsx
        MainPage.scss
  server/
    server.js
```

## Запуск проекта

### 1) Backend

В папке `server` сейчас только `server.js`, поэтому перед первым запуском нужно создать `package.json` и поставить зависимости:

```bash
cd server
npm init -y
npm pkg set type=module
npm i express cors nanoid swagger-jsdoc swagger-ui-express
node server.js
```

Сервер поднимется на `http://localhost:3001`.

Swagger UI: `http://localhost:3001/api-docs`.

### 2) Frontend

```bash
cd client
npm install
npx vite --port 5173
```

Frontend будет доступен на `http://localhost:5173`.

## API (кратко)

### `GET /api/products`
Возвращает массив товаров.

### `POST /api/products`
Создает новый товар.

Пример тела:

```json
{
  "name": "Nike Air Max Pulse",
  "category": "Кроссовки",
  "description": "Легкие городские кроссовки",
  "price": 14990,
  "stock": 12,
  "rating": 4.7,
  "image": "https://..."
}
```

### `PATCH /api/products/:id`
Частично обновляет товар по `id`.

### `DELETE /api/products/:id`
Удаляет товар по `id`.

## Что сделано в рамках работы

- Приведены в рабочее состояние CRUD-маршруты для сущности `products`.
- Переведены клиентские запросы на `/api/products`.
- Реализована модалка создания/редактирования и связана с `MainPage`.
- Добавлены стили карточек, кнопок и модального окна в едином темном UI.
- Добавлена Swagger-документация с описанием схемы `Product` и всех endpoint-ов.

## Известные моменты

- В `client/package.json` нет скрипта `lint`.
- Для backend зависимости ставятся отдельно в директории `server` (см. шаги запуска выше).
