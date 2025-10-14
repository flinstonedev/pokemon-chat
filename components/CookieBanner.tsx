"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { getCookieConsent, setCookieConsent } from "@/lib/cookie-consent";
import { Button } from "@/components/ui/button";

/**
 * GDPR-compliant cookie consent banner
 * Displays a banner informing users about cookie usage and tracking
 * Allows users to accept or reject analytics cookies
 */
export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = getCookieConsent();
    if (consent === null) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => {
        setShowBanner(true);
        // Trigger animation after mount
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setCookieConsent("accepted");
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
    
    // Trigger custom event for PostHog or other analytics to initialize
    window.dispatchEvent(new CustomEvent("cookieConsentChanged", { 
      detail: { consent: "accepted" } 
    }));
  };

  const handleReject = () => {
    setCookieConsent("rejected");
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
    
    // Trigger custom event
    window.dispatchEvent(new CustomEvent("cookieConsentChanged", { 
      detail: { consent: "rejected" } 
    }));
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent banner"
    >
      <div className="bg-surface-2 backdrop-blur-lg border-t border-border shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 hidden sm:block">
              <Cookie className="w-8 h-8 text-primary" />
            </div>

            {/* Content */}
            <div className="flex-1 text-sm sm:text-base">
              <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-primary sm:hidden" />
                  We value your privacy
                </h3>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 sm:hidden"
                  aria-label="Close banner"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to analyze site usage and improve your experience. 
                By clicking &quot;Accept&quot;, you consent to the use of analytics cookies. 
                You can choose to reject non-essential cookies by clicking &quot;Reject&quot;{" "}
                <a 
                  href="/privacy" 
                  className="text-primary hover:opacity-90 underline transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-row sm:flex-col lg:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={handleReject}
                variant="outline"
                className="flex-1 sm:flex-none"
                aria-label="Reject analytics cookies"
              >
                Reject
              </Button>
              <Button
                onClick={handleAccept}
                variant="default"
                className="flex-1 sm:flex-none shadow-md"
                aria-label="Accept analytics cookies"
              >
                Accept
              </Button>
            </div>

            {/* Close button for desktop */}
            <button
              onClick={handleClose}
              className="hidden sm:block text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1"
              aria-label="Close banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
