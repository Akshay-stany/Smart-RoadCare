from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
try:
    from .config import MODEL_PATH, is_model_weights_available
    from .detector import detector
    from .classes import RDD_CLASS_MAP
except ImportError:
    from config import MODEL_PATH, is_model_weights_available
    from detector import detector
    from classes import RDD_CLASS_MAP

app = FastAPI(
    title="RoadCare AI Road Damage Detection Service",
    description="Computer Vision inference microservice for road surface damage detection",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RoadDamage-AI",
        "model_available": is_model_weights_available(),
        "model_path": MODEL_PATH,
        "classes_supported": len(RDD_CLASS_MAP),
    }

@app.get("/model-info")
def model_info():
    return {
        "architecture": "YOLOv8-RDD",
        "dataset": "Road Damage Dataset (RDD2022)",
        "weights_configured": is_model_weights_available(),
        "classes": RDD_CLASS_MAP,
    }

@app.get("/classes")
def list_classes():
    return {"classes": list(RDD_CLASS_MAP.values())}

@app.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image format (JPEG, PNG, WebP)")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image size exceeds 10 MB limit")

    try:
        result = detector.analyze(content)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failure: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    from .config import HOST, PORT
    uvicorn.run("services.road-damage-ai.app:app", host=HOST, port=PORT, reload=True)
