# Current revision: continuous world camera

Supersedes the montage and browser-unavailable status in the historical report below. In-app browser available for this revision; physical iPhone unavailable.

- Reviewed 1440×900, 1024×768, 390×844 and 360×800. City and destination assets decoded, no horizontal overflow after the impact-grid correction, original title appears once.
- Forward camera arrival reaches the original world at exact viewport bounds. Native reverse scrolling returned the camera transforms exactly to their initial values. One sticky viewport owns both chapters. No artwork crossfades.
- Browser checks caught and fixed missing spaces at mobile line breaks and a zero-height sticky margin box that covered the next chapter. Direct #how now shows the making scene; #builder reveals the diagram and all 18 slots. Actual slot/palette editing changed bead 1 to Silver; reload restored default design.
- Pause restores original DOM owners and both prologue lines in normal flow; resume remounts the camera. Ordinary reload initializes 650 impact marks and 18 slots.
- npm test passes all five suites. Camera geometry checks 1001 positions per layout, exact registered corners and deterministic reverse states. Fixtures remain distinct from browser evidence.
- Representative still: world-camera-desktop.jpg. No short scroll recording saved.

Outstanding: physical iPhone Safari touch, momentum, toolbar/rotation behavior, warmed per-chapter frame targets, cold-load waterfall and compositor profiling. Browser inspection does not establish iPhone smoothness. Team rendered-card verification remains fixture-only.

## Historical first implementation report

# Prologue implementation — local acceptance record

Implemented in `runway/`, with root changes limited to team corrections. Existing root team module had already removed Aadil before this run; its nine-person roster was preserved. No commit, push or deployment.

## Verified

- `npm test --prefix runway`: builder/order contracts, presentation DOM fixtures, performance-summary thresholds, scene source/media contracts pass.
- Presentation fixtures cover deterministic prologue/opening/making reverse states, exactly 650 marks, twin group transform reversal, cached render geometry, scroll callback coalescing, direct progress overriding queued scroll, hidden cancellation/resume, hidden rotation dimensions, refresh measurements, shortcut availability, pause/reduced motion, image failure, missing libraries, animation initialization failure, destroy cancellation/listener cleanup.
- `node verification/served-team.mjs` fetched both localhost team modules with the version query, compared full served bodies to local files, and executed each in a DOM fixture: nine cards, no Aadil. Both served pages have nine-person count copy and the approved '10 pairs of hands string faster.' line. **This is served-response plus fixture rendering, not real-browser card verification.**
- Generated landscape and separately composed portrait close/wide illustrations exported to WebP. Existing master/near artwork supplies the intermediate/final composition. Prompts and provenance are in `assets/illustrations/PROMPTS.md`; dimensions/bytes in the manifest.
- Initial unique artwork URLs: mobile 418,774 bytes; desktop 463,564 bytes. All twelve WebP files combined: 1,040,620 bytes. These are media file sizes, not a measured cold-load network waterfall.
- Source contracts reserve dimensions, verify asset existence/unique IDs and the original scene label, and check the shared seam viewport. Prologue travel is 180svh desktop/140svh mobile after the 100svh opening overlap. Original opening chapter has its full prior height/timing.
- Root tracked diff contains only `team.html` corrections and the pre-existing `js/team.js` roster removal. No other tracked root files were changed.

## Outstanding acceptance — do not claim smoothness

Browser connector inventory exposed no browsers. Native Chrome inspection failed with ScreenCaptureKit -3811 / server -10005. No physical iPhone session was available. Therefore none of the following has been accepted:

- 1440×900, 1024×768, 390×844, 360×800 rendered typography/overflow/decoding, seam forward/reverse, existing transitions, anchor navigation or pause/resume.
- Browser-rendered team cards (served module rendering was checked only with fixtures).
- Representative browser stills or short scroll recording.
- Before/after comparable scroll profiles, cold-load waterfall/behavior, compositor memory/layer behavior.
- Physical iPhone Safari slow drags, flicks, momentum, reverse, toolbar collapse/expansion, rotation and builder touch.
- Median ≤18ms, p95 ≤25ms and ≤5% intervals over 25ms on a 60Hz iPhone 12/comparable. No measured frame-timing result exists.

## Local review path

Open `http://localhost:8898/runway/?measure`. `window.presentation` exposes `setProgress`, `setPaused`, `refresh`, `destroy`. Review the seam in both directions and direct anchors before calling visual acceptance complete.

The opt-in probe runs only during scroll bursts and suspends sampling while hidden. After loading/warming, call `window.runwayPerformance.reset({warmupMs:1500})`, repeat an identical warmed full scroll run, and collect `window.runwayPerformance.report()`. Reports contain chapter interval summaries and user agent/viewport; record physical device model, iOS, Safari and display cadence manually. Repeat runs, save separate cold-load observations, and record a short scroll video. `reset({warmupMs:0})` is available for a separate cold interval run; it does not replace a network waterfall.

If phone targets fail, reduce simultaneous artwork/effects before changing beats or controls. GSAP's [documented configuration](https://www.gsap.com/docs/v3/Plugins/ScrollTrigger/static.config%28%29/) disables automatic resize/visibility refresh for this presentation; the coalesced owner refreshes real layout changes and stable svh chapter travel. These source-level changes require real Safari verification.

## Note and narrow making composition correction

Moved the note's two-line promise below the raster image with larger unrotated type. At 390×844 the entire note/caption and copy are visible. At 390×844 and 360×800 reviewed all three making beats: SVG keeps its 1000:800 aspect ratio, window crop is contained above the copy, and paper height scales with width (50px at 360 rather than the HTML 800px height). No horizontal overflow at 360. Saved mobile-note-readable.jpg and mobile-making-readable.jpg. All existing suites and whitespace check pass. Physical device acceptance remains outstanding.

## Promoted main site

Root index.html, team.html and legal.html now render the approved camera version using shared runway styles/modules/artwork. Copyright notices and their year setters removed. Actual served browser navigation verified `/` → team (9 rendered cards) → legal → `/index.html#builder` (18 slots, visible diagram); homepage has 650 impact marks and decoded mobile world artwork. Root/preview parity and resource-path tests pass. No deployment or commit performed.
