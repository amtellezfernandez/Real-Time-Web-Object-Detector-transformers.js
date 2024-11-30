import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers";

env.allowLocalModels = false;

const cameraButton = document.getElementById("camera-button");
const imageContainer = document.getElementById("image-container");
const status = document.getElementById("status");
const videoElement = document.getElementById("video");

let stream;

status.textContent = "Loading model...";

const detector = await pipeline("object-detection", "Xenova/detr-resnet-50");

status.textContent = "Ready";

// Function to start the camera and capture an image
async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoElement.srcObject = stream;
    videoElement.style.display = "block";
    status.textContent = "Camera ready. Click 'Capture' to take a photo.";
  } catch (err) {
    console.error("Error accessing camera: ", err);
    status.textContent = "Error accessing camera. Please ensure it is connected and allowed.";
  }
}

// Function to capture an image from the video stream
function capturePhoto() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  stopCamera(); // Stop the camera after capturing
  const imageDataURL = canvas.toDataURL("image/png");
  displayImage(imageDataURL);
  detect(imageDataURL);
}

// Stop the camera
function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    videoElement.style.display = "none";
  }
}

// Display captured image
function displayImage(imageDataURL) {
  imageContainer.innerHTML = "";
  const image = document.createElement("img");
  image.src = imageDataURL;
  imageContainer.appendChild(image);
}

// Run object detection
async function detect(imageSrc) {
  status.textContent = "Analysing...";
  const output = await detector(imageSrc, {
    threshold: 0.5,
    percentage: true,
  });
  status.textContent = "";
  console.log("output", output);
  output.forEach(renderBox);
}

// Render bounding boxes
function renderBox({ box, label }) {
  const { xmax, xmin, ymax, ymin } = box;

  // Generate a random color for the box
  const color = "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, 0);

  // Draw the box
  const boxElement = document.createElement("div");
  boxElement.className = "bounding-box";
  Object.assign(boxElement.style, {
    borderColor: color,
    left: 100 * xmin + "%",
    top: 100 * ymin + "%",
    width: 100 * (xmax - xmin) + "%",
    height: 100 * (ymax - ymin) + "%",
  });

  // Draw the label
  const labelElement = document.createElement("span");
  labelElement.textContent = label;
  labelElement.className = "bounding-box-label";
  labelElement.style.backgroundColor = color;

  boxElement.appendChild(labelElement);
  imageContainer.appendChild(boxElement);
}

// Attach event listeners
cameraButton.addEventListener("click", startCamera);
videoElement.addEventListener("click", capturePhoto);
