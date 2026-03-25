"use client"

function Header() {
  return (
    <header>
      <div
        style={{
          backgroundColor: "#000000",
          color: "white",
          padding: "10px 20px",
          textAlign: "center",
          fontSize: "18px",
          fontWeight: 500,
          justifyContent: "center",
        }}
      >
        Kop est une plateforme gratuite ici, pas de risques d'endettement,
        isolement, dépendance.
      </div>

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
  return (
    <>
      <Header />
      <AboveContent />
      <Content />
    </>
  )
}