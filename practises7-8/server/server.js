const express = require("express");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Секретный ключ для подписи токенов
const JWT_SECRET = "access_secret";

// Время жизни токена
const ACCESS_EXPIRES_IN = "15m";

const app = express();
const port = 3000;

// Настройки Swagger
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API AUTH",
      version: "1.0.1",
      description: "API для работы с товарами и регистрацией",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Локальный сервер",
      },
    ],
  },
  apis: ["./server.js"],
};

let users = [];
let products = [];

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { sub, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

// Поиск товара/пользователя или возврат 404
function findById(collection, key, value, res) {
  const item = collection.find((item) => item[key] == value);

  if (!item) {
    res.status(404).json({ error: `${key} not found` });
    return null;
  }
  return item;
}
// Хеширование пароля
async function hashPassword(password) {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

// Проверка пароля
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

// Подключение Swagger
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());

// Логгер запросов
app.use((req, res, next) => {
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`,
    );
    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      console.log("Body:", req.body);
    }
  });
  next();
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     description: Создает нового пользователя с хешированным паролем
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@example.com
 *               first_name:
 *                 type: string
 *                 example: Ivan
 *               last_name:
 *                 type: string
 *                 example: Ivanov
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: ab12cd
 *                 email:
 *                   type: string
 *                   example: ivan@example.com
 *                 first_name:
 *                   type: string
 *                   example: Ivan
 *                 last_name:
 *                   type: string
 *                   example: Ivanov
 *                 hashedPassword:
 *                   type: string
 *                   example: $2b$10$kO6Hq7ZKfV4cPzGm8u7mEuR7r4Xx2p9mP0q3t1yZbCq9Lh5a8b1QW
 *       400:
 *         description: Некорректные данные
 */
app.post("/api/auth/register", async (req, res) => {
  const { email, first_name, last_name, password } = req.body;

  if (!email || !password || !first_name || !last_name) {
    return res
      .status(400)
      .json({ error: "email, first_name, last_name, password are required" });
  }

  const newUser = {
    id: nanoid(6),
    email: email,
    first_name: first_name,
    last_name: last_name,
    hashedPassword: await hashPassword(password),
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Проверяет email и пароль пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@example.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 login:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Отсутствуют обязательные поля
 *       401:
 *         description: Неверные учетные данные
 *       404:
 *         description: Пользователь не найден
 */
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = findById(users, "email", email, res);
  if (!user) {
    return res.status(401).json({
      error: "Invalid credentials",
    });
  }

  const isAuthentethicated = await verifyPassword(
    password,
    user.hashedPassword,
  );

  if (!isAuthentethicated) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN,
    },
  );

  res.json({
    accessToken,
  });
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
  const userId = req.user.sub;
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  // Никогда не возвращаем passwordHash
  res.json({
    id: user.id,
    email: user.email,
  });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     description: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: iPhone 15
 *               category:
 *                 type: string
 *                 example: Smartphones
 *               description:
 *                 type: string
 *                 example: Новый смартфон от Apple
 *               price:
 *                 type: number
 *                 example: 999.99
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: ab12cd
 *                 title:
 *                   type: string
 *                   example: iPhone 15
 *                 category:
 *                   type: string
 *                   example: Smartphones
 *                 description:
 *                   type: string
 *                   example: Новый смартфон от Apple
 *                 price:
 *                   type: number
 *                   example: 999.99
 *       400:
 *         description: Отсутствуют обязательные поля
 */
app.post("/api/products", async (req, res) => {
  const { title, category, description, price } = req.body;

  if (!title || !category || !description || !price) {
    return res.status(400).json({ error: "Заполните все поля" });
  }

  const newProduct = {
    id: nanoid(6),
    title,
    category,
    description,
    price: Number(price),
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     description: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   title:
 *                     type: string
 *                   category:
 *                     type: string
 *                   description:
 *                     type: string
 *                   price:
 *                     type: number
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     description: Возвращает товар по уникальному идентификатору
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 category:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: "id is required" });
  }

  const product = findById(products, "id", id, res);
  if (!product) return;

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить товар
 *     description: Обновляет параметры товара по id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: iPhone 15 Pro
 *               category:
 *                 type: string
 *                 example: Smartphones
 *               description:
 *                 type: string
 *                 example: Обновленный смартфон
 *               price:
 *                 type: number
 *                 example: 1099.99
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 title:
 *                   type: string
 *                 category:
 *                   type: string
 *                 description:
 *                   type: string
 *                 price:
 *                   type: number
 *       404:
 *         description: Товар не найден
 */
app.put("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;
  const { title, category, description, price } = req.body;

  const product = findById(products, "id", id, res);
  if (!product) return;

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     description: Удаляет товар по id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар успешно удален
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Product deleted
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", authMiddleware, (req, res) => {
  const { id } = req.params;

  const productIndex = products.findIndex((p) => p.id == id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  products.splice(productIndex, 1);
  res.json({ message: "Product deleted" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(
    `Swagger UI доступен по адресу http://localhost:${port}/api-docs`,
  );
});
