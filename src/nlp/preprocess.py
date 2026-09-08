"""
SocialSentinel — Text Preprocessing Pipeline
Handles social-media-specific text: emojis, hashtags, mentions, URLs, slang.
"""
from __future__ import annotations

import re
import unicodedata


# ---------------------------------------------------------------------------
# Emoji → sentiment-word mapping
# ---------------------------------------------------------------------------
# Emojis carry important sentiment signals; we translate them to words
# rather than discarding them.

EMOJI_SENTIMENT_MAP: dict[str, str] = {
    # Very positive
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
    # Negative
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
    # Sarcastic / ambiguous
    "🙃": " sarcastic ",
    # Surprised / shocked
    "🤯": " shocked ",
    "😱": " shocked ",
    # Cool / neutral-positive
    "😎": " cool ",
    "🤔": " unsure ",
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _expand_emojis(text: str) -> str:
    """Replace known emojis with their sentiment-word equivalents."""
    for emoji_char, word in EMOJI_SENTIMENT_MAP.items():
        text = text.replace(emoji_char, word)
    return text


def _remove_remaining_emojis(text: str) -> str:
    """
    Strip any leftover non-ASCII emoji / symbol characters that were not
    in the map. Uses Unicode category checks so we do not accidentally
    remove foreign-language letters.
    """
    result: list[str] = []
    for char in text:
        cat = unicodedata.category(char)
        # Keep letters (L*), numbers (N*), punctuation (P*), spaces (Zs)
        # and common marks (M*). Drop symbols (S*) and other junk.
        if cat.startswith(("L", "N", "P", "M", "Z")):
            result.append(char)
        elif char in (" ", "\t", "\n"):
            result.append(" ")
        else:
            result.append(" ")
    return "".join(result)


def _expand_hashtag(raw_hashtag: str) -> str:
    """
    Convert a hashtag into readable spaced words.

    Examples:
        #GreatService  →  great service
        #BADDELIVERY   →  bad delivery
        #greatservice  →  greatservice  (kept as-is, no CamelCase to split)
    """
    tag = raw_hashtag.lstrip("#")
    if not tag:
        return ""

    # Split on CamelCase boundaries
    spaced = re.sub(r"([A-Z][a-z]+)", r" \1", tag)
    spaced = re.sub(r"([A-Z]{2,})(?=[A-Z][a-z]|\d|\b)", r" \1 ", spaced)
    spaced = re.sub(r"(\d+)", r" \1 ", spaced)

    return spaced.strip().lower()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def preprocess_text(text: str) -> str:
    """
    Full preprocessing pipeline for a single social-media post.

    Steps:
      1.  Expand known emojis to sentiment words
      2.  Convert hashtags to spaced, lowercase words
      3.  Remove @mentions (they carry no sentiment signal)
      4.  Remove URLs (they dominate TF-IDF features unhelpfully)
      5.  Normalize repeated characters  (loooove → loove)
      6.  Normalize excessive punctuation
      7.  Remove remaining non-ASCII emoji / symbol characters
      8.  Lowercase everything
      9.  Collapse extra whitespace

    Args:
        text: Raw social-media post string.

    Returns:
        Cleaned, normalised text ready for vectorisation.
    """
    if not isinstance(text, str) or not text.strip():
        return ""

    # 1. Emoji → words
    text = _expand_emojis(text)

    # 2. Hashtags → readable words  (#GreatService → great service)
    text = re.sub(
        r"#(\w+)",
        lambda m: " " + _expand_hashtag("#" + m.group(1)) + " ",
        text,
    )

    # 3. Remove @mentions
    text = re.sub(r"@\w+", " ", text)

    # 4. Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # 5. Normalise repeated characters (keep at most 2 consecutive)
    text = re.sub(r"(.)\1{2,}", r"\1\1", text)

    # 6. Normalise excessive punctuation
    text = re.sub(r"[!]{2,}", " ! ", text)
    text = re.sub(r"[?]{2,}", " ? ", text)
    text = re.sub(r"[.]{3,}", " ... ", text)

    # 7. Remove leftover non-ASCII symbols (unmapped emojis, etc.)
    text = _remove_remaining_emojis(text)

    # 8. Lowercase
    text = text.lower()

    # 9. Collapse whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text
