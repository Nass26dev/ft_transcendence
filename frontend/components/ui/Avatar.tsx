import React from "react";

interface AvatarProps {
  /** URL de la photo de profil. Si absente/null → initiales. */
  src?: string | null;
  /** Initiales affichées en repli (déjà calculées par l'appelant). */
  initials: string;
  /** Classes de taille et de texte, ex. "h-9 w-9 text-[13px]". */
  className?: string;
  /** Couleur de fond pleine du repli (sinon dégradé de marque). */
  color?: string;
  /** Couleur du texte du repli, utilisée avec `color`. */
  textColor?: string;
  title?: string;
}

/** Avatar utilisateur : affiche la photo si elle existe, sinon une pastille
 *  avec les initiales. Comportement unique partagé par toute l'app. */
export function Avatar({
  src,
  initials,
  className = "",
  color,
  textColor,
  title,
}: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={title ?? initials}
        title={title}
        className={`flex-none rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      title={title}
      style={color ? { background: color, color: textColor ?? "#fff" } : undefined}
      className={[
        "grid flex-none place-items-center rounded-full font-bold",
        color ? "" : "bg-gradient-to-br from-[#FF6B6B] to-[#C9184A] text-white",
        className,
      ].join(" ")}
    >
      {initials}
    </div>
  );
}
