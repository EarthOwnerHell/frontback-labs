const express = require("express");
const https = require("https");
const fs = require("fs");
const path = require("path");
const socketIo = require("socket.io");
const webpush = require("web-push");
const bodyParser = require("body-parser");
const cors = require("cors");

const vapidKeys = {
  publicKey:
    "BF_pN6wEwKD6wtLcyQI9DRxObAf5Bnkn8VPkZxiv250IQGN04uevTTjsHJzeATBf_DorTwW0Oc2HGcLWM7WiefM",
  privateKey: "yHoFQj1or9SC8RMaJ7zsUQFxfISzpmcN3KOUAo-1s3Y",
};

webpush.setVapidDetails(
  "mailto:your-email@example.com",
  vapidKeys.publicKey,
  vapidKeys.privateKey,
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Раздача статических файлов приложения (при необходимости)
app.use(express.static(path.join(__dirname, "../client")));

let subscriptions = [];
const reminders = new Map();

const server = https.createServer(
  {
    key: fs.readFileSync(path.resolve(__dirname, "../localhost+2-key.pem")),
    cert: fs.readFileSync(path.resolve(__dirname, "../localhost+2.pem")),
  },
  app,
);

const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  console.log("Клиент подключён:", socket.id);

  socket.on("newTask", (task) => {
    io.emit("taskAdded", task);

    const payload = JSON.stringify({
      title: "Новая задача",
      body: task.text,
    });

    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        if (err.statusCode === 410) {
          // Подписка устарела/отписана — удаляем из списка
          subscriptions = subscriptions.filter(
            (item) => item.endpoint !== sub.endpoint,
          );
        }
        console.error("Push error:", err);
      });
    });
  });

  socket.on("newReminder", (reminder) => {
    const { id, text, reminderTime } = reminder;
    const delay = reminderTime - Date.now();

    if (!id || !text || delay <= 0) {
      return;
    }

    if (reminders.has(id)) {
      clearTimeout(reminders.get(id).timeoutId);
    }

    const timeoutId = setTimeout(() => {
      const payload = JSON.stringify({
        title: "!!! Напоминание",
        body: text,
        reminderId: id,
      });

      subscriptions.forEach((sub) => {
        webpush.sendNotification(sub, payload).catch((err) => {
          if (err.statusCode === 410) {
            subscriptions = subscriptions.filter(
              (item) => item.endpoint !== sub.endpoint,
            );
          }
          console.error("Push error:", err);
        });
      });

      reminders.delete(id);
    }, delay);

    reminders.set(id, { timeoutId, text, reminderTime });
  });

  socket.on("disconnect", () => {
    console.log("Клиент отключён:", socket.id);
  });
});

app.post("/subscribe", (req, res) => {
  subscriptions.push(req.body);
  console.log("Subscribe:", req.body?.endpoint || "no-endpoint");
  res.status(201).json({ message: "Подписка сохранена" });
});

app.post("/unsubscribe", (req, res) => {
  const { endpoint } = req.body;
  subscriptions = subscriptions.filter((sub) => sub.endpoint !== endpoint);
  console.log("Unsubscribe:", endpoint || "no-endpoint");
  res.status(200).json({ message: "Подписка удалена" });
});

app.post("/snooze", (req, res) => {
  const reminderId = parseInt(req.query.reminderId, 10);

  if (!reminderId || !reminders.has(reminderId)) {
    return res.status(404).json({ error: "Reminder not found" });
  }

  const reminder = reminders.get(reminderId);
  clearTimeout(reminder.timeoutId);

  const newDelay = 5 * 60 * 1000;
  const newTimeoutId = setTimeout(() => {
    const payload = JSON.stringify({
      title: "Напоминание отложено",
      body: reminder.text,
      reminderId,
    });

    subscriptions.forEach((sub) => {
      webpush.sendNotification(sub, payload).catch((err) => {
        if (err.statusCode === 410) {
          subscriptions = subscriptions.filter(
            (item) => item.endpoint !== sub.endpoint,
          );
        }
        console.error("Push error:", err);
      });
    });

    reminders.delete(reminderId);
  }, newDelay);

  reminders.set(reminderId, {
    timeoutId: newTimeoutId,
    text: reminder.text,
    reminderTime: Date.now() + newDelay,
  });

  return res.status(200).json({ message: "Reminder snoozed for 5 minutes" });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Сервер запущен на https://localhost:${PORT}`);
  console.log(`VAPID public key: ${vapidKeys.publicKey}`);
});
