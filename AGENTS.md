# MinneTrail project instructions

All user-facing additions and edits must support both Swedish and English and follow the saved app language. This applies to navigation, buttons, descriptions, challenges, progress, accessibility labels, success/error states and empty states. Preserve Swedish content when adding English. Do not introduce new single-language sections.

Keep existing missions, XP, rewards, photo memories, saved profile data and the app icon intact unless the user explicitly requests a change. Keep stable IDs when reorganising or translating content.

For city-guide changes, run `node scripts/check-cities.cjs` and TypeScript checking. The guide checks cover both language rendering and saved XP migration.
