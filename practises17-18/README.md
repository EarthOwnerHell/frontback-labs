# Practises 17–18

## Практика 17 — Детализация Push

Сделано:
- Форма заметки с напоминанием: текст + дата/время в `client/public/content/home.html`.
- Заметки в `localStorage` сохраняются как объекты с `id`, `text`, `datetime`, `reminder`.
- Сервер планирует push-напоминания через `setTimeout` и хранит активные таймеры.
- В Service Worker добавлена кнопка `Отложить на 5 минут` и запрос на `/snooze`.

### Запуск клиента по HTTPS

```
cd practises15-16/client
npm install
npm run dev -- --host
```

Открыть: `https://localhost:3000`

## Основа из прошлой практики

Сделано:
- HTTPS сервер с Socket.IO и Web Push (`server/server.js`).
- Эндпоинты `/subscribe` и `/unsubscribe`.
- Клиент подключается к Socket.IO и отправляет события `newTask` и `newReminder`.
- Push уведомления с иконками и действиями.

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
3. Добавь заметку с напоминанием на ближайшую минуту.
4. После push нажми `Отложить на 5 минут`, чтобы проверить `/snooze`.

## Где что лежит

- `client/index.html` — App Shell + кнопки push
- `client/public/content/home.html` — контент «Главная»
- `client/public/content/about.html` — контент «О приложении»
- `client/public/app.js` — логика App Shell + localStorage + Socket.IO + push + напоминания
- `client/public/sw.js` — кэширование App Shell + push обработчик + snooze
- `server/server.js` — WebSocket + push сервер + планировщик напоминаний
