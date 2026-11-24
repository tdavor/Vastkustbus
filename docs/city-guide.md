# Lär känna din stad

Home → country → city → four places. The entire guide follows the app’s Swedish/English setting, including descriptions, challenges, counters, map actions, stamps and errors. English landmark text is exhaustive by ID in `src/city-copy.ts`; new cities must also supply an `en` name and description. Each place has a short read-aloud description, an outdoor mini-challenge, a map link and a one-time 50 XP check-in per child.

`src/cities.ts` is the catalogue: add a country to `countries`, add its cities with matching `countryId`, then add stable landmark IDs in `src/landmarks.ts` and reference them in `landmarkIds`. No navigation screen changes are needed for another country. Keep IDs globally unique and stable.

Göteborg now shows Läppstiftet, Slottsskogen, Skansen Kronan and Poseidon. Stockholm shows Stadshuset, Kungliga slottet, Stortorget and Vasamuseet. All challenges can be done outdoors; museum admission is not required. City counters count that city's four places only. Previously saved visits to the four older Göteborg places retain their XP and reward progress. Those retired IDs cannot receive a new check-in. Existing Göteborg deep links remain supported.

Checks: `node scripts/check-cities.cjs` covers catalogue relationships, coordinates/map links, per-city progress, both journal versions, old XP and rewards, duplicate check-ins, independent child profiles and JSON persistence.

Fact references (accessed 2026-11-24; descriptions are original child-friendly paraphrases):
- https://vasakronan.se/lappstiftet/
- https://goteborg.se/wps/portal/enhetssida/slottsskogen/in-english
- https://www.goteborg.com/platser/skansen-kronan
- https://www.goteborg.com/platser/poseidon
- https://stadshuset.stockholm/utforska-stadshuset/stadshusets-historia/de-tre-kronorna-pa-stadshustornet/
- https://visitsweden.com/where-to-go/middle-sweden/stockholm/the-royal-palace-stockholm/
- https://www.visitstockholm.com/o/stortorget/
- https://faq.vasamuseet.se/category/45/article/4508

## Photos in the shared album

Every landmark has a photo action. Camera and system photo picker lead to a preview and explicit save. Saved pictures are ordinary per-child album memories with a stable `landmarkId` and `missionId: 0` (no normal mission uses that ID). Their photo XP is zero: saving atomically checks in the landmark, awarding 50 XP only if it has not already been visited. More photos and retries do not award additional XP. Existing missions and memories retain their original format and XP rules.

City photos use the existing album detail, stories, colouring, artwork, sharing/printing, slideshow and family-book PDF features. Titles and city names follow Swedish/English, including Stockholm postcards and exported books. Files are copied into the normal memory directory; a failed journal write removes only the new copy. Camera results are ignored after leaving or switching profiles, and a queued save rejects a changed active profile.

`node scripts/check-city-photos.cjs` exercises camera/picker handlers, cancellation/denial, preview and explicit save, late results, profile isolation, file rollback, persistence and one-time XP.
