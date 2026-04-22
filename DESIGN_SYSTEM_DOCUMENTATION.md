# ProperEstate — Editorial Brutalist + Restrained Luxury Design System

## 🎨 Design Philosophy

This redesign combines three distinct visual languages:

1. **Editorial Brutalist** (humandestroyer.tilda.ws)
   - Oversized typography with variable weights
   - Stark black/white contrast blocks
   - Monospace accents and section numbers
   - Letter-by-letter text animations

2. **Restrained Luxury** (everyday-needs.com)
   - Near-white backgrounds (#F8F7F4)
   - Minimal borders and generous padding
   - Clean hover underlines instead of shadows
   - Refined mono-spaced accents

3. **Cinematic Experience** (sonsofgallipoli.com)
   - Full-screen video/animated backgrounds
   - Parallax depth layers
   - Curtain wipe page transitions
   - Scroll-triggered section entrances

---

## 📁 File Structure

```
frontend/src/
├── DesignSystem.css          # Core design tokens, variables, utilities
├── HeroSection.css            # Full-screen hero with video background
├── Navigation.css             # Frosted glass navbar with animated underlines
├── Sidebar.css                # Dark luxury sidebar with spring animations
├── PropertyCards.css          # Card hover effects & entrance animations
├── SearchEnhanced.css         # Live search with spring dropdown
├── PageTransitions.css        # Curtain wipe & masked reveal transitions
├── ThemeSwitcher.css          # Dark/Light mode toggle
├── ScrollAnimations.css       # Intersection Observer triggered effects
├── App.css                    # Master stylesheet
├── animations.js              # JavaScript animation controllers
└── components/
    └── HeroVideoBackground.js # Video background component
```

---

## 🎬 Key Features Implemented

### 1. **Hero Section**
- ✅ Full-bleed video/animated background with dark overlay
- ✅ Giant serif headline (80-120px) with staggered word reveal animation
- ✅ Subtitle fades in 400ms after headline
- ✅ Floating search widget with spring physics
- ✅ Parallax floating cards that respond to mouse movement
- ✅ Animated statistics counter

**Files:** `HeroSection.css`, `components/HeroVideoBackground.js`

### 2. **Navigation Bar**
- ✅ Transparent on hero, transitions to frosted glass on scroll
- ✅ Logo with weight shift animation on hover
- ✅ Nav links with left-to-right underline growth
- ✅ Active page indicator with animated dot
- ✅ Icon buttons with micro-animations
- ✅ Badge notifications with pop animation

**Files:** `Navigation.css`

### 3. **Sidebar**
- ✅ Dark luxury background (#0F0F0F) with noise texture
- ✅ Spring animation slide-in with overshoot
- ✅ Icon + label layout with micro-animations (rotate 15deg + scale 1.1)
- ✅ Active item with left-border accent that "draws" in
- ✅ Staggered entrance for each item (80ms delay)
- ✅ Collapse/expand toggle with 180deg rotation

**Files:** `Sidebar.css`

### 4. **Property Cards**
- ✅ Image zoom on hover (scale 1.05, 600ms)
- ✅ Card lift with translated shadow
- ✅ Price badge with animated counter (counts up on viewport entry)
- ✅ Heart button with "pop" keyframe animation
- ✅ "New listing" badge with pulsing glow ring
- ✅ Cascade entrance animation (staggered 80ms)

**Files:** `PropertyCards.css`

### 5. **Search System**
- ✅ Typewriter effect for placeholder text
- ✅ Live results dropdown with spring slide-down
- ✅ Staggered result row animations (opacity + translateX)
- ✅ Matching text highlighted with animated yellow underline
- ✅ "No results" state with shake animation
- ✅ Recent searches with localStorage persistence

**Files:** `SearchEnhanced.css`, `components/SearchBar.js`

### 6. **Page Transitions**
- ✅ Curtain wipe: solid panel slides left-to-right
- ✅ Masked reveal: expanding circle from click origin
- ✅ Applied to ALL router links
- ✅ Loading bar indicator

**Files:** `PageTransitions.css`, `animations.js`

### 7. **Button System**
- ✅ Primary CTA: magnetic text swap illusion on hover
- ✅ Secondary: border draws itself via clip-path
- ✅ Icon buttons: spring bounce on click
- ✅ Ripple effect starting at cursor position
- ✅ Disabled state: shimmer/scan-line animation

**Files:** `DesignSystem.css`

### 8. **Scroll Animations**
- ✅ Section headings: word-by-word wipe-up reveal
- ✅ Stat numbers: count up from 0 on viewport entry
- ✅ Section dividers: horizontal line draws left-to-right
- ✅ Image grids: left-to-right wipe using clip-path
- ✅ All powered by Intersection Observer (performance optimized)

**Files:** `ScrollAnimations.css`, `animations.js`

---

## 🎨 Color Palette

### Light Theme
```css
--color-bg-light: #F8F7F4      /* Warm off-white */
--color-card: #FFFFFF           /* Pure white */
--color-border: #E8E6E1         /* Subtle border */
--color-text-dark: #1A1A1A      /* Near black */
--color-accent: #C8A96E         /* Warm gold */
```

### Dark Theme
```css
--color-bg-dark: #0A0E1A        /* Deep navy */
--color-bg-dark-alt: #0F0F0F    /* Near black */
--color-card: #151922           /* Dark card */
--color-border: #2A2F3C         /* Dark border */
--color-text-light: #F0EDE8     /* Off-white text */
--color-accent: #C8A96E         /* Warm gold */
```

---

## 📐 Typography

### Font Families
- **Serif (Headings):** Playfair Display, Cormorant Garamond
- **Sans (Body):** Inter, system-ui
- **Mono (Labels):** JetBrains Mono

### Fluid Type Scale
Uses `clamp()` for responsive sizing:
```css
--text-xs: clamp(0.69rem, 0.66rem + 0.13vw, 0.75rem)
--text-sm: clamp(0.83rem, 0.78rem + 0.24vw, 0.94rem)
--text-base: clamp(1rem, 0.93rem + 0.37vw, 1.19rem)
--text-hero: clamp(3.58rem, 2.86rem + 3.63vw, 5.69rem)
```

---

## ⚡ Performance Optimizations

1. **Transform & Opacity Only**
   - All animations use GPU-accelerated properties
   - No layout-triggering properties (width, height, top, left)

2. **will-change Sparingly**
   - Only applied to actively animating elements
   - Removed after animation completes

3. **Intersection Observer**
   - Replaces scroll event listeners
   - Triggers animations only when elements enter viewport

4. **Lazy Loading**
   - Below-fold media loads on demand
   - Video background uses compressed WebM + MP4 fallback

5. **Reduced Motion Support**
   ```css
   @media (prefers-reduced-motion: reduce) {
     * { animation-duration: 0.01ms !important; }
   }
   ```

---

## 🎯 Animation Timing

### Easing Functions
```css
--transition-fast: 200ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 400ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 600ms cubic-bezier(0.4, 0, 0.2, 1)
--transition-spring: 600ms cubic-bezier(0.34, 1.56, 0.64, 1)
```

### Stagger Delays
- Cards: 80ms between each
- Sidebar items: 50ms between each
- Search results: 50ms between each
- Section words: 100ms between each

---

## 🔧 JavaScript Controllers

### `animations.js` Exports

```javascript
// Initialize all animations
initAnimations()

// Split headings into animated words
splitSectionHeadings()

// Handle page transitions
handlePageTransition(callback, clickEvent)

// Smooth scroll to element
smoothScrollTo(element, offset)
```

### Usage Example
```javascript
import initAnimations from './animations';

useEffect(() => {
  initAnimations();
}, [location.pathname]);
```

---

## 📱 Responsive Breakpoints

```css
/* Desktop: 1024px+ */
/* Tablet: 768px - 1023px */
/* Mobile: < 768px */
/* Small Mobile: < 480px */
```

All components are fully responsive with mobile-first approach.

---

## ♿ Accessibility

1. **Keyboard Navigation**
   - All interactive elements focusable
   - Custom focus-visible styles

2. **Screen Readers**
   - Semantic HTML structure
   - ARIA labels where needed
   - `.sr-only` utility class

3. **Reduced Motion**
   - Respects `prefers-reduced-motion`
   - Disables all animations when requested

4. **Color Contrast**
   - WCAG AA compliant
   - 4.5:1 minimum for body text
   - 3:1 minimum for large text

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Start Development Server
```bash
npm start
```

### 3. Build for Production
```bash
npm run build
```

---

## 🎥 Adding Video Background

Replace the gradient fallback with actual video:

```javascript
<HeroVideoBackground 
  videoSrc="/videos/hero-background.mp4"
  posterSrc="/images/hero-poster.jpg"
/>
```

**Video Requirements:**
- Format: MP4 (H.264) + WebM (VP9) for browser support
- Resolution: 1920x1080 minimum
- Duration: 10-30 seconds (looping)
- File size: < 5MB (compressed)
- Aspect ratio: 16:9

---

## 🎨 Customization

### Change Accent Color
Edit `DesignSystem.css`:
```css
:root {
  --color-accent: #C8A96E; /* Change to your brand color */
}
```

### Adjust Animation Speed
Edit timing variables:
```css
:root {
  --transition-base: 400ms; /* Make faster/slower */
}
```

### Modify Typography
Replace font imports in `DesignSystem.css`:
```css
@import url('https://fonts.googleapis.com/css2?family=Your+Font');
```

---

## 📊 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Features requiring polyfills:**
- Intersection Observer (IE11)
- CSS Custom Properties (IE11)
- backdrop-filter (Firefox < 103)

---

## 🐛 Known Issues & Solutions

### Issue: Video not autoplaying on mobile
**Solution:** Videos require user interaction on iOS. Use animated gradient fallback.

### Issue: Animations janky on low-end devices
**Solution:** Reduce animation complexity or disable via `prefers-reduced-motion`.

### Issue: Frosted glass effect not working
**Solution:** Check browser support for `backdrop-filter`. Fallback to solid background.

---

## 📝 Maintenance Notes

### Adding New Animated Elements
1. Add appropriate class (`.fade-in-up`, `.scale-in`, etc.)
2. Element will auto-animate via Intersection Observer
3. No additional JavaScript needed

### Creating Custom Animations
1. Define keyframes in appropriate CSS file
2. Add animation class
3. Register in `animations.js` if JS control needed

---

## 🎓 Learning Resources

- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)
- [Cubic Bezier Easing](https://cubic-bezier.com/)

---

## 📄 License

This design system is part of the ProperEstate project.

---

## 👥 Credits

**Design Inspiration:**
- humandestroyer.tilda.ws (Editorial Brutalism)
- everyday-needs.com (Restrained Luxury)
- sonsofgallipoli.com (Cinematic Experience)

**Implementation:** ProperEstate Development Team

---

**Last Updated:** April 30, 2026
**Version:** 1.0.0
