import "./ProductCard.scss";

function formatPrice(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Number(rating) || 0));
  const fullStars = Math.round(safeRating);

  return "★".repeat(fullStars) + "☆".repeat(5 - fullStars);
}

export default function ProductCard({
  id,
  name,
  category,
  description,
  price,
  stock,
  rating,
  image,
  onEdit,
  onDelete,
}) {
  return (
    <article className="product-card">
      {image ? (
        <div className="product-card__media">
          <img className="product-card__image" src={image} alt={name} />
        </div>
      ) : null}

      <div className="product-card__body">
        <p className="product-card__category">{category}</p>
        <h3 className="product-card__title">{name}</h3>
        <p className="product-card__description">{description}</p>

        <div className="product-card__meta">
          <p className="product-card__price">{formatPrice(price)}</p>
          <p className="product-card__stock">На складе: {stock} шт.</p>
        </div>

        {typeof rating === "number" ? (
          <p
            className="product-card__rating"
            aria-label={`Рейтинг ${rating} из 5`}
          >
            {renderStars(rating)} <span>{rating.toFixed(1)}</span>
          </p>
        ) : null}

        <div className="adm_buttons">
          <button className="edit" onClick={() => onEdit?.({ id, name, category, description, price, stock, rating, image })}>
            Редактировать
          </button>
          <button className="delete" onClick={() => onDelete?.(id)}>
            Удалить
          </button>
        </div>
      </div>
    </article>
  );
}
