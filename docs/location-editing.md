# Location editing and device suggestions

The editor now shows the selected location as an editable search value with Change area, plus a Change location shortcut in the profile overview. Search text is separate from the selected structured place. Until a replacement is selected, both the editor submit action and the app's preview/save path reject pending location search text instead of silently saving the previous place.

Device detection requests a fresh high-accuracy position, reports supplied accuracy, and refuses to present readings worse than 10 km as a confident city lookup. Lookup returns multiple area candidates ordered by distance; the member confirms one. Detection never overwrites the current profile automatically. Manual edits, selection, and unmount invalidate late device responses. Place searches ignore aborted responses.

The reverse endpoint uses rounded coordinates transiently to query the provider and returns canonical area points for profile matching, rather than overwriting them with the member's rounded position. The internet-connection estimate is labeled separately and remains optional; its result is not evidence of residence or identity.

Regression coverage includes manual edits, required candidate selection, fresh device options, multiple candidates, reported coarse accuracy, stale device responses, permission denial, nearest-candidate ordering, and preservation of canonical area coordinates. Full browser/device accuracy still requires testing on the member's device.

## Permission request reliability

The production response previously sent `Permissions-Policy: geolocation=()`, preventing the browser from requesting permission. It now permits `geolocation=(self)`. This permits the app origin to ask; it does not grant access, start tracking, or override an embedding page's policy.

The button displays request and lookup status immediately beside itself. It detects unsupported/insecure/policy-blocked contexts and provides a direct browser link where appropriate. Denials explain how to change browser or device settings. Synchronous platform exceptions and a 45-second overall wait release the button, while cancellation, typing, choosing a place, and unmounting discard stale responses and abort reverse lookup. No automatic retry requests permission again.

The native iOS shell now declares `NSLocationWhenInUseUsageDescription`. Existing native binaries need a new Xcode build/install to receive that metadata; publishing the website cannot update an installed app's Info.plist. iOS permission prompts require device validation. Embedded location access remains subject to the parent frame's policy; blocked embeds offer the published app in a browser.
