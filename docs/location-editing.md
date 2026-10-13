# Location editing and device suggestions

The editor now shows the selected location as an editable search value with Change area, plus a Change location shortcut in the profile overview. Search text is separate from the selected structured place. Until a replacement is selected, both the editor submit action and the app's preview/save path reject pending location search text instead of silently saving the previous place.

Device detection requests a fresh high-accuracy position, reports supplied accuracy, and refuses to present readings worse than 10 km as a confident city lookup. Lookup returns multiple area candidates ordered by distance; the member confirms one. Detection never overwrites the current profile automatically. Manual edits, selection, and unmount invalidate late device responses. Place searches ignore aborted responses.

The reverse endpoint uses rounded coordinates transiently to query the provider and returns canonical area points for profile matching, rather than overwriting them with the member's rounded position. The internet-connection estimate is labeled separately and remains optional; its result is not evidence of residence or identity.

Regression coverage includes manual edits, required candidate selection, fresh device options, multiple candidates, reported coarse accuracy, stale device responses, permission denial, nearest-candidate ordering, and preservation of canonical area coordinates. Full browser/device accuracy still requires testing on the member's device.
