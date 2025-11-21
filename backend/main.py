from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import zipfile
from pathlib import Path

from backend.agent.graph import agent

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


@app.post("/plan")
def create_plan(request: ProjectRequest):
    try:
        result = agent.invoke(
            {"user_prompt": request.prompt},
            {"recursion_limit": request.recursion_limit}
        )

        # Añadir información sobre si el proyecto está listo para descargar
        result["download_ready"] = True
        result["project_path"] = "MY_PROJECT"

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/download")
def download_project():
    """Crea un ZIP del proyecto y lo envía para descargar"""
    try:
        project_path = Path("my_project")

        if not project_path.exists():
            raise HTTPException(status_code=404, detail="Project folder not found")

        # Crear archivo ZIP temporal
        zip_path = "my_project.zip"

        # Eliminar ZIP anterior si existe
        if os.path.exists(zip_path):
            os.remove(zip_path)

        # Crear el ZIP
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