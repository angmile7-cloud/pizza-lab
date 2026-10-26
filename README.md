# React + Vite

## Rewards (front-end only)

The map links to `/recompensas`, including before unlock. Catalog, unlock level,
fantasy voucher copy, six selectable secret recipes, seven chef topics with
28 guided questions, and all rewards/chat UI copy live in
[`src/data/rewards.json`](./src/data/rewards.json). The existing passed-level
helper controls unlock; reward costs never change earned scores, progress,
tiers, shifts or the maximum score.

Map, rewards and chat headers show the spendable balance as **Puntos** and the
earned score as **Total ganado: N**. Level/order/result progress badges retain
the earned `N/715` value and use **Total ganado**; spending never lowers them.

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
at 10s for every tier. Base points, the maximum time bonus and maximum score
remain unchanged; the bonus still uses the fraction of the order's time left.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
