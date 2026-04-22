/* ===================================================================
   ANIMATION CONTROLLERS — Intersection Observer & Interactive Effects
   =================================================================== */

// Initialize all animations when DOM is ready
export const initAnimations = () => {
  initScrollAnimations();
  initNavbarScroll();
  initHeroAnimations();
  initSearchAnimations();
  initCardAnimations();
  initButtonRipples();
  initParallax();
};

// ===== INTERSECTION OBSERVER FOR SCROLL ANIMATIONS =====
const initScrollAnimations = () => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // DISABLED: Counter animations cause numbers to change rapidly
        // if (entry.target.classList.contains('stat-number') || 
        //     entry.target.classList.contains('hero-stat-num')) {
        //   animateCounter(entry.target);
        // }
        
        // DISABLED: Price counter animation
        // if (entry.target.classList.contains('price-tag')) {
        //   entry.target.classList.add('counting');
        //   animatePriceCounter(entry.target);
        // }
      }
    });
  }, observerOptions);

  // Observe all animated elements
  const animatedElements = document.querySelectorAll(
    '.animate-on-scroll, .fade-in-up, .fade-in, .scale-in, ' +
    '.slide-in-left, .slide-in-right, .section-heading, ' +
    '.section-divider, .image-grid-item, .stat-number, ' +
    '.stagger-container, .rotate-in, .blur-in, .text-reveal, ' +
    '.hero-stat-num, .price-tag'
  );

  animatedElements.forEach(el => observer.observe(el));
};

// ===== COUNTER ANIMATION =====
const animateCounter = (element) => {
  const text = element.textContent;
  const number = parseInt(text.replace(/[^0-9]/g, ''));
  
  if (isNaN(number)) return;
  
  const duration = 2000;
  const steps = 60;
  const increment = number / steps;
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= number) {
      element.textContent = text;
      clearInterval(timer);
    } else {
      const suffix = text.replace(/[0-9,]/g, '');
      element.textContent = Math.floor(current).toLocaleString() + suffix;
    }
  }, duration / steps);
};

// ===== PRICE COUNTER ANIMATION =====
const animatePriceCounter = (element) => {
  const text = element.textContent;
  const match = text.match(/Rs\.\s*([\d,]+)/);
  
  if (!match) return;
  
  const number = parseInt(match[1].replace(/,/g, ''));
  const duration = 1500;
  const steps = 50;
  const increment = number / steps;
  let current = 0;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= number) {
      element.textContent = text;
      clearInterval(timer);
    } else {
      element.textContent = `Rs. ${Math.floor(current).toLocaleString()}/mo`;
    }
  }, duration / steps);
};

// ===== NAVBAR SCROLL EFFECT =====
const initNavbarScroll = () => {
  const header = document.querySelector('.header');
  if (!header) return;
  
  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 80) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  });
};

// ===== HERO TITLE WORD ANIMATION =====
const initHeroAnimations = () => {
  const heroTitle = document.querySelector('.hero-title-enhanced');
  if (!heroTitle) return;
  
  // Split title into words
  const text = heroTitle.textContent;
  const words = text.split(' ');
  
  heroTitle.innerHTML = words.map(word => 
    `<span class="hero-title-word">
      <span class="hero-title-word-inner">${word}</span>
    </span>`
  ).join(' ');
  
  // Add video background if not exists
  addHeroVideoBackground();
};

// ===== HERO VIDEO BACKGROUND =====
const addHeroVideoBackground = () => {
  const hero = document.querySelector('.hero-enhanced');
  if (!hero || hero.querySelector('.hero-video-background')) return;
  
  // Create video background container
  const videoContainer = document.createElement('div');
  videoContainer.className = 'hero-video-background';
  
  // Use a placeholder animated gradient as fallback
  // In production, replace with actual video element
  const videoElement = document.createElement('div');
  videoElement.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0A0E1A 0%, #1A1F2E 50%, #0A0E1A 100%);
    background-size: 200% 200%;
    animation: gradientShift 15s ease infinite;
  `;
  
  // Add keyframe animation
  if (!document.querySelector('#gradient-shift-keyframes')) {
    const style = document.createElement('style');
    style.id = 'gradient-shift-keyframes';
    style.textContent = `
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
    `;
    document.head.appendChild(style);
  }
  
  videoContainer.appendChild(videoElement);
  
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'hero-overlay';
  
  // Insert at the beginning of hero
  hero.insertBefore(overlay, hero.firstChild);
  hero.insertBefore(videoContainer, hero.firstChild);
};

// ===== SEARCH ANIMATIONS — typewriter disabled (caused glitch) =====
const initSearchAnimations = () => {
  // Placeholder is static — set once and leave it alone
  const searchInput = document.querySelector('.search-input-enhanced');
  if (searchInput && !searchInput.placeholder) {
    searchInput.placeholder = 'Search properties, locations...';
  }
};

// ===== CARD HOVER ANIMATIONS =====
const initCardAnimations = () => {
  const cards = document.querySelectorAll('.land-card');
  
  cards.forEach(card => {
    // Add entrance animation observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
        }
      });
    }, { threshold: 0.1 });
    
    observer.observe(card);
    
    // Heart button animation
    const saveBtn = card.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', function(e) {
        this.classList.add('saved');
        setTimeout(() => this.classList.remove('saved'), 300);
      });
    }
  });
};

// ===== BUTTON RIPPLE EFFECT =====
const initButtonRipples = () => {
  const buttons = document.querySelectorAll(
    '.btn-primary, .btn-secondary, .btn-outline, ' +
    '.icon-btn, .save-btn, .search-btn-enhanced'
  );
  
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
};

// ===== PARALLAX EFFECT =====
const initParallax = () => {
  const parallaxElements = document.querySelectorAll('.parallax-element');
  if (parallaxElements.length === 0) return;
  
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    
    parallaxElements.forEach(element => {
      const speed = element.dataset.speed || 0.5;
      const yPos = -(scrolled * speed);
      element.style.transform = `translateY(${yPos}px)`;
    });
  });
  
  // Mouse parallax for hero floating cards
  const hero = document.querySelector('.hero-enhanced');
  if (hero) {
    document.addEventListener('mousemove', (e) => {
      const cards = hero.querySelectorAll('.floating-card');
      const mouseX = e.clientX / window.innerWidth;
      const mouseY = e.clientY / window.innerHeight;
      
      cards.forEach((card, index) => {
        const speed = (index + 1) * 10;
        const x = (mouseX - 0.5) * speed;
        const y = (mouseY - 0.5) * speed;
        
        card.style.transform = `translate(${x}px, ${y}px)`;
      });
    });
  }
};

// ===== SECTION HEADING WORD SPLIT =====
export const splitSectionHeadings = () => {
  const headings = document.querySelectorAll('.section-heading');
  
  headings.forEach(heading => {
    if (heading.querySelector('.section-heading-word')) return; // Already split
    
    const text = heading.textContent;
    const words = text.split(' ');
    
    heading.innerHTML = words.map(word => 
      `<span class="section-heading-word">
        <span class="section-heading-word-inner">${word}</span>
      </span>`
    ).join(' ');
  });
};

// ===== PAGE TRANSITION HANDLER =====
export const handlePageTransition = (callback, clickEvent = null) => {
  // Create curtain element
  const curtain = document.createElement('div');
  curtain.className = 'curtain-wipe entering';
  document.body.appendChild(curtain);
  
  // If click event provided, use masked reveal instead
  if (clickEvent) {
    curtain.className = 'masked-reveal entering';
    const x = (clickEvent.clientX / window.innerWidth) * 100;
    const y = (clickEvent.clientY / window.innerHeight) * 100;
    curtain.style.setProperty('--click-x', `${x}%`);
    curtain.style.setProperty('--click-y', `${y}%`);
  }
  
  // Execute callback after animation
  setTimeout(() => {
    if (callback) callback();
    
    // Remove curtain
    setTimeout(() => {
      curtain.remove();
    }, 100);
  }, 600);
};

// ===== SMOOTH SCROLL TO ELEMENT =====
export const smoothScrollTo = (element, offset = 0) => {
  const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - offset;
  
  window.scrollTo({
    top: targetPosition,
    behavior: 'smooth'
  });
};

// ===== EXPORT INITIALIZATION =====
export default initAnimations;
