/**
 * Performance Monitoring Utility
 * Tracks and reports frontend performance metrics
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      firstInputDelay: null,
      cumulativeLayoutShift: null,
      timeToInteractive: null,
      resourceTimings: [],
      apiCallTimings: []
    };

    this.isSupported = 'performance' in window && 'PerformanceObserver' in window;
    
    if (this.isSupported) {
      this.init();
    }
  }

  init() {
    // Observe Core Web Vitals
    this.observeFCP();
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    
    // Track page load time
    if (document.readyState === 'complete') {
      this.capturePageLoadMetrics();
    } else {
      window.addEventListener('load', () => {
        this.capturePageLoadMetrics();
      });
    }

    // Track resource timings
    this.observeResourceTimings();
  }

  /**
   * Observe First Contentful Paint (FCP)
   */
  observeFCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime;
            console.log('📊 FCP:', entry.startTime.toFixed(2), 'ms');
            observer.disconnect();
          }
        }
      });
      
      observer.observe({ entryTypes: ['paint'] });
    } catch (e) {
      console.warn('FCP observation failed:', e);
    }
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.largestContentfulPaint = lastEntry.startTime;
        console.log('📊 LCP:', lastEntry.startTime.toFixed(2), 'ms');
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // Disconnect on visibility change or page hide
      ['visibilitychange', 'pagehide'].forEach((event) => {
        addEventListener(event, () => observer.disconnect(), { once: true });
      });
    } catch (e) {
      console.warn('LCP observation failed:', e);
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.firstInputDelay = entry.processingStart - entry.startTime;
          console.log('📊 FID:', this.metrics.firstInputDelay.toFixed(2), 'ms');
          observer.disconnect();
        }
      });
      
      observer.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      console.warn('FID observation failed:', e);
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  observeCLS() {
    try {
      let clsScore = 0;
      
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsScore += entry.value;
            this.metrics.cumulativeLayoutShift = clsScore;
          }
        }
      });
      
      observer.observe({ entryTypes: ['layout-shift'] });
      
      // Report final CLS on page hide
      addEventListener('pagehide', () => {
        console.log('📊 CLS:', clsScore.toFixed(3));
        observer.disconnect();
      }, { once: true });
    } catch (e) {
      console.warn('CLS observation failed:', e);
    }
  }

  /**
   * Observe resource loading timings
   */
  observeResourceTimings() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const timing = {
            name: entry.name,
            type: entry.initiatorType,
            duration: entry.duration,
            size: entry.transferSize,
            cached: entry.transferSize === 0,
            startTime: entry.startTime
          };
          
          this.metrics.resourceTimings.push(timing);
          
          // Warn on slow resources (> 1s)
          if (entry.duration > 1000) {
            console.warn('⚠️ Slow resource:', entry.name, entry.duration.toFixed(2), 'ms');
          }
        }
      });
      
      observer.observe({ entryTypes: ['resource'] });
    } catch (e) {
      console.warn('Resource timing observation failed:', e);
    }
  }

  /**
   * Capture page load metrics
   */
  capturePageLoadMetrics() {
    if (!this.isSupported) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (navigation) {
      this.metrics.pageLoad = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        domParsing: navigation.domInteractive - navigation.responseEnd,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.fetchStart
      };

      console.log('📊 Page Load Metrics:', {
        'DNS Lookup': `${this.metrics.pageLoad.dns.toFixed(2)}ms`,
        'TCP Connection': `${this.metrics.pageLoad.tcp.toFixed(2)}ms`,
        'Request Time': `${this.metrics.pageLoad.request.toFixed(2)}ms`,
        'Response Time': `${this.metrics.pageLoad.response.toFixed(2)}ms`,
        'DOM Parsing': `${this.metrics.pageLoad.domParsing.toFixed(2)}ms`,
        'Total Load': `${this.metrics.pageLoad.total.toFixed(2)}ms`
      });
    }
  }

  /**
   * Track API call timing
   */
  trackApiCall(url, startTime, endTime, success = true) {
    const duration = endTime - startTime;
    
    this.metrics.apiCallTimings.push({
      url,
      duration,
      success,
      timestamp: Date.now()
    });

    // Warn on slow API calls (> 2s)
    if (duration > 2000) {
      console.warn('⚠️ Slow API call:', url, `${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get performance summary
   */
  getSummary() {
    const summary = {
      coreWebVitals: {
        fcp: this.metrics.firstContentfulPaint 
          ? `${this.metrics.firstContentfulPaint.toFixed(2)}ms`
          : 'Not available',
        lcp: this.metrics.largestContentfulPaint 
          ? `${this.metrics.largestContentfulPaint.toFixed(2)}ms`
          : 'Not available',
        fid: this.metrics.firstInputDelay 
          ? `${this.metrics.firstInputDelay.toFixed(2)}ms`
          : 'Not available',
        cls: this.metrics.cumulativeLayoutShift 
          ? this.metrics.cumulativeLayoutShift.toFixed(3)
          : 'Not available'
      },
      pageLoad: this.metrics.pageLoad,
      resourceStats: {
        total: this.metrics.resourceTimings.length,
        cached: this.metrics.resourceTimings.filter(r => r.cached).length,
        avgDuration: this.metrics.resourceTimings.length > 0
          ? (this.metrics.resourceTimings.reduce((sum, r) => sum + r.duration, 0) / this.metrics.resourceTimings.length).toFixed(2)
          : 0
      },
      apiStats: {
        total: this.metrics.apiCallTimings.length,
        successful: this.metrics.apiCallTimings.filter(a => a.success).length,
        avgDuration: this.metrics.apiCallTimings.length > 0
          ? (this.metrics.apiCallTimings.reduce((sum, a) => sum + a.duration, 0) / this.metrics.apiCallTimings.length).toFixed(2)
          : 0
      }
    };

    return summary;
  }

  /**
   * Report performance metrics (can be sent to analytics)
   */
  report() {
    const summary = this.getSummary();
    console.log('📊 Performance Report:', summary);
    
    // TODO: Send to analytics service if needed
    // analytics.track('performance_metrics', summary);
    
    return summary;
  }

  /**
   * Check if performance is good based on Core Web Vitals thresholds
   */
  getHealthStatus() {
    const status = {
      fcp: this.metrics.firstContentfulPaint < 1800 ? 'good' : 
           this.metrics.firstContentfulPaint < 3000 ? 'needs-improvement' : 'poor',
      lcp: this.metrics.largestContentfulPaint < 2500 ? 'good' : 
           this.metrics.largestContentfulPaint < 4000 ? 'needs-improvement' : 'poor',
      fid: this.metrics.firstInputDelay < 100 ? 'good' : 
           this.metrics.firstInputDelay < 300 ? 'needs-improvement' : 'poor',
      cls: this.metrics.cumulativeLayoutShift < 0.1 ? 'good' : 
           this.metrics.cumulativeLayoutShift < 0.25 ? 'needs-improvement' : 'poor'
    };

    return status;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Auto-report on page hide
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    performanceMonitor.report();
  });

  // Expose to window for debugging
  if (import.meta.env.DEV) {
    window.__performanceMonitor = performanceMonitor;
  }
}

export default performanceMonitor;
