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
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", {
        detail: { consent: "accepted" },
      })
    );
  };

  const handleReject = () => {
    setCookieConsent("rejected");
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);

    // Trigger custom event
    window.dispatchEvent(
      new CustomEvent("cookieConsentChanged", {
        detail: { consent: "rejected" },
      })
    );
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShowBanner(false), 300);
  };

  if (!showBanner) return null;

  return (
    <div
      className={`fixed right-0 bottom-0 left-0 z-50 transition-transform duration-300 ease-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent banner"
    >
      <div className="bg-surface-2 border-border border-t shadow-2xl backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            {/* Icon */}
            <div className="hidden flex-shrink-0 sm:block">
              <Cookie className="text-primary h-8 w-8" />
            </div>

            {/* Content */}
            <div className="flex-1 text-sm sm:text-base">
              <div className="mb-2 flex items-start justify-between gap-2 sm:mb-3">
                <h3 className="text-foreground flex items-center gap-2 font-semibold">
                  <Cookie className="text-primary h-5 w-5 sm:hidden" />
                  We value your privacy
                </h3>
                <button
                  onClick={handleClose}
                  className="text-muted-foreground hover:text-foreground -mt-1 p-1 transition-colors sm:hidden"
                  aria-label="Close banner"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar technologies to analyze site usage
                and improve your experience. By clicking &quot;Accept&quot;, you
                consent to the use of analytics cookies. You can choose to
                reject non-essential cookies by clicking &quot;Reject&quot;{" "}
                <a
                  href="/privacy"
                  className="text-primary underline transition-colors hover:opacity-90"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Learn more
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex w-full flex-row gap-2 sm:w-auto sm:flex-col sm:gap-3 lg:flex-row">
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
                className="flex-1 shadow-md sm:flex-none"
                aria-label="Accept analytics cookies"
              >
                Accept
              </Button>
            </div>

            {/* Close button for desktop */}
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground -mt-1 hidden p-1 transition-colors sm:block"
              aria-label="Close banner"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
