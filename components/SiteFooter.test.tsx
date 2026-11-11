import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import en from "@/content/i18n/en";
import pl from "@/content/i18n/pl";
import { SiteFooter } from "./SiteFooter";

describe("SiteFooter", () => {
  afterEach(cleanup);

  it.each([
    ["pl", pl.footer],
    ["en", en.footer],
  ])("shows the %s disclaimer", (_, footer) => {
    render(<SiteFooter dict={footer} />);
    expect(screen.getByTestId("disclaimer").textContent).toBe(footer.disclaimer);
  });
});
