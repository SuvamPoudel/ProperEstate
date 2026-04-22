import { useEffect } from 'react';

const CinematicEffects = () => {
  useEffect(() => {
    // ===== PAGE LOADER =====
    const createPageLoader = () => {
      const loader = document.createElement('div');
      loader.className = 'page-loader';
      loader.innerHTML = `
        <div class="loader-logo">Proper<span>Estate</span></div>
        <div class="loader-bar-wrap">
          <div class="loader-bar"></div>
        </div>
      `;
      document.body.appendChild(loader);
      
      setTimeout(() => {
        loader.classList.add('loaded');
        setTimeout(() => loader.remove(), 800);
      }, 2000);
    };

    // Only show loader on initial page load
    if (!sessionStorage.getItem('loaderShown')) {
      createPageLoader();
      sessionStorage.setItem('loaderShown', 'true');
    }

    // ===== AESTHETIC CURSOR =====
    const cursor = document.createElement('div');
    cursor.className = 'aesthetic-cursor';
    document.body.appendChild(cursor);

    const ring = document.createElement('div');
    ring.className = 'aesthetic-cursor-ring';
    document.body.appendChild(ring);

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let ringX = 0, ringY = 0;

    const moveCursor = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animateCursor = () => {
      const speed = 0.2;
      const ringSpeed = 0.1;

      cursorX += (mouseX - cursorX) * speed;
      cursorY += (mouseY - cursorY) * speed;
      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';

      ringX += (mouseX - ringX) * ringSpeed;
      ringY += (mouseY - ringY) * ringSpeed;
      ring.style.left = ringX + 'px';
      ring.style.top = ringY + 'px';

      requestAnimationFrame(animateCursor);
    };

    document.addEventListener('mousemove', moveCursor);
    animateCursor();

    // ===== SCROLL PROGRESS BAR =====
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);

    const updateScrollProgress = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollTop / docHeight;
      progressBar.style.transform = `scaleX(${scrollPercent})`;
    };

    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // ===== NOISE TEXTURE OVERLAY =====
    const noiseOverlay = document.createElement('div');
    noiseOverlay.className = 'noise-overlay';
    document.body.appendChild(noiseOverlay);

    // ===== HERO PARALLAX BACKGROUND =====
    const createHeroParallax = () => {
      const hero = document.querySelector('.hero');
      if (hero && !hero.querySelector('.hero-bg-layer')) {
        hero.classList.add('hero-cinematic');
        
        // Create background layer
        const bgLayer = document.createElement('div');
        bgLayer.className = 'hero-bg-layer';
        bgLayer.style.backgroundImage = `url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')`;
        hero.insertBefore(bgLayer, hero.firstChild);
        
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'hero-overlay';
        hero.insertBefore(overlay, hero.children[1]);
        
        // Parallax effect
        const handleParallax = () => {
          const scrolled = window.pageYOffset;
          const rate = scrolled * -0.3;
          bgLayer.style.transform = `translateY(${rate}px)`;
        };
        
        window.addEventListener('scroll', handleParallax, { passive: true });
      }
    };

    // ===== SPLIT TEXT ANIMATION =====
    const createSplitTextAnimation = () => {
      const heroTitle = document.querySelector('.hero h1');
      if (heroTitle && !heroTitle.querySelector('.split-text-line')) {
        const text = heroTitle.textContent;
        const words = text.split(' ');
        
        heroTitle.innerHTML = words.map((word, index) => 
          `<span class="split-text-line">
            <span class="split-text-inner delay-${Math.min(index + 1, 5)}">${word}</span>
          </span>`
        ).join(' ');
      }
    };

    // ===== MARQUEE TICKER ===== (DISABLED)
    const createMarqueeTicker = () => {
      // Disabled to remove random text appearing on screen
      return;
    };

    // ===== SCROLL INDICATOR =====
    const createScrollIndicator = () => {
      const hero = document.querySelector('.hero');
      if (hero && !hero.querySelector('.scroll-indicator')) {
        const indicator = document.createElement('div');
        indicator.className = 'scroll-indicator';
        indicator.innerHTML = `
          <div class="scroll-indicator-line"></div>
          <div class="scroll-indicator-text">Scroll</div>
        `;
        hero.appendChild(indicator);
      }
    };

    // ===== AUTO-ADD ANIMATION CLASSES =====
    const addAnimationClasses = () => {
      // Add stagger animation to land cards
      document.querySelectorAll('.land-card').forEach((card, index) => {
        if (!card.classList.contains('stagger-item')) {
          card.classList.add('stagger-item', 'card-animated');
          
          // Add hover overlay
          if (!card.querySelector('.card-hover-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'card-hover-overlay';
            overlay.innerHTML = '<div class="card-hover-cta">View Details</div>';
            const imageContainer = card.querySelector('.land-image');
            if (imageContainer) {
              imageContainer.appendChild(overlay);
            }
          }
        }
      });

      // Add animations to location cards
      document.querySelectorAll('.location-card').forEach((card, index) => {
        if (!card.classList.contains('fade-in')) {
          card.classList.add('fade-in');
          card.style.transitionDelay = `${index * 0.1}s`;
        }
      });

      // Add animations to section headers
      document.querySelectorAll('.section-header-center').forEach(header => {
        if (!header.classList.contains('fade-in')) {
          header.classList.add('fade-in');
        }
      });

      // Add animations to CTA section
      document.querySelectorAll('.cta-section').forEach(section => {
        if (!section.classList.contains('fade-in')) {
          section.classList.add('fade-in');
        }
      });

      // Add smooth-hover to sidebar links
      document.querySelectorAll('.sidebar-link').forEach(link => {
        if (!link.classList.contains('smooth-hover')) {
          link.classList.add('smooth-hover');
        }
      });

      // Add btn-animated to all buttons
      document.querySelectorAll('.btn-primary, .btn-outline, .btn-secondary').forEach(btn => {
        if (!btn.classList.contains('btn-animated')) {
          btn.classList.add('btn-animated', 'ripple');
        }
      });

      // Add fade-in to filter bar
      const filterBar = document.querySelector('.filter-bar');
      if (filterBar && !filterBar.classList.contains('fade-in')) {
        filterBar.classList.add('fade-in');
      }

      // Add blur-reveal to hero content
      const heroContent = document.querySelector('.hero p');
      if (heroContent && !heroContent.classList.contains('blur-reveal')) {
        heroContent.classList.add('blur-reveal');
      }

      // Add section dividers
      document.querySelectorAll('h2, h3').forEach(heading => {
        if (!heading.nextElementSibling?.classList.contains('section-divider')) {
          const divider = document.createElement('div');
          divider.className = 'section-divider';
          heading.parentNode.insertBefore(divider, heading.nextSibling);
        }
      });
    };

    // ===== MAGNETIC HOVER EFFECTS =====
    const magneticElements = 'a, button, .land-card, .btn-primary, .btn-outline, .logo, .sidebar-link, .nav-item';
    
    const addMagneticEffect = (el) => {
      el.addEventListener('mouseenter', () => {
        document.body.classList.add('cursor-hover');
      });

      el.addEventListener('mouseleave', () => {
        document.body.classList.remove('cursor-hover');
        el.style.transform = '';
      });

      // Magnetic pull effect
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        const distance = Math.sqrt(x * x + y * y);
        const maxDistance = 100;
        
        if (distance < maxDistance) {
          const strength = (maxDistance - distance) / maxDistance;
          const moveX = x * 0.1 * strength;
          const moveY = y * 0.1 * strength;
          el.style.transform = `translate(${moveX}px, ${moveY}px)`;
        }
      });
    };

    const updateMagneticElements = () => {
      document.querySelectorAll(magneticElements).forEach(addMagneticEffect);
    };

    // ===== SCROLL ANIMATIONS =====
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    const observeAnimations = () => {
      const animatedElements = document.querySelectorAll(
        '.fade-in, .fade-in-left, .fade-in-right, .scale-in, .blur-reveal, .slide-reveal, .stagger-item'
      );
      
      animatedElements.forEach(el => {
        scrollObserver.observe(el);
      });
    };

    // ===== PARALLAX EFFECT =====
    const handleParallax = () => {
      const scrolled = window.pageYOffset;
      
      document.querySelectorAll('.parallax-layer').forEach((el, index) => {
        const speed = (index + 1) * 0.05;
        el.style.transform = `translateY(${scrolled * speed}px)`;
      });
    };

    // ===== TILT EFFECT FOR CARDS =====
    const addTiltEffect = (card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-12px)`;
        card.style.transition = 'box-shadow 0.3s ease';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      });
    };

    const updateTiltCards = () => {
      document.querySelectorAll('.land-card').forEach(addTiltEffect);
    };

    // ===== HEADER SCROLL EFFECT =====
    const header = document.querySelector('.header');
    const handleHeaderScroll = () => {
      if (window.scrollY > 100) {
        header?.classList.add('scrolled');
      } else {
        header?.classList.remove('scrolled');
      }
    };

    // ===== INITIALIZE EVERYTHING =====
    const initializeEffects = () => {
      createHeroParallax();
      createSplitTextAnimation();
      createMarqueeTicker();
      createScrollIndicator();
      addAnimationClasses();
      updateMagneticElements();
      observeAnimations();
      updateTiltCards();
    };

    // Run initially
    initializeEffects();
    
    // Re-run on DOM changes
    const observer = new MutationObserver(() => {
      setTimeout(() => {
        addAnimationClasses();
        updateMagneticElements();
        observeAnimations();
        updateTiltCards();
      }, 100);
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // Add event listeners
    window.addEventListener('scroll', handleParallax, { passive: true });
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });

    // ===== PAGE TRANSITION EFFECTS =====
    const createPageTransition = () => {
      const curtain = document.createElement('div');
      curtain.className = 'page-curtain';
      document.body.appendChild(curtain);
      
      // Animate in
      curtain.classList.add('entering');
      setTimeout(() => {
        curtain.classList.remove('entering');
        curtain.classList.add('leaving');
        setTimeout(() => curtain.remove(), 500);
      }, 500);
    };

    // Trigger page transition on navigation
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link && link.href && !link.href.startsWith('mailto:') && !link.href.startsWith('tel:')) {
        const isExternal = link.hostname !== window.location.hostname;
        if (!isExternal && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          createPageTransition();
          setTimeout(() => {
            window.location.href = link.href;
          }, 250);
        }
      }
    });

    // ===== CLEANUP =====
    return () => {
      document.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('scroll', updateScrollProgress);
      window.removeEventListener('scroll', handleParallax);
      window.removeEventListener('scroll', handleHeaderScroll);
      cursor.remove();
      ring.remove();
      progressBar.remove();
      noiseOverlay.remove();
      observer.disconnect();
      scrollObserver.disconnect();
    };
  }, []);

  return null;
};

export default CinematicEffects;
