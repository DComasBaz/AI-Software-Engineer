from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
import os
import zipfile
from pathlib import Path
import json
import asyncio

from backend.agent.graph import agent, progress_state

app = FastAPI(title="Engineering Project Planner API")

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ProjectRequest(BaseModel):
    prompt: str
    recursion_limit: int = 100


async def event_generator():
    """Generator for SSE events"""
    while True:
        yield f"data: {json.dumps(progress_state)}\n\n"
        await asyncio.sleep(0.5)  # Send updates every 500ms


@app.get("/progress")
async def stream_progress():
    """SSE endpoint for progress updates"""
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.post("/plan")
def create_plan(request: ProjectRequest):
    try:
        # Reset progress
        progress_state["status"] = "planning"
        progress_state["message"] = "Starting project planning..."
        progress_state["step"] = 0
        progress_state["total"] = 0

        result = agent.invoke(
            {"user_prompt": request.prompt},
            {"recursion_limit": request.recursion_limit}
        )

        # Mark as complete
        progress_state["status"] = "complete"
        progress_state["message"] = "Project ready!"

        result["download_ready"] = True
        result["project_path"] = "MY_PROJECT"

        return result

    except Exception as e:
        progress_state["status"] = "error"
        progress_state["message"] = str(e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download")
def download_project():
    """Creates a ZIP of the project and sends it for download"""
    try:
        project_path = Path("my_project")

        if not project_path.exists():
            raise HTTPException(status_code=404, detail="Project folder not found")

        zip_path = "my_project.zip"

        if os.path.exists(zip_path):
            os.remove(zip_path)

        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(project_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, project_path.parent)
                    zipf.write(file_path, arcname)

        return FileResponse(
            path=zip_path,
            filename="my_project.zip",
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=my_project.zip"
            }
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)