# Form field consistency

The source audit found 87 native input, textarea, and select declarations across `app/` and shared UI components: 22 textareas, 28 selects, 13 default text inputs, 5 number inputs, 2 search inputs, 2 dates, 2 file inputs, 1 email, 1 URL, 10 checkboxes, and 1 range slider. Loops can render more than one instance of a declaration.

`app/globals.css` supplies borders, pale backgrounds, 12px × 14px padding, a 48px minimum height, and a 3px focus outline for editable fields. The selector is independent of label nesting and overrides earlier search/composer resets. Search wrappers no longer add a second surrounding field border. Disabled fields remain distinct; placeholders stay readable.

Checkboxes and radios retain native indicators, compact dimensions, and accent colors, with an additional visible edge and focus outline. Sliders receive a padded, bordered background. Uploads include a bordered file-picker button. Hidden inputs and input buttons are excluded. The transparent OTP capture input is also excluded; visible OTP slots receive the styling instead. Shared custom select, checkbox, radio, and slider controls have corresponding visible surfaces and focus treatments.

Validation: TypeScript, production build, profile/location/chat render and interaction checks, and whitespace checks. Browser and device visual checks were unavailable; computed layout, native control appearance, and scrolling remain unverified on actual devices.
