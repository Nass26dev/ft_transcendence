import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Kop",
  description:
    "Quelles données Kop collecte, pourquoi, combien de temps, et comment exercer tes droits.",
};

const UPDATED = "11 août 2026";

export default function PrivacyPage() {
  return (
    <article>
      <h1 className="font-display text-[30px] font-bold tracking-[-0.02em]">
        Politique de confidentialité
      </h1>
      <p className="mt-1.5 text-[13px] text-text-3">Dernière mise à jour : {UPDATED}</p>

      <p className="mt-6 text-[14.5px] leading-[1.6] text-text-2">
        Kop est une plateforme de pronostics sportifs <strong>sans argent réel</strong>,
        développée dans le cadre du cursus 42. Cette page décrit exactement quelles
        données nous collectons, pourquoi, combien de temps nous les gardons, et
        comment tu peux les récupérer ou les faire supprimer.
      </p>

      <Section title="1. Qui traite tes données">
        <p>
          Kop est un projet étudiant réalisé par une équipe de quatre apprenants de
          l&apos;école 42. Il n&apos;y a ni société, ni exploitation commerciale, ni
          revente de données. Pour toute question ou demande, écris à{" "}
          <a href="mailto:contact@kop.life" className="text-kop-bright hover:underline">
            contact@kop.life
          </a>
          .
        </p>
      </Section>

      <Section title="2. Données que nous collectons">
        <p>Nous ne collectons que ce dont l&apos;application a besoin pour fonctionner.</p>
        <Table
          head={["Donnée", "Origine", "Pourquoi"]}
          rows={[
            ["Adresse email", "Toi, à l'inscription", "Identifiant de connexion, envoi du code de connexion"],
            ["Mot de passe", "Toi", "Authentification. Stocké haché et salé, jamais en clair, jamais lisible par l'équipe"],
            ["Pseudonyme", "Toi", "Affichage public dans les classements, ligues et discussions"],
            ["Prénom, nom, biographie", "Toi, facultatif", "Affichage sur ton profil"],
            ["Photo de profil", "Toi, facultatif", "Affichage sur ton profil"],
            ["Solde de Kops et historique des paris", "Ton activité", "Fonctionnement du jeu, statistiques, classements"],
            ["Ligues, amitiés, messages", "Ton activité", "Fonctionnalités sociales"],
            ["Notifications", "Ton activité", "Te prévenir d'un résultat, d'une invitation, d'un message"],
            ["Dates du dernier bonus et du dernier tour de roue", "Ton activité", "Limiter ces bonus à un par jour"],
            ["Identifiant Google", "Google, si tu utilises ce mode de connexion", "Rattacher ta connexion Google à ton compte"],
          ]}
        />
        <p>
          Nous ne collectons <strong>aucune donnée bancaire</strong> : il n&apos;y a
          aucun paiement sur Kop. Nous n&apos;utilisons ni traceur publicitaire, ni
          outil de mesure d&apos;audience, ni revente à des tiers.
        </p>
      </Section>

      <Section title="3. Fondement juridique">
        <p>
          Le traitement de ton email, de ton mot de passe et de ton activité de jeu est
          nécessaire à <strong>l&apos;exécution du service</strong> que tu demandes en
          créant un compte. Les champs facultatifs (prénom, nom, biographie, photo)
          reposent sur ton <strong>consentement</strong> : tu peux les laisser vides ou
          les effacer à tout moment depuis les réglages.
        </p>
      </Section>

      <Section title="4. Destinataires">
        <p>Tes données ne sortent de la plateforme que vers deux prestataires techniques :</p>
        <ul>
          <li>
            <strong>Brevo</strong> : reçoit ton adresse email pour t&apos;envoyer le code
            de connexion à six chiffres. Aucune autre donnée ne lui est transmise.
          </li>
          <li>
            <strong>Google</strong> : uniquement si tu choisis de te connecter avec ton
            compte Google, selon la politique de confidentialité de Google.
          </li>
        </ul>
        <p>
          Les données de matchs (scores, compositions, événements) proviennent de sources
          publiques et ne contiennent aucune information te concernant.
        </p>
      </Section>

      <Section title="5. Ce qui est visible par les autres">
        <p>
          Ton pseudonyme, ta photo, ta biographie, tes statistiques de jeu et ta position
          au classement sont visibles par les autres utilisateurs. Tu peux sortir des
          classements publics et du fil d&apos;activité des amis en désactivant{" "}
          <strong>« Profil public »</strong> dans tes réglages.
        </p>
        <p>
          Tes messages privés ne sont lisibles que par ton interlocuteur. Les messages de
          ligue sont lisibles par tous les membres de cette ligue.
        </p>
      </Section>

      <Section title="6. Cookies">
        <p>
          Kop dépose deux cookies, tous deux <strong>strictement nécessaires</strong> à
          la connexion : <code>access_token</code> et <code>refresh_token</code>. Ils sont{" "}
          <code>httpOnly</code>, donc inaccessibles au JavaScript de la page, et
          transmis en <code>SameSite=Lax</code>. Le premier expire au bout de 5 minutes,
          le second au bout de 7 jours.
        </p>
        <p>
          Aucun cookie publicitaire, aucun cookie de mesure d&apos;audience, aucun
          traceur tiers. C&apos;est pourquoi Kop n&apos;affiche pas de bandeau de
          consentement : il n&apos;y a rien à consentir au-delà du strictement nécessaire.
        </p>
      </Section>

      <Section title="7. Durée de conservation">
        <ul>
          <li>
            <strong>Compte et activité</strong> : conservés tant que ton compte existe.
          </li>
          <li>
            <strong>Code de connexion</strong> : stocké 5 minutes, puis effacé
            automatiquement.
          </li>
          <li>
            <strong>Après suppression du compte</strong> : tes données personnelles sont
            supprimées. Les messages que tu as envoyés dans une ligue peuvent subsister
            de façon anonymisée pour ne pas trouer les conversations des autres membres.
          </li>
        </ul>
        <p className="text-text-3">
          Kop étant un projet étudiant, la base de données peut être réinitialisée entre
          deux phases de développement. Ne considère aucune donnée comme archivée
          durablement.
        </p>
      </Section>

      <Section title="8. Sécurité">
        <ul>
          <li>Mots de passe hachés et salés, jamais stockés en clair</li>
          <li>Second facteur obligatoire à chaque connexion, par code envoyé à ton email</li>
          <li>Jetons de session en cookies <code>httpOnly</code>, hors de portée du JavaScript</li>
          <li>Chiffrement TLS des échanges</li>
          <li>Accès administrateur restreint et journalisé côté serveur</li>
        </ul>
        <p className="text-text-3">
          Aucun système n&apos;est infaillible. Si tu découvres une faille, préviens-nous
          à <a href="mailto:contact@kop.life" className="text-kop-bright hover:underline">contact@kop.life</a>{" "}
          plutôt que de l&apos;exploiter.
        </p>
      </Section>

      <Section title="9. Tes droits">
        <p>
          Conformément au RGPD, tu disposes d&apos;un droit d&apos;accès, de
          rectification, d&apos;effacement, de portabilité, de limitation et
          d&apos;opposition sur tes données.
        </p>
        <ul>
          <li>
            <strong>Consulter et rectifier</strong> : directement depuis la page
            Réglages, qui expose l&apos;essentiel de tes données de compte.
          </li>
          <li>
            <strong>Effacer, exporter ou t&apos;opposer</strong> : écris à{" "}
            <a href="mailto:contact@kop.life" className="text-kop-bright hover:underline">
              contact@kop.life
            </a>
            . Nous répondons sous 30 jours.
          </li>
        </ul>
        <p>
          Tu peux également introduire une réclamation auprès de la CNIL
          (<a href="https://www.cnil.fr" className="text-kop-bright hover:underline" target="_blank" rel="noreferrer">cnil.fr</a>).
        </p>
      </Section>

      <Section title="10. Âge minimum">
        <p>
          Kop est ouvert à partir de <strong>16 ans</strong>. Aucune donnée n&apos;est
          sciemment collectée auprès de personnes plus jeunes ; si c&apos;était le cas,
          signale-le-nous et le compte sera supprimé.
        </p>
      </Section>

      <Section title="11. Modifications">
        <p>
          Toute évolution de cette politique sera publiée sur cette page, avec la date de
          mise à jour ci-dessus. Un changement substantiel te sera signalé dans
          l&apos;application.
        </p>
      </Section>
    </article>
  );
}

// ---------- Sous-composants ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-[19px] font-bold tracking-[-0.01em]">{title}</h2>
      <div className="mt-2.5 flex flex-col gap-3 text-[14px] leading-[1.65] text-text-2 [&_code]:rounded [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12.5px] [&_li]:ml-4.5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
        {children}
      </div>
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-border">
      <table className="w-full min-w-[520px] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border bg-surface-1 text-left">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-semibold text-text-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]} className="border-b border-border last:border-b-0">
              {r.map((cell, i) => (
                <td key={i} className="px-3 py-2.5 align-top text-text-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
