function initMeta() {
  const wrapper = document.getElementById("meta_block");
  if (!wrapper) return;

  const FIRMWARE_URL = "/dfu-updater/meta-firmware";
  const select = wrapper.querySelector("#firmwareSelector");
  const readme = wrapper.querySelector("#readme");
  const fileInput = wrapper.querySelector("#fileInput");
  const fileDisplay = wrapper.querySelector("#fileDisplay");
  const programBtn = wrapper.querySelector("#download");

  let firmwareList = [];

  function waitForDownloadButton(callback) {
    const checkInterval = setInterval(() => {
      if (programBtn) {
        clearInterval(checkInterval);
        callback(programBtn);
      }
    }, 100);
  }

  fetch(`${FIRMWARE_URL}/firmware_list.json?v=${Date.now()}`)
    .then((res) => res.json())
    .then((data) => {
      firmwareList = data;
      data.forEach((firmware, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.textContent = firmware.name;
        option.dataset.path = firmware.filepath;
        option.dataset.name = firmware.name;
        option.dataset.description = firmware.description || "";
        option.dataset.url = firmware.url
          ? firmware.url
          : `readmes/${firmware.filepath.split("/").pop().replace(".bin", ".md")}`;
        select.appendChild(option);
      });
    })
    .catch((err) => console.error("Failed to load firmware list:", err));

  select.addEventListener("change", (e) => {
    const index = parseInt(e.target.value);
    const selectedFirmware = firmwareList[index];
    const selectedOption = e.target.options[e.target.selectedIndex];
    if (!selectedFirmware?.filepath) return;

    if (fileDisplay) fileDisplay.textContent = selectedFirmware.name;

    const readmeUrl = selectedOption.dataset.url;
    if (readme && readmeUrl) {
      displayReadMe(`${FIRMWARE_URL}/${readmeUrl}`);
    }

    const fullPath = `${FIRMWARE_URL}/${selectedFirmware.filepath}`;
    window.firmwareFileName = selectedFirmware.name;

    readServerFirmwareFile(fullPath).then((buffer) => {
      window.firmwareFile = buffer;
      waitForDownloadButton((btn) => (btn.disabled = false));
    });
  });

  function displayReadMe(url) {
    if (!readme) return;
    marked.setOptions({ renderer: new marked.Renderer(), gfm: true });
    fetch(url)
      .then((res) => res.text())
      .then((text) => {
        readme.innerHTML = marked.parse(
          text.replace("404: Not Found", "No additional details available.")
        );
      })
      .catch(() => (readme.innerHTML = "Failed to load ReadMe."));
  }

  async function readServerFirmwareFile(path) {
    return new Promise((resolve) => {
      const raw = new XMLHttpRequest();
      raw.open("GET", path, true);
      raw.responseType = "arraybuffer";
      raw.onload = () => resolve(raw.response);
      raw.send(null);
    });
  }

  fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file || !file.name.endsWith(".bin")) {
      alert("Please upload a valid .bin firmware file.");
      return;
    }

    if (fileDisplay) fileDisplay.textContent = file.name;

    const reader = new FileReader();
    reader.onload = function () {
      window.firmwareFileName = file.name;
      window.firmwareFile = reader.result;
      if (programBtn) programBtn.disabled = false;
    };
    reader.readAsArrayBuffer(file);
  });
}

initMeta();
