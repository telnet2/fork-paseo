import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { CustomCssProvider, type CssStorage } from "./provider.web";
import { CustomCssSection } from "./section.web";
import { WIDE_COMPACT_CSS } from "./css";

class TestStorage implements CssStorage {
  fail = true;
  saved: string | null = null;
  getItem() {
    return this.saved;
  }
  setItem(_key: string, value: string) {
    if (this.fail) throw new Error("Storage is full");
    this.saved = value;
  }
}

let root: Root;
let container: HTMLDivElement;
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

test("shows storage failures without applying the unsaved reset and allows retry", () => {
  const storage = new TestStorage();
  act(() =>
    root.render(
      <CustomCssProvider storage={storage}>
        <CustomCssSection />
      </CustomCssProvider>,
    ),
  );
  const reset = [...container.querySelectorAll('[role="button"]')].find(
    (button) => button.textContent === "Reset CSS",
  );
  if (!(reset instanceof HTMLElement)) throw new Error("Reset CSS button missing");
  act(() => reset.click());
  expect(container.querySelector('[role="alert"]')?.textContent).toContain("Could not save CSS");
  expect(document.getElementById("paseo-custom-css")?.textContent).toContain(WIDE_COMPACT_CSS);
  storage.fail = false;
  act(() => reset.click());
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).toContain("CSS saved and applied.");
  expect(document.getElementById("paseo-custom-css")?.textContent).toBe("");
  expect(storage.saved).toBe("");
});
