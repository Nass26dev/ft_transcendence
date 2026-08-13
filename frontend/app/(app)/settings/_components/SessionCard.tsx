import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { useProfile } from "../../_components/ProfileProvider";
import { Card } from "./primitives";

/** Carte Session : accès admin (si autorisé) et déconnexion. */
export function SessionCard() {
  const { profile, logout } = useProfile();
  const router = useRouter();
  const canAccessAdmin = profile?.status === "admin" || profile?.status === "owner";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <Card title="Session">
      {canAccessAdmin && (
        <div className="flex items-center justify-between border-b border-border py-3.5">
          <div className="min-w-0 pr-4">
            <div className="text-[13.5px] font-medium text-text">
              Administration
            </div>
            <div className="text-[12px] text-text-3">
              Accéder au panneau d&apos;administration.
            </div>
          </div>

          <Link
            href="/settings/administration"
            className="flex flex-none items-center gap-2 rounded-[10px] border border-kop/40 bg-kop/10 px-4 py-2 text-[13px] font-semibold text-kop-bright transition-colors hover:bg-kop/20"
          >
            <Icon name="shield" size={15} stroke={2} />
            Ouvrir le panneau
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between pt-3.5">
        <div className="min-w-0 pr-4">
          <div className="text-[13.5px] font-medium text-text">
            Déconnexion
          </div>
          <div className="text-[12px] text-text-3">
            Termine ta session sur cet appareil.
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex flex-none items-center gap-2 rounded-[10px] border border-kop/40 bg-kop/10 px-4 py-2 text-[13px] font-semibold text-kop-bright transition-colors hover:bg-kop/20"
        >
          <Icon name="swap" size={15} stroke={2} />
          Se déconnecter
        </button>
      </div>
    </Card>
  );
}
