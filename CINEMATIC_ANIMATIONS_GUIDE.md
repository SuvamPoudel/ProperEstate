# Cinematic Animations System

## ✨ What's Implemented

### 1. **Magnetic Cursor**
- Smooth-following cursor with easing
- Morphs and expands on hover
- Magnetic pull effect on interactive elements
- Inspired by Moon Safari

### 2. **Scroll-Triggered Animations**
- Fade in from bottom
- Fade in from left/right
- Scale in
- Blur reveal
- Slide reveal
- Stagger animations for grids

### 3. **Button Animations**
- Ripple effect on click
- Hover lift with shadow
- Expanding circle on hover
- Magnetic pull effect
- Smooth transitions

### 4. **Card Animations**
- 3D tilt effect on hover
- Image zoom and rotate
- Smooth elevation
- Stagger animation when scrolling into view

### 5. **Parallax Effects**
- Multiple layers moving at different speeds
- Smooth scroll-based movement

### 6. **Micro-Interactions**
- Elastic hover effects
- Glow effects
- Morphing shapes
- Gradient animations
- Floating animations

## 🎨 How to Use

### Adding Animations to Elements

#### Scroll Animations:
```html
<!-- Fade in from bottom -->
<div className="fade-in">Content</div>

<!-- Fade in from left -->
<div className="fade-in-left">Content</div>

<!-- Fade in from right -->
<div className="fade-in-right">Content</div>

<!-- Scale in -->
<div className="scale-in">Content</div>

<!-- Blur reveal -->
<div className="blur-reveal">Content</div>
```

#### Button Animations:
```html
<!-- Animated button with ripple -->
<button className="btn-primary btn-animated ripple">Click Me</button>

<!-- Magnetic button -->
<button className="btn-primary btn-magnetic">Hover Me</button>

<!-- Elastic hover -->
<button className="btn-primary elastic-hover">Bounce</button>
```

#### Card Animations:
```html
<!-- Animated card with tilt -->
<div className="land-card card-animated tilt-card">
  <div className="card-image">
    <img src="..." alt="..." />
  </div>
  <div className="card-content">...</div>
</div>
```

#### Parallax Layers:
```html
<div className="parallax-layer" data-speed="0.5">
  Background Layer
</div>
<div className="parallax-layer" data-speed="0.3">
  Foreground Layer
</div>
```

#### Stagger Animations:
```html
<div className="lands-grid">
  <div className="stagger-item">Item 1</div>
  <div className="stagger-item">Item 2</div>
  <div className="stagger-item">Item 3</div>
</div>
```

## 🎯 Animation Classes Reference

### Scroll Animations:
- `.fade-in` - Fade in from bottom
- `.fade-in-left` - Fade in from left
- `.fade-in-right` - Fade in from right
- `.scale-in` - Scale up from small
- `.blur-reveal` - Blur to clear
- `.slide-reveal` - Slide reveal with overlay

### Hover Effects:
- `.smooth-hover` - Smooth color and position change
- `.elastic-hover` - Elastic bounce on hover
- `.glow-on-hover` - Glow effect on hover
- `.morph-shape` - Shape morphing on hover

### Button Effects:
- `.btn-animated` - Expanding circle on hover
- `.btn-magnetic` - Magnetic pull effect
- `.ripple` - Ripple effect on click

### Card Effects:
- `.card-animated` - Smooth hover elevation
- `.tilt-card` - 3D tilt on hover

### Special Effects:
- `.floating` - Floating animation
- `.gradient-animated` - Animated gradient
- `.shimmer` - Shimmer loading effect
- `.parallax-layer` - Parallax scrolling

## 🚀 Automatic Features

The `CinematicEffects` component automatically:

1. **Creates magnetic cursor** - No setup needed
2. **Observes scroll animations** - Automatically triggers when elements enter viewport
3. **Adds magnetic effect** - To all buttons, links, and cards
4. **Enables parallax** - For elements with `.parallax-layer` class
5. **Adds tilt effect** - To all `.land-card` elements
6. **Stagger grid items** - Automatically staggers `.lands-grid` children

## 🎨 Customization

### Changing Animation Speed:
Edit `Animations.css`:
```css
.fade-in {
  transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Changing Cursor Style:
Edit `Animations.css`:
```css
.cursor-magnetic {
  width: 15px;
  height: 15px;
  background: #D4AF37;
}
```

### Changing Magnetic Strength:
Edit `CinematicEffects.js`:
```javascript
el.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
// Change 0.1 to increase/decrease magnetic pull
```

## 📊 Performance

All animations use:
- `transform` and `opacity` for GPU acceleration
- `will-change` for optimization
- `requestAnimationFrame` for smooth 60fps
- Intersection Observer for efficient scroll detection
- Passive event listeners where possible

## 🎬 Inspiration

Animations inspired by:
- **Moon Safari** - Magnetic cursor, smooth transitions
- **Everyday Needs** - Elegant hover effects, scroll animations
- **Clock Strikes Twelve** - Cinematic feel, attention to detail

## 🔧 Troubleshooting

### Cursor not visible:
- Check if `CinematicEffects` component is imported
- Ensure no conflicting `cursor` CSS

### Animations not triggering:
- Add animation class to element
- Check if element is in viewport
- Verify `CinematicEffects` is rendered

### Performance issues:
- Reduce number of animated elements
- Use `will-change` sparingly
- Disable parallax on mobile

## 📱 Mobile Considerations

Animations automatically adapt:
- Cursor effects disabled on touch devices
- Reduced motion for accessibility
- Optimized for mobile performance

## ✅ Status

- ✅ Magnetic cursor implemented
- ✅ Scroll animations working
- ✅ Button animations active
- ✅ Card animations functional
- ✅ Parallax effects ready
- ✅ All micro-interactions working
- ✅ Performance optimized
- ✅ Mobile-friendly

**Every interaction now feels cinematic and intentional!**
