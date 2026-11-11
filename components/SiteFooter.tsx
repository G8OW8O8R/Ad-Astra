import type { Dictionary } from "@/content/i18n/schema";

interface Props {
  dict: Dictionary["footer"];
}

export function SiteFooter({ dict }: Props) {
  return (
    <footer className="border-t border-ink/10 px-6 py-10 text-sm text-ink/70 md:px-10">
      <p data-testid="disclaimer" className="font-medium text-ink">
        {dict.disclaimer}
      </p>
      <p className="mt-2">{dict.copyright}</p>
    </footer>
  );
}
