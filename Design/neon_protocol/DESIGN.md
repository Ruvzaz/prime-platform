---
name: Neon Protocol
colors:
  surface: '#0e1418'
  surface-dim: '#0e1418'
  surface-bright: '#343a3f'
  surface-container-lowest: '#090f13'
  surface-container-low: '#161c21'
  surface-container: '#1a2025'
  surface-container-high: '#252b2f'
  surface-container-highest: '#30353a'
  on-surface: '#dee3e9'
  on-surface-variant: '#b9cacb'
  inverse-surface: '#dee3e9'
  inverse-on-surface: '#2b3136'
  outline: '#849495'
  outline-variant: '#3b494b'
  surface-tint: '#00dbe9'
  primary: '#dbfcff'
  on-primary: '#00363a'
  primary-container: '#00f0ff'
  on-primary-container: '#006970'
  inverse-primary: '#006970'
  secondary: '#ffb3b2'
  on-secondary: '#680012'
  secondary-container: '#ff525c'
  on-secondary-container: '#5b000f'
  tertiary: '#faf3ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#e1d2ff'
  on-tertiary-container: '#7213ff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#7df4ff'
  primary-fixed-dim: '#00dbe9'
  on-primary-fixed: '#002022'
  on-primary-fixed-variant: '#004f54'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b2'
  on-secondary-fixed: '#410008'
  on-secondary-fixed-variant: '#92001e'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#0e1418'
  on-background: '#dee3e9'
  surface-variant: '#30353a'
typography:
  display-lg:
    fontFamily: Space Grotesk
    fontSize: 72px
    fontWeight: '700'
    lineHeight: 80px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.1em
spacing:
  grid-unit: 4px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 16px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is engineered for high-performance interfaces, drawing deep inspiration from cybernetic aesthetics and futuristic command centers. The brand personality is precise, immersive, and high-energy, targeting tech-savvy users, developers, and gamers who demand a sophisticated "HUD" (Heads-Up Display) experience.

The visual direction combines **Glassmorphism** with **Brutalism**. It utilizes deep, dark backgrounds to make vibrant neon accents pop, creating a sense of infinite digital space. Interfaces should feel like they are projected onto glass, utilizing semi-transparency and light-refraction effects to simulate advanced holographic technology.

## Colors

The palette is rooted in a "Void Black" foundation to ensure maximum contrast for the neon elements.

- **Primary (Electric Cyan):** Used for primary actions, data visualization headers, and active states. It represents the "alive" state of the system.
- **Secondary (Neon Pulse):** Used for critical alerts, high-priority errors, and aggressive highlights. It provides a sharp counterpoint to the cyan.
- **Tertiary (Quantum Violet):** Reserved for complex data types, secondary interactive elements, and background depth glows.
- **Neutral:** A range of deep navy-blacks and cool grays that form the "chassis" of the UI.

All interactive elements should utilize a "glow" state, where the color bleeds slightly into the surrounding background using a `20px` Gaussian blur at `30%` opacity.

## Typography

The typography strategy leverages high-tech sans-serifs and monospaced fonts to reinforce the "terminal" feel. **Space Grotesk** is used for headlines to provide a geometric, futuristic character. **Geist** provides ultra-clean readability for body text, while **JetBrains Mono** is essential for metadata, labels, and technical readouts.

Key stylistic rules:
- **Uppercase Headers:** Headlines should often use uppercase with increased letter spacing for a more architectural look.
- **Monospaced Accents:** Small labels, timestamps, and ID numbers must always use the monospaced font to suggest automated, machine-generated data.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model on desktop to maintain a structured, cockpit-like feel. 

- **Desktop:** A 12-column grid with a max-width of 1440px. 
- **Tablet:** 8-column fluid grid.
- **Mobile:** 4-column fluid grid.

The spacing rhythm is strictly based on a **4px baseline**. All margins and paddings must be multiples of 4. Component spacing should be tight to maximize information density, mirroring professional technical software. Heavy use of "Panel" containers is encouraged to group related data points.

## Elevation & Depth

Depth is achieved through **Glassmorphism** and **Tonal Layering** rather than traditional shadows. 

1. **Base Layer:** `#050A0E` (solid).
2. **Surface Layer:** Dark translucent overlays (e.g., `rgba(10, 15, 20, 0.7)`) with a `16px` backdrop blur.
3. **Accent Layer:** Fine 1px borders using `rgba(0, 240, 255, 0.2)` to define edges.
4. **Interactive Layer:** Outer glows. Instead of shadows, use "drop-glows" where an element's border color is mirrored in a soft, diffused outer glow to indicate focus or activity.

## Shapes

The shape language is strictly **Sharp (0px)**. To deviate from the standard rounded web aesthetic, this design system uses hard 90-degree angles and 45-degree chamfered corners for containers.

- **Buttons & Inputs:** Hard edges only.
- **Decorative Elements:** Use "circuitry" lines—horizontal or vertical lines that end in a 45-degree diagonal segment—to connect disparate UI panels.
- **Clipping:** Cards may occasionally feature a "clipped corner" (top-right or bottom-left) to enhance the futuristic, military-tech vibe.

## Components

### Buttons
- **Primary:** solid Neon Cyan background, black text, sharp corners. No border. On hover, add an external glow.
- **Ghost:** 1px Neon Cyan border, transparent background. Text is Neon Cyan.
- **Action:** 45-degree chamfered corners on the top-right.

### Input Fields
- Dark, semi-transparent background (`rgba(255, 255, 255, 0.05)`).
- 1px bottom border only, glowing when focused.
- Labels in `label-mono` style, positioned above the field.

### Chips / Tags
- Small, rectangular boxes with `label-mono` text.
- Used for status indicators (e.g., [ ONLINE ], [ ERROR ]).
- Backgrounds should be highly desaturated versions of the status color with a 1px bright border.

### Cards & Panels
- Backdrop blur is mandatory.
- 1px border on all sides using a low-opacity primary color.
- Include a "Header Bar" for every card—a thin 4px strip of solid color at the very top.

### Data Lists
- Alternating row highlights using subtle opacity changes.
- Right-aligned monospaced values for easy vertical scanning.
- Vertical "scanline" textures (1px repeating patterns) can be used as very subtle background decorations.