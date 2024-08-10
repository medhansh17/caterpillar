import React, { useRef, useEffect, useState } from "react";
import { savePhoto } from "./indexedDB";

const CameraModal = ({ isOpen, onClose, onCapture, stepId }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let stream = null;
    if (isOpen) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((videoStream) => {
          stream = videoStream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Error accessing the camera", err);
          setError("Camera access denied. Please check your permissions.");
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const photoDataUrl = canvas.toDataURL("image/jpeg");

    try {
      await savePhoto(stepId, photoDataUrl);
      onCapture(photoDataUrl);
      onClose();
    } catch (error) {
      console.error("Error saving photo", error);
      setError("Failed to save photo. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-lg">
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", maxWidth: "500px" }}
            />
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </>
        )}
        <div className="mt-4 flex justify-between">
          <button
            onClick={capturePhoto}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            disabled={!!error}
          >
            Capture
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraModal;
