# UX improvements applied after the v81 screen review

- Notifications and reviewer routes no longer highlight My profile. Safety review has its own explicit topbar action and reviewer count.
- Chat navigation distinguishes unread messages from connection requests. Inbox tabs show each count at its corresponding task, with accessible labels.
- A sticky save bar appears for unsaved profile answers on every existing-member editing section, including the overview and Photos. Photo uploads remain separate; the bar explicitly identifies profile answers.
- Conversation photo status is visible before secondary details. A mutually shared photo has a directly accessible thumbnail. Consent management is a first-level control, not a nested disclosure.
- Failed photo changes preserve the checkbox and display an adjacent error. A ref prevents overlapping changes; successful changes clear the temporary selection and close the controls.
- Location search supports Up/Down wrapping, Enter selection, Escape dismissal, an active descendant, and selected-option styling. Enter with unselected typed text explains the needed selection instead of accidentally submitting the profile.
- Active discovery constraints appear above results outside the collapsed filter panel.
- A circle with no available accepted cofounder offers Find a cofounder and Review connection requests.
- Boycott proposals use Purpose, Evidence, and Review and submit steps. Native field validation gates progression; parent-owned data survives Back and failed submissions. Editing proposal details clears the final consent checkbox. The final step shows the complete proposal and sources before submission. Server validation and publication review are unchanged.

Validation includes rendering/action regressions for navigation, every profile save section, consent failure and retry, location keyboard selection, and proposal stage transitions. Existing API/privacy tests and TypeScript checks continue to pass. Production build is required before publication. Live browser/mobile/physical-device QA is unavailable in this environment; responsive CSS and rendered components are checked in source and automated tests only.
