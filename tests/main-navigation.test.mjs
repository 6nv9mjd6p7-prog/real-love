import ts from "typescript";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
let source = readFileSync("app/main-navigation.tsx", "utf8").replace(
  /from ["']lucide-react["']/,
  `from '${pathToFileURL(require.resolve("lucide-react")).href}'`,
);
const js = ts
  .transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  })
  .outputText.replace(
    /from ["']react\/jsx-runtime["']/,
    `from '${pathToFileURL(require.resolve("react/jsx-runtime")).href}'`,
  );
const { default: Navigation, mainDestination } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
for (const route of [
  "circles",
  "circles/requests",
  "circles/group-id",
  "circles/work",
  "conversations",
  "conversations/sent",
  "chat/chat-id",
])
  assert.equal(mainDestination(route), "conversations");
for (const route of ["profile", "settings", "notifications", "review"])
  assert.equal(mainDestination(route), "profile");
for (const route of ["discover", "saved", "examples", "person/example"])
  assert.equal(mainDestination(route), "discover");
let destination;
const tree = Navigation({
  current: "circles",
  onNavigate: (r) => (destination = r),
  circleRequests: 3,
  requests: 2,
  unread: 1,
});
const buttons = tree.props.children;
assert.deepEqual(
  buttons.map((b) => b.props.children[1].props.children),
  ["Discover", "Chats", "Profile"],
);
assert.equal(
  buttons.filter((b) => b.props["aria-current"] === "page").length,
  1,
);
assert.equal(
  buttons[1].props["aria-current"],
  "page",
  "Circles belongs to Chats",
);
buttons[1].props.onClick();
assert.equal(destination, "conversations");
buttons[2].props.onClick();
assert.equal(destination, "profile");
assert.equal(
  buttons[1].props["aria-label"],
  "Chats, 1 unread message, 2 connection requests, 3 circle requests",
);
const settings = renderToStaticMarkup(
  React.createElement(Navigation, {
    current: "settings",
    onNavigate: () => {},
  }),
);
assert(
  settings.includes('aria-current="page"'),
  "settings retains its Profile parent",
);
const busy = renderToStaticMarkup(
  React.createElement(Navigation, {
    current: "discover",
    onNavigate: () => {},
    requests: 123,
    unread: 101,
    circleRequests: 2,
  }),
);
assert(
  busy.includes(">99+</span>"),
  "large activity counts cannot expand the mobile navigation",
);
assert(
  busy.includes(
    "101 unread messages, 123 connection requests, 2 circle requests",
  ),
  "accessible labels preserve full distinct counts",
);
console.log(
  "Three primary destinations, route grouping, one active parent, navigation actions and accessible activity counts passed.",
);
