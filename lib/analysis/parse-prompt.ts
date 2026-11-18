export function extractRequestedArtwork(prompt: string): string {
  const trimmed = prompt.trim();
  const match = trimmed.match(/(?:of|about)\s+(.+?)(?:\.|$)/i);
  const requested = match ? match[1].trim() : trimmed;
  return requested.replace(/^["'\u201C\u2018]|["'\u201D\u2019]$/g, "");
}
