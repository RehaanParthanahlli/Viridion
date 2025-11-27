import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping
import os, json

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = "backend/model/dataset_raw/PlantVillage"
MODEL_DIR = "backend/model/model_output"
MODEL_PATH = os.path.join(MODEL_DIR, "crop_disease_model.h5")
CLASS_JSON_PATH = os.path.join(MODEL_DIR, "class_names.json")

os.makedirs(MODEL_DIR, exist_ok=True)

# -----------------------------
# Data Preparation
# -----------------------------
train_datagen = ImageDataGenerator(
    rescale=1.0 / 255,
    validation_split=0.2
)

train_gen = train_datagen.flow_from_directory(
    BASE_DIR,
    target_size=(128, 128),
    batch_size=32,
    class_mode="categorical",
    subset="training"
)

val_gen = train_datagen.flow_from_directory(
    BASE_DIR,
    target_size=(128, 128),
    batch_size=32,
    class_mode="categorical",
    subset="validation"
)

# Save class names in the correct order (critical for inference!)
class_names = list(train_gen.class_indices.keys())
with open(CLASS_JSON_PATH, "w") as f:
    json.dump(class_names, f, indent=2)
print(f"✅ Saved class mapping to {CLASS_JSON_PATH}")

# -----------------------------
# Model Architecture
# -----------------------------
model = Sequential([
    Conv2D(32, (3, 3), activation="relu", input_shape=(128, 128, 3)),
    BatchNormalization(),
    MaxPooling2D(2, 2),

    Conv2D(64, (3, 3), activation="relu"),
    BatchNormalization(),
    MaxPooling2D(2, 2),

    Conv2D(128, (3, 3), activation="relu"),
    BatchNormalization(),
    MaxPooling2D(2, 2),

    Flatten(),
    Dense(256, activation="relu"),
    Dropout(0.4),
    Dense(train_gen.num_classes, activation="softmax")
])

model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# -----------------------------
# Training with early stopping
# -----------------------------
early_stop = EarlyStopping(
    monitor="val_loss",
    patience=3,
    restore_best_weights=True
)

history = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=10,
    callbacks=[early_stop]
)

# -----------------------------
# Save Model
# -----------------------------
model.save(MODEL_PATH)
print(f"✅ Model training complete! Saved to {MODEL_PATH}")
print(f"🧠 Classes trained on ({len(class_names)}):")
for i, c in enumerate(class_names):
    print(f"  {i}: {c}")
