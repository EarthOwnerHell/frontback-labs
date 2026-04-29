const express = require("express");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const { createClient } = require("redis");

// Секретный ключ для подписи токенов
const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";
// Время жизни токенов
const ACCESS_EXPIRES_IN = "15s";
const REFRESH_EXPIRES_IN = "7d";

const app = express();
const port = Number(process.env.PORT) || 3000;
const INSTANCE_NAME = process.env.INSTANCE_NAME || `backend-${port}`;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const USERS_CACHE_TTL = 60;
const PRODUCTS_CACHE_TTL = 600;
const PRODUCT_CACHE_TTL = 600;
const redisClient = createClient({ url: REDIS_URL });

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

redisClient.connect().catch((err) => {
  console.error("Redis connection failed:", err);
});

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
const refreshTokens = new Set();

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    ACCESS_SECRET,
    {
      expiresIn: ACCESS_EXPIRES_IN,
    },
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    REFRESH_SECRET,
    {
      expiresIn: REFRESH_EXPIRES_IN,
    },
  );
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      error: "Missing or invalid Authorization header",
    });
  }

  try {
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = payload; // { sub, username, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}

function roleMiddleware(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return res.json({
          source: "cache",
          data: JSON.parse(cachedData),
        });
      }

      req.cacheKey = key;
      req.cacheTTL = ttl;
      next();
    } catch (err) {
      console.error("Cache read error:", err);
      next();
    }
  };
}

async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), {
      EX: ttl,
    });
  } catch (err) {
    console.error("Cache save error:", err);
  }
}

// Удаление кэша пользователей
async function invalidateUsersCache(userId = null) {
  try {
    await redisClient.del("users:all");

    if (userId) {
      await redisClient.del(`users:${userId}`);
    }
  } catch (err) {
    console.error("Users cache invalidate error:", err);
  }
}

async function invalidateProductsCache(productId = null) {
  try {
    await redisClient.del("products");

    if (productId) {
      await redisClient.del(`product:${productId}`);
    }
  } catch (err) {
    console.error("Products cache invalidate error:", err);
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
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("X-Backend-Instance", INSTANCE_NAME);
  next();
});

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

app.get("/", (req, res) => {
  res.json({
    message: "Response from backend server",
    instance: INSTANCE_NAME,
    port,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    instance: INSTANCE_NAME,
    port,
    redis: redisClient.isOpen ? "connected" : "disconnected",
  });
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
  const { email, first_name, last_name, password, role } = req.body;

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
    role: role || "user",
  };

  users.push(newUser);
  await invalidateUsersCache();
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

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  refreshTokens.add(refreshToken);

  console.log("Login tokens:", { accessToken, refreshToken });
  res.json({ accessToken, refreshToken });
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
app.post(
  "/api/products",
  authMiddleware,
  roleMiddleware(["seller", "admin"]),
  async (req, res) => {
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
    await invalidateProductsCache();
    res.status(201).json(newProduct);
  },
);

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
app.get(
  "/api/products",
  cacheMiddleware(() => "products", PRODUCTS_CACHE_TTL),
  async (req, res) => {
    const data = products.map((p) => ({
      id: p.id,
      title: p.title,
      category: p.category,
      description: p.description,
      price: p.price,
    }));

    await saveToCache(req.cacheKey, data, req.cacheTTL);

    res.json({
      source: "server",
      data,
    });
  },
);

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
app.get(
  "/api/products/:id",
  authMiddleware,
  cacheMiddleware((req) => `product:${req.params.id}`, PRODUCT_CACHE_TTL),
  async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const product = findById(products, "id", id, res);
    if (!product) return;

    const data = {
      id: product.id,
      title: product.title,
      category: product.category,
      description: product.description,
      price: product.price,
    };

    await saveToCache(req.cacheKey, data, req.cacheTTL);

    res.json({
      source: "server",
      data,
    });
  },
);

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
app.put("/api/products/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { title, category, description, price } = req.body;

  const product = findById(products, "id", id, res);
  if (!product) return;

  if (title !== undefined) product.title = title;
  if (category !== undefined) product.category = category;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);

  await invalidateProductsCache(id);
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
app.delete("/api/products/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const productIndex = products.findIndex((p) => p.id == id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Товар не найден" });
  }

  products.splice(productIndex, 1);
  await invalidateProductsCache(id);
  res.json({ message: "Product deleted" });
});

app.post("/api/auth/refresh", (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: "refreshToken is required",
    });
  }

  if (!refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }

  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET);
    const user = users.find((u) => u.id === payload.sub);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
      });
    }

    refreshTokens.delete(refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    refreshTokens.add(newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(401).json({
      error: "Invalid or expired refresh token",
    });
  }
});

app.get(
  "/api/protected-route",
  authMiddleware,
  roleMiddleware(["seller", "admin"]),
  (req, res) => {
    res.json({
      message: "Protected route for seller or admin",
      user: req.user,
    });
  },
);

app.get(
  "/api/protected-admin-route",
  authMiddleware,
  roleMiddleware(["admin"]),
  (req, res) => {
    res.json({
      message: "Admin only route",
      user: req.user,
    });
  },
);

app.get(
  "/api/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware(() => "users:all", USERS_CACHE_TTL),
  async (req, res) => {
    const data = users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
    }));

    await saveToCache(req.cacheKey, data, req.cacheTTL);

    res.json({
      source: "server",
      data,
    });
  },
);

app.get(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  cacheMiddleware((req) => `users:${req.params.id}`, USERS_CACHE_TTL),
  async (req, res) => {
    const user = users.find((u) => u.id === req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const data = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    await saveToCache(req.cacheKey, data, req.cacheTTL);

    res.json({
      source: "server",
      data,
    });
  },
);

app.put(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;
    const { email, first_name, last_name, password, role } = req.body;

    const user = findById(users, "id", id, res);
    if (!user) return;

    if (email !== undefined) user.email = email;
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (password !== undefined) user.hashedPassword = await hashPassword(password);
    if (role !== undefined) user.role = role;

    await invalidateUsersCache(id);
    res.json(user);
  },
);

app.delete(
  "/api/users/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    const { id } = req.params;

    const userIndex = users.findIndex((u) => u.id == id);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }

    users.splice(userIndex, 1);
    await invalidateUsersCache(id);
    res.json({ message: "Пользователь заблокирован" });
  },
);
app.listen(port, () => {
  console.log(`Сервер ${INSTANCE_NAME} запущен на http://localhost:${port}`);
  console.log(
    `Swagger UI доступен по адресу http://localhost:${port}/api-docs`,
  );
});
