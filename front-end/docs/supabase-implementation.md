# Skimp Supabase Implementation Notes

The GitHub backend is a guide, not a contract. It helped identify the product entities, but the Expo app is wired through `SkimpDataAdapter` so the production backend can be Supabase-first.

## Project Creation

Use the Supabase MCP during implementation when the live project should be created:

1. List organizations and choose the target org.
2. Get project creation cost and confirm it with the user.
3. Create a new project named `Skimp`; `ap-southeast-2` is the recommended region for New Zealand use.
4. Apply `supabase/schema.sql` as the initial migration.
5. Generate TypeScript database types and replace `src/data/supabase/database.types.ts`.
6. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from the project settings.

## Data Flow

- The app uses `MockSkimpDataAdapter` until a Skimp Supabase project exists.
- Screen components depend only on `SkimpDataAdapter`, so switching to Supabase should not require UI rewrites.
- AI categorization must run server-side in an Edge Function or trusted backend service.
- Imported transactions must be checked by `(user_id, source_transaction_id)` before classification. Existing categorized rows are reused and are not sent to AI again.
- Merchant-level category reuse belongs in `merchant_category_cache`, replacing the Python classifier's local SQLite cache.

## Schema Coverage

`supabase/schema.sql` includes:

- user profiles
- friend groups and max-8 active group membership
- weekly challenges with bad-category snapshots
- transactions with stored category metadata
- merchant category cache
- weekly results and medal records
- weekly recap snapshots
- RLS policies for group-scoped reads and owner writes

`merchant_category_cache`, weekly result writes, and recap writes intentionally have no authenticated-client write policies. They should be written by server-side code.
