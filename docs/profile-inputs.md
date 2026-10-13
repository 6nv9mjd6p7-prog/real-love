# Profile inputs and birth-date privacy

New setup asks for a chosen name, private birth date, general area selected from place suggestions, 1–8 interests, one introduction, and conduct agreement. Identity, communication, availability, activities, attraction, and relationship details remain optional.

## Birth date

Month and day are separately labeled dropdowns. Day choices follow the selected month and leap year. Year uses a four-digit numeric text input. All three support birthday autocomplete. Incompatible days are cleared when the month or year changes, with an immediate message; invalid days, months, future years, and nonnumeric years are rejected while editing. They form a strict calendar date string; no timestamp conversion is used. `ageFromBirthDate` validates the date and computes calendar age using a consistent UTC day. The server derives age instead of trusting the submitted age. New profiles require an adult date (the existing 18–99 range remains). Existing profiles without a date retain their saved age and may still edit other answers until they supply their own date. No date is inferred from a legacy age. Once supplied, the server preserves it for old client payloads and rejects clearing it in favor of a numeric age.

The birth date and selected prompt keys are returned only in the authenticated member's own profile. Public profile projections, discovery, connection profiles, previews, report evidence, and moderation summaries exclude the birth date. Moderation summaries use the calculated age. Self-reported dates do not verify identity or adulthood.

## Optional choices and compatibility

New optional personal answers are blank rather than preselected. Gender, introduction prompt, private openness to romance, attraction, and future expectations use visible radio choices. Optional radio groups can be cleared. Attraction allows self-description; that description appears only when self-description is selected. Communication, activities, participation, and availability use native checkboxes with clear labels.

Availability and participation store arrays. Existing single-choice answers are mapped into those arrays without inventing new choices. Scalar summaries remain for older clients. Server saves preserve arrays if an older payload omits them and leaves its scalar summary unchanged. Matching, search, profile display, and discovery filters use the arrays. Only explicitly shared concrete availability slots are described as common timing; flexible/varies/occasional does not establish an agreed schedule.

Interests show checkmarks and removable chips. Custom interests are added directly from the search text instead of another input. Introduction and optional answers show character counts.

The nine existing idea/relationship questions share an optional prompt library. New selections are limited to three. Older profiles with more answers retain and can edit every answer; nothing is removed automatically. Removing an answer is an explicit control that clears its text and selection. First activity, faith/worldview, and affection/boundaries retain their own short optional text fields.

Photo management already provides upload, preview, replace/remove controls and sharing status. Discovery visibility and interaction pause remain distinct settings. Conduct consent remains unchecked until the member agrees.

## Verification

Regression coverage includes calendar validity, birthday and leap-year boundaries, server age derivation, underage/date rejection, private/public projections, older payloads, legacy answers, multi-choice matching and filtering, and rendered control interactions. Production build and TypeScript checks accompany the full test suite. Browser/mobile visual inspection remains unavailable in this environment.
