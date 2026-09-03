from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import pm4py
import io

app = FastAPI(title="FlowLens Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "FlowLens API running"}

@app.post("/analyze")
async def analyze_event_log(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"CSV read error: {str(exc)}")

    df.columns = df.columns.str.strip()
    required = {"case_id", "activity", "timestamp"}
    if not required.issubset(set(df.columns)):
        raise HTTPException(
            status_code=422,
            detail=f"Missing required columns. Found: {list(df.columns)}, Required: {list(required)}"
        )

    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    df = df.dropna(subset=["case_id", "activity", "timestamp"])

    formatted_df = pm4py.format_dataframe(
        df, case_id="case_id", activity_key="activity", timestamp_key="timestamp"
    )

    dfg_perf, start_acts, end_acts = pm4py.discover_performance_dfg(formatted_df)

    nodes = set()
    edges = []

    for (source, target), stats in dfg_perf.items():
        nodes.add(source)
        nodes.add(target)
        duration_hrs = round(stats.get("mean", 0) / 3600, 2)
        edges.append({
            "id": f"e-{source}-{target}",
            "source": str(source),
            "target": str(target),
            "label": f"{duration_hrs}h",
            "is_bottleneck": duration_hrs > 24,
            "duration_hrs": duration_hrs
        })

    node_list = [
        {
            "id": str(node),
            "label": str(node),
            "is_start": str(node) in [str(s) for s in start_acts.keys()],
            "is_end": str(node) in [str(e) for e in end_acts.keys()]
        }
        for node in nodes
    ]

    return {
        "status": "success",
        "nodes": node_list,
        "edges": edges,
        "metrics": {
            "total_cases": int(df["case_id"].nunique()),
            "total_events": int(len(df)),
            "unique_activities": int(len(nodes))
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)