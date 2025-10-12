import posthog from "posthog-js";
import { getCookieConsent } from "./lib/cookie-consent";

let isPostHogInitialized = false;

function initializePostHog() {
  if (isPostHogInitialized || typeof window === "undefined") return;
  
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2025-05-24",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
    persistence: "localStorage+cookie",
    autocapture: true,
    capture_pageview: true,
    disable_session_recording: false,
  });
  
  isPostHogInitialized = true;
  posthog.capture("$pageview");
}

// Only initialize PostHog if user has already consented
if (typeof window !== "undefined") {
  const consent = getCookieConsent();
  
  if (consent === "accepted") {
    initializePostHog();
  }

  // Listen for consent changes from the cookie banner
  window.addEventListener("cookieConsentChanged", ((event: CustomEvent) => {
    const { consent } = event.detail;
    
    if (consent === "accepted") {
      // User just accepted - initialize PostHog for the first time
      initializePostHog();
    } else if (consent === "rejected" && isPostHogInitialized) {
      // User rejected - opt out and clear data if PostHog was initialized
      posthog.opt_out_capturing();
      posthog.reset();
    }
  }) as EventListener);
}
