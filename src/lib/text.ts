/**
 * Converts normal capitalized words to lowercase while preserving
 * intentionally ALL-CAPS words (2+ uppercase letters, e.g. "ТОП", "АНИМЕ", "OVA").
 */
export function formatCommentText(text?: string | null): string {
  if (!text) return "";
  return text.replace(/[A-Za-zА-ЯЁа-яё]+/g, (word) => {
    const isAllCaps = word.length >= 2 && word === word.toUpperCase() && word !== word.toLowerCase();
    if (isAllCaps) return word;
    return word.toLowerCase();
  });
}
