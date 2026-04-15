/* global io */
window.appLoaded = true;
console.log("app.js loaded");
const contentDiv = document.getElementById("app-content");
const homeBtn = document.getElementById("home-btn");
const aboutBtn = document.getElementById("about-btn");

const socket = io("https://localhost:3001");
const VAPID_PUBLIC_KEY =
  "BF_pN6wEwKD6wtLcyQI9DRxObAf5Bnkn8VPkZxiv250IQGN04uevTTjsHJzeATBf_DorTwW0Oc2HGcLWM7WiefM";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    await fetch("https://localhost:3001/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    });
    console.log("Push subscribe OK", subscription);
  } catch (err) {
    console.error("Push subscribe failed", err);
    alert("Не удалось подписаться на push. Проверь HTTPS и разрешения.");
  }
}

async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await fetch("https://localhost:3001/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      console.log("Push unsubscribe OK");
    }
  } catch (err) {
    console.error("Push unsubscribe failed", err);
  }
}

function setActiveButton(activeId) {
  [homeBtn, aboutBtn].forEach((btn) => btn.classList.remove("active"));
  document.getElementById(activeId).classList.add("active");
}

async function loadContent(page) {
  try {
    const response = await fetch(`/content/${page}.html`);
    const html = await response.text();
    contentDiv.innerHTML = html;

    if (page === "home") {
      initNotes();
    }
  } catch (err) {
    contentDiv.innerHTML =
      '<p class="is-center text-error">Ошибка загрузки страницы.</p>';
    console.error(err);
  }
}

homeBtn.addEventListener("click", () => {
  setActiveButton("home-btn");
  loadContent("home");
});

aboutBtn.addEventListener("click", () => {
  setActiveButton("about-btn");
  loadContent("about");
});

loadContent("home");

function initNotes() {
  const form = document.getElementById("note-form");
  const input = document.getElementById("note-input");
  const reminderForm = document.getElementById("reminder-form");
  const reminderText = document.getElementById("reminder-text");
  const reminderTime = document.getElementById("reminder-time");
  const list = document.getElementById("notes-list");

  function loadNotes() {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    list.innerHTML = notes
      .map((note) => {
        const normalizedNote =
          typeof note === "string"
            ? { id: Date.now(), text: note, reminder: null, datetime: null }
            : note;

        const createdAt = normalizedNote.datetime || normalizedNote.timestamp;
        const createdAtLine = createdAt
          ? `<div style="font-size: 0.8rem; opacity: 0.7;">Создано: ${new Date(createdAt).toLocaleString()}</div>`
          : "";
        const reminderLine = normalizedNote.reminder
          ? `<div style="font-size: 0.8rem; color: #2f855a;">Напоминание: ${new Date(normalizedNote.reminder).toLocaleString()}</div>`
          : "";

        return `<li class="card" style="margin-bottom: 0.5rem; padding: 0.5rem;">${normalizedNote.text}${createdAtLine}${reminderLine}</li>`;
      })
      .join("");
  }

  function addNote(text, reminderTimestamp = null) {
    const notes = JSON.parse(localStorage.getItem("notes") || "[]");
    const newNote = {
      id: Date.now(),
      text,
      datetime: new Date().toISOString(),
      reminder: reminderTimestamp,
    };
    notes.push(newNote);
    localStorage.setItem("notes", JSON.stringify(notes));
    loadNotes();

    if (reminderTimestamp) {
      socket.emit("newReminder", {
        id: newNote.id,
        text,
        reminderTime: reminderTimestamp,
      });
      return;
    }

    socket.emit("newTask", { text, timestamp: Date.now() });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (text) {
      addNote(text);
      input.value = "";
    }
  });

  reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = reminderText.value.trim();
    const datetime = reminderTime.value;

    if (!text || !datetime) return;

    const reminderTimestamp = new Date(datetime).getTime();
    if (Number.isNaN(reminderTimestamp) || reminderTimestamp <= Date.now()) {
      alert("Дата напоминания должна быть в будущем");
      return;
    }

    addNote(text, reminderTimestamp);
    reminderText.value = "";
    reminderTime.value = "";
  });

  loadNotes();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        console.log("SW registered:", reg.scope);
        const enableBtn = document.getElementById("enable-push");
        const disableBtn = document.getElementById("disable-push");

        if (enableBtn && disableBtn) {
          await navigator.serviceWorker.ready;
          const subscription = await reg.pushManager.getSubscription();
          console.log("Existing subscription:", subscription);
          if (subscription) {
            enableBtn.style.display = "none";
            disableBtn.style.display = "inline-block";
          }

          enableBtn.addEventListener("click", async () => {
            if (Notification.permission === "denied") {
              alert(
                "Уведомления запрещены. Разрешите их в настройках браузера.",
              );
              return;
            }
            if (Notification.permission === "default") {
              const permission = await Notification.requestPermission();
              if (permission !== "granted") {
                alert("Необходимо разрешить уведомления.");
                return;
              }
            }
            await subscribeToPush();
            enableBtn.style.display = "none";
            disableBtn.style.display = "inline-block";
          });

          disableBtn.addEventListener("click", async () => {
            await unsubscribeFromPush();
            disableBtn.style.display = "none";
            enableBtn.style.display = "inline-block";
          });
        }
      })
      .catch((err) => console.log("SW registration failed:", err));
  });
}

socket.on("taskAdded", () => {});
