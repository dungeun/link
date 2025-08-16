// Critical CSS for above-the-fold content
export const CriticalCSS = () => (
  <style jsx global>{`
    /* Critical CSS for LCP optimization */
    .hero-section {
      min-height: 320px;
      contain: layout style paint;
    }
    
    .hero-slide {
      will-change: transform;
      transform: translateZ(0);
    }
    
    .hero-image {
      object-fit: cover;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    
    /* Layout shift prevention */
    .campaign-card {
      aspect-ratio: 1;
      contain: layout style;
    }
    
    .campaign-image {
      aspect-ratio: 1;
      object-fit: cover;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    /* Category icons layout */
    .category-icon {
      width: 3rem;
      height: 3rem;
      contain: layout style;
    }
    
    /* Font display optimization */
    @font-face {
      font-family: 'Inter';
      font-display: swap;
      src: local('Inter');
    }
    
    /* Reduce layout shift for images */
    img {
      max-width: 100%;
      height: auto;
    }
    
    /* Critical navigation styles */
    .header {
      contain: layout style;
      will-change: transform;
    }
    
    /* Main content container */
    .main-content {
      contain: layout style paint;
    }
  `}</style>
)