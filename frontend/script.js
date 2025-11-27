// ============================================
// GreenGuardian - Upload & Prediction Script
// ============================================

const API_URL = "http://localhost:8000/predict";

document.addEventListener("DOMContentLoaded", function () {
  const imageInput = document.getElementById("imageInput");
  const preview = document.getElementById("preview");
  const uploadBtn = document.getElementById("uploadBtn");
  const removeBtn = document.getElementById("removeBtn");
  const fileName = document.getElementById("file-name");
  const loading = document.getElementById("loading");
  const container = document.getElementById("container");

  // Handle file selection - show preview
  imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];

    if (file) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(file.type.toLowerCase())) {
        alert("⚠️ Please upload a valid image file (JPG, PNG, GIF, WebP)");
        imageInput.value = "";
        return;
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert("⚠️ File size should be less than 10MB!");
        imageInput.value = "";
        return;
      }

      // Show filename
      fileName.textContent = file.name;
      fileName.style.color = "#43a047";

      // Show preview image
      const reader = new FileReader();
      reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block";
        
        // Add uploaded class to container for styling
        container.classList.add("uploaded");
        
        // Show upload and remove buttons
        uploadBtn.style.display = "inline-block";
        removeBtn.style.display = "inline-block";
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle remove button - clear selection
  removeBtn.addEventListener("click", function () {
    imageInput.value = "";
    preview.src = "";
    preview.style.display = "none";
    fileName.textContent = "No file chosen";
    fileName.style.color = "#3bb543";
    uploadBtn.style.display = "none";
    removeBtn.style.display = "none";
    container.classList.remove("uploaded");
  });

  // Handle upload button - send to API
  uploadBtn.addEventListener("click", async function () {
    const file = imageInput.files[0];

    if (!file) {
      alert("⚠️ Please select an image first!");
      return;
    }

    // Show loading state
    loading.style.display = "block";
    uploadBtn.disabled = true;
    uploadBtn.textContent = "🔄 Understanding...";
    removeBtn.disabled = true;

    try {
      // Create FormData and append the file
      const formData = new FormData();
      // CRITICAL: parameter name must be "file" to match FastAPI endpoint
      formData.append("file", file);

      // Send POST request to FastAPI backend
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // Validate response
      if (!data.predicted_class || data.confidence === undefined) {
        throw new Error("Invalid response from server");
      }

      // Store result in localStorage for result.html
      localStorage.setItem("diagnosisResult", JSON.stringify(data));

      // Show success message briefly
      loading.textContent = "✅ Understanding complete! Redirecting...";
      loading.style.color = "#43a047";

      // Redirect to result page after short delay
      setTimeout(() => {
        window.location.href = "result.html";
      }, 1000);

    } catch (error) {
      console.error("Error:", error);

      // Hide loading
      loading.style.display = "none";

      // Show error message
      let errorMsg = "❌ Failed to understand image.\n\n";

      if (error.message.includes("fetch") || error.message.includes("Failed to fetch")) {
        errorMsg += "Please make sure:\n";
        errorMsg += "1. FastAPI server is running (python main.py)\n";
        errorMsg += "2. Server is accessible at http://localhost:8000\n";
        errorMsg += "3. Check browser console (F12) for details";
      } else {
        errorMsg += error.message;
      }

      alert(errorMsg);

      // Re-enable buttons
      uploadBtn.disabled = false;
      uploadBtn.textContent = "✔️ Check Disease";
      removeBtn.disabled = false;
    }
  });
});