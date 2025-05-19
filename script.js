const CLASS_MAPPING = {
    "Cani_aure": "Golden Jackal",
    "Catt_catt": "Cow",
    "Hyen_hyen": "Spotted Hyena",
    "Pant_pard": "Leopard",
    "Rusa_unic": "Sambar Deer"
  };
  
  async function handleUpload() {
    const fileInput = document.getElementById("upload");
    const status = document.getElementById("status");
    const resultContainer = document.getElementById("resultContainer");
    const downloadLink = document.getElementById("downloadLink");
  
    if (!fileInput.files.length) return;
  
    const file = fileInput.files[0];
    downloadLink.style.display = "none";
    status.innerText = "Processing...";
    resultContainer.innerHTML = "";
  
    const zip = new JSZip();
  
    if (file.name.endsWith(".zip")) {
      const reader = new FileReader();
      reader.onload = async function () {
        const content = await JSZip.loadAsync(reader.result);
        let count = 0;
        let total = Object.keys(content.files).filter(f => /\.(jpe?g|png)$/i.test(f)).length;
  
        for (let filename in content.files) {
          if (!/\.(jpe?g|png)$/i.test(filename)) continue;
  
          const blob = await content.files[filename].async("blob");
          const imgFile = new File([blob], filename, { type: "image/jpeg" });
  
          const formData = new FormData();
          formData.append("file", imgFile);
  
          try {
            const response = await fetch("https://ai-species-backend-1.onrender.com/predict", { method: "POST", body: formData });
            const result = await response.json();
            const className = result.predicted_class || "Unknown";
  
            // Display prediction
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
              <img src="${URL.createObjectURL(imgFile)}" alt="${className}" />
              <h4>${className}</h4>
            `;
            resultContainer.appendChild(card);
  
            // Add to ZIP
            zip.file(`${className}/${filename}`, blob);
            count++;
            status.textContent = `Processed ${count} / ${total}`;
          } catch (error) {
            console.error(error);
            status.textContent += `\nError processing ${filename}`;
          }
        }
  
        if (count > 0) {
          const contentZIP = await zip.generateAsync({ type: "blob" });
          downloadLink.href = URL.createObjectURL(contentZIP);
          downloadLink.style.display = "inline-block";
        } else {
          status.textContent += "\nNo valid images found.";
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const formData = new FormData();
      formData.append("file", file);
  
      try {
        const response = await fetch("https://ai-species-backend-1.onrender.com/predict", { method: "POST", body: formData });
        const result = await response.json();
        const className = result.predicted_class || "Unknown";
  
        // Show result
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <img src="${URL.createObjectURL(file)}" alt="${className}" />
          <h4>${className}</h4>
        `;
        resultContainer.appendChild(card);
  
        // Create ZIP with single categorized image
        const reader = new FileReader();
        reader.onloadend = () => {
          zip.file(`${className}/${file.name}`, file);
          zip.generateAsync({ type: "blob" }).then(blob => {
            downloadLink.href = URL.createObjectURL(blob);
            downloadLink.style.display = "inline-block";
          });
        };
        reader.readAsArrayBuffer(file);
      } catch (error) {
        status.textContent = "Prediction failed.";
        console.error(error);
      }
    }
  }
