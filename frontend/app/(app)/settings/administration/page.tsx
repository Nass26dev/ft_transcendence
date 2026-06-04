"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "../../_components/ProfileProvider";

export default function AdministrationPage() {
  const { profile, ready } = useProfile();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;

    const allowed =
      profile?.status === "admin" ||
      profile?.status === "owner";

    if (!allowed) {
      router.replace("/settings");
    }
  }, [ready, profile, router]);

  if (!ready) return null;

  const allowed =
    profile?.status === "admin" ||
    profile?.status === "owner";

  if (!allowed) return null;

  return (
    <div>
      Admin panel
    </div>
  );
}