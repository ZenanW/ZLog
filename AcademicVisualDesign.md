# Pact — Visual Design

The visual language only: colors, typography, and styling rules. Overall vibe is
**editorial / "legal document"** — serif display type, monochrome slate, generous whitespace,
and a single restrained red accent. Colors authored in **OKLCH**. Dark mode is the default.

---

## Colors

### Dark (default)
| Token | Value | Role |
|---|---|---|
| `background` | `oklch(0.18 0.01 240)` | deep slate app bg |
| `foreground` | `oklch(0.92 0.005 60)` | warm off-white text |
| `surface` | `oklch(0.21 0.01 240)` | cards / panels |
| `surface-elevated` | `oklch(0.24 0.012 240)` | raised surface |
| `muted` / `muted-foreground` | `0.25 0.012 240` / `0.65 0.01 240` | secondary text |
| `accent` / `accent-foreground` | `0.30 0.015 240` / `0.92 0.005 60` | hover / selected fills |
| `primary` / `primary-foreground` | `0.92 0.005 60` / `0.18 0.01 240` | **inverted** (light btn, dark text) |
| `secondary` / `secondary-foreground` | `0.27 0.012 240` / `0.92 0.005 60` | |
| `border` | `oklch(0.30 0.012 240)` | hairline borders |
| `input` | `oklch(0.27 0.012 240)` | field bg |
| **`alert`** / `alert-foreground` | `oklch(0.50 0.14 25)` / `0.96 0.005 60` | oxblood red — danger only |
| `destructive` | same as alert | |
| **`active`** / `active-foreground` | `oklch(0.62 0.07 175)` / `0.15 0.01 240` | soft teal — healthy / active |
| `quiet` | `oklch(0.50 0.005 240)` | neutral gray — inactive |
| `ring` (focus) | `oklch(0.50 0.14 25)` | = alert red |

### Light (`.light` overrides)
| Token | Value |
|---|---|
| `background` | `oklch(0.98 0.005 60)` |
| `foreground` | `oklch(0.20 0.01 240)` |
| `surface` | `oklch(1 0 0)` |
| `surface-elevated` | `oklch(0.96 0.005 60)` |
| `primary` / `primary-foreground` | `0.20 0.01 240` / `0.98 0.005 60` (still inverted) |
| `secondary` / `muted` / `accent` | `~0.92–0.94 * 240` neutrals |
| `border` | `oklch(0.88 0.008 240)` |
| `input` | `oklch(0.92 0.008 240)` |

> `alert`, `active`, and `quiet` are inherited from dark — not overridden in light.

**Philosophy:** near-monochrome slate + off-white, with **only two accents**, used sparingly —
red for danger, teal for healthy.

---

## Typography

- **Serif display** — `'Cormorant Garamond', Georgia, serif`, weight 500,
  letter-spacing `-0.01em`. Used for **all headings, the logo wordmark, invite codes, and
  document bodies**. This serif is the brand.
- **Sans UI/body** — `'Inter', system-ui, sans-serif`, weights 300–700.
- Body settings: `font-feature-settings: "ss01", "cv11"`, antialiased.
- Load from Google Fonts (Cormorant 400/500/600/700, Inter 300–700).

**Signature type moments**
- Hero: serif `text-6xl` / `text-7xl`, leading `1.05`.
- Invite code: serif `text-7xl`, `tracking-[0.3em]`.
- Page titles: serif `text-4xl` / `text-5xl`.

---

## Styling rules

- **Radius**: base `0.375rem` (6px). Applied only to buttons, inputs, and avatars
  (fully round). Cards/panels stay **sharp-cornered**.
- **Hairline borders, not shadows.** Panels = `bg-surface` + `border border-border/60`;
  hover raises to `border-border`. The only shadow in the app is on a floating button.
- **Inverted primary buttons** — light fill, dark text.
- **Uppercase micro-labels** — `text-xs uppercase tracking-wide text-muted-foreground`
  for metadata (course codes, step counters, column headers).
- **Selected state** — `border-foreground bg-accent/40`
  (or `border-alert bg-alert/10` in danger contexts).
- **Danger surfaces** — full-width `bg-alert text-alert-foreground` banner;
  contextual text flips to `text-alert`.
- **Empty states** — dashed box: `border-dashed border-border/60 p-12 text-center`.
- **Generous whitespace** — narrow, centered columns (`max-w-sm` / `max-w-xl`)
  with large vertical padding (`py-16` / `py-20`).

### Status dots (0.5rem circles)
| Class | Look | Meaning |
|---|---|---|
| `status-active` | filled teal (`active`) | active (<24h) |
| `status-recent` | gray (`quiet`), 0.85 opacity | recent (<72h) |
| `status-quiet` | transparent, 1px `quiet` ring | inactive (>72h) |
| `status-flagged` | red square (`alert`), 2px radius | flagged |
