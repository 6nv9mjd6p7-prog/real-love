# Ongoing photo sharing

Photo exchange now offers an unchecked, explicit agreement to share current and future profile photos with the named connection. Existing sharing is not upgraded automatically. Existing users can choose Agree to ongoing sharing without first revoking their current exchange. Both members must opt in before replacements preserve access. Stop sharing remains available independently of the checkbox.

The existing integer consent columns use 0 for no permission, 1 for legacy current-photo permission, and 2 for explicit ongoing permission. Existing rows and schema defaults remain unchanged. Photo reads accept either consent level only when both members have agreed, the connection is accepted, and account, block, and activity checks pass. Replacement preserves permission only when both columns are 2. Removal clears both columns. Blocking, ending a connection, and applicable moderation restrictions still clear permissions; pausing still prevents access.

Replacement/removal permission changes are guarded by the immediately preceding profile update's SQLite changes() result inside the atomic batch, so a rejected stale update cannot clear agreements. API tests cover ongoing replacement, legacy/mixed permission, revocation, removal, photo reads, and stale replacement. Render tests cover the explicit checkbox, disabled request button, upgrade action, and independent stop action.

Previously reset permissions cannot be reconstructed from this change. Users opt in again through Conversation details. No historical agreement is invented or restored.
