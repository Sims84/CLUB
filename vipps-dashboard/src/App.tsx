import { useState } from "react";
import "./App.css";

const API_URL = "https://sims84.app.n8n.cloud/webhook/player-dashboard";
const CLUB_ID = "testclub";

type Suggestion = {
  name: string;
  vipps: string;
  amount: number;
} | null;

type Player = {
  id: string;
  name: string;
  vipps: string;
  saldo: number;
};

type ApiResponse = {
  player: Player;
  direction: "pay" | "receive" | null;
  suggestion: Suggestion;
  balances: any[];
};

function App() {
  const [playerId, setPlayerId] = useState("ola");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchData(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clubId: CLUB_ID,
          playerId,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const raw = await res.json();
      console.log("API response:", raw);

      // Mange no-code/verktøy returnerer eit array – ta første entry i så fall
      const json = Array.isArray(raw) ? raw[0] : raw;

      if (!json || !json.player) {
        console.error("Unexpected API shape:", json);
        throw new Error("API-response manglar 'player'-felt");
      }

      setData(json as ApiResponse);
    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Noko gjekk gale");
    } finally {
      setLoading(false);
    }
  }

  const saldoText =
    data?.player != null
      ? data.player.saldo > 0
        ? `+${data.player.saldo}`
        : data.player.saldo
      : null;

  return (
    <div className="app">
      <header className="header">
        <h1>Gjer opp med Vipps</h1>
        <p>
          Systemet føreslår kven du bør vippse, basert på kven som skuldar og kven som
          sår1.
        </p>
      </header>

      <form className="player-form" onSubmit={fetchData}>
        <label>
          Spelar-ID
          <input
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            placeholder="ola, kari, per…"
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Hentar…" : "Hent saldo"}
        </button>
      </form>

      {error && <div className="error">Feil: {error}</div>}

      {data && (
        <main className="grid">
          {/* Venstre kolonne – profil og saldo */}
          <section className="card">
            <h2>Din saldo og profil</h2>
            <div className="profile">
              <div className="avatar">
                {data.player.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="name">{data.player.name}</div>
                <div className="sub">Vipps {data.player.vipps}</div>
              </div>
            </div>

            <div className="saldo-box">
              <div className="label">
                {data.player.saldo < 0 ? "Skylder" : "Har til gode"}
              </div>
              <div className="saldo">{saldoText} kr</div>
            </div>
          </section>

          {/* Høgre kolonne – forslag til betaling */}
          <section className="card">
            <h2>Føreslått vipps-betaling</h2>
            {data.suggestion ? (
              <>
                <div className="suggest-line">
                  <div>
                    <div className="name">{data.suggestion.name}</div>
                    <div className="sub">
                      Vipps: {data.suggestion.vipps}
                    </div>
                  </div>
                  <div className="amount">{data.suggestion.amount} kr</div>
                </div>

                <p className="hint">
                  Baserte på rekneskapen skuldar du {data.suggestion.name}{" "}
                  {data.suggestion.amount} kr.
                  Når du har vippsa, kan du markere som betalt.
                </p>

                <div className="button-row">
                  <button type="button">Markér som betalt</button>
                </div>
              </>
            ) : (
              <p>Ingen spesifikk anbefaling akkurat no.</p>
            )}
          </section>
        </main>
      )}
    </div>
  );
}

export default App;
