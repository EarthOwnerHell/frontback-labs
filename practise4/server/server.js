import express from "express";
import { nanoid } from "nanoid";
import cors from "cors";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let products = [
  {
    id: nanoid(6),
    name: "Nike Air Max Pulse",
    category: "Кроссовки",
    description:
      "Легкие городские кроссовки с мягкой амортизацией Air и дышащим верхом для ежедневной носки.",
    price: 14990,
    stock: 12,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Adidas Ultraboost Light",
    category: "Кроссовки",
    description:
      "Пружинистая подошва Boost и легкий сетчатый верх для бега и повседневной носки.",
    price: 16990,
    stock: 9,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "New Balance 9060",
    category: "Кроссовки",
    description:
      "Массивный силуэт в ретро-стиле с мягкой амортизацией и комфортной посадкой.",
    price: 18990,
    stock: 7,
    rating: 4.6,
    image:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Puma RS-X Efekt",
    category: "Кроссовки",
    description:
      "Яркий дизайн и устойчивая подошва для активного городского ритма.",
    price: 12990,
    stock: 14,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "ASICS Gel-Kayano 30",
    category: "Кроссовки",
    description:
      "Стабильная беговая модель с технологией GEL и мягким перекатом стопы.",
    price: 19990,
    stock: 5,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Reebok Classic Leather",
    category: "Кроссовки",
    description:
      "Лаконичная классика из мягкой кожи, которая подходит почти к любому образу.",
    price: 9990,
    stock: 20,
    rating: 4.5,
    image:
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Converse Run Star Hike",
    category: "Кроссовки",
    description:
      "Высокая зубчатая подошва и узнаваемый силуэт для смелых повседневных луков.",
    price: 11990,
    stock: 11,
    rating: 4.3,
    image:
      "https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Saucony Shadow 6000",
    category: "Кроссовки",
    description:
      "Удобная винтажная модель с мягкой EVA-подошвой и дышащими материалами.",
    price: 13990,
    stock: 8,
    rating: 4.2,
    image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Nike Dunk Low",
    category: "Кроссовки",
    description:
      "Легендарная низкая модель с плотной фиксацией и износостойкой резиновой подошвой.",
    price: 15490,
    stock: 13,
    rating: 4.7,
    image:
      "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Jordan 1 Mid",
    category: "Кроссовки",
    description:
      "Культовый баскетбольный силуэт в средней высоте для повседневного стиля.",
    price: 17990,
    stock: 6,
    rating: 4.8,
    image:
      "https://images.unsplash.com/photo-1511556820780-d912e42b4980?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: nanoid(6),
    name: "Vans Knu Skool",
    category: "Кроссовки",
    description:
      "Скейтовая классика с объемным язычком и прочным замшевым верхом.",
    price: 10990,
    stock: 16,
    rating: 4.4,
    image:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80",
  },
];

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3001"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

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

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API управления товарами",
      version: "1.0.0",
      description: "Простое API для CRUD-операций с товарами",
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: "Локальный сервер",
      },
    ],
    tags: [{ name: "Products", description: "Операции с товарами" }],
  },
  apis: [path.join(__dirname, "server.js")],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *         - rating
 *       properties:
 *         id:
 *           type: string
 *           description: Автоматически сгенерированный уникальный ID товара
 *         name:
 *           type: string
 *           description: Название товара
 *         category:
 *           type: string
 *           description: Категория товара
 *         description:
 *           type: string
 *           description: Описание товара
 *         price:
 *           type: number
 *           description: Цена товара
 *         stock:
 *           type: integer
 *           description: Количество товара на складе
 *         rating:
 *           type: number
 *           format: float
 *           description: Рейтинг товара (0-5)
 *         image:
 *           type: string
 *           description: URL изображения товара
 *       example:
 *         id: "abc123"
 *         name: "Nike Air Max Pulse"
 *         category: "Кроссовки"
 *         description: "Легкие городские кроссовки"
 *         price: 14990
 *         stock: 12
 *         rating: 4.7
 *         image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
 */
function findProductOr404(id, res) {
  const product = products.find((p) => p.id === id);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return null;
  }
  return product;
}

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *               - rating
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка в теле запроса
 */
app.post("/api/products", (req, res) => {
  const { name, category, description, price, stock, rating, image } =
    req.body ?? {};

  if (
    !name ||
    !category ||
    !description ||
    price === undefined ||
    stock === undefined ||
    rating === undefined
  ) {
    return res.status(400).json({ error: "Required product fields are missing" });
  }

  const newProduct = {
    id: nanoid(6),
    name: String(name).trim(),
    category: String(category).trim(),
    description: String(description),
    price: Number(price),
    stock: Number(stock),
    rating: Number(rating),
    image: typeof image === "string" ? image.trim() : "",
  };

  products.push(newProduct);
  return res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get("/api/products", (req, res) => {
  res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает товар по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Данные товара
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Товар не найден
 */
app.get("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;
  res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет данные товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновленный товар
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Товар не найден
 */
app.patch("/api/products/:id", (req, res) => {
  const product = findProductOr404(req.params.id, res);
  if (!product) return;

  const allowed = [
    "name",
    "category",
    "description",
    "price",
    "stock",
    "rating",
    "image",
  ];

  const normalize = {
    name: (v) => String(v).trim(),
    category: (v) => String(v).trim(),
    description: (v) => String(v),
    price: (v) => Number(v),
    stock: (v) => Number(v),
    rating: (v) => Number(v),
    image: (v) => String(v).trim(),
  };

  const patch = Object.fromEntries(
    Object.entries(req.body ?? {})
      .filter(([key, value]) => allowed.includes(key) && value !== undefined)
      .map(([key, value]) => [key, normalize[key](value)]),
  );

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  Object.assign(product, patch);
  return res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет товар
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID товара
 *     responses:
 *       204:
 *         description: Товар успешно удален (без тела ответа)
 *       404:
 *         description: Товар не найден
 */
app.delete("/api/products/:id", (req, res) => {
  const id = req.params.id;
  const exists = products.some((p) => p.id === id);
  if (!exists) return res.status(404).json({ error: "Product not found" });

  products = products.filter((p) => p.id !== id);
  return res.status(204).send();
});

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
  console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});
