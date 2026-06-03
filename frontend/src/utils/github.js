/**
 * Extract a clean GitHub username from a raw input string.
 * Handles:
 * - Raw username (e.g., "torvalds")
 * - Profile URL (e.g., "https://github.com/torvalds")
 * - Profile URL with query/hash (e.g., "https://github.com/torvalds?tab=repositories")
 * - Username with leading @ (e.g., "@torvalds")
 */
export const extractUsername = (input) => {
  if (!input) return "";
  let cleaned = input.trim();
  
  // Remove query parameters and hash fragments
  cleaned = cleaned.split("?")[0].split("#")[0];
  
  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");
  
  // If it's a full URL containing github.com
  if (cleaned.includes("github.com")) {
    const parts = cleaned.split("/");
    return parts[parts.length - 1] || "";
  }
  
  // Handle general URLs
  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    const parts = cleaned.split("/");
    return parts[parts.length - 1] || "";
  }
  
  // Remove leading @ if present
  if (cleaned.startsWith("@")) {
    cleaned = cleaned.slice(1);
  }
  
  return cleaned;
};
