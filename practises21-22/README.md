# Practises 21-22

Практика 21:
- кэширование Redis для `GET /api/users`, `GET /api/users/:id`, `GET /api/products`, `GET /api/products/:id`;
- TTL:
  - users: `60` секунд;
  - products: `600` секунд.

Практика 22:
- подготовлено 3 backend-экземпляра одного Express-приложения;
- настроен `Nginx` как балансировщик нагрузки;
- добавлен альтернативный пример через `HAProxy`;
- добавлены `health check`, резервный backend и Docker Compose для локального запуска.

## Что добавлено

- [server/server.js](/Users/a1/Documents/GitHub/pr1-2/practises21-22/server/server.js)  
  Один backend, который можно запускать в нескольких экземплярах через `PORT` и `INSTANCE_NAME`.

- [server/package.json](/Users/a1/Documents/GitHub/pr1-2/practises21-22/server/package.json)  
  Зависимости и `npm start` для backend.

- [server/Dockerfile](/Users/a1/Documents/GitHub/pr1-2/practises21-22/server/Dockerfile)  
  Сборка backend-контейнера.

- [nginx.conf](/Users/a1/Documents/GitHub/pr1-2/practises21-22/nginx.conf)  
  Балансировка через `upstream`, `max_fails`, `fail_timeout` и `backup`.

- [haproxy.cfg](/Users/a1/Documents/GitHub/pr1-2/practises21-22/haproxy.cfg)  
  Альтернативная балансировка через HAProxy.

- [docker-compose.yml](/Users/a1/Documents/GitHub/pr1-2/practises21-22/docker-compose.yml)  
  Поднимает `redis`, 3 backend-сервера, `nginx` и `haproxy`.

## Как работает балансировка

- `backend1` и `backend2` являются основными серверами.
- `backend3` настроен как резервный.
- `nginx` доступен на `http://localhost:8080`.
- `haproxy` доступен на `http://localhost:8081`.

Каждый backend возвращает:
- `instance` — имя экземпляра;
- `port` — порт контейнера;
- заголовок `X-Backend-Instance`.

Это позволяет видеть, какой сервер обработал запрос.

## Маршруты для проверки

- `GET /` — тестовый ответ от backend с `instance` и `port`
- `GET /api/health` — health check для балансировщиков
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/users`
- `GET /api/users/:id`

## Запуск через Docker Compose

```bash
cd practises21-22
docker compose up --build
```

## Проверка Nginx

Несколько раз выполни:

```bash
curl http://localhost:8080/
```

В ответах должны меняться `instance: backend-1` и `instance: backend-2`.

Чтобы увидеть заголовок backend:

```bash
curl -i http://localhost:8080/
```

## Проверка HAProxy

```bash
curl http://localhost:8081/
```

Повторные запросы тоже должны распределяться между backend-экземплярами.

## Проверка отказоустойчивости

В конфиге Nginx используются:
- `max_fails=2`
- `fail_timeout=30s`
- `backup` для `backend3`

Если один из основных серверов перестаёт отвечать, трафик будет уходить на оставшийся рабочий сервер, а при необходимости — на резервный.

## Где задаётся время жизни кэша Redis

В [server/server.js](/Users/a1/Documents/GitHub/pr1-2/practises21-22/server/server.js):

```js
const USERS_CACHE_TTL = 60;
const PRODUCTS_CACHE_TTL = 600;
const PRODUCT_CACHE_TTL = 600;
```

Потом это значение передаётся в Redis через:

```js
await redisClient.set(key, JSON.stringify(data), {
  EX: ttl,
});
```

`EX` — это TTL в секундах.
