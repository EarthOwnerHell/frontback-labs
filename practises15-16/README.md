# Practises 15–16

## Практика 15 — HTTPS + App Shell

Сделано:
- HTTPS для клиента через Vite (сертификаты `localhost+2.pem` и `localhost+2-key.pem`).
- Архитектура App Shell: каркас в `client/index.html`, динамический контент в `client/public/content`.
- Service Worker кэширует App Shell и динамический контент (`client/public/sw.js`).

### Запуск клиента по HTTPS

```
cd practises15-16/client
npm install
npm run dev -- --host
```

Открыть: `https://localhost:3000`

## Практика 16 — WebSocket + Push

Сделано:
- HTTPS сервер с Socket.IO и Web Push (`server/server.js`).
- Эндпоинты `/subscribe` и `/unsubscribe`.
- Клиент подключается к Socket.IO и отправляет событие `newTask` при добавлении заметки.
- Push уведомления с иконками.

### Запуск сервера

```
cd practises15-16/server
npm install
npm start
```

Сервер: `https://localhost:3001`

### Проверка

1. Открой клиент: `https://localhost:3000`
2. Нажми «Включить уведомления» и разреши их.
3. Добавь заметку — увидишь pop‑up и push.

## Где что лежит

- `client/index.html` — App Shell + кнопки push
- `client/public/content/home.html` — контент «Главная»
- `client/public/content/about.html` — контент «О приложении»
- `client/public/app.js` — логика App Shell + localStorage + Socket.IO + push
- `client/public/sw.js` — кэширование App Shell + push обработчик
- `server/server.js` — WebSocket + push сервер
