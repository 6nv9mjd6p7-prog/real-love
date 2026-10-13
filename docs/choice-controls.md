# Choice control audit

Scanned all 99 tracked TSX files under `app/` and `components/`, including shared native/custom select and combobox implementations. The AST inventory found 85 native input/select/textarea declarations. A declaration inside a loop or helper can render several controls; this is not a screen or field-instance count. Server option allowlists, birth-date validation, public projections, and matching were also checked for consistency with the UI.

## Decisions

| Choice | Control | Source and reason |
| --- | --- | --- |
| Birth month/day | Native dropdowns | `profile-editor.tsx`: bounded values prevent impossible days; month and year determine the available days. |
| Birth year | Numeric text input | Four digits are quicker to enter than scanning a century of years; edits and server validation enforce real dates. |
| Attraction | Native dropdown, updated | Seven choices plus an unanswered placeholder reduce the long optional list. Self-description remains conditional and clears when another choice is selected. |
| Gender | Visible radios | Short choices remain comparable; self-description and nondisclosure remain explicit. |
| Introduction prompt | Visible radios | Three prompts are useful to read before choosing. |
| Private openness/future expectations | Visible radios | Short lists and an explicit Clear answer control preserve deliberate optional answers. |
| Availability/participation/communication/activities | Checkboxes | Several choices may apply. A single dropdown would discard valid selections. |
| Interests | Search and selectable chips | Long vocabulary, custom wording, and several selections need search and clear selected state. |
| Optional question library | Native dropdown | Nine possible prompts; selected answers are shown below and legacy answers remain editable. |
| Profile editing section | Existing native dropdown | Compact section switch beside the overview action; overview cards retain their summaries. |
| Discovery interests/activity/availability/location | Existing native dropdowns | One filter value per control, blank/Any options where applicable; interest options are already grouped by topic family. |
| Advanced profile filters | Existing native dropdowns | One condition per attribute; independent multi-choice chips remain separate. |
| Place selection | Searchable combobox | A fixed dropdown cannot cover city names; selected structured results remain required. |
| Circle co-founder | Existing native dropdown | Dynamic list identifies one accepted connection by ID. |
| Worker circle type | Existing native dropdown | Compact classification within the optional worker branch; consent stays separate. |
| Resource topic | Existing native dropdown, deduplicated | One filter value; repeated resources must not repeat topic options. |
| Invitation reply context/report reason | Existing native dropdowns | One saved answer context or report classification; selection does not send anything. |
| Campaign feedback/review/open submission | Existing native dropdowns | One classification, status-dependent decision, or stable submission ID; explicit buttons submit actions. |
| Reviewer assignment | Existing native dropdown | Dynamic member list uses stable IDs; assignment and admission remain explicit server-checked actions. |
| Navigation, destructive actions, and agreement | Buttons/tabs/checkboxes | Keep destinations and consequential actions visible; consent is never a dropdown. |

## Maintenance comments

Comments now explain control choice, optional blank values, multi-choice compatibility, leap-year dependencies, legacy prompt preservation, stable IDs, and server/public privacy boundaries. Shared select/combobox components document their intended use. `profile-inputs.md` was updated to reflect the attraction dropdown rather than the earlier radio list. Existing explanatory GitHub comments are preserved when source is synchronized.

USWDS guidance supports compact single-choice dropdowns for moderate lists, visible radios for shorter comparisons, searchable choices for very long lists, and checkboxes for multiple selections: https://designsystem.digital.gov/components/select/ . The existing grouped interest filter is retained; a future searchable replacement should be tested with members rather than introduced solely because the list is long.

Validation uses interaction/render regression checks, TypeScript, and the production build. Browser/device visual validation remains unavailable.

## Native declarations by module

| Module | Declarations |
| --- | ---: |
| `app/auth/sign-in.tsx` | 2 |
| `app/campaign-proposal.tsx` | 6 |
| `app/chat-bubble.tsx` | 1 |
| `app/chat-composer.tsx` | 1 |
| `app/circles.tsx` | 9 |
| `app/collective-action.tsx` | 8 |
| `app/conversation.tsx` | 1 |
| `app/discovery-details.tsx` | 7 |
| `app/location-editor.tsx` | 1 |
| `app/love-app.tsx` | 16 |
| `app/moderation.tsx` | 4 |
| `app/profile-editor.tsx` | 25 |
| `app/worker-support.tsx` | 1 |
| `components/ui/input.tsx` | 1 |
| `components/ui/native-select.tsx` | 1 |
| `components/ui/textarea.tsx` | 1 |
