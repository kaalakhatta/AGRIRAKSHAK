"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";
import { SaveSummary } from "@/features/scanning/save-summary";
import { runMockInference } from "@/lib/inference/mock";
import { SCANNER_CROPS, type ScannerCrop } from "@/lib/inference/contract";
import { useConnectionSignal } from "@/features/offline/connectivity";
import { runApiInference } from "@/lib/inference/api";
import type { ScreeningResult } from "@/lib/inference/types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function LeafAnalyzer() {
  const connected = useConnectionSignal();
  const request = useRef(0), controller = useRef<AbortController | null>(null), streamRef = useRef<MediaStream | null>(null);
  const [consent,setConsent] = useState(false), [crop,setCrop] = useState<ScannerCrop | "">("");
  const [screenedAt,setScreenedAt] = useState("");
  useEffect(() => () => { request.current++; controller.current?.abort(); streamRef.current?.getTracks().forEach(track => track.stop()); }, []);
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
    void videoRef.current.play().catch(() => setError("Camera preview could not start. Use Upload from files."));
    return () => cameraStream.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  function validateAndSelect(nextFile?: File) {
    request.current++; controller.current?.abort(); setIsAnalyzing(false); setConsent(false);
    setError(null);
    setResult(null);
    if (!nextFile) return;
    if (!ACCEPTED_TYPES.includes(nextFile.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (!nextFile.size || nextFile.size > MAX_FILE_BYTES) {
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
    request.current++; controller.current?.abort(); setIsAnalyzing(false); setConsent(false);
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
    setIsStartingCamera(true); const cameraRequest = ++request.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      if (cameraRequest !== request.current) { stream.getTracks().forEach(track=>track.stop()); return; }
      streamRef.current=stream; setCameraStream(stream);
    } catch {
      setError("Camera access was not granted. Allow camera permission or use Upload from files.");
    } finally {
      setIsStartingCamera(false);
    }
  }

  function stopCamera() {
    request.current++; streamRef.current=null;
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
  }

  async function captureFrame() {
    const captureRequest = request.current;
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
    if (captureRequest !== request.current) return;
    if (!blob) {
      setError("This browser could not create the captured image.");
      return;
    }
    stopCamera();
    validateAndSelect(new File([blob], `leaf-${Date.now()}.jpg`, { type: "image/jpeg" }));
  }

  async function analyze(demo = false) {
    if (!file || (!demo && (!crop || !consent || !connected))) return;
    controller.current?.abort(); const abort = new AbortController(); controller.current=abort;
    const token=++request.current; setIsAnalyzing(true); setResult(null); setError(null);
    try {
      const next = demo ? await runMockInference(file) : await runApiInference(file,crop as ScannerCrop,abort.signal);
      if (token === request.current) { setScreenedAt(new Date().toISOString()); setResult(next); }
    } catch (nextError) {
      if (token === request.current) setError(nextError instanceof Error ? nextError.message : "The image could not be analyzed.");
    } finally { if (token === request.current) setIsAnalyzing(false); }
  }

  return (
    <section className="analyzer" aria-labelledby="analyzer-title">
      <div className="analyzer-intro">
        <p className="eyebrow">Preliminary screening</p>
        <h2 id="analyzer-title">Check a leaf photograph</h2>
        <p>Use one clear leaf, natural light, and a simple background. Analyzing sends the selected image to the configured analysis server after your consent. This app does not retain the image. Camera preview stays on this page.</p>
        <p>Existing scanner baseline: bell pepper, potato and tomato. Soybean, wheat and gram/chickpea screening is not supported by this model.</p>
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
            <label>Crop photographed<select value={crop} disabled={isAnalyzing} onChange={e=>{request.current++;controller.current?.abort();setCrop(e.target.value as ScannerCrop | "");setResult(null);setConsent(false);}}><option value="">Choose a supported crop</option>{SCANNER_CROPS.map(c=><option key={c} value={c}>{c === 'Pepper' ? 'Bell pepper' : c}</option>)}</select></label>
            <label className="check-label"><input type="checkbox" checked={consent} onChange={e=>{setConsent(e.target.checked);if(!e.target.checked){request.current++;controller.current?.abort();setIsAnalyzing(false);}}} />Send this image to the analysis server for preliminary screening</label>
            {!connected && <p>Browser reports offline. Model analysis needs the configured server; your farm records and the explicit interface demo remain available.</p>}
            <button className="button button-primary button-wide" type="button" onClick={()=>void analyze()} disabled={isAnalyzing || !consent || !crop || !connected}>
              {isAnalyzing ? "Analyzing leaf…" : "Analyze leaf"}
            </button>
            <button type="button" className="text-button" disabled={isAnalyzing} onClick={()=>void analyze(true)}>Run labelled interface demo (no model)</button>
          </div>
        )}

        <input ref={inputRef} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleChange} />
        {error && <p className="form-error" role="alert">{error}</p>}
        {result && <ResultPanel result={result} screenedAt={screenedAt} />}
      </div>
    </section>
  );
}

function ResultPanel({ result,screenedAt }: { result: ScreeningResult; screenedAt:string }) {
  const percentage = Math.round(result.confidence * 100);
  const uncertain = result.confidence < result.uncertaintyThreshold;
  return (
    <section className="result-panel" aria-live="polite" aria-labelledby="result-heading">
      <div className="simulation-label">{result.mode === "mock" ? "Interface simulation · no model prediction" : `Preliminary AI screening · ${result.modelVersion}`}</div>
      <p className="result-kicker">{uncertain ? "More information needed" : result.crop}</p>
      <h3 id="result-heading">{uncertain ? "The model is not confident enough" : result.condition}</h3>
      <div className="confidence-row"><span>{result.mode === "mock" ? "Simulated confidence" : "Model confidence"}</span><strong>{percentage}%</strong></div>
      <div className="confidence-track" aria-hidden="true"><span style={{ width: `${percentage}%` }} /></div>
      <p className="result-summary">{uncertain ? result.uncertainMessage : result.summary}</p>
      <div className="result-actions">
        <button className="button button-secondary" type="button" disabled>Learn about this condition</button>
        <span>Education content will unlock with the evaluated model and reviewed catalog.</span>
      </div>
      {result.mode === "mock" ? <SaveSummary key={screenedAt} result={result} screenedAt={screenedAt} /> : <p>The image and prediction are not saved to farm records. Record an observation yourself if you want a follow-up.</p>}
    </section>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
