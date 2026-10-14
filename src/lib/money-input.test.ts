import { describe, expect, it } from "vitest";
import { amountOf, cleanAmount, editAmount, formatAmount } from "./money-input";

describe("money input", () => {
  it("cleans typed and pasted text", () => {
    expect(cleanAmount("$1,440.50")).toBe("1440.50");
    expect(cleanAmount("$1,440.505")).toBe("1440.50");
    expect(cleanAmount("1.2.3")).toBe("1.23");
    expect(cleanAmount(".5")).toBe("0.5");
    expect(cleanAmount("007")).toBe("7");
    expect(cleanAmount("0")).toBe("0");
    expect(cleanAmount("$")).toBe("");
    expect(cleanAmount("12345678")).toBe("1234567");
  });
  it("formats while typing", () => {
    expect(formatAmount("")).toBe("");
    expect(formatAmount("1440")).toBe("$1,440");
    expect(formatAmount("1440.")).toBe("$1,440.");
    expect(formatAmount("1440.5")).toBe("$1,440.5");
    expect(formatAmount("1234567.89")).toBe("$1,234,567.89");
  });
  it("round-trips through the formatted text", () => {
    for (const raw of ["", "0.", "3", "1440.5", "999999.99"])
      expect(cleanAmount(formatAmount(raw))).toBe(raw);
  });
  it("never leaves Backspace stuck on formatting", () => {
    // Typing and deleting at the end.
    expect(editAmount("123", "$1234")).toBe("1234");
    expect(editAmount("1234", "$1,23")).toBe("123");
    expect(editAmount("1", "$")).toBe("");
    // Backspace right after a comma deletes the digit before it.
    expect(editAmount("1234", "$1234")).toBe("234");
    expect(editAmount("1234567", "$1,234567")).toBe("123567");
    // Deleting the "$" changes nothing, and that's fine.
    expect(editAmount("1234", "1,234")).toBe("1234");
  });
  it("turns cents into a raw amount", () => {
    expect(amountOf(144000)).toBe("1440");
    expect(amountOf(144050)).toBe("1440.50");
  });
});
