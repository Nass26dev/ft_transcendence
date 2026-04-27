"use client"

<<<<<<< HEAD
export default function page() {
  return (
    <div>Bienvenue</div>
  )
}
=======
import { useState, useEffect } from "react"
import api from "@/utils/api";

interface Odd {
  label: string;
  value: string;
  hot?: boolean;
}

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  status: "upcoming" | "live" | "finished";
  time: string;
  competition: string;
  odds: Odd[];
}

interface Selection {
  matchId: number;
  label: string;
  value: string;
  teams: string;
}

interface Sport {
  id: string;
  name: string;
  icon: string;
}

interface Competition {
  id: string;
  name: string;
  flag: string;
  sport: string;
}

// --- DATA ---
const SPORTS: Sport[] = [
  { id: "football", name: "Football", icon: "⚽" },
  { id: "tennis", name: "Tennis", icon: "🎾" },
  { id: "basketball", name: "Basketball", icon: "🏀" },
]

const COMPETITIONS: Competition[] = [
  { id: "ucl", name: "Ligue des Champions", flag: "🇪🇺", sport: "football" },
  { id: "l1", name: "Ligue 1", flag: "🇫🇷", sport: "football" },
  { id: "pl", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", sport: "football" },
  { id: "liga", name: "La Liga", flag: "🇪🇸", sport: "football" },
]

// --- UTILS ---
function LiveDot() {
  return (
    <span style={{
      display: "inline-block", width: 8, height: 8, borderRadius: "50%",
      background: "#E8FF3B", boxShadow: "0 0 6px #E8FF3B",
      animation: "pulse 1.5s infinite", marginRight: 6, flexShrink: 0,
    }} />
  )
}

function OddButton({ odd, selected, onClick }: { odd: Odd; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: selected ? "linear-gradient(135deg, #E8FF3B 0%, #C8E000 100%)" : odd.hot ? "rgba(232,255,59,0.08)" : "rgba(255,255,255,0.04)",
        border: selected ? "1.5px solid #E8FF3B" : odd.hot ? "1.5px solid rgba(232,255,59,0.35)" : "1.5px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "8px 6px", cursor: "pointer", transition: "all 0.18s ease",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 0,
      }}
    >
      <span style={{ fontSize: 10, color: selected ? "#1a1a1a" : "rgba(255,255,255,0.5)", fontWeight: 500, textAlign: "center", width: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{odd.label}</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: selected ? "#1a1a1a" : odd.hot ? "#E8FF3B" : "white", fontFamily: "'DM Mono', monospace" }}>{odd.value}</span>
    </button>
  )
}

function MatchCard({ match, selections, onSelect }: { match: Match; selections: Selection[]; onSelect: (sel: Selection) => void }) {
  const isSelected = (oddLabel: string) => selections.some(s => s.matchId === match.id && s.label === oddLabel)
  
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 6, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <span style={{ fontSize: 13 }}>⚽</span>
        {match.status === "live" && <LiveDot />}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>{match.competition}</span>
        {match.status === "live" && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#E8FF3B", background: "rgba(232,255,59,0.12)", padding: "2px 7px", borderRadius: 20 }}>LIVE</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "14px 16px", gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>{match.homeTeam}</span>
        <div style={{ textAlign: "center" }}>
          {match.status !== "upcoming" ? (
            <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'DM Mono', monospace", color: "#E8FF3B" }}>
              {match.homeScore} – {match.awayScore}
            </div>
          ) : (
            <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(255,255,255,0.7)", fontFamily: "'DM Mono', monospace" }}>VS</div>
          )}
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{match.time}</div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: "white", textAlign: "right" }}>{match.awayTeam}</span>
      </div>

      <div style={{ display: "flex", gap: 6, padding: "0 12px 12px" }}>
        {match.odds.map((odd, i) => (
          <OddButton key={i} odd={odd} selected={isSelected(odd.label)} onClick={() => onSelect({ matchId: match.id, label: odd.label, value: odd.value, teams: `${match.homeTeam} – ${match.awayTeam}` })} />
        ))}
      </div>
    </div>
  )
}

function Sidebar({ onSelectCompetition }: { onSelectCompetition: (id: string) => void }) {
  const [expanded, setExpanded] = useState<string[]>(["football"])

  return (
    <aside style={{ width: 220, flexShrink: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "12px 0", overflowY: "auto" }}>
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "8px 10px" }}>
          <span style={{ fontSize: 13, opacity: 0.5 }}>🔍</span>
          <input placeholder="Rechercher…" style={{ background: "transparent", border: "none", outline: "none", color: "white", fontSize: 12, width: "100%" }} />
        </div>
      </div>

      <div style={{ padding: "10px 12px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 6 }}>SPORTS</div>
        {SPORTS.map(sport => (
          <div key={sport.id}>
            <div onClick={() => setExpanded(p => p.includes(sport.id) ? p.filter(x => x !== sport.id) : [...p, sport.id])}
                 style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 6px", cursor: "pointer", fontSize: 13, color: "white" }}>
              <span>{sport.icon}</span><span style={{ flex: 1 }}>{sport.name}</span>
            </div>
            {expanded.includes(sport.id) && (
              <div style={{ paddingLeft: 12 }}>
                {COMPETITIONS.filter(c => c.sport === sport.id).map(comp => (
                  <div key={comp.id} onClick={() => onSelectCompetition(comp.id)} style={{ padding: "6px 8px", cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {comp.flag} {comp.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

function BetSlip({ selections, onRemove, onClear }: { selections: Selection[]; onRemove: (id: number, lbl: string) => void; onClear: () => void }) {
  const [stake, setStake] = useState("")
  const totalOdds = selections.reduce((acc, s) => acc * parseFloat(s.value.replace(",", ".")), 1)
  const gain = stake ? (parseFloat(stake) * totalOdds).toFixed(2) : null

  return (
    <aside style={{ width: 240, flexShrink: 0, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontWeight: 700, fontSize: 13 }}>Ma sélection ({selections.length})</span>
        {selections.length > 0 && <button onClick={onClear} style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>🗑</button>}
      </div>

      <div style={{ padding: "10px 12px", overflowY: "auto", flex: 1 }}>
        {selections.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 40 }}>Panier vide</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selections.map(sel => (
              <div key={`${sel.matchId}-${sel.label}`} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 9, padding: 10, position: "relative" }}>
                <button onClick={() => onRemove(sel.matchId, sel.label)} style={{ position: "absolute", top: 6, right: 8, background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer" }}>×</button>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{sel.teams}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{sel.label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "#E8FF3B", fontFamily: "'DM Mono', monospace" }}>{sel.value}</div>
              </div>
            ))}
            {selections.length > 1 && <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 4px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Cote totale</span>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#E8FF3B" }}>{totalOdds.toFixed(2)}</span>
            </div>}
            <input type="number" value={stake} onChange={e => setStake(e.target.value)} placeholder="MISE (€)" style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: 9, color: "white", outline: "none" }} />
            {gain && <div style={{ display: "flex", justifyContent: "space-between", background: "rgba(232,255,59,0.07)", padding: 8, borderRadius: 8 }}>
              <span style={{ fontSize: 11 }}>Gain potentiel</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#E8FF3B" }}>{gain} €</span>
            </div>}
            <button style={{ background: "linear-gradient(135deg, #E8FF3B 0%, #C8E000 100%)", border: "none", borderRadius: 10, padding: 13, fontWeight: 900, cursor: "pointer" }}>Valider mon pari →</button>
          </div>
        )}
      </div>
    </aside>
  )
}

function Header() {
  return (
    <header style={{ backgroundColor: "#000000", padding: "8px 15px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <img src="/full-logo.png" alt="Kop Logo" style={{ height: "30px" }} />
      <div style={{ display: "flex", gap: "8px" }}>
        <button className="HeaderButtonStyle active" onClick={() => window.location.href = "/dashboard"}>Dashboard</button>
        <button className="HeaderButtonStyle" onClick={() => window.location.href = "/profil"}>Mon compte</button>
        <button className="HeaderButtonStyle" onClick={() => window.location.href = "/tournament"}>Tournois</button>
      </div>
      <div style={{ width: "30px" }} />
    </header>
  )
}

function AboveContent() {
  return (
    <div style={{ backgroundColor: "#20272C", color: "white", padding: "8px", textAlign: "center", display: "flex", gap: "8px", justifyContent: "center" }}>
      <button className="AboveContentButtonStyle active" onClick={() => window.location.href = "/dashboard"}>Acceuil</button>
      <button className="AboveContentButtonStyle" onClick={() => window.location.href = "/dashboard/history"}>Mes paris</button>
    </div>
  )
}

export default function Page() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [selections, setSelections] = useState<Selection[]>([])

  useEffect(() => {
    api.get(`${process.env.NEXT_PUBLIC_API_URL}/api/matches/`)
      .then(res => setMatches(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const handleSelect = (sel: Selection) => {
    setSelections(prev => {
      const exists = prev.find(s => s.matchId === sel.matchId && s.label === sel.label)
      if (exists) return prev.filter(s => !(s.matchId === sel.matchId && s.label === sel.label))
      return [...prev.filter(s => s.matchId !== sel.matchId), sel]
    })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;700&family=Syne:wght@700;800;900&display=swap');
        body { background: #000000; color: white; font-family: 'Syne', sans-serif; margin: 0; overflow: hidden; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
      `}</style>

      <Header />
      <AboveContent />

      <div style={{ display: "flex", height: "calc(100vh - 100px)", padding: "16px", gap: 12, background: "linear-gradient(to right, #000000 0%, #20272C 50%, #000000 100%)" }}>
        <Sidebar onSelectCompetition={() => {}} />

        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.4)", margin: "0 auto 12px", maxWidth: 680 }}>
            {loading ? "CHARGEMENT..." : "MATCHS DU JOUR"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680, margin: "0 auto" }}>
            {matches.map(m => <MatchCard key={m.id} match={m} selections={selections} onSelect={handleSelect} />)}
          </div>
        </main>

        <BetSlip selections={selections} onRemove={(id, lbl) => setSelections(p => p.filter(s => !(s.matchId === id && s.label === lbl)))} onClear={() => setSelections([])} />
      </div>
    </>
  )
}
>>>>>>> engiusep
