import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import ts from "typescript";
const layout = readFileSync("app/layout.tsx", "utf8");
assert(
  layout.includes('import "./interface.css";') &&
    layout.includes('import "./chat-layout.css";'),
  "the rebuilt interface and chat layout are loaded",
);
for (const retired of ["globals.css", "design-system.css", "screen-polish.css"])
  assert(
    !layout.includes(retired),
    "retired styling layers cannot override the rebuilt interface",
  );
assert(
  layout.includes("initialScale: 1") && !layout.includes("maximumScale"),
  "mobile layout uses natural sizing and permits pinch zoom",
);
const viewportSource = readFileSync("app/chat-viewport.ts", "utf8");
const { chatViewportState } = await import(
  "data:text/javascript;base64," +
    Buffer.from(
      ts.transpileModule(viewportSource, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      }).outputText,
    ).toString("base64")
);
assert.deepEqual(
  chatViewportState(844, 844, 480, 420, true),
  { keyboardOpen: true, layoutHeight: 844, height: 480, top: 364 },
  "visual viewport offsets stay within the space reduced by the keyboard",
);
assert.deepEqual(
  chatViewportState(844, 844, 844, 120, false),
  { keyboardOpen: false, layoutHeight: 844, height: null, top: 0 },
  "keyboard dismissal clears stale Safari offsets",
);
assert.deepEqual(
  chatViewportState(844, 400, 400, 0, false),
  { keyboardOpen: false, layoutHeight: 400, height: null, top: 0 },
  "orientation changes refresh the closed-keyboard baseline",
);
console.log(
  "The rebuilt stylesheet boundary, accessible viewport and keyboard geometry checks passed.",
);
