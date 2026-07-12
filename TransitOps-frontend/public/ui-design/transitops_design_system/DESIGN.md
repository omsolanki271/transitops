---
name: TransitOps Design System
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#424754'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#727785'
  outline-variant: '#c2c6d6'
  surface-tint: '#005ac2'
  primary: '#0058be'
  on-primary: '#ffffff'
  primary-container: '#2170e4'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#6df5e1'
  on-secondary-container: '#006f64'
  tertiary: '#00628d'
  on-tertiary: '#ffffff'
  tertiary-container: '#007cb1'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a42'
  on-primary-fixed-variant: '#004395'
  secondary-fixed: '#71f8e4'
  secondary-fixed-dim: '#4fdbc8'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005048'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.6'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  code:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  container-margin: 24px
  gutter: 16px
---

## Brand & Style
The design system is engineered for **TransitOps**, a high-performance transport operations platform. The brand personality is authoritative yet approachable, blending the systematic precision of a developer tool with the operational clarity of a modern ERP. 

The aesthetic is **Modern Corporate Minimalism**, heavily influenced by high-utility SaaS platforms. It utilizes generous whitespace, purposeful motion, and a layered architectural approach to information density. The goal is to reduce cognitive load for operators managing complex logistical data through a "focus-first" interface that feels light, fast, and premium.

## Colors
The palette leverages a sophisticated "Garden Slate" foundation—mixing cool mint and sage greens with high-performance blues. 

- **Primary & Action:** The Electric Blue (#3B82F6) is reserved for primary actions and brand-critical touchpoints.
- **Surface Strategy:** We depart from traditional whites. The top navigation uses a desaturated sage (#EEF4F0), while the main workspace utilizes a soft, minty wash (#E0F8D6) to distinguish the dashboard environment.
- **Card Elements:** Data containers use a high-visibility mint (#B3E5B7). Ensure text contrast against this background remains at WCAG AA standards using the Dark Gray (#1F2937).

## Typography
**Inter** is the sole typeface for this design system, chosen for its exceptional legibility in data-dense environments. 

- **Weight Strategy:** Use Bold (700) for primary dashboard headings to create a clear hierarchy. Body text uses Medium (500) rather than Regular (400) to ensure legibility against the tinted background surfaces.
- **Leading:** Generous line-height (1.6 for body) is mandatory to maintain the "airy" SaaS feel and prevent visual fatigue during long operational shifts.

## Layout & Spacing
The design system utilizes a **12-column fluid grid** for the main content area, with a fixed-width collapsible sidebar.

- **Sidebar:** Fixed at 280px when expanded, 64px when collapsed.
- **Rhythm:** A strict 8px/4px spatial system. Vertical rhythm between dashboard cards should consistently be 24px (lg).
- **Reflow:** On tablet, the 12-column grid collapses to 6 columns. On mobile, elements stack into a single column with 16px horizontal safe-margins.

## Elevation & Depth
Depth is achieved through **Soft Tonal Layering** and **Ambient Shadows**. 

1.  **Level 0 (Floor):** The #E0F8D6 background.
2.  **Level 1 (Cards):** #B3E5B7 with a 1px inner white border (0.1 opacity) and a very soft, large-radius shadow (0px 10px 30px rgba(0,0,0,0.04)).
3.  **Level 2 (Overlays/Modals):** Pure white surfaces or high-opacity glassmorphism (Backdrop blur: 12px) to distinguish temporary interactions from the underlying data.
4.  **Interaction:** On hover, cards should "lift" slightly by increasing shadow spread and shifting -2px on the Y-axis.

## Shapes
The shape language is friendly and modern, utilizing significant corner rounding to offset the "stiff" nature of enterprise data.

- **Large Cards:** Use a 24px radius to define major content sections.
- **Inputs & Smaller Cards:** Use a 12px radius.
- **Buttons:** Use a Pill-shaped (rounded-xl) approach to maximize tap targets and visual distinction from square data cells.

## Components
- **Buttons:** Primary buttons use a linear gradient (Primary to Secondary) with white text. Apply a subtle 2px "lift" shadow on hover. Size XL is the default for primary dashboard actions.
- **Sidebar:** Dark Gray (#1F2937) or Deep Navy with semi-transparent active states. Icons should be 24px, stroke-based (2px weight).
- **Input Fields:** 12px rounded corners, 1px border using a darker shade of the background mint. Focus state adds a 3px Primary Blue glow.
- **Data Vis:** Charts should strictly use the Primary Blue, Secondary Teal, and Info Blue. Use soft rounded ends on bar charts and smooth interpolation on line graphs.
- **Chips/Status:** Use the Success/Warning/Danger palette with 10% opacity backgrounds and 100% opacity text for high legibility without visual clutter.