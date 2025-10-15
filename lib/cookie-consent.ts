/**
 * Cookie Consent Management Utility
 * Handles reading and writing cookie consent preferences for GDPR compliance
 */

const COOKIE_CONSENT_KEY = "cookie-consent";
const COOKIE_CONSENT_EXPIRY_DAYS = 365;

export type CookieConsentValue = "accepted" | "rejected" | null;

/**
 * Get the current cookie consent status from localStorage
 */
export function getCookieConsent(): CookieConsentValue {
  if (typeof window === "undefined") return null;

  try {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === "accepted" || consent === "rejected") {
      return consent;
    }
    return null;
  } catch (error) {
    console.error("Error reading cookie consent:", error);
    return null;
  }
}

/**
 * Set the cookie consent status in localStorage
 */
export function setCookieConsent(value: "accepted" | "rejected"): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);

    // Also set a cookie for server-side detection if needed
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + COOKIE_CONSENT_EXPIRY_DAYS);

    document.cookie = `${COOKIE_CONSENT_KEY}=${value}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.error("Error setting cookie consent:", error);
  }
}

/**
 * Clear the cookie consent status
 */
export function clearCookieConsent(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    document.cookie = `${COOKIE_CONSENT_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  } catch (error) {
    console.error("Error clearing cookie consent:", error);
  }
}

/**
 * Check if analytics should be enabled based on consent
 */
export function shouldEnableAnalytics(): boolean {
  return getCookieConsent() === "accepted";
}
