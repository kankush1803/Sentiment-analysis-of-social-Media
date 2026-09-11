/**
 * SocialSentinel — Text Preprocessing Pipeline
 * Handles social-media-specific text: emojis, hashtags, mentions, URLs, slang.
 */

export const EMOJI_SENTIMENT_MAP = {
  // Very positive
  "😍": " love ",
  "🤩": " amazing ",
  "😁": " happy ",
  "😄": " happy ",
  "😊": " happy ",
  "😀": " happy ",
  "🥰": " love ",
  "❤️": " love ",
  "♥️": " love ",
  "💕": " love ",
  "💖": " love ",
  "💗": " love ",
  "💯": " perfect ",
  "🔥": " great ",
  "🚀": " fast ",
  "⭐": " star ",
  "🌟": " star ",
  "✨": " excellent ",
  "🎉": " celebrate ",
  "🎊": " celebrate ",
  "👏": " applause ",
  "💪": " strong ",
  "👍": " good ",
  "✅": " approved ",
  "🙌": " great ",
  // Negative
  "😡": " angry ",
  "😠": " angry ",
  "😤": " frustrated ",
  "😒": " disappointed ",
  "😔": " disappointed ",
  "😢": " sad ",
  "😭": " crying ",
  "💔": " heartbreak ",
  "👎": " bad ",
  "❌": " rejected ",
  "🙄": " annoyed ",
  "😩": " exhausted ",
  "🤦": " facepalm ",
  "😫": " frustrated ",
  // Sarcastic / ambiguous
  "🙃": " sarcastic ",
  // Surprised / shocked
  "🤯": " shocked ",
  "😱": " shocked ",
  // Cool / neutral-positive
  "😎": " cool ",
  "🤔": " unsure ",
};

/**
 * Replace known emojis with their sentiment-word equivalents.
 */
function expandEmojis(text) {
  let result = text;
  for (const [emoji, word] of Object.entries(EMOJI_SENTIMENT_MAP)) {
    result = result.replaceAll(emoji, word);
  }
  return result;
}

/**
 * Convert a hashtag into readable spaced words.
 * Examples:
 *   #GreatService  →  great service
 *   #BADDELIVERY   →  bad delivery
 *   #greatservice  →  greatservice
 */
function expandHashtags(text) {
  return text.replace(/#([a-zA-Z0-9_]+)/g, (_, tag) => {
    if (!tag) return '';
    let spaced = tag.replace(/([A-Z][a-z]+)/g, ' $1');
    spaced = spaced.replace(/([A-Z]{2,})(?=[A-Z][a-z]|\d|\b)/g, ' $1 ');
    spaced = spaced.replace(/(\d+)/g, ' $1 ');
    return ' ' + spaced.trim().toLowerCase() + ' ';
  });
}

/**
 * Remove leftover non-ASCII emoji / symbol characters that were not in the map.
 */
function removeRemainingEmojis(text) {
  // Retain letters, numbers, standard punctuation, and whitespace
  return text.replace(/[^\p{L}\p{N}\p{P}\s]/gu, ' ');
}

/**
 * Full preprocessing pipeline for a single social-media post.
 *
 * Steps:
 *   1. Expand known emojis to sentiment words
 *   2. Convert hashtags to spaced, lowercase words
 *   3. Remove @mentions
 *   4. Remove URLs
 *   5. Normalize repeated characters (loooove -> loove)
 *   6. Normalize excessive punctuation
 *   7. Remove remaining non-ASCII emoji / symbol characters
 *   8. Lowercase everything
 *   9. Collapse extra whitespace
 *
 * @param {string} text - Raw social-media post string.
 * @returns {string} Cleaned, normalised text ready for vectorisation.
 */
export function preprocessText(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return '';
  }

  let cleaned = text;

  // 1. Emoji -> words
  cleaned = expandEmojis(cleaned);

  // 2. Hashtags -> words
  cleaned = expandHashtags(cleaned);

  // 3. Remove @mentions
  cleaned = cleaned.replace(/@\w+/g, ' ');

  // 4. Remove URLs
  cleaned = cleaned.replace(/https?:\/\/\S+|www\.\S+/g, ' ');

  // 5. Normalise repeated characters (keep at most 2 consecutive)
  cleaned = cleaned.replace(/(.)\1{2,}/gu, '$1$1');

  // 6. Normalise excessive punctuation
  cleaned = cleaned.replace(/!{2,}/g, ' ! ');
  cleaned = cleaned.replace(/\?{2,}/g, ' ? ');
  cleaned = cleaned.replace(/\.{3,}/g, ' ... ');

  // 7. Remove leftover symbols/emojis
  cleaned = removeRemainingEmojis(cleaned);

  // 8. Lowercase
  cleaned = cleaned.toLowerCase();

  // 9. Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}
