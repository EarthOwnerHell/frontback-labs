import { useEffect, useState } from "react";

function MainPage() {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("notes") || "[]");
    setNotes(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("notes", JSON.stringify(notes));
  }, [notes]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    setText("");
  };

  return (
    <main>
      <h1>Заметки</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Введите заметку"
          required
        />
        <button type="submit">Добавить</button>
      </form>
      <ul>
        {notes.map((note, index) => (
          <li key={`${note}-${index}`}>{note}</li>
        ))}
      </ul>
    </main>
  );
}
export default MainPage;
