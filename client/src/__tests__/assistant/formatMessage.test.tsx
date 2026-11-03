import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { formatMessage } from "../../assistant/formatMessage";

const html = (text: string) =>
  render(<div>{formatMessage(text)}</div>).container.firstElementChild!.innerHTML;

describe("formatMessage", () => {
  it("shows **bold** as bold, without the asterisks", () => {
    expect(html("The **2023 Subaru Outback** is $95.")).toBe(
      "<p>The <strong>2023 Subaru Outback</strong> is $95.</p>"
    );
  });

  it("turns lines starting with a dash, bullet or number into one list", () => {
    expect(html("Options:\n- First **car**\n- Second car\n3. Third car")).toBe(
      "<p>Options:</p><ul><li>First <strong>car</strong></li><li>Second car</li><li>Third car</li></ul>"
    );
  });

  it("keeps paragraphs separate and skips blank lines", () => {
    expect(html("One.\n\nTwo.")).toBe("<p>One.</p><p>Two.</p>");
  });

  it("never injects HTML: tags in the text stay text", () => {
    const out = html('<img src=x onerror="alert(1)"> and <b>bold</b>');
    expect(out).toContain("&lt;img");
    expect(out).not.toContain("<img");
    expect(out).not.toContain("<b>");
  });

  it("leaves unmatched asterisks alone", () => {
    expect(html("5 * 3 and **half")).toBe("<p>5 * 3 and **half</p>");
  });

  it("copes with an empty reply", () => {
    expect(html("")).toBe("");
  });
});
