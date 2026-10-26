# React + Vite

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
Omitting `selection` draws a margherita; empty builder
slots use the default base, sauce and cheese but do not add toppings.
Ingredient placement is deterministic and independent of topping selection order.
The illustration has no animations of its own; the results oven retains its
existing motion and reduced-motion behavior. Builder controls and the saved-pizza
summary intentionally remain text-only to preserve their layout.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
