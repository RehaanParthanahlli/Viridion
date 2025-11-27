const imageInput = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const fileName = document.getElementById("file-name");
const uploadBtn = document.getElementById("uploadBtn");
const removeBtn = document.getElementById("removeBtn");
const loading = document.getElementById("loading");
const container = document.getElementById("container");

// ✅ Always use Netlify Functions endpoint
const API_BASE = "/.netlify/functions/main";

console.log("Backend API Base URL:", API_BASE); // helpful debug log

imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = "block";
      uploadBtn.style.display = "inline-block";
      removeBtn.style.display = "inline-block";
      container.classList.add("uploaded");
    };
    reader.readAsDataURL(file);
    fileName.textContent = file.name;
  }
});

removeBtn.addEventListener("click", () => {
  imageInput.value = "";
  preview.src = "";
  preview.style.display = "none";
  uploadBtn.style.display = "none";
  removeBtn.style.display = "none";
  fileName.textContent = "No file chosen";
  container.classList.remove("uploaded");
});

uploadBtn.addEventListener("click", async () => {
  const file = imageInput.files[0];
  if (!file) {
    alert("Please upload an image first!");
    return;
  }

  loading.style.display = "block";
  const formData = new FormData();
  formData.append("file", file);

  try {
    // ✅ Always call Netlify function
    const response = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error("Backend error");
    const data = await response.json();

    // Save only the response keys
    localStorage.setItem("diagnosisResult", JSON.stringify({
      predicted_class: data.predicted_class,
      confidence: data.confidence
    }));

    window.location.href = "result.html";
  } catch (err) {
    alert("Error connecting to backend: " + err.message);
  } finally {
    loading.style.display = "none";
  }
});