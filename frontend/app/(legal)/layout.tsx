import Link from "next/link";
import Image from "next/image";

/** Coquille des pages légales : accessibles sans compte, hors du shell applicatif. */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[760px] items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo-clear.png" alt="Kop" width={28} height={28} className="h-7 w-auto" />
            <span className="font-display text-[20px] font-bold tracking-[-0.03em]">Kop</span>
          </Link>
          <Link
            href="/"
            className="text-[13px] font-semibold text-text-3 transition-colors hover:text-text"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-6 text-[12.5px] text-text-3 sm:px-6">
          <Link href="/privacy" className="hover:text-text">
            Politique de confidentialité
          </Link>
          <Link href="/terms" className="hover:text-text">
            Conditions d&apos;utilisation
          </Link>
          <span className="ml-auto">Projet étudiant 42, aucun argent réel.</span>
        </div>
      </footer>
    </div>
  );
}
