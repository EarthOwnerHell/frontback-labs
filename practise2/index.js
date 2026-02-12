const express = require("express");
const app = express();
const port = 3000;

let products = [
  { id: 1, name: "Монитор", price: 1600 },
  { id: 2, name: "Клавиатура", price: 800 },
  { id: 3, name: "Мышь", price: 400 },
];
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Главная страница");
});

app.post("/products", (req, res) => {
  const { name, price } = req.body;
  const newProduct = {
    id: Date.now(),
    name,
    price,
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

app.get("/products", (req, res) => {
  res.json(products);
});

app.get("/products/:id", (req, res) => {
  const product = products.find((p) => p.id == req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Продукт не найден" });
  }
});

app.patch("/products/:id", (req, res) => {
  const product = products.find((p) => p.id == req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Продукт не найден" });
  }

  const { name, price } = req.body;
  if (name !== undefined) product.name = name;
  if (price !== undefined) product.price = price;

  res.json(product);
});

app.delete("/products/:id", (req, res) => {
  const productExists = products.some((p) => p.id == req.params.id);
  if (!productExists) {
    return res.status(404).json({ message: "Продукт не найден" });
  }

  products = products.filter((p) => p.id != req.params.id);
  res.json({ message: "Продукт удален" });
});

// Запуск сервера
app.listen(port, () => {
  console.log(`✅ Сервер запущен на http://localhost:${port}`);
  console.log(`📋 Доступные маршруты:`);
  console.log(`   GET    /products        - все продукты`);
  console.log(`   GET    /products/:id    - продукт по ID`);
  console.log(`   POST   /products        - создать продукт`);
  console.log(`   PATCH  /products/:id    - обновить продукт`);
  console.log(`   DELETE /products/:id    - удалить продукт`);
});
