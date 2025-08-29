import { useState } from "react";

export default function App() {
  const [out, setOut] = useState("Click a button…");

  async function call(path: string) {
    setOut("Loading…");
    const res = await fetch(`/.netlify/functions/${path}`);
    const json = await res.json();
    setOut(JSON.stringify(json, null, 2));
  }

  return (
    <div style={{ padding: 24, fontFamily: "system-ui", color: "#fff" }}>
      <h1>TrakEZ</h1>
      <p>Vite + Netlify + Neon</p>
      <button onClick={() => call("health")}>Health</button>{" "}
      <button onClick={() => call("db-test")}>DB Test</button>
      <pre style={{ background: "#111", padding: 12, borderRadius: 8 }}>{out}</pre>
    </div>
  );
}
