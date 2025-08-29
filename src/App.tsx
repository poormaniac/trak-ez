import { useState, useEffect } from "react";

type Note = { id: number; message: string; created_at: string };

export default function App() {
  const [out, setOut] = useState("Click a button…");
  const [notes, setNotes] = useState<Note[]>([]);
  const [message, setMessage] = useState("");

  async function call(path: string) {
    setOut("Loading…");
    const res = await fetch(`/.netlify/functions/${path}`);
    const json = await res.json();
    setOut(JSON.stringify(json, null, 2));
  }

  async function loadNotes() {
    const res = await fetch(`/.netlify/functions/notes`);
    const data = (await res.json()) as Note[];
    setNotes(data);
  }

  async function addNote() {
    if (!message.trim()) return;
    const res = await fetch(`/.netlify/functions/notes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) {
      setMessage("");
      await loadNotes();
    } else {
      const txt = await res.text();
      alert(`Error: ${txt}`);
    }
  }

  useEffect(() => {
    // optional: load notes on first visit
    loadNotes().catch(() => {});
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", color: "#fff" }}>
      <h1>TrakEZ</h1>
      <p>Vite + Netlify + Neon</p>

      <div style={{ marginBottom: 12 }}>
        <button onClick={() => call("health")}>Health</button>{" "}
        <button onClick={() => call("db-test")}>DB Test</button>
      </div>

      <pre style={{ background: "#111", padding: 12, borderRadius: 8, maxWidth: 520 }}>
        {out}
      </pre>

      <hr style={{ margin: "24px 0", opacity: 0.2 }} />

      <h2>Notes</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a note…"
          style={{ padding: 8, borderRadius: 6, border: "1px solid #333", background: "#111", color: "#fff", width: 320 }}
        />
        <button onClick={addNote}>Add</button>
        <button onClick={loadNotes}>Refresh</button>
      </div>

      {notes.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No notes yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, maxWidth: 520 }}>
          {notes.map((n) => (
            <li key={n.id} style={{ background: "#111", padding: 12, borderRadius: 8, marginBottom: 8 }}>
              <div style={{ fontWeight: 600 }}>{n.message}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{new Date(n.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
