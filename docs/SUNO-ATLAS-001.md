# SUNO ATLAS 001 — The Infinite Discography Browser

An independent WebZ laboratory for navigating **user-provided** Suno music metadata. Does not access Suno accounts, private endpoints, cookies, credentials, automated scraping, API tokens, audio files, commercial licensing or audio downloads. Original two WebZ sovereign worlds remain unchanged.

## Why import first

Suno's effective September 3, 2026 Terms of Service prohibit automated scraping or similar data extraction. Suno help documents song downloads and Studio export, but an authorized metadata-library synchronization API was not confirmed. This Atlas intentionally accepts only data the operator already has rights to provide in CSV or JSON. It does not fabricate an official Suno export format. Format input examples below are files the user may create manually.

## Run

On the `experiment/suno-atlas-001-library-dials` branch, Node.js >=22:

```sh
npm test
npm run serve
```

Visit http://127.0.0.1:8080/worlds/suno-atlas/ on that machine. This is not yet publicly hosted. If your source file includes private track titles, use a computer/browser profile you control.

## CSV minimum

```csv
title,id,created_at,duration,style,model,album,url
Porch Song,clip0001,2026-06-02,3:12,"folk, gospel",v5,Season Three,https://suno.com/song/abcdef12345
Ridge Echo,clip0002,2026-06-03,187,"ambient; cinematic",v5,Season Three,
```

Use `.json` files containing an array of rows or `{ "songs": [...] }` or `{ "tracks": [...] }`. Common alternative headers include `song_id`, `display_name`, `date`, `duration_seconds`, `genre`, `tags`, `collection`, and `parent_id`. The Atlas retains only title, ID, date, duration, style/tags, model, album, direct Suno song URL and parent ID. Lyrics, style prompts outside the whitelisted style field, account tokens, browser cookies, private prompts and raw extra fields are deliberately dropped. An input file can contain 20,000 records at most and 6MB per file. Invalid/duplicate rows refuse the import atomically, without altering the current catalog.

## Eleven dials / composition

- Vertical tuning 01–11: 01 is all tracks, positions 02–11 are up to the ten most frequent **actually present** style tags (ties broken alphabetically). If fewer than ten tags exist, unoccupied positions hold empty rather than inventing genres.
- Horizontal granularity 01–11: visible track cap 11, 22, 44, 88, ... to all tracks. Timeline changes resolution: year → quarter → month → week.
- `ENTER` commits a typed tuning/granularity pair and retunes within the resulting subset; `RISE` restores the prior pair, to depth 24. Each address is bound to the *catalog fingerprint*, preventing a bookmark from silently resolving inside another dataset. The fingerprint is deterministic FNV-1a used solely for view identity, **not a cryptographic authenticity signature**.
- The style constellation draws tag co-occurrence edges only when a particular track actually has both tags. This is **not** audio similarity, lyrical clustering or causation.
- Real original Suno song links are allowed only for manually provided HTTPS Suno `/song/` or `/s/` direct URLs, opened only after explicit user choice in an external browser tab. No audio embedding, scraping or auto-playing.

## Storage and portability

`Save snapshot locally` stores the normalized metadata in the browser's IndexedDB under an operator-chosen name (up to 24 saved libraries). Never autosaves imported files, audio or authentication information. Reloading does NOT automatically reopen the library. `Load saved` deliberately restores, `Delete saved` removes a local record, and `Export metadata JSON` makes a portable private backup suitable for later reimport with its exact IDs. Browser IndexedDB is not secure encrypted storage or cloud sync; browser data-clearing will erase it. Back up files yourself and consider private recording metadata sensitive.

## Next experiment

Audio fingerprinting from legitimately acquired local audio exports could produce a separate explicitly consented and legally compatible index; do not assume this app can download an entire Suno library. Separately explore authorized integration if Suno publishes a permitted user-library API. Potential Static Collective layers: Autodisco for style/semantic tags, WebZ for world mapping, GHoT for bounded optional local signal analysis, reLATTE for separately approved media provenance/crossing, Static Live for intentional playback where appropriately licensed.

**INDEX != OWNERSHIP. STYLE CO-OCCURRENCE != MUSICAL CAUSATION. DIAL != STREAM. LOCAL SNAPSHOT != SUNO BACKUP. VIEW ADDRESS != SOURCE ID.**