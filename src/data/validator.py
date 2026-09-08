"""
SocialSentinel — Data Validator
Validates social media posts datasets and training datasets.
"""
from __future__ import annotations

from typing import List, Tuple

import pandas as pd

VALID_LABELS: frozenset[str] = frozenset({"positive", "negative", "neutral"})


# ---------------------------------------------------------------------------
# Posts dataset
# ---------------------------------------------------------------------------

def validate_posts_dataset(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Validate a social media posts dataset.

    Requires the 'text' column.
    Handles optional columns: id, date, platform.

    Args:
        df: Raw DataFrame loaded from CSV.

    Returns:
        (cleaned_df, warnings) — cleaned DataFrame and list of warning strings.

    Raises:
        ValueError: If required columns are missing or no valid rows remain.
    """
    warnings: List[str] = []

    # ---- Required column -----------------------------------------------
    if "text" not in df.columns:
        raise ValueError(
            "The dataset does not contain the required 'text' column.\n\n"
            "Expected CSV format:\n\n"
            "  id,text,date,platform\n"
            "  1,\"Great service!\",2026-01-01,Twitter"
        )

    # ---- Drop empty text rows ------------------------------------------
    initial_count = len(df)
    df = df.copy()
    df = df.dropna(subset=["text"])
    df = df[df["text"].astype(str).str.strip() != ""]
    dropped = initial_count - len(df)
    if dropped > 0:
        warnings.append(
            f"{dropped} row(s) with empty or missing text were skipped."
        )

    if len(df) == 0:
        raise ValueError(
            "The dataset contains no valid text entries after cleaning.\n"
            "Please check the 'text' column for empty values."
        )

    # ---- Optional columns ----------------------------------------------
    optional = {"id", "date", "platform"}
    missing_optional = sorted(optional - set(df.columns))
    if missing_optional:
        warnings.append(
            f"Optional column(s) not found and will be skipped: "
            f"{', '.join(missing_optional)}"
        )

    # ---- Parse dates ---------------------------------------------------
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"], errors="coerce")
        invalid_dates = int(df["date"].isna().sum())
        if invalid_dates > 0:
            warnings.append(
                f"{invalid_dates} row(s) have invalid or missing dates."
            )

    # ---- Normalise text -----------------------------------------------
    df["text"] = df["text"].astype(str)

    return df, warnings


# ---------------------------------------------------------------------------
# Training dataset
# ---------------------------------------------------------------------------

def validate_training_dataset(
    df: pd.DataFrame,
) -> Tuple[pd.DataFrame, List[str]]:
    """
    Validate a training dataset (text + label columns).

    Normalises labels to lowercase and removes invalid ones.

    Args:
        df: Raw DataFrame loaded from the training CSV.

    Returns:
        (cleaned_df, warnings) — cleaned DataFrame and list of warning strings.

    Raises:
        ValueError: If required columns are missing or dataset is too small.
    """
    warnings: List[str] = []

    # ---- Required columns -----------------------------------------------
    if "text" not in df.columns:
        raise ValueError(
            "Training dataset is missing the 'text' column.\n\n"
            "Expected format:\n\n  text,label\n"
            '  "Great product",positive'
        )
    if "label" not in df.columns:
        raise ValueError(
            "Training dataset is missing the 'label' column.\n\n"
            "Expected format:\n\n  text,label\n"
            '  "Great product",positive'
        )

    df = df.copy()

    # ---- Normalise labels -----------------------------------------------
    df["label"] = df["label"].astype(str).str.lower().str.strip()

    # ---- Remove invalid labels -----------------------------------------
    invalid_mask = ~df["label"].isin(VALID_LABELS)
    invalid_count = int(invalid_mask.sum())
    if invalid_count > 0:
        invalid_found = df.loc[invalid_mask, "label"].unique().tolist()
        warnings.append(
            f"{invalid_count} row(s) with unrecognised labels removed "
            f"(found: {invalid_found}). "
            f"Valid labels: positive, negative, neutral."
        )
        df = df[~invalid_mask]

    # ---- Drop empty text / label rows ---------------------------------
    df = df.dropna(subset=["text", "label"])
    df = df[df["text"].astype(str).str.strip() != ""]
    df["text"] = df["text"].astype(str)

    # ---- Minimum size check --------------------------------------------
    if len(df) < 10:
        raise ValueError(
            f"Insufficient training data: only {len(df)} valid example(s).\n"
            "At least 10 labelled examples are required."
        )

    # ---- Per-class size warnings ---------------------------------------
    label_counts = df["label"].value_counts()
    for label in VALID_LABELS:
        count = int(label_counts.get(label, 0))
        if count < 3:
            warnings.append(
                f"Very few examples for label '{label}': {count}. "
                "Consider adding more training examples for this class."
            )

    return df, warnings
