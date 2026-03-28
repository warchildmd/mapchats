# Design System Strategy: The Kinetic Pulse

## 1. Overview & Creative North Star
This design system is built to capture the high-energy, real-time nature of social mapping. We are moving away from the "utility-only" map aesthetic toward an experience we call **"The Electric Cartographer."** 

The Creative North Star is defined by **Luminous Depth**. Instead of flat, static pins on a gray background, the UI feels like a living organism. We break the traditional grid through intentional asymmetry—floating action buttons that don't sit in corners, and "peek-a-boo" cards that slide over the map with varying radii. By layering semi-transparent surfaces over a deep-space background (`#0e0e10`), we create a sense of looking through a high-tech lens into a vibrant, active world.

## 2. Colors: The Neon & Night Palette
Our palette relies on a high-contrast relationship between a "void" background and "kinetic" interactive elements.

*   **Primary Kinetic (`primary` #97a9ff):** Used for core navigation and "Discussions." It provides a cool, electric glow.
*   **Secondary Alert (`secondary` #ffbf00):** Reserved for urgent "Alerts." This amber tone cuts through the dark mode to grab immediate attention.
*   **Tertiary Event (`tertiary` #ac8aff):** A deep violet used for "Events." It feels social, premium, and distinct from utility alerts.

### The Rules of Engagement:
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Separation must be achieved via background shifts. For example, a `surface-container-low` (#131315) card sits directly on a `surface` (#0e0e10) background. The 1% shift is felt, not seen as a line.
*   **Surface Hierarchy & Nesting:** Use the `surface-container` tiers to define "importance density." 
    *   *Base Map:* `surface-dim` (#0e0e10).
    *   *Primary Overlays:* `surface-container` (#19191c).
    *   *Interactive Elements (Buttons/Inputs):* `surface-container-high` (#1f1f22).
*   **The "Glass & Gradient" Rule:** Floating map controls must use `surface-variant` (#262528) with a 60% opacity and a 20px backdrop-blur. 
*   **Signature Textures:** Apply a subtle linear gradient from `primary` (#97a9ff) to `primary-container` (#859aff) at a 135-degree angle for all primary Action Buttons to give them a "lit from within" quality.

## 3. Typography: The Editorial Sans
We use a dual-sans-serif approach to balance high-energy headlines with high-utility data.

*   **Display & Headlines (Plus Jakarta Sans):** This is our "voice." Plus Jakarta Sans is used for big, bold moments (`display-lg` to `headline-sm`). It feels modern, energetic, and slightly tech-forward. Use `headline-md` for map category titles to create a strong editorial anchor.
*   **Body & Titles (Manrope):** This is our "engine." Manrope’s geometric yet warm structure ensures that even at `body-sm` (0.75rem), user comments and map coordinates remain legible under movement.
*   **Hierarchy Note:** Always pair a `label-md` in `secondary` (Amber) with a `title-lg` in `on_surface` to create an immediate hierarchy between the "Category" and the "Event Name."

## 4. Elevation & Depth
In a social map, depth is information. We use **Tonal Layering** to tell the user what is "closer" to them.

*   **The Layering Principle:** To "lift" a discussion card over the map, do not use a border. Place a `surface-container-highest` (#262528) card on top of the `surface` background. The natural luminosity difference creates the lift.
*   **Ambient Shadows:** For elements that truly float (like the "New Post" button), use a 24px blur shadow with 6% opacity. The shadow color should be `#000000` (for maximum contrast against the dark base) but feathered so widely it feels like an ambient occlusion.
*   **The "Ghost Border" Fallback:** In rare cases where elements of the same color overlap, use the `outline-variant` (#48474a) at 15% opacity. This creates a "whisper" of a boundary without breaking the fluid aesthetic.

## 5. Components

### Navigation & Pins
*   **Active Pins:** 24px diameter. Use `primary-dim` (#3e65ff) for discussions, `secondary-dim` (#eeb200) for alerts. Pins should have a 4px "aura" (a 10% opacity glow of their own color) to simulate light on the map.
*   **Floating Action Buttons (FAB):** Use `xl` (3rem) roundedness. Use the Signature Texture gradient. No icon-only buttons for primary actions; always pair with a `label-md`.

### Cards & Lists
*   **Social Cards:** Use `md` (1.5rem) roundedness. Forbid dividers. Use `spacing-6` (1.5rem) of vertical white space to separate user comments.
*   **Bottom Sheets:** Use `lg` (2rem) roundedness on the top corners only. The background must be `surface-container-low` with a glassmorphism header.

### Inputs & Interaction
*   **Input Fields:** Use `surface-container-highest` with `none` border. On focus, transition the background to `surface-bright` (#2c2c2f).
*   **Chips:** For filtering (e.g., "Trending," "Near Me"), use `full` (9999px) roundedness and `surface-variant`. When selected, toggle to `primary` with `on_primary` text.

### Additional Signature Component: The "Pulse" Indicator
For real-time activity, use a 8px dot of `primary` with an expanding, fading ring (2s duration) to indicate live discussions happening at that map coordinate.

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical spacing. A card can have `spacing-5` padding on the left and `spacing-6` on the right to feel more dynamic.
*   **Do** lean into the `primary_fixed_dim` (#718bff) for secondary text that needs to feel "branded" but not loud.
*   **Do** use the `full` roundedness scale for all interactive "pill" elements.

### Don't:
*   **Don't** use pure white (#ffffff). It will "bloom" too harshly against the `#0e0e10` background. Use `on_surface` (#f6f3f5) for high-contrast text.
*   **Don't** use 1px dividers between list items. Use a `0.5rem` gap of the background color instead.
*   **Don't** use standard "drop shadows" on cards. Rely on color shifts between `surface-container` levels.