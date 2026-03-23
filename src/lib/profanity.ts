import { Filter } from "bad-words";

// Create a singleton instance to reuse across API routes
const filter = new Filter();

// We can add custom words if desired
// filter.addWords('someCustomWord');

export function containsProfanity(text: string | null | undefined): boolean {
  if (!text) return false;
  try {
    return filter.isProfane(text);
  } catch (error) {
    console.error("Profanity filter error:", error);
    return false; // Fail open to not block legitimate requests if parser crashes
  }
}

export function cleanProfanity(text: string | null | undefined): string {
  if (!text) return "";
  try {
    return filter.clean(text);
  } catch (error) {
    return text;
  }
}
