from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import numpy as np
import uvicorn
import os
import json
from mangum import Mangum

app = FastAPI()

# Allow frontend access (HTML/JS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# MODEL & CLASS SETUP
# ----------------------------
BASE_DIR = os.path.dirname(__file__)

MODEL_PATH = os.path.join(BASE_DIR, "crop_disease_model.h5")
DATASET_PATH = os.path.join(BASE_DIR, "PlantVillage")
CLASS_JSON_PATH = os.path.join(BASE_DIR, "class_names.json")


# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Load class names from JSON if available
if os.path.exists(CLASS_JSON_PATH):
    with open(CLASS_JSON_PATH, "r") as f:
        class_names = json.load(f)
    print(f"Loaded {len(class_names)} class names from JSON.")
else:
    # Fallback: read subfolders (alphabetically)
    class_names = sorted(
        [d for d in os.listdir(DATASET_PATH) if os.path.isdir(os.path.join(DATASET_PATH, d))]
    )
    print("Warning: class_names.json not found. Using folder names instead.")
    print(f"Loaded {len(class_names)} class names from folder structure.")

# ----------------------------
# ROUTES
# ----------------------------
@app.get("/")
def root():
    return {"message": "GreenGuardian API is alive 🌿"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Save uploaded file temporarily
    contents = await file.read()
    temp_path = os.path.join(BASE_DIR, f"temp_{file.filename}")

    with open(temp_path, "wb") as f:
        f.write(contents)

    # Preprocess image
    img = image.load_img(temp_path, target_size=(128, 128))
    img_array = image.img_to_array(img) / 255.0
    img_array = np.expand_dims(img_array, axis=0)

    # Predict
    preds = model.predict(img_array)
    predicted_class = class_names[int(np.argmax(preds))]
    confidence = float(np.max(preds))

    # Delete temp file
    os.remove(temp_path)

    return {
        "predicted_class": predicted_class,
        "confidence": confidence
    }

# ----------------------------
# MAIN
# ----------------------------
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

handler = Mangum(app)
