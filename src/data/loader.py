"""
SocialSentinel — Data Loader
Handles loading CSV files with clear, user-friendly error messages.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd


def load_csv(filepath: str) -> pd.DataFrame:
    """
    Load a CSV file and return a DataFrame.

    Args:
        filepath: Path to the CSV file.

    Returns:
        A pandas DataFrame with the CSV contents.

    Raises:
        FileNotFoundError: If the file does not exist.
        ValueError: If the file is empty, malformed, or not a CSV.
    """
    path = Path(filepath)

    if not path.exists():
        raise FileNotFoundError(
            f"File not found: '{filepath}'\n\n"
            "Please check the path and try again."
        )

    if path.suffix.lower() != ".csv":
        raise ValueError(
            f"Expected a .csv file, got '{path.suffix}'.\n\n"
            "SocialSentinel only accepts CSV files."
        )

    try:
        df = pd.read_csv(filepath, encoding="utf-8")
    except pd.errors.EmptyDataError:
        raise ValueError(f"The CSV file is empty: '{filepath}'")
    except pd.errors.ParserError as exc:
        raise ValueError(
            f"Failed to parse CSV file '{filepath}'.\n"
            f"Parser error: {exc}"
        )
    except UnicodeDecodeError:
        # Try latin-1 as fallback
        try:
            df = pd.read_csv(filepath, encoding="latin-1")
        except Exception as exc:
            raise ValueError(
                f"Cannot read file '{filepath}' — encoding error.\n"
                f"Details: {exc}"
            )

    if df.empty:
        raise ValueError(
            f"The dataset is empty: '{filepath}'\n\n"
            "The file was read successfully but contains no rows."
        )

    return df
