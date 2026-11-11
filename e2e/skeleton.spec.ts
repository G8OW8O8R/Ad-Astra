import { expect, test } from "@playwright/test";

const sectionIds = [
  "scena",
  "penthouse",
  "deweloper",
  "mieszkania",
  "ceny",
  "dostosowanie",
  "lokalizacja",
  "harmonogram",
  "finansowanie",
  "kontakt",
];

test("root redirects to /pl", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/pl$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "pl");
});

test("PL page has all sections, footer and noindex", async ({ page }) => {
  const response = await page.goto("/pl");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");

  for (const id of sectionIds) {
    await expect(page.locator(`section#${id}`)).toHaveCount(1);
  }
  await expect(page.getByTestId("disclaimer")).toHaveText(
    "Koncept. Inwestycja i deweloper są fikcyjne.",
  );
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute(
    "href",
    /\/en$/,
  );
  await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute(
    "href",
    /\/pl$/,
  );
});

test("language switcher goes to EN", async ({ page }) => {
  await page.goto("/pl");
  await page.getByRole("link", { name: /English/ }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByTestId("disclaimer")).toContainText("fictional");
});

test("unknown locale returns 404", async ({ page }) => {
  const response = await page.goto("/pl/nie-istnieje");
  expect(response?.status()).toBe(404);
});

test("robots.txt disallows everything", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(await res.text()).toMatch(/Disallow: \//);
});
