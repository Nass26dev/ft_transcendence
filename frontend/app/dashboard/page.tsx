"use client"

import { useState } from "react"

// types

type Odd = { label: string; value: string; hot?: boolean }
type Match = {
  id: number
  competition: string
  status: "live" | "upcoming" | "finished"
  time: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  odds: [Odd, Odd, Odd]
}
type Selection = { matchId: number; label: string; value: string; teams: string }
type Sport = { id: string; name: string; icon: string }
type Competition = { id: string; name: string; flag: string; sport: string }

// data

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

// matchs de test en attendant qu'on récupere les cotes
const MATCHES: Match[] = [
  {
    id: 1,
    competition: "Ligue des Champions · 1/4 aller",
    status: "live",
    time: "13:22",
    homeTeam: "Real Madrid (F)",
    awayTeam: "Barcelone (F)",
    homeScore: 0,
    awayScore: 2,
    odds: [
      { label: "Real Madrid (F)", value: "60" },
      { label: "Match nul", value: "25" },
      { label: "Barcelone (F)", value: "1,01", hot: true },
    ],
  },
  {
    id: 2,
    competition: "Ligue des Champions · 1/4 aller",
    status: "upcoming",
    time: "21:00",
    homeTeam: "Manchester United (F)",
    awayTeam: "Bayern Munich (F)",
    odds: [
      { label: "Manchester United (F)", value: "2,95" },
      { label: "Match nul", value: "3,85" },
      { label: "Bayern Munich (F)", value: "2,00", hot: true },
    ],
  },
  {
    id: 3,
    competition: "Ligue 1 · J28",
    status: "upcoming",
    time: "20:45",
    homeTeam: "PSG",
    awayTeam: "Marseille",
    odds: [
      { label: "PSG", value: "1,55" },
      { label: "Match nul", value: "4,10" },
      { label: "Marseille", value: "5,20" },
    ],
  },
  {
    id: 4,
    competition: "Premier League · J31",
    status: "upcoming",
    time: "16:00",
    homeTeam: "Arsenal",
    awayTeam: "Liverpool",
    odds: [
      { label: "Arsenal", value: "2,30" },
      { label: "Match nul", value: "3,40" },
      { label: "Liverpool", value: "2,80", hot: true },
    ],
  },
  {
    id: 5,
    competition: "La Liga · J30",
    status: "live",
    time: "67'",
    homeTeam: "Atlético Madrid",
    awayTeam: "Séville",
    homeScore: 1,
    awayScore: 1,
    odds: [
      { label: "Atlético Madrid", value: "2,10" },
      { label: "Match nul", value: "3,20" },
      { label: "Séville", value: "3,50" },
    ],
  },
]

// utils
function LiveDot() {
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: "#E8FF3B",
      boxShadow: "0 0 6px #E8FF3B",
      animation: "pulse 1.5s infinite",
      marginRight: 6,
      flexShrink: 0,
    }} />
  )
}
 
function OddButton({
  odd, selected, onClick
}: { odd: Odd; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: selected
          ? "linear-gradient(135deg, #E8FF3B 0%, #C8E000 100%)"
          : odd.hot
          ? "rgba(232,255,59,0.08)"
          : "rgba(255,255,255,0.04)",
        border: selected
          ? "1.5px solid #E8FF3B"
          : odd.hot
          ? "1.5px solid rgba(232,255,59,0.35)"
          : "1.5px solid rgba(255,255,255,0.08)",
        borderRadius: 8,
        padding: "8px 6px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        minWidth: 0,
      }}
      onMouseEnter={e => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background = "rgba(232,255,59,0.12)"
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(232,255,59,0.4)"
        }
      }}
      onMouseLeave={e => {
        if (!selected) {
          (e.currentTarget as HTMLButtonElement).style.background = odd.hot
            ? "rgba(232,255,59,0.08)"
            : "rgba(255,255,255,0.04)"
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = odd.hot
            ? "rgba(232,255,59,0.35)"
            : "rgba(255,255,255,0.08)"
        }
      }}
    >
      <span style={{
        fontSize: 10,
        color: selected ? "#1a1a1a" : "rgba(255,255,255,0.5)",
        fontWeight: 500,
        textAlign: "center",
        lineHeight: 1.2,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
      }}>{odd.label}</span>
      <span style={{
        fontSize: 15,
        fontWeight: 800,
        color: selected ? "#1a1a1a" : odd.hot ? "#E8FF3B" : "white",
        fontFamily: "'DM Mono', monospace",
        letterSpacing: "-0.5px",
      }}>{odd.value}</span>
    </button>
  )
}
 
function MatchCard({
  match, selections, onSelect
}: {
  match: Match
  selections: Selection[]
  onSelect: (sel: Selection) => void
}) {
  const isSelected = (oddLabel: string) =>
    selections.some(s => s.matchId === match.id && s.label === oddLabel)
 
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 18,
      overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 12px",
        background: "rgba(255,255,255,0.03)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}>
        <span style={{ fontSize: 13 }}>⚽</span>
        {match.status === "live" && <LiveDot />}
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
          {match.competition}
        </span>
        {match.status === "live" && (
          <span style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 700,
            color: "#E8FF3B",
            background: "rgba(232,255,59,0.12)",
            padding: "2px 7px",
            borderRadius: 20,
            letterSpacing: 0.5,
          }}>LIVE</span>
        )}
      </div>
 
      {/* affichage des équipes et du score */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        padding: "14px 16px",
        gap: 8,
      }}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>
            {match.homeTeam.includes("PSG") ? "🔵🔴" :
             match.homeTeam.includes("Arsenal") ? "🔴⚪" :
             match.homeTeam.includes("Atlético") ? "🔴⚪" :
             match.homeTeam.includes("Manchester") ? "🔴" : "⚪"}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "white", lineHeight: 1.3 }}>
            {match.homeTeam}
          </span>
        </div>
 
        <div style={{ textAlign: "center" }}>
          {match.status === "live" || match.status === "finished" ? (
            <>
              <div style={{
                fontSize: 22,
                fontWeight: 900,
                fontFamily: "'DM Mono', monospace",
                color: "#E8FF3B",
                letterSpacing: 2,
              }}>
                {match.homeScore} – {match.awayScore}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                ● {match.time}
              </div>
            </>
          ) : (
            <>
              <div style={{
                fontSize: 18,
                fontWeight: 800,
                color: "rgba(255,255,255,0.7)",
                fontFamily: "'DM Mono', monospace",
                letterSpacing: 1,
              }}>VS</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                {match.time}
              </div>
            </>
          )}
        </div>
 
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>
            {match.awayTeam.includes("Barcelone") ? "🔵🔴" :
             match.awayTeam.includes("Bayern") ? "🔴⚪" :
             match.awayTeam.includes("Marseille") ? "⚪🔵" :
             match.awayTeam.includes("Liverpool") ? "🔴" :
             match.awayTeam.includes("Séville") ? "⚪🔴" : "⚽"}
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: "white", lineHeight: 1.3 }}>
            {match.awayTeam}
          </span>
        </div>
      </div>
 
      {/* affichage des cotes */}
      <div style={{
        display: "flex",
        gap: 6,
        padding: "0 12px 12px",
      }}>
        {match.odds.map((odd, i) => (
          <OddButton
            key={i}
            odd={odd}
            selected={isSelected(odd.label)}
            onClick={() => onSelect({
              matchId: match.id,
              label: odd.label,
              value: odd.value,
              teams: `${match.homeTeam} – ${match.awayTeam}`,
            })}
          />
        ))}
      </div>
    </div>
  )
}
 
function Sidebar({ onSelectCompetition }: { onSelectCompetition: (id: string) => void }) {
  const [activeSport, setActiveSport] = useState("football")
  const [expanded, setExpanded] = useState<string[]>(["football"])
 
  const toggle = (id: string) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setActiveSport(id)
  }
 
  return (
    <aside style={{
      width: 220,
      flexShrink: 0,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      padding: "12px 0",
      overflowY: "auto",
      maxHeight: "100%",
    }}>
      {/* barre de recherche */}
      <div style={{ padding: "0 12px 12px" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: 8,
          padding: "8px 10px",
        }}>
          <span style={{ fontSize: 13, opacity: 0.5 }}>🔍</span>
          <input
            placeholder="Rechercher…"
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "white",
              fontSize: 12,
              width: "100%",
            }}
          />
        </div>
      </div>
 
      {/* raccourcis */}
      <div style={{ padding: "0 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {["📅 Matchs à venir", "⭐ Mes favoris", "🔥 Cotes boostées"].map(item => (
          <div key={item} style={{
            padding: "8px 6px",
            fontSize: 12,
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "background 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            {item}
          </div>
        ))}
      </div>
 
      {/* Sports */}
      <div style={{ padding: "10px 12px 4px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1, marginBottom: 6 }}>
          SPORTS
        </div>
        {SPORTS.map(sport => (
          <div key={sport.id}>
            <div
              onClick={() => toggle(sport.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 6px",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: activeSport === sport.id ? 700 : 500,
                color: activeSport === sport.id ? "white" : "rgba(255,255,255,0.6)",
                background: activeSport === sport.id ? "rgba(232,255,59,0.08)" : "transparent",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => {
                if (activeSport !== sport.id)
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"
              }}
              onMouseLeave={e => {
                if (activeSport !== sport.id)
                  (e.currentTarget as HTMLDivElement).style.background = "transparent"
              }}
            >
              <span>{sport.icon}</span>
              <span style={{ flex: 1 }}>{sport.name}</span>
              <span style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.3)",
                transform: expanded.includes(sport.id) ? "rotate(90deg)" : "none",
                transition: "transform 0.2s",
              }}>›</span>
            </div>
 
            {/* Competitions */}
            {expanded.includes(sport.id) && (
              <div style={{ paddingLeft: 12, paddingBottom: 4 }}>
                {COMPETITIONS.filter(c => c.sport === sport.id).map(comp => (
                  <div
                    key={comp.id}
                    onClick={() => onSelectCompetition(comp.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      padding: "6px 8px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 11,
                      color: "rgba(255,255,255,0.5)",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"
                      ;(e.currentTarget as HTMLDivElement).style.color = "white"
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.background = "transparent"
                      ;(e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.5)"
                    }}
                  >
                    <span style={{ fontSize: 13 }}>{comp.flag}</span>
                    {comp.name}
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
 
function BetSlip({
  selections, onRemove, onClear
}: {
  selections: Selection[]
  onRemove: (matchId: number, label: string) => void
  onClear: () => void
}) {
  const [stake, setStake] = useState("")
  const totalOdds = selections.reduce((acc, s) => {
    const val = parseFloat(s.value.replace(",", "."))
    return isNaN(val) ? acc : acc * val
  }, 1)
  const gain = stake ? (parseFloat(stake) * totalOdds).toFixed(2) : null
 
  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 16,
      display: "flex",
      flexDirection: "column",
      maxHeight: "100%",
      overflowY: "auto",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>🎯</span>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Ma sélection</span>
          {selections.length > 0 && (
            <span style={{
              background: "#E8FF3B",
              color: "#1a1a1a",
              fontSize: 10,
              fontWeight: 800,
              borderRadius: 20,
              padding: "2px 7px",
            }}>{selections.length}</span>
          )}
        </div>
        {selections.length > 0 && (
          <button
            onClick={onClear}
            style={{
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
          >🗑</button>
        )}
      </div>
 
      {selections.length === 0 ? (
        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 10,
          color: "rgba(255,255,255,0.3)",
        }}>
          <span style={{ fontSize: 36 }}>👟</span>
          <span style={{ fontSize: 12, textAlign: "center", lineHeight: 1.5 }}>
            Ton panier est vide.<br />Clique sur une cote pour commencer.
          </span>
        </div>
      ) : (
        <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {selections.map(sel => (
            <div key={`${sel.matchId}-${sel.label}`} style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 9,
              padding: "10px 10px",
              position: "relative",
            }}>
              <button
                onClick={() => onRemove(sel.matchId, sel.label)}
                style={{
                  position: "absolute", top: 6, right: 8,
                  background: "transparent", border: "none",
                  color: "rgba(255,255,255,0.3)", cursor: "pointer",
                  fontSize: 14, padding: 0,
                }}
              >×</button>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>
                {sel.teams}
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
                {sel.label}
              </div>
              <div style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#E8FF3B",
                fontFamily: "'DM Mono', monospace",
              }}>{sel.value}</div>
            </div>
          ))}
 
          {/* lister les paris */}
          {selections.length > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 4px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              marginTop: 4,
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Cote totale</span>
              <span style={{
                fontSize: 16,
                fontWeight: 900,
                color: "#E8FF3B",
                fontFamily: "'DM Mono', monospace",
              }}>{totalOdds.toFixed(2)}</span>
            </div>
          )}
 
          {/* montant */}
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 5 }}>MISE (€)</div>
            <input
              type="number"
              value={stake}
              onChange={e => setStake(e.target.value)}
              placeholder="0,00"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "9px 12px",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'DM Mono', monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
 
          {/* pour l'estimation des gains */}
          {gain && (
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              background: "rgba(232,255,59,0.07)",
              border: "1px solid rgba(232,255,59,0.2)",
              borderRadius: 8,
              padding: "8px 12px",
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Gain potentiel</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#E8FF3B", fontFamily: "'DM Mono', monospace" }}>
                {gain} €
              </span>
            </div>
          )}
 
          {/* bouton de validation */}
          <button style={{
            background: "linear-gradient(135deg, #E8FF3B 0%, #C8E000 100%)",
            border: "none",
            borderRadius: 10,
            padding: "13px",
            fontWeight: 900,
            fontSize: 14,
            color: "#1a1a1a",
            cursor: "pointer",
            letterSpacing: 0.5,
            marginTop: 4,
            transition: "opacity 0.15s",
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            Valider mon pari →
          </button>
        </div>
      )}
    </aside>
  )
}

function Header() {
  return (
    <header>
      <div
        style={{
          backgroundColor: "#000000",
          paddingTop: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ flex: "1", display: "flex", alignItems: "center" }}>
          <img
            src="/full-logo.png"
            alt="Kop Logo"
            style={{ height: "30px", marginLeft: "15px" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            flex: "1",
          }}
        >
          <button
            className="HeaderButtonStyle active"
            onClick={() => window.location.href = "/dashboard"} 
          >Dashboard</button>
          <button
            className="HeaderButtonStyle"
            onClick={() => window.location.href = "/profil"} 
          >Mon compte</button>
          <button
            className="HeaderButtonStyle"
            onClick={() => window.location.href = "/tournament"} 
          >Tournois</button>
            
        </div>

        <div style={{ flex: "1" }} />
      </div>
    </header>
  )
}

function AboveContent() {
  return (
    <div
      style={{
        backgroundColor: "#20272C",
        color: "white",
        padding: "8px",
        textAlign: "center"
      }}
      >

      <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            flex: "1",
          }}
        >
          <button
            className="AboveContentButtonStyle active"
            onClick={() => window.location.href = "/dashboard"} 
          >Acceuil</button>
          <button
            className="AboveContentButtonStyle"
            onClick={() => window.location.href = "/dashboard/history"} 
          >Mes paris</button>
      </div>
      </div>
  )
}

function Content() {
  return (
    <div style={{
      padding: "40px",
      background: "linear-gradient(to right, #000000 0%, #262B38 50%, #000000 100%)",
      minHeight: "100vh"
    }}>
      <h2>Bienvenue !</h2>
      <p>Ici c'est le dashboard.</p>
    </div>
  )
}

export default function Page() {
  const [selections, setSelections] = useState<Selection[]>([])
 
  const handleSelect = (sel: Selection) => {
    setSelections(prev => {
      const exists = prev.find(s => s.matchId === sel.matchId && s.label === sel.label)
      if (exists) return prev.filter(s => !(s.matchId === sel.matchId && s.label === sel.label))

      const filtered = prev.filter(s => s.matchId !== sel.matchId)
      return [...filtered, sel]
    })
  }
 
  const handleRemove = (matchId: number, label: string) => {
    setSelections(prev => prev.filter(s => !(s.matchId === matchId && s.label === label)))
  }
 
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500;700&family=Syne:wght@500;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #000000; color: white; font-family: 'Syne', sans-serif; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
 
      <Header />
      <AboveContent />
 
      <div style={{
        display: "flex",
        height: "calc(100vh - 100px)",
        overflow: "hidden",
        padding: "16px",
        gap: 12,
        background: "linear-gradient(to right, #000000 0%, #20272C 50%, #000000 100%)",
      }}>
        <Sidebar onSelectCompetition={() => {}} />
 
        <main style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16,
        }}>
          {/* Gestion des filtres (à changer selon ce qu'on veut mettre en place) */}
          <div style={{ maxWidth: 680, margin: "0 auto 16px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["🔥 Hot 2", "Buteurs", "Stats joueurs", "Stats équipes", "Résultat"].map((f, i) => (
              <button key={f} style={{
                background: i === 0 ? "#E8FF3B" : "rgba(255,255,255,0.05)",
                border: "1px solid",
                borderColor: i === 0 ? "#E8FF3B" : "rgba(255,255,255,0.1)",
                color: i === 0 ? "#1a1a1a" : "rgba(255,255,255,0.6)",
                borderRadius: 20,
                padding: "5px 14px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: i === 0 ? 800 : 500,
              }}>{f}</button>
            ))}
          </div>
          </div>
 
          <h2 style={{
            fontSize: 14,
            fontWeight: 700,
            color: "rgba(255,255,255,0.4)",
            letterSpacing: 1,
            marginBottom: 12,
            maxWidth: 680,
            margin: "0 auto 12px",
          }}>MATCHS DU JOUR</h2>
 
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 680, margin: "0 auto" }}>
            {MATCHES.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                selections={selections}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </main>
 
        <BetSlip
          selections={selections}
          onRemove={handleRemove}
          onClear={() => setSelections([])}
        />
      </div>
    </>
  )
}