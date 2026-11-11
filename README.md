# Ad Astra

> *Per aspera ad astra — od fundamentu do gwiazd.*

Koncept strony jednej inwestycji deweloperskiej: 42-piętrowej wieży mieszkalnej
nad rzeką we współczesnej metropolii. Przewijanie prowadzi przez budowę
(wykop → rdzeń → konstrukcja → fasada → tarasy → korona ze szpicem), potem na
taras penthouse’u o zmierzchu, do wnętrz i na koniec do części sprzedażowej:
wyszukiwarki mieszkań, jawnych cen, harmonogramu, finansowania i kontaktu.

**Koncept. Inwestycja „Ad Astra” i deweloper „ALTUM Development” są fikcyjne.**
Projekt portfolio GOVO DIGITAL. Strona w dwóch językach: polskim i angielskim.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript (strict) ·
Tailwind CSS 4 · three.js (scena w jednym module, bez React Three Fiber) ·
Lenis · Zustand · Zod · Vitest · Playwright · ESLint · pnpm · Vercel

## Uruchomienie

Wymagania: Node.js ≥ 22, pnpm (wersja z pola `packageManager`, np. przez `corepack enable`).

```bash
pnpm install
cp .env.example .env.local   # opcjonalnie: NEXT_PUBLIC_SITE_URL
pnpm dev                     # http://localhost:3000 → /pl
```

| Polecenie        | Co robi                                         |
| ---------------- | ----------------------------------------------- |
| `pnpm dev`       | serwer deweloperski                             |
| `pnpm build`     | build produkcyjny                               |
| `pnpm start`     | uruchomienie buildu                             |
| `pnpm lint`      | ESLint (bez ostrzeżeń)                          |
| `pnpm test`      | testy jednostkowe (Vitest)                      |
| `pnpm test:e2e`  | testy e2e (Playwright, na buildzie produkcyjnym) |
| `pnpm typecheck` | kontrola typów                                  |

Przed pierwszym `pnpm test:e2e`: `pnpm build` i `pnpm exec playwright install chromium`.

## Struktura

```
app/
  [lang]/          układ główny i strona dla /pl i /en (lang, hreflang, metadane)
  icon.svg         favicon (tymczasowy)
  robots.ts        robots.txt
  globals.css      Tailwind i tokeny (tymczasowe do czasu identyfikacji)
components/        komponenty interfejsu (nagłówek, stopka, sekcje, przełącznik języka)
content/
  i18n/            słowniki PL/EN i ich schemat (Zod)
  sections.ts      lista sekcji strony i ich identyfikatory
lib/
  i18n/            konfiguracja języków i ładowanie słowników
  scene/           moduł sceny three.js: init, setProgress(0–1), resize, dispose
  store/           wspólny stan (Zustand)
  site.ts          adres strony i przełącznik indeksowania
e2e/               testy Playwright
proxy.ts           przekierowanie adresów bez języka na /pl
```

Sekcje strony (kotwice wspólne dla obu języków): `#scena`, `#penthouse`,
`#deweloper`, `#mieszkania`, `#ceny`, `#dostosowanie`, `#lokalizacja`,
`#harmonogram`, `#finansowanie`, `#kontakt`.

## Zasada nr 1: nic nie wygląda jak płaskie zdjęcie wklejone na zdjęcie

- Płaskie mogą być tylko rzeczy dalekie: skyline, rzeka, niebo. Tam brak paralaksy jest fizycznie poprawny.
- Bliskie otoczenie to prosta geometria 3D z obrazem rzutowanym z kamery (camera projection), więc ruch kamery daje prawdziwą paralaksę.
- Wieża i otoczenie mają wspólne światło: ten sam kierunek słońca, cienie wieży na otoczeniu, niebo odbite w szkle, cień kontaktowy, mgiełka.
- Cała klatka przechodzi przez jedną postprodukcję (LUT, bloom, ziarno, winieta).
- Żadnych wycinków przesuwanych jak naklejki. Każdy nowy element sprawdzamy pytaniem: czy przy ruchu kamery zachowuje się jak przedmiot w przestrzeni?

## Dostępność

Cała treść informacyjna jest w HTML, nigdy tylko na canvasie. Przy
`prefers-reduced-motion` płynne przewijanie jest wyłączone. Założenia dla
kolejnych etapów: bez WebGL lub przy reduced motion strona pokazuje listę
etapów ze statycznymi kadrami, a po etapach można przechodzić klawiaturą
(strzałki, Tab).

## Indeksowanie

Do czasu publikacji strona nie jest indeksowana (`meta robots`, nagłówek
`X-Robots-Tag`, `robots.txt`). Wszystkie trzy przełącza jedna stała,
`INDEXING_ENABLED` w `lib/site.ts`.

## Licencja

Repozytorium ma dwie licencje (szczegóły w [LICENSE](LICENSE)):

- **Kod** (TypeScript, CSS, konfiguracja, testy) jest na licencji **MIT**. Możesz go używać, zmieniać i rozpowszechniać.
- **Grafiki, teksty i marka** (obrazy, rendery, tekst strony w każdym języku, nazwy „Ad Astra” i „ALTUM Development”, logo, identyfikacja wizualna, marka GOVO DIGITAL) to **© GOVO DIGITAL, wszelkie prawa zastrzeżone**. Nie wolno ich kopiować ani używać w innych projektach bez pisemnej zgody.

Podział jest celowy: kod może posłużyć innym jako przykład, ale treść i wygląd
tworzą markę projektu portfolio.
