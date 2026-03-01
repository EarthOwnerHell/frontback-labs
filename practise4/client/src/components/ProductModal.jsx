import { useState } from "react";
import "./ProductModal.scss";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  stock: "",
  rating: "",
  image: "",
};

export default function ProductModal({
  mode,
  product,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(() =>
    mode === "edit" && product
      ? {
          name: product.name ?? "",
          category: product.category ?? "",
          description: product.description ?? "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          rating: product.rating ?? "",
          image: product.image ?? "",
        }
      : emptyForm,
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      description: form.description,
      price: Number(form.price),
      stock: Number(form.stock),
      rating: Number(form.rating),
      image: form.image.trim(),
    };

    if (mode === "edit" && product?.id) {
      onSubmit({ id: product.id, ...payload });
      return;
    }

    onSubmit(payload);
  };

  return (
    <div className="product-modal" role="dialog" aria-modal="true">
      <div className="product-modal__backdrop" onClick={onClose} />
      <div className="product-modal__content">
        <h2 className="product-modal__title">
          {mode === "edit" ? "Редактировать товар" : "Добавить товар"}
        </h2>

        <form className="product-modal__form" onSubmit={handleSubmit}>
          <label>
            Название
            <input
              required
              name="name"
              value={form.name}
              onChange={handleChange}
            />
          </label>

          <label>
            Категория
            <input
              required
              name="category"
              value={form.category}
              onChange={handleChange}
            />
          </label>

          <label>
            Описание
            <textarea
              required
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
          </label>

          <div className="product-modal__row">
            <label>
              Цена
              <input
                required
                min="0"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
              />
            </label>

            <label>
              Остаток
              <input
                required
                min="0"
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="product-modal__row">
            <label>
              Рейтинг
              <input
                min="0"
                max="5"
                step="0.1"
                type="number"
                name="rating"
                value={form.rating}
                onChange={handleChange}
              />
            </label>

            <label>
              URL фото
              <input
                name="image"
                value={form.image}
                onChange={handleChange}
              />
            </label>
          </div>

          <div className="product-modal__actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
