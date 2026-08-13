import React from "react";

/** Préférence booléenne persistée dans le localStorage sous la clé `kop.pref.<key>`. */
export function usePref(key: string, initial: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = React.useState<boolean>(initial);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(`kop.pref.${key}`);
    if (stored !== null) setValue(stored === "1");
  }, [key]);

  const update = React.useCallback(
    (v: boolean) => {
      setValue(v);
      window.localStorage.setItem(`kop.pref.${key}`, v ? "1" : "0");
    },
    [key],
  );

  return [value, update];
}
