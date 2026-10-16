# Obsolete branch cleanup — October 15, 2026

Reviewed against GitHub main `835a04eca4a1dc96b351a54a14412aa1a04a991b`. Its continuous-integration run 38848120573 passed. No branch was deleted: the connected GitHub tools do not expose branch deletion.

| Branch | Reviewed head | Disposition |
| --- | --- | --- |
| `codex/location-autocomplete-radius-2026-10-10` | `aad07202d73aa2eff2c69d1e2257f3835d67afcc` | Merged in PR #2; ready to delete. |
| `codex/location-nearby-2026-10-11` | `9feacb8b49ec60420391b186bca655b73570213a` | Superseded by the current-location branch merged in PR #3; do not merge. |
| `codex/location-nearby-current-2026-10-11` | `f1f79c736dedd7ed9a71cd721a57985295592afd` | Merged in PR #3; ready to delete. |
| `codex/voice-hold-release-2026-10-10` | `e3857c061300156f2285261be1ce734fcbd1c21f` | Merged in PR #1; ready to delete. |
| `dependabot/github_actions/pnpm/action-setup-6.1.0` | `8ed90c500d1fd270925cbc4732e6cf0078d3164c` | Merged in PR #5; ready to delete. |
| `worker-support-v1` | `6eaa4d983efc1df4729fbc0a53c0265cded6fac6` | Superseded. Worker.gov and Wage and Hour Division resources recovered in the current implementation; do not merge the older tag-based system. |

Before deleting through GitHub, verify that each branch still points to the reviewed head. If it has changed, review the new commits first. Preserve `main`. Divergent commit counts can reflect squash merges; they do not alone establish missing work.

