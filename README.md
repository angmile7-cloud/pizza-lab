# React + Vite

## Responsive layout

Below 560 CSS pixels, the game fills the viewport without a bezel and reserves
the four device safe-area insets. At 560 pixels and above, the centered frame
remains at most 430 pixels wide and `min(852px, 100dvh - 32px)` tall. The shared
viewport variable falls back to `100vh` when dynamic viewport units are
unavailable. The outer page does not scroll; game content scrolls inside it.

Question and pizza-builder actions use the existing scroll/actions layout.
At viewport heights of 600 pixels or less, orders put the ticket, preview and
ingredients in one scrolling middle area, keeping the action bar inside the
frame. Longer text wraps, and constrained header/footer copy can scroll rather
than pushing controls outside the frame. Narrow community leaderboards move
vote counts beneath chef identities only when their container is at most
260 pixels wide. Touch controls have at least 44-pixel targets.

For responsive regression checks, use an in-memory chef profile and navigate
within the app (a reload resets progress). Check portrait, landscape and short
desktop viewports, 150%/200% root text size, community gallery/photo overlays,
and active orders as well as their intro screen. `npm run lint` and
`npm run build` validate the source and production bundle.

Order mode alone centers its score badge 6px below the header and keeps the
level/progress block compact. The content-sized paper ticket and square live
pizza share a 90%-wide row (57:40 tracks with an 8px gap); the timer and hint
follow directly over the wall without a panel. The centered hint occupies 72%
of the scene width (14% side margins); the timer inside it occupies 60% of the
scene width (20% side margins). Original text, bar styles and vertical spacing
are preserved. Timer colors and urgency thresholds are unchanged.
At 320x568, the single-line hint can reach the oven's brick edge; retaining
its original font and height takes precedence over wrapping it onto another line.
Quotes use 15px text, or 14px for long
orders, and the paper grows to fit. After a successful delivery the ticket
returns on the left and the finished pizza occupies only the right column.
Below 340px, or in landscape at heights up to 600px, the row stacks with a
72px pizza. Shared level/map badge layouts are unchanged.

The hub places "Canjea tus puntos" and "Reto del mes" in an equal-width row
inside the player header, above its divider. Both pills are at least 44px tall
with 14px semibold dark-green text, a green border, cream fill and original
gift/trophy icons (the existing lock replaces the gift when locked).
The identity and points occupy separate grid columns, with a 12px gap before
the buttons and at least 12px between the divider and "TU PROGRESO".
"Preparar pedidos" is a stronger solid-green pill at least 52px tall between
"TU PROGRESO" and the slice map, regardless of shift status. Existing lock
indicators and order status messages stay with their own control. The map and
ingredient trail retain their shared canvas, row spacing and level-10 endpoint.
Destination routes and unlock rules are unchanged.
Order notices use centered 13px text and an 8px gap below the button.
Only the level-1-locked primary is dimmed; exhausted shifts retain primary green
without changing the existing disabled state.

The orders-stage selector reuses LevelHeader with "DODO'S PIZZA LAB" and no
level suffix, without screen-specific header style overrides.
Its "Preparar pedidos" title and 14px dark subtitle share a rounded cream plate with
no text shadow or outline; stage cards and their states are unchanged.

## Chef profile (in memory only)

Welcome opens `/chef`: a nickname (2–16 characters after normalization) and
one of eight original illustrated avatars. Nicknames allow letters, numbers,
spaces, `.`, `_` and `-`, require a letter or number, and are rendered as plain
text. Repeated spaces collapse, surrounding whitespace is trimmed, and accents
are normalized to NFC. The avatar picker supports arrows, Home/End and a single
Tab stop, with a selection ring and check mark. Reduced motion disables the
preview bob.

There are no accounts, email/password fields, storage writes or external calls.
External Google Fonts links were removed to keep the app local-only; the existing
CSS font stacks use their system fallbacks when game fonts are not installed.
The legacy `pizza-lab:userName` localStorage key is removed once on startup.
All game routes require an in-memory profile; reloading them redirects to `/`.
Old `/registro` and `/login` URLs also redirect to `/` through the fallback.
Restart clears progress but keeps the nickname/avatar; returning to the menu
and opening `/chef` prefills both. Starting from that screen starts a new game.
The map and personal community entries share this identity; fictional chefs
retain initials. Existing publishing, voting, rewards and orders rules remain
unchanged.

## Community challenges (educational, browser-only demo)

The always-enabled "Reto del mes" map link opens `/comunidad`. Five fictional
challenges, chef bios, starting hearts, optional photo credits and the publishing
threshold live in [`src/data/community.json`](./src/data/community.json).
[`src/game/communityService.js`](./src/game/communityService.js) is the only
data adapter: it resolves local photos by basename with eager `import.meta.glob`,
exposes challenge/entry queries, voting, publishing and removal, and owns a
subscribable in-memory store instantiated by `GameProvider`. UI code never
imports the JSON. Missing/unreadable photos use the existing PizzaPreview.

Voting is free from level 1, with one vote per challenge stored as a
challenge ID -> entry ID map. Choosing a different pizza moves the vote in one
atomic store update; choosing the same pizza removes it. Other challenges keep
their votes. Counts derive from starting hearts plus the single selected vote,
so rapid taps cannot accumulate duplicates. Personal pizzas cannot receive the
player's own vote. Top cards and galleries share the same selection and politely
announce vote changes/removal, never individual count updates.
Publishing requires every level to be passed using
the existing passed-level helper, not just reaching level 10. One personal photo
per challenge is allowed. JPEG/PNG/WebP files up to 5 MB are decoded locally,
resized to at most 720 px on the long side and re-encoded as WebP through canvas
to strip original metadata. Temporary decoding URLs are always revoked; final
data URLs remain only in memory. Names are trimmed, limited to 30 characters and
rendered as plain text. Nothing is uploaded, fetched externally or persisted.

Personal pizzas start at zero hearts. A deterministic name/challenge-seeded
schedule adds 1–7 hearts every 3–7 visible seconds, ending after at most 60
reactions or before the challenge leader's initial count. The timer exists only
on this screen while the document is visible; navigation, tab hiding, completion
and reset stop it. The schedule resumes where it paused when returning.
Reset/new-game clears votes, personal photos and simulated reactions. Community
hearts never change score, spending, rewards, tiers, shifts or level access.
Prizes are explicitly fictional game benefits. Credits show a pending message
until credits are filled in. Sheets reuse the in-phone focus trap and Escape
behavior from rewards; live announcements are limited to voting, publication/removal
and actionable errors, never simulated heart increments.

Community photo buttons open a compact, in-phone viewer, including personal
in-memory photos and illustration fallbacks. The viewer shares the existing
vote handler and live counts with Top (three entries) and Ver Todos (all entries).
Margherita has four local photos; the other challenges are unchanged.
Previous/next buttons, arrow keys and horizontal swipes follow the gallery's
heart-sorted order and stop at either end. Close with the close button, backdrop
or Escape; focus is trapped and restored to the opening thumbnail. Background
scroll is locked and restored, including when viewing from the gallery sheet.
The square image is contained, at most 300 px or 70% of the frame width, with a
reserved loading placeholder. The card is capped at 70% of the community frame's
height and scrolls internally on short frames. Its 180 ms fade/scale entrance
is disabled by reduced-motion preferences.

## Rewards (front-end only)

The map links to `/recompensas`, including before unlock. Catalog, unlock level,
fantasy voucher copy, six selectable secret recipes, seven chef topics with
28 guided questions, and all rewards/chat UI copy live in
[`src/data/rewards.json`](./src/data/rewards.json). The existing passed-level
helper controls unlock; reward costs never change earned scores, progress,
tiers or shifts.

Under TU PROGRESO, Recompensas and Comunidad share the first centered row.
The orders-mode button occupies its own centered row, with its existing
`orders-mode-lock` helper directly underneath while locked. Link behavior,
lock indicators and all orders-mode state labels remain unchanged.

Map, rewards and chat headers show the spendable balance as **Puntos** and the
earned score as **Total ganado: N**. Level/order/result/builder progress badges
show only the earned `N` value and use **Total ganado**; spending never lowers
them. Score displays and live announcements do not include a possible maximum.

`GameContext` exposes `spentPoints`, `redemptions`, `availablePoints`,
`unlockedRecipeIds`, `answeredQuestionIds` and
`redeemReward(rewardId, optionId?, requestId?)`. Recipe/question purchases require
an existing, unowned option ID. A confirmation supplies a stable request ID for
idempotency; pending calls for the same option also share their result before
the state commit. The original three recipes previously had no IDs; their
stable IDs are now `masa-dodo`, `salsa-tomate` and `pizza-margarita`.
Spending and redemption history update together. Available points clamp to zero
if earned scores drop. All rewards are in-memory and cleared by the existing
restart/new-game path; nothing new is persisted or sent over the network.

Opening `/chat`, changing topics, browsing recipes, dismissing a sheet and
navigation are free. Only the final Canjear/Preguntar confirmation calls
`redeemReward`. Recipes cost 80 points each; questions cost 50 each, without
credits. Owned recipes and answered questions reopen free, even without points.
Chat history derives from redemptions and survives route changes during the
session. Restart clears history and both collections. Sheets focus Cancelar
by default, trap focus, and dismiss with Escape or a tap on their backdrop.

Vouchers are fantasy collectibles, not redeemable benefits outside the game.
The `fulfillment` field is retained for future extensions; this version only
ships `fantasy` rewards. The confirmation/result dialogs stay inside the phone,
trap keyboard focus, support Escape, and announce redemption results.
The count animation respects reduced motion. Clipboard permission failures use
a selected-code fallback and display manual-copy instructions if that fails.

## Levels pizza artwork

The shared kitchen background uses `src/assets/Niveles/fondo_cocina.webp`
(941 x 1672), with the existing background sizing and positioning unchanged.

`src/components/PizzaPreview.jsx` is a decorative, SVG-only illustration with
instance-scoped definitions. It accepts `selection` (`masa`, `salsa`, `queso`,
`toppings`) using the choice IDs in `src/data/levels.json`, plus `className`,
`glow`, `cutLines` and `doneness` (`golden` by default, or `burnt`). Burnt
pizzas reuse the same ingredient slots with charred edges, browned cheese,
darkened toppings, an ash overlay and a static smoke wisp. The results oven
uses its existing pass/fail value to choose doneness and the bubble text
(`¡Ding!` on success, `¡Uy!` on failure); its existing smoke puff keeps the
same animation and is static with reduced motion.
Omitting `selection` draws a margherita; an empty selection draws only the
board. Explicit selections show only the chosen layers and toppings.
Ingredient placement is deterministic and independent of topping selection order.
The illustration has no animations of its own; the results oven retains its
existing motion and reduced-motion behavior. Builder controls and the saved-pizza
summary intentionally remain text-only to preserve their layout.

## Live orders pizza

Orders mode uses the same SVG, adding layers as the player chooses them.
Optional `face`, `ghosts`, `extras`, `badLayers` and `hold` props provide the
decorative verdict state; they default to no face, marks or held ingredients.
Stable `data-pizza-element` hooks and layer/topping classes support selection-diff
animations without changing ingredient positions. `sliceWiggle` reuses clipped
copies of the assembled SVG for the successful verdict only.

Delivery evaluation, point awards and saved shift results happen synchronously
before the 2.2-second visual sequence. Delicate leaves are withheld during the
oven step and added after baking. Only the verdict reveals missing/extra toppings
or incorrect layers. Tap the stage, Enter, Space or Escape to skip to the verdict.
Reduced motion shows a static verdict for 1.5 seconds; timeouts retain the paper
crumple without a pizza stage. The stage stays inside the phone frame, below the
header, while INICIO remains available. New sequence timeouts and keyboard
listeners are cleaned up on unmount.

After a satisfied delivery's verdict (or immediately when skipped), the assembled
happy pizza replaces the paper visually inside the same reserved ticket box.
The small preview is hidden without collapsing its space. Unsuccessful orders
retain the paper and small pizza; timed-out paper returns after the crumple.
The next order restores the normal paper entrance and empty preview.

Tier durations come from `src/data/orders.json`: Aprendiz 65s, Cocinero 50s,
Pizzaiolo 40s and Maestro 35s. Amber begins at 35s remaining for the first three
tiers and at 21s for Maestro (the existing 60% short-order threshold). Red begins
at 10s for every tier. Base points and the maximum time bonus
remain unchanged; the bonus still uses the fraction of the order's time left.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
