import io
import pandas as pd
from typing import Tuple, Dict, Any, List

REQUIRED_KEYS = ["case_id", "activity", "timestamp"]
MAX_ROW_LIMIT = 20000

def ingest_clean_and_sort_csv(
    file_bytes: bytes,
    case_col: str = "case_id",
    activity_col: str = "activity",
    timestamp_col: str = "timestamp"
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Member 4 Task:
    Ingests CSV bytes, validates schema, trims whitespace,
    converts timestamps, and sorts chronologically.
    """
    if not file_bytes:
        raise ValueError("Uploaded CSV file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"Could not parse CSV file: {str(exc)}")

    if df.empty:
        raise ValueError("The uploaded CSV contains zero records.")

    if len(df) > MAX_ROW_LIMIT:
        raise ValueError(f"Dataset exceeds the {MAX_ROW_LIMIT} event boundary limit.")

    # 1. Validate required columns exist in the uploaded file
    target_mappings = [("Case ID", case_col), ("Activity", activity_col), ("Timestamp", timestamp_col)]
    for label, col in target_mappings:
        if col not in df.columns:
            raise ValueError(f"Missing mapped {label} column: '{col}' not present in CSV.")

    # 2. Extract and standardize column names
    clean_df = df[[case_col, activity_col, timestamp_col]].copy()
    clean_df.rename(columns={
        case_col: "case_id",
        activity_col: "activity",
        timestamp_col: "timestamp"
    }, inplace=True)

    # 3. Clean strings & remove whitespace
    clean_df["case_id"] = clean_df["case_id"].astype(str).str.strip()
    clean_df["activity"] = clean_df["activity"].astype(str).str.strip()

    if clean_df["case_id"].replace("", pd.NA).isna().any():
        raise ValueError("Case ID column contains blank/null values.")
    if clean_df["activity"].replace("", pd.NA).isna().any():
        raise ValueError("Activity column contains blank/null values.")

    # 4. Parse timestamps to standard UTC datetime
    try:
        clean_df["timestamp"] = pd.to_datetime(clean_df["timestamp"], utc=True)
    except Exception as exc:
        raise ValueError(f"Invalid timestamp format encountered: {str(exc)}")

    # 5. Composite chronological sort (Case ID -> Timestamp -> Original Row Index)
    clean_df["_row_order"] = clean_df.index
    clean_df.sort_values(by=["case_id", "timestamp", "_row_order"], ascending=[True, True, True], inplace=True)
    clean_df.drop(columns=["_row_order"], inplace=True)
    clean_df.reset_index(drop=True, inplace=True)

    summary_metadata = {
        "total_events": int(len(clean_df)),
        "unique_cases": int(clean_df["case_id"].nunique()),
        "unique_activities": int(clean_df["activity"].nunique())
    }

    return clean_df, summary_metadata


def serialize_graph_to_json(
    raw_mining_dict: Dict[str, Any],
    sla_threshold_min: float = 60.0
) -> Dict[str, Any]:
    """
    Member 4 Task:
    Receives raw dictionary output from Member 3 (mining.py)
    and serializes it into the JSON schema required by the React frontend.
    """
    dfg = raw_mining_dict.get("dfg", {})
    start_acts = raw_mining_dict.get("start_activities", set())
    end_acts = raw_mining_dict.get("end_activities", set())
    latencies = raw_mining_dict.get("latencies", {})
    activities = raw_mining_dict.get("activities", [])

    nodes: List[Dict[str, Any]] = []
    edges: List[Dict[str, Any]] = []
    bottleneck_count = 0

    # Build React Flow Nodes
    for idx, act in enumerate(sorted(activities)):
        nodes.append({
            "id": act,
            "type": "customNode",
            "position": {"x": 100 + (idx % 3) * 260, "y": 80 + (idx // 3) * 160},
            "data": {
                "label": act,
                "is_start": act in start_acts,
                "is_end": act in end_acts
            }
        })

    # Build React Flow Edges with SLA flag
    for (src, tgt), count in dfg.items():
        avg_duration = latencies.get((src, tgt), 0.0)
        is_bottleneck = avg_duration > sla_threshold_min
        if is_bottleneck:
            bottleneck_count += 1

        edges.append({
            "id": f"e-{src}->{tgt}",
            "source": src,
            "target": tgt,
            "animated": is_bottleneck,
            "data": {
                "count": int(count),
                "avg_duration_min": round(float(avg_duration), 2),
                "is_bottleneck": is_bottleneck,
                "label": f"{round(avg_duration, 1)} min ({count}x)"
            },
            "style": {
                "stroke": "#ef4444" if is_bottleneck else "#0284c7",
                "strokeWidth": 3 if is_bottleneck else 2
            }
        })

    return {
        "nodes": nodes,
        "edges": edges,
        "variants": raw_mining_dict.get("variants", []),
        "kpi_metrics": {
            **raw_mining_dict.get("kpi_metrics", {}),
            "bottlenecks_detected": bottleneck_count,
            "sla_threshold_min": sla_threshold_min
        }
    }