from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pm4py
from pipeline import ingest_clean_and_sort, serialize_dfg_response

app = FastAPI(
    title="FlowLens Backend API",
    description="Stateless in-memory process mining engine"
)

# CORS configuration for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "FlowLens API running", "engine": "Stateless In-Memory RAM"}

@app.post("/analyze")
async def analyze_event_log(
    file: UploadFile = File(...),
    sla_threshold_hrs: float = Query(24.0, description="SLA bottleneck threshold in hours")
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only standard CSV files are supported.")

    contents = await file.read()

    # Step 1: Member 4 Data Ingestion, Validation & Chronological Sorting
    try:
        clean_df, summary = ingest_clean_and_sort(contents)
    except ValueError as val_err:
        raise HTTPException(status_code=422, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(exc)}")

    # Step 2: PM4Py Algorithmic Discovery (Member 3 responsibility)
    try:
        formatted_df = pm4py.format_dataframe(
            clean_df, case_id="case_id", activity_key="activity", timestamp_key="timestamp"
        )
        dfg_perf, start_acts, end_acts = pm4py.discover_performance_dfg(formatted_df)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Mining error: {str(exc)}")

    # Step 3: Member 4 Serialization to JSON for the Frontend
    result_payload = serialize_dfg_response(
        dfg_perf=dfg_perf,
        start_acts=start_acts,
        end_acts=end_acts,
        summary=summary,
        sla_hours=sla_threshold_hrs
    )

    return result_payload

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)