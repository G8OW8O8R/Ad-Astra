import { AdAstraLogo } from "@/components/brand/AdAstraLogo";
import type { Dictionary } from "@/content/i18n/schema";
import type { Locale } from "@/lib/i18n/config";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface Props {
  locale: Locale;
  dict: Dictionary;
}

export function SiteHeader({ locale, dict }: Props) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-6 py-5 md:px-10">
      <a href="#scena" aria-label={dict.common.home} className="text-ink">
        <AdAstraLogo title={null} className="h-5 w-auto md:h-6" />
      </a>
      <LanguageSwitcher current={locale} labels={dict.common} />
    </header>
  );
}
