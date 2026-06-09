---
name: Sky & Shore Aesthetic
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#3d4850'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#6d7881'
  outline-variant: '#bdc8d2'
  surface-tint: '#00658d'
  primary: '#00658d'
  on-primary: '#ffffff'
  primary-container: '#00baff'
  on-primary-container: '#004764'
  inverse-primary: '#81cfff'
  secondary: '#006b5f'
  on-secondary: '#ffffff'
  secondary-container: '#62fae3'
  on-secondary-container: '#007165'
  tertiary: '#5c5f61'
  on-tertiary: '#ffffff'
  tertiary-container: '#abaeb0'
  on-tertiary-container: '#3f4244'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c6e7ff'
  primary-fixed-dim: '#81cfff'
  on-primary-fixed: '#001e2d'
  on-primary-fixed-variant: '#004c6b'
  secondary-fixed: '#62fae3'
  secondary-fixed-dim: '#3cddc7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter-desktop: 15%
  content-width: 70%
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  section-gap: 64px
---

## Brand & Style

The brand personality is adventurous yet sophisticated, capturing the breezy freedom of travel with the polished connectivity of a modern social network. It is designed to evoke a sense of optimism, clarity, and ease. 

This design system utilizes a **Modern Minimalist** style with **Glassmorphic** accents to create a high-end, editorial feel. The aesthetic prioritizes expansive white space, allowing high-quality travel photography to become the primary visual driver. Subtle translucency is applied to functional overlays to maintain context and depth, ensuring the UI feels light and "airy" rather than heavy or industrial.

## Colors

The palette is inspired by the natural horizon. The **Primary Sky Blue** represents the boundless sky and the feeling of freedom, used for primary actions and brand signifiers. The **Secondary Fresh Green** (leaning toward a coastal teal-green) represents nature and adventure, reserved for success states, discovery tags, and eco-friendly indicators.

The background is a **Clean White**, ensuring a high-contrast canvas for imagery. Accents and borders utilize a sophisticated scale of **Soft Grays** to provide structure without creating visual noise. Text is rendered in a deep slate blue-gray to maintain readability while appearing softer than pure black.

## Typography

The design system uses **Plus Jakarta Sans** for its contemporary, geometric, and friendly character. It balances the professional requirements of a booking platform with the approachable warmth of a social community.

Hierarchy is established through significant weight variance rather than color changes. Headlines use a tight letter spacing and heavy weights to feel impactful, while body text employs a generous line height (1.6) to ensure long-form reviews and descriptions remain highly legible. Labels and captions are uppercase or semi-bold to distinguish them from narrative content.

## Layout & Spacing

The layout follows a **Fixed-Focus Grid**. On desktop, the functional content is centralized, occupying **70% of the viewport width** with **15% gutters** on either side. This creates an editorial "column" feel that reduces eye strain and mimics high-end travel magazines.

Spacing is governed by an **8px base unit**. 
- **Desktop:** 12-column grid within the 70% container.
- **Tablet:** 8-column grid with 40px side margins.
- **Mobile:** Single column with 20px side margins, transitioning to a fully fluid model.

Section gaps are generous (64px+) to maintain the "clean" brand promise and prevent the interface from feeling cluttered with too many competing travel packages.

## Elevation & Depth

Depth is achieved through **Ambient Shadows** and **Tonal Layering**. Surfaces do not use harsh black shadows; instead, they use a very soft, diffused shadow tinted with the primary blue (e.g., `rgba(0, 186, 255, 0.08)`) to make cards feel like they are floating over the white canvas.

**Elevation Levels:**
1.  **Level 0 (Base):** Pure white background.
2.  **Level 1 (Cards):** Subtle 1px border (#F1F5F9) with a low-blur shadow.
3.  **Level 2 (Active/Hover):** Increased shadow spread to indicate interactivity.
4.  **Level 3 (Navigation/AI Chat):** Background blur (20px) with 80% opacity white fill, creating a glassmorphic effect that keeps the travel imagery visible underneath.

## Shapes

To achieve the "sophisticated SNS" look, the design system utilizes a **Rounded** shape language. Standard components like input fields and buttons use a **0.5rem (8px)** radius. However, container elements—specifically **Cards, Sliders, and Modals**—are intentionally more pronounced with a **1rem (16px) or 1.5rem (24px)** radius.

This high degree of roundedness softens the technical nature of a booking engine and makes the UI feel friendly, modern, and "touchable," consistent with mobile-first social media platforms.

## Components

### Buttons & Interaction
Buttons are pill-shaped or highly rounded. The primary button uses a vibrant Sky Blue gradient or solid fill with white text. Hover states should feature a subtle scale-up effect (1.02x) to emphasize the "interactive card" feel.

### Cards (The Core Unit)
Travel packages and user reviews are housed in cards. They feature a "Media-First" layout where the image occupies the top 60-70% of the card. Text is inset with generous padding (24px). Interactive elements (like "Like" or "Save") are placed as glassmorphic icon buttons overlaying the image corners.

### Search & Navigation
The search bar is a prominent, oversized component. It uses a soft shadow rather than a heavy border to appear integrated into the background. Navigation is minimal, using icons with text labels, often anchored as a glassmorphic bar at the bottom on mobile devices.

### AI Recommendation Interface
Chat bubbles for AI recommendations use a distinct Fresh Green tint for the AI and a Neutral Gray for the user. These bubbles should have "squishy" physics—slight bounciness when appearing—to feel modern and responsive.

### Sliders
Hero banners use full-width or container-width sliders with "peek" functionality (showing a sliver of the next card) to encourage horizontal swiping, mimicking social media stories.