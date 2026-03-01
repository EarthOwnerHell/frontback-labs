# Практика 5: Swagger для backend API

В этой практике показана документация Swagger для API из `practise4/server`.

Swagger UI доступен по адресу:

`http://localhost:3001/api-docs`

## Главная страница Swagger

![Главная страница Swagger](../photo/mainpageswagger.png)

## Методы API

### `GET /api/products`
Список всех товаров.

![GET /api/products](../photo/getproducts.png)

### `GET /api/products/{id}`
Получение товара по идентификатору.

![GET /api/products/{id}](../photo/getproductbyid.png)

### `POST /api/products`
Создание нового товара.

![POST /api/products](../photo/postproducts.png)

### `PATCH /api/products/{id}`
Частичное обновление товара.

![PATCH /api/products/{id}](../photo/patchproduct.png)

### `DELETE /api/products/{id}`
Удаление товара.

![DELETE /api/products/{id}](../photo/deleteproduct.png)
