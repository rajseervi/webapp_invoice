/**
 * Print scaling utilities to ensure content fits on single A4 page
 */

export interface PrintScaleOptions {
  maxHeight?: number; // Maximum height in mm (default: 267mm for A4 with margins)
  maxWidth?: number; // Maximum width in mm (default: 186mm for A4 with margins)
  containerSelector?: string; // CSS selector for the container to scale
  enableAutoScale?: boolean; // Enable automatic scaling
  minScale?: number; // Minimum scale factor (default: 0.6)
  maxScale?: number; // Maximum scale factor (default: 1.0)
}

export class PrintScaleManager {
  private static readonly DEFAULT_OPTIONS: Required<PrintScaleOptions> = {
    maxHeight: 267, // A4 height (297mm) - margins (30mm)
    maxWidth: 186, // A4 width (210mm) - margins (24mm)
    containerSelector: '.auto-scale',
    enableAutoScale: true,
    minScale: 0.6,
    maxScale: 1.0
  };

  /**
   * Calculate optimal scale factor for print content
   */
  static calculateScaleFactor(
    contentHeight: number,
    contentWidth: number,
    options: PrintScaleOptions = {}
  ): number {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    if (!opts.enableAutoScale) return 1.0;

    const heightScale = opts.maxHeight / contentHeight;
    const widthScale = opts.maxWidth / contentWidth;
    
    // Use the smaller scale to ensure content fits both dimensions
    let scale = Math.min(heightScale, widthScale);
    
    // Clamp between min and max scale
    scale = Math.max(opts.minScale, Math.min(opts.maxScale, scale));
    
    return scale;
  }

  /**
   * Apply automatic scaling to print content
   */
  static applyAutoScale(options: PrintScaleOptions = {}): void {
    if (typeof window === 'undefined') return;
    
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    const containers = document.querySelectorAll(opts.containerSelector);
    
    containers.forEach((container) => {
      const element = container as HTMLElement;
      
      // Get the actual content dimensions
      const rect = element.getBoundingClientRect();
      const heightMM = this.pixelsToMM(rect.height);
      const widthMM = this.pixelsToMM(rect.width);
      
      // Calculate optimal scale
      const scale = this.calculateScaleFactor(heightMM, widthMM, opts);
      
      // Apply scale if needed
      if (scale < 1.0) {
        element.style.setProperty('--scale-factor', scale.toString());
        element.style.transform = `scale(${scale})`;
        element.style.transformOrigin = 'top left';
        
        console.log(`Applied print scale: ${(scale * 100).toFixed(1)}% (${heightMM.toFixed(1)}mm → ${(heightMM * scale).toFixed(1)}mm)`);
      }
    });
  }

  /**
   * Convert pixels to millimeters (approximate)
   */
  private static pixelsToMM(pixels: number): number {
    // Standard conversion: 96 DPI = 25.4mm per inch
    return (pixels * 25.4) / 96;
  }

  /**
   * Convert millimeters to pixels (approximate)
   */
  private static mmToPixels(mm: number): number {
    return (mm * 96) / 25.4;
  }

  /**
   * Setup print event listeners for automatic scaling
   */
  static setupPrintListeners(options: PrintScaleOptions = {}): void {
    if (typeof window === 'undefined') return;

    const handleBeforePrint = () => {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        this.applyAutoScale(options);
      }, 100);
    };

    const handleAfterPrint = () => {
      // Reset scaling after print
      const opts = { ...this.DEFAULT_OPTIONS, ...options };
      const containers = document.querySelectorAll(opts.containerSelector);
      
      containers.forEach((container) => {
        const element = container as HTMLElement;
        element.style.removeProperty('--scale-factor');
        element.style.removeProperty('transform');
        element.style.removeProperty('transform-origin');
      });
    };

    // Modern browsers
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    // Fallback for older browsers
    if (window.matchMedia) {
      const mediaQueryList = window.matchMedia('print');
      mediaQueryList.addEventListener('change', (mql) => {
        if (mql.matches) {
          handleBeforePrint();
        } else {
          handleAfterPrint();
        }
      });
    }
  }

  /**
   * Force single page layout with aggressive scaling if needed
   */
  static forceSinglePage(options: PrintScaleOptions = {}): void {
    if (typeof window === 'undefined') return;

    const opts = { 
      ...this.DEFAULT_OPTIONS, 
      ...options,
      minScale: 0.4, // More aggressive minimum scale
      maxHeight: 260, // Slightly smaller to ensure fit
      maxWidth: 180
    };

    this.applyAutoScale(opts);
  }

  /**
   * Add CSS for print optimization
   */
  static addOptimizedPrintStyles(): void {
    if (typeof document === 'undefined') return;

    const styleId = 'print-optimization-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media print {
        @page {
          size: A4 portrait;
          margin: 15mm 12mm;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
          print-color-adjust: exact;
        }
        
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box !important;
        }
        
        body {
          margin: 0 !important;
          padding: 0 !important;
          font-size: 9px !important;
          line-height: 1.1 !important;
          overflow: hidden !important;
        }
        
        .print-optimize {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }
        
        .print-fit-page {
          max-height: 267mm !important;
          overflow: hidden !important;
          transform-origin: top left !important;
        }
        
        /* Force single page */
        .force-single-page * {
          font-size: 8px !important;
          line-height: 1.05 !important;
          padding: 1px 2px !important;
          margin: 0 !important;
        }
        
        /* Compact table styling */
        .force-single-page table {
          font-size: 7px !important;
          line-height: 1 !important;
        }
        
        .force-single-page th,
        .force-single-page td {
          padding: 1px 2px !important;
          font-size: 7px !important;
        }
      }
    `;
    
    document.head.appendChild(style);
  }
}

export default PrintScaleManager;