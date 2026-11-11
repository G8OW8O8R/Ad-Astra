import { AltumMark } from "@/components/brand/AltumMark";
import type { Dictionary } from "@/content/i18n/schema";

interface Props {
  dict: Dictionary["footer"];
}

export function SiteFooter({ dict }: Props) {
  return (
    <footer className="border-t border-gold px-6 py-12 md:px-10">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <AltumMark className="h-12 w-auto text-ink" />
        <div className="space-y-2 md:text-right">
          <p data-testid="disclaimer" className="text-sm text-ink">
            {dict.disclaimer}
          </p>
          <p className="label text-ink-soft">{dict.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
