"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { runMockInference } from "@/lib/inference/mock";
import type { ScreeningResult } from "@/lib/inference/types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function LeafAnalyzer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  useEffect(() => {
    if (!cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    void videoRef.current.play();
    return () => cameraStream.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function validateAndSelect(nextFile?: File) {
    setError(null);
    setResult(null);
    if (!nextFile) return;
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    validateAndSelect(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    validateAndSelect(event.dataTransfer.files?.[0]);
  }

  function clearSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  }

  async function startCamera() {
    setError(null);
    setResult(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Live camera access is not supported by this browser. Use Upload from files instead.");
      return;
    }
    setIsStartingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      setCameraStream(stream);
    } catch {
      setError("Camera access was not granted. Allow camera permission or use Upload from files.");
    } finally {
      setIsStartingCamera(false);
    }
  }

  function stopCamera() {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      setError("The camera is still starting. Wait a moment and try again.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("This browser could not capture the camera frame.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    if (!blob) {
      setError("This browser could not create the captured image.");
      return;
    }
    stopCamera();
    validateAndSelect(new File([blob], `leaf-${Date.now()}.jpg`, { type: "image/jpeg" }));
  }

  async function analyze() {
    if (!file) return;
    setIsAnalyzing(true);
    setResult(null);
    setResult(await runMockInference(file));
    setIsAnalyzing(false);
  }

  return (
    <section className="analyzer" aria-labelledby="analyzer-title">
      <div className="analyzer-intro">
        <p className="eyebrow">Try the interaction</p>
        <h2 id="analyzer-title">Check a leaf photograph</h2>
        <p>Use one clear leaf, natural light, and a simple background. Your selected image stays in this browser during the prototype.</p>
        <ul className="photo-tips">
          <li>Keep the leaf in focus</li>
          <li>Include healthy and affected tissue</li>
          <li>Avoid screenshots and collages</li>
        </ul>
      </div>

      <div className="analyzer-workspace">
        {cameraStream ? (
          <div className="camera-scanner">
            <div className="camera-stage">
              <video ref={videoRef} playsInline muted aria-label="Live rear camera preview" />
              <div className="scan-guide" aria-hidden="true"><span>Place one leaf inside the frame</span></div>
            </div>
            <div className="camera-actions">
              <button className="button button-secondary" type="button" onClick={stopCamera}>Cancel</button>
              <button className="button button-primary" type="button" onClick={captureFrame}>Capture leaf</button>
            </div>
          </div>
        ) : !previewUrl ? (
          <div className="drop-zone" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
            <div className="leaf-mark" aria-hidden="true">+</div>
            <h3>Add a leaf image</h3>
            <p>Scan with the live camera or upload an existing photograph.</p>
            <div className="source-actions">
              <button className="button button-primary" type="button" onClick={startCamera} disabled={isStartingCamera}>
                {isStartingCamera ? "Starting camera…" : "Open live camera"}
              </button>
              <button className="button button-secondary" type="button" onClick={() => inputRef.current?.click()}>
                Upload from files
              </button>
            </div>
            <span>JPG, PNG or WebP · maximum 10 MB</span>
          </div>
        ) : (
          <div className="selection">
            <div className="image-frame">
              <Image src={previewUrl} alt="Selected leaf preview" fill unoptimized sizes="(max-width: 720px) 100vw, 520px" />
            </div>
            <div className="file-row">
              <div>
                <strong>{file?.name}</strong>
                <span>{file ? formatBytes(file.size) : ""}</span>
              </div>
              <button className="text-button" type="button" onClick={clearSelection}>Remove</button>
            </div>
            <button className="button button-primary button-wide" type="button" onClick={analyze} disabled={isAnalyzing}>
              {isAnalyzing ? "Running interface simulation…" : "Run interface demo"}
            </button>
          </div>
        )}

        <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
        {error && <p className="form-error" role="alert">{error}</p>}
        {result && <ResultPanel result={result} />}
      </div>
    </section>
  );
}

function ResultPanel({ result }: { result: ScreeningResult }) {
  const percentage = Math.round(result.confidence * 100);
  const uncertain = result.confidence < result.uncertaintyThreshold;
  return (
    <section className="result-panel" aria-live="polite" aria-labelledby="result-heading">
      <div className="simulation-label">Interface simulation · no model prediction</div>
      <p className="result-kicker">{uncertain ? "More information needed" : result.crop}</p>
      <h3 id="result-heading">{uncertain ? "The model is not confident enough" : result.condition}</h3>
      <div className="confidence-row"><span>Simulated model confidence</span><strong>{percentage}%</strong></div>
      <div className="confidence-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
      <p className="result-summary">{uncertain ? result.uncertainMessage : result.summary}</p>
      <div className="result-actions">
        <button className="button button-secondary" type="button" disabled>Learn about this condition</button>
        <span>Education content will unlock with the evaluated model and reviewed catalog.</span>
      </div>
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
