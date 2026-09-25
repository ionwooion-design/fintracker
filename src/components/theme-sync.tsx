import { useEffect } from "react";
import type { FinanceSnapshot } from "@/lib/finance/types";

export function ThemeSync({ snapshot }: { snapshot?: FinanceSnapshot }) {
  useEffect(() => {
    if (snapshot == null) return;
    const dark = snapshot.settings.darkTheme;
    document.documentElement.classList.toggle("dark", dark);
  }, [snapshot?.settings.darkTheme]);
  return null;
}
