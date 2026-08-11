import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Kop",
  description:
    "Règles d'usage de Kop : compte, monnaie virtuelle, comportement, modération, limites de responsabilité.",
};

const UPDATED = "11 août 2026";

export default function TermsPage() {
  return (
    <article>
      <h1 className="font-display text-[30px] font-bold tracking-[-0.02em]">
        Conditions d&apos;utilisation
      </h1>
      <p className="mt-1.5 text-[13px] text-text-3">Dernière mise à jour : {UPDATED}</p>

      <div className="mt-6 rounded-[10px] border border-kop/40 bg-kop/10 px-4 py-3.5 text-[14px] leading-[1.6] text-text">
        <strong>Kop n&apos;est pas un site de paris d&apos;argent.</strong> Aucun euro
        n&apos;entre, aucun euro ne sort. Les Kops sont une monnaie de jeu sans aucune
        valeur, non convertible et non transférable. Aucun gain ne peut être encaissé.
      </div>

      <p className="mt-6 text-[14.5px] leading-[1.6] text-text-2">
        En créant un compte sur Kop, tu acceptes les règles ci-dessous. Si tu n&apos;es
        pas d&apos;accord, n&apos;utilise pas le service.
      </p>

      <Section title="1. Objet du service">
        <p>
          Kop est une plateforme de <strong>pronostics sportifs simulés</strong>. Tu
          places des paris en Kops sur de vrais matchs de football, tu affrontes
          d&apos;autres utilisateurs dans des ligues privées et tu progresses au
          classement. C&apos;est un projet étudiant réalisé dans le cadre du cursus 42,
          sans but lucratif.
        </p>
      </Section>

      <Section title="2. Conditions d'accès">
        <ul>
          <li>Tu dois avoir <strong>16 ans révolus</strong>.</li>
          <li>Un seul compte par personne. Les comptes multiples peuvent être supprimés.</li>
          <li>Les informations que tu fournis à l&apos;inscription doivent être exactes.</li>
          <li>
            Tu es responsable de la confidentialité de ton mot de passe et de
            l&apos;accès à la boîte email associée, puisque le code de connexion y est
            envoyé.
          </li>
        </ul>
      </Section>

      <Section title="3. Les Kops">
        <ul>
          <li>
            Les Kops sont une <strong>monnaie virtuelle interne</strong>. Ils n&apos;ont
            aucune valeur monétaire, ne peuvent être ni achetés, ni vendus, ni convertis,
            ni transférés entre comptes.
          </li>
          <li>
            Chaque nouveau compte reçoit <strong>100 Kops</strong>. Tu peux en obtenir
            davantage par le bonus quotidien, la roue de la chance, les défis et les
            paris gagnants.
          </li>
          <li>
            Un solde à zéro ne bloque pas le compte : le bonus quotidien reste
            disponible.
          </li>
          <li>
            L&apos;équipe peut ajuster un solde en cas de bug, d&apos;abus ou de
            réinitialisation technique. Un solde de Kops ne constitue pas une créance.
          </li>
        </ul>
      </Section>

      <Section title="4. Paris et cotes">
        <ul>
          <li>
            Les cotes sont <strong>calculées par la plateforme</strong> à partir de la
            forme récente des équipes. Elles ne proviennent d&apos;aucun opérateur de
            paris et n&apos;ont aucune valeur de référence.
          </li>
          <li>
            La cote appliquée est celle affichée <strong>au moment où tu valides ton
            pari</strong>. Les variations ultérieures ne modifient pas un pari déjà placé.
          </li>
          <li>
            Un pari validé ne peut pas être annulé. La mise est retenue immédiatement.
          </li>
          <li>
            Le règlement intervient automatiquement après la fin du match. Si un match
            est annulé, les sélections concernées sont neutralisées et la mise
            correspondante remboursée.
          </li>
          <li>
            Les données de match proviennent de sources tierces. Un score erroné ou une
            interruption de la source peut retarder ou fausser un règlement ; nous
            corrigeons dès que possible mais ne garantissons aucune exactitude.
          </li>
        </ul>
      </Section>

      <Section title="5. Comportement attendu">
        <p>Dans les discussions, les noms de ligue, les pseudonymes et les biographies, il est interdit de :</p>
        <ul>
          <li>harceler, menacer, insulter ou tenir des propos haineux, racistes, sexistes ou discriminatoires ;</li>
          <li>publier du contenu à caractère sexuel, violent ou illégal ;</li>
          <li>usurper l&apos;identité d&apos;un autre utilisateur ou de l&apos;équipe ;</li>
          <li>diffuser du spam, de la publicité ou des liens malveillants.</li>
        </ul>
        <p>Sur le plan technique, il est interdit de :</p>
        <ul>
          <li>automatiser l&apos;usage du service (robots, scripts de paris en masse) ;</li>
          <li>tenter de contourner l&apos;authentification, les limites de bonus ou les règles de règlement ;</li>
          <li>exploiter une faille plutôt que de la signaler ;</li>
          <li>surcharger volontairement l&apos;infrastructure.</li>
        </ul>
      </Section>

      <Section title="6. Contenus que tu publies">
        <p>
          Tu restes responsable de ce que tu écris et de la photo que tu envoies. Tu
          garantis disposer des droits sur ta photo de profil. Nous pouvons retirer tout
          contenu contraire aux règles ci-dessus, sans préavis.
        </p>
      </Section>

      <Section title="7. Modération et sanctions">
        <p>
          Les comptes <code>admin</code> et <code>owner</code> peuvent consulter les
          données d&apos;un utilisateur, ajuster un solde, retirer un contenu ou
          supprimer un compte. En cas de manquement, et selon la gravité, nous pouvons :
        </p>
        <ul>
          <li>retirer le contenu en cause ;</li>
          <li>réinitialiser un solde obtenu de façon abusive ;</li>
          <li>suspendre ou supprimer le compte.</li>
        </ul>
      </Section>

      <Section title="8. Disponibilité du service">
        <p>
          Kop est un projet étudiant fourni <strong>en l&apos;état</strong>, sans
          garantie de disponibilité, de continuité ni d&apos;absence de bugs. Le service
          peut être interrompu, modifié ou arrêté à tout moment, et la base de données
          peut être réinitialisée. Nous ne pouvons être tenus responsables de la perte de
          Kops, de statistiques ou de messages.
        </p>
      </Section>

      <Section title="9. Jeu responsable">
        <p>
          Kop reproduit volontairement les mécaniques du pari sportif — cotes, tension du
          direct, combinés, bonus quotidiens — dans un cadre sans argent. Ces mécaniques
          restent conçues pour être captivantes. Si tu constates que tu y passes plus de
          temps que tu ne le souhaites, ou si le pari en argent réel te pose problème par
          ailleurs, des ressources d&apos;aide existent, notamment{" "}
          <a
            href="https://www.joueurs-info-service.fr"
            target="_blank"
            rel="noreferrer"
            className="text-kop-bright hover:underline"
          >
            Joueurs Info Service
          </a>
          .
        </p>
      </Section>

      <Section title="10. Résiliation">
        <p>
          Tu peux demander la suppression de ton compte à tout moment en écrivant à{" "}
          <a href="mailto:contact@kop.life" className="text-kop-bright hover:underline">
            contact@kop.life
          </a>
          . La suppression est définitive : solde, historique de paris et statistiques
          sont perdus.
        </p>
      </Section>

      <Section title="11. Données personnelles">
        <p>
          Le traitement de tes données est décrit dans la{" "}
          <Link href="/privacy" className="text-kop-bright hover:underline">
            politique de confidentialité
          </Link>
          , qui fait partie intégrante des présentes conditions.
        </p>
      </Section>

      <Section title="12. Modification des conditions">
        <p>
          Ces conditions peuvent évoluer. La version en vigueur est celle publiée sur
          cette page, avec sa date de mise à jour. Continuer à utiliser Kop après une
          modification vaut acceptation.
        </p>
      </Section>

      <Section title="13. Droit applicable">
        <p>
          Les présentes conditions sont soumises au <strong>droit français</strong>. En
          cas de litige, une solution amiable sera recherchée en priorité, à l&apos;adresse{" "}
          <a href="mailto:contact@kop.life" className="text-kop-bright hover:underline">
            contact@kop.life
          </a>
          .
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
