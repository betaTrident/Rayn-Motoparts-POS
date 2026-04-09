# Design System Specification: The Industrial Atelier
 
## 1. Overview & Creative North Star
**Creative North Star: "Precision Engineering"**
This design system moves away from the "software-as-a-service" template look and adopts the aesthetic of a high-end industrial blueprint. It is defined by a "Structured Canvas" approach—where the interface is treated like a physical workstation. By combining a crisp, light-theme base with the high-octane energy of **Racing Orange (#FF5722)**, we create an environment that feels authoritative, enterprise-grade, and hyper-efficient. 
 
The system utilizes intentional asymmetry and a rigid "Structured Canvas" layout. Instead of floating elements, the UI is anchored by a logic of 1px architectural lines and subtle tonal shifts, mimicking the precision of technical drafts and professional instrumentation.
 
---
 
## 2. Colors: The High-Contrast Palette
The color logic is built on "Industrial Neutrality." We use high-contrast blacks and crisp whites, punctuated by the "Racing Orange" for critical path actions.
 
### Primary & Accent
- **Primary (#b02f00):** Used for emphasized states.
- **Primary Container (#FF5722):** The signature "Racing Orange." Use this for hero CTAs and primary action states.
- **On-Primary (#ffffff):** The mandatory contrast for all orange backgrounds.
 
### The "Structured Canvas" Surfaces
- **Surface (#f9f9f9):** The base canvas.
- **Surface Container Lowest (#ffffff):** Used for elevated "active" workspaces or cards.
- **Surface Container Low (#f3f3f3):** Used for secondary sidebar navigation or subtle background grouping.
- **Surface Container High (#e8e8e8):** Used for structural headers or "well" components.
 
### The "No-Line" Rule & Signature Textures
- **The Tonal Boundary:** While the user request specifies 1px outlines, these should be reserved for the outermost structural containers (the "Canvas"). Inside these containers, prohibit solid borders for sectioning. Use background shifts (e.g., a `surface-container-low` list item on a `surface` background) to define boundaries.
- **Signature Gradients:** For high-impact areas, use a linear gradient from `primary` (#b02f00) to `primary-container` (#FF5722) at a 135-degree angle. This adds a "machined metal" depth to the Racing Orange that a flat hex code cannot achieve.
 
---
 
## 3. Typography: Editorial Authority
We use **Inter** exclusively, leveraging its variable font weight to create a hierarchy that feels like a technical manual or a premium financial broadsheet.
 
- **Display (Lg/Md/Sm):** 3.5rem down to 2.25rem. Set with -0.02em letter spacing and "SemiBold" weight. These are your "Statement" moments.
- **Headline (Lg/Md/Sm):** 2rem to 1.5rem. Use these for major section starts. 
- **Title (Lg/Md/Sm):** 1.375rem to 1rem. Medium weight. These anchor the "Structured Canvas" blocks.
- **Body (Lg/Md/Sm):** 1rem down to 0.75rem. Regular weight. Ensure a line height of 1.5 for maximum legibility in data-heavy enterprise views.
- **Label (Md/Sm):** 0.75rem to 0.6875rem. Bold weight, All-Caps. Used for technical metadata and table headers to reinforce the industrial aesthetic.
 
---
 
## 4. Elevation & Depth: Tonal Layering
In this system, "Up" does not mean "Shadow." "Up" means "Brighter."
 
- **The Layering Principle:** Stacking follows a light-source logic. The `surface-container-lowest` (#ffffff) sits on top of `surface` (#f9f9f9) to create a natural lift.
- **The "Ghost Border" (The 1px Rule):** To satisfy the "Structured Canvas" aesthetic, use the `outline-variant` (#e4beb4) at **20% opacity** for 1px internal lines. This provides a "technical drawing" feel without cluttering the UI with heavy strokes.
- **Ambient Shadows:** Only use shadows for "Temporary Overlays" (Modals/Popovers). Use a 12% opacity shadow tinted with `secondary` (#546067) and a 24px blur to simulate a soft glow rather than a harsh drop.
- **Glassmorphism:** For floating utility bars, use `surface` at 80% opacity with a 12px backdrop-blur. This keeps the user grounded in the "Industrial Atelier" while providing modern depth.
 
---
 
## 5. Components: Industrial Primitives
 
### Buttons
- **Primary:** Background `primary-container` (#FF5722), text `on-primary`. 0.25rem (sm) corner radius. No shadow.
- **Secondary:** 1px `outline` (#907067) border, text `primary`.
- **Tertiary:** Text-only, SemiBold, All-Caps `label-md` styling.
 
### Cards & Canvas Blocks
- **The Layout:** Forbid divider lines within cards. Separate content using `surface-container-high` headers and `surface-container-lowest` bodies. 
- **Radius:** Stick to the **DEFAULT (0.25rem)** or **MD (0.375rem)** for an engineered, sharp-edged look. Avoid `xl` or `full` except for status chips.
 
### Input Fields
- **Default State:** 1px `outline-variant` border. Background `surface-container-lowest`.
- **Focus State:** 2px border using `primary-container` (#FF5722). No "outer glow" or "halo." Precision is key.
 
### Data Grids (The "Enterprise" Specialist)
- **Headers:** `surface-container-high` background, `label-md` (All-Caps) typography.
- **Row Separation:** Strictly use a 1px `outline-variant` at 10% opacity. No alternating "zebra" stripes.
 
---
 
## 6. Do’s and Don’ts
 
### Do:
- **Use "Racing Orange" Sparingly:** It is a high-vis color. If everything is orange, nothing is important. Use it for the "Kill Switch" or "Final Submit" only.
- **Embrace White Space:** Enterprise-grade does not mean "crammed." Use the `surface` color to create wide gutters between "Canvas" blocks.
- **Align to the Grid:** Every element must feel like it was snapped into place by a machine.
 
### Don’t:
- **Don't Use Pure Black Shadows:** This muddies the "Crisp Light Theme." Always tint shadows with the secondary gray-blue.
- **Don't Use Rounded Corners over 8px:** High-end industrial design favors the "soft-square" over the "pill" shape. Large radii feel "consumer-soft" rather than "enterprise-strong."
- **Don't Use Dividers for Spacing:** If you need to separate two pieces of text, use a 24px vertical gap rather than a horizontal line. Lines are for structural containers only.