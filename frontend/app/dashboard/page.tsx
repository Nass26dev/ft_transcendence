"use client"

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
        }}
      >
        Kop est une plateforme gratuite ici, pas de risques d'endettement,
        isolement, dépendance.
      </div>

      <div
        style={{
          background: "linear-gradient(to right, #000000 0%, #262B38 50%, #000000 100%)",
          padding: "10px",
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
          <button className="HeaderButtonStyle">Dashboard</button>
          <button className="HeaderButtonStyle">Mon compte</button>
          <button className="HeaderButtonStyle">Tournois</button>
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
        background: "linear-gradient(to right, #272C33 0%, #3D424F 50%, #272C33 100%)",
        color: "white",
        padding: "20px",
        textAlign: "center"
      }}
      >
      </div>
  )
}

function Content() {
  return (
    <div style={{
      padding: "40px",
      backgroundColor: "#292E3D",
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