# Sky AIR React design system

The approved Figma library is the visual source of truth. React APIs use semantic names and preserve legacy shadcn-style values only as temporary compatibility aliases.

## Normalized conventions

- Figma's canonical `--air-*` web syntax is the primary React token API. Legacy `--color-*`, spacing, radius, and shadow variables remain compatibility aliases during application migration.
- Interactive field and selection-control boundaries use `--air-color-border-control` (`#64748B`) to meet WCAG 2.2 non-text contrast; lighter border roles remain reserved for decorative dividers and surfaces.
- Component props use full words: `small` and `large`, not `sm` and `default`.
- Visual intent is semantic: `brand`, `brand-subtle`, `gray`, `gray-subtle`, `text`, `danger`, and `danger-subtle`.
- Native interaction state remains CSS-driven (`:hover`, `:active`, `:focus-visible`, `:disabled`); state is not a public React prop.
- Lucide icons are passed as React nodes. Icon-only controls require an accessible `label`.
- Focus uses `--color-interaction-focus` with a 2 px canvas-colored gap.
- Components expose native element props and refs unless a composite contract requires otherwise.

## Field contracts

- `Input`, `Textarea`, and `Select` remain native-element primitives for compatibility with existing forms.
- `InputField` and `TextareaField` compose labels, optional or required indicators, hint text, and validation messages around native primitives. `SelectField` adds a precisely positioned custom menu while the native `Select` remains available to legacy consumers.
- Validation messages replace normal hint text and are connected to the control with `aria-describedby`; invalid controls use `aria-invalid`.
- `SearchField` enables its Lucide search icon by default; `DateField` uses the browser's native date indicator to avoid duplicate controls.
- `PasswordField` uses the native password input, exposes an accessible Show/Hide password action, and supports controlled or uncontrolled visibility.
- `SelectField` and `MultiSelectField` enable their disclosure icons by default.
- `MultiSelectField` shows a comma-separated, ellipsized value summary in its control, renders removable selected chips below, and overlays its flush menu above hint text. It uses `value` and `onValueChange` for controlled use, or `defaultValue` for uncontrolled use.
- Focus and error state are derived from native interaction and validation props rather than a public visual `state` prop.

## Selection controls

- Checkbox and Radio use native form inputs; Toggle exposes `role="switch"` and `aria-checked`.
- Figma's `Selected` property maps to React's conventional `checked` and `onCheckedChange` API.
- Each control supports controlled `checked` or uncontrolled `defaultChecked` usage.
- Disabled controls use `--color-control-disabled` and `--color-control-disabled-surface` so the control, track, and knob remain clearly visible.
- Checkbox supports `indeterminate` and `defaultIndeterminate`, exposed to assistive technology as the native mixed state.
- Keyboard focus rings wrap only the Checkbox, Radio, or Toggle control—not the adjacent label and description.
- Selected Radio follows the Figma geometry: white surface, 2 px brand border, and an 8 px brand dot.

## Status and supporting elements

- `Badge` exposes semantic `tone` values: `neutral`, `brand`, `success`, `warning`, `error`, and `inverse`; its Lucide icon can be replaced or hidden.
- `Chip` supports controlled or uncontrolled selection, an optional leading icon, and an independent accessible remove action. Native hover, focus, selected, and disabled behavior replaces visual state props.
- `Tooltip` opens after a pointer delay or immediately on keyboard focus, closes on blur, Escape, or outside interaction, and links its trigger with `aria-describedby` while visible.
- Tooltip placement uses semantic screen position (`top-start`, `top`, `top-end`, `bottom-start`, `bottom`, `bottom-end`, `left`, or `right`); the matching Figma pointer is derived internally.

## Feedback and progress

- `Alert` supports `info`, `success`, `warning`, and `error` tones, `small` and `large` sizes, and `contained` or `full-bleed` presentation. Error alerts use the assertive `alert` role; other tones use `status`.
- `Spinner` preserves Figma's `small`, `medium`, and `large` geometry and `brand`, `neutral`, and `inverse` tones. Its required accessible name defaults to “Loading.”
- `Progress` accepts any numeric value, clamps it to 0–100, and exposes native progressbar semantics. Figma's 25/50/75/100 variants become examples rather than API restrictions.
- `Tabs` exposes semantic `line` and `pill` styles. Selection is controlled with `value`/`onValueChange` or initialized with `defaultValue`; Arrow Left/Right, Home, and End implement the WAI-ARIA keyboard pattern and skip disabled tabs.

## Tier 2 primitives and composition

- `Avatar` supports Figma's 16, 24, and 40 px sizes, initials or image content, and optional online-status and notification overlays.
- `Accordion` derives hover, active, focus, open, and disabled states from native interaction. It supports controlled or uncontrolled expansion and `fill` or `line` treatment.
- `Breadcrumbs` accepts a data-driven item array rather than Figma's fixed count variants. The final item is exposed as the current page and Lucide chevrons remain decorative.
- `ButtonSet` composes the normalized Button primitive in the approved order: optional Cancel text button, optional Save and close gray-subtle button, then the required Continue brand button.
- Cards are split into `SimpleCard`, `MediaCard`, and `ProfileCard` contracts over a shared `CardShell`. Native hover, active, focus-within, and disabled presentation replaces Figma's visual `State` property.
- `MediaCard` supports vertical or horizontal orientation and `full-bleed`, `inset`, or `thumbnail` media treatment. Media and actions remain replaceable React content, matching Figma's instance-swap intent.
- `VideoPlayer` supports controlled or uncontrolled playback, mute, and elapsed-time state. Its progress slider is keyboard operable, and its elapsed-time display is calculated from the supplied duration rather than stored as a separate visual variant.
- The approved 5:30 examples map to 0:00, 1:23, 2:45, 4:08, and 5:30 at 0%, 25%, 50%, 75%, and 100%. Settings, fullscreen, the full control bar, and poster content remain optional.
- `Dialog` uses Radix modal semantics for focus trapping, focus restoration, Escape dismissal, and outside interaction. It supports controlled or uncontrolled open state, Small and Large geometry, optional dismissal, feedback, actions, and custom body content.
- Two- and three-button Dialog variants are derived from the existing `ButtonSet`: Cancel, optional Save and close, then Continue. Completing an action closes the Dialog after invoking its callback.
- `NotificationItem` derives hover, active, focus, and disabled presentation from its native button state. Selection is controlled with `selected`/`onSelectedChange` or initialized with `defaultSelected`; unread status remains independent and is announced to assistive technology.
- `NotificationPanel` accepts data-driven items and controlled or uncontrolled selected IDs instead of fixed Figma item-count properties. Its optional settings action and empty state are accessible, while the approved 446 px panel, 56 px header, and 104 px item geometry are preserved.

## Migration order

1. Tokens, Button, Icon Button, Link, and field primitives.
2. Checkbox, Radio, Toggle, Badge, Chip, Tooltip, Alert, Spinner, Progress, and Tabs.
3. Avatar, Accordion, Breadcrumbs, Button Set, Card, Video, Dialog, Notification Item, and Notification Panel.

Legacy Button aliases remain supported while page consumers migrate:

| Legacy | Normalized |
| --- | --- |
| `default` | `brand` |
| `secondary` | `gray-subtle` |
| `outline` | `gray` |
| `ghost` | `text` |
| `destructive` | `danger` |
| `sm` | `small` |
| `default` size | `large` |
