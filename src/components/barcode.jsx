import React, { useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/library";
import CameraModal from "./CameraModal"; // Adjust the path as needed
import { useNavigate } from "react-router-dom";

const ImageBarcodeScanner = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [data, setData] = useState("No result");
  const [error, setError] = useState(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [serialNumber, setSerialNumber] = useState("");
  const [modelId, setModelId] = useState("");

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(URL.createObjectURL(file));
    }
  };

  const handleScan = () => {
    const codeReader = new BrowserMultiFormatReader();

    if (selectedFile) {
      const img = document.getElementById("barcode-img");
      codeReader
        .decodeFromImage(img)
        .then((result) => {
          setData(result.text);
          // Assuming scanned data format is "SerialNumber,ModelID"
          const [serial, model] = result.text.split(",");
          setSerialNumber(serial || "");
          setModelId(model || "");
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to scan barcode. Please try again.");
        });
    }
  };

  const handleCapture = (photoDataUrl) => {
    setSelectedFile(photoDataUrl);
    handleScan();
  };

  const handleContinue = () => {
    navigate(`/inspectForm?serialno=${serialNumber}&modelno=${modelId}`);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-xl font-bold mb-4">Image Barcode Scanner</h1>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4 p-2 border rounded"
      />
      <button
        onClick={() => setIsCameraModalOpen(true)}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Capture Barcode
      </button>
      {selectedFile && (
        <>
          <img
            id="barcode-img"
            src={selectedFile}
            alt="Uploaded"
            className="max-w-xs max-h-60 object-contain mb-4 border rounded"
          />
          <button
            onClick={handleScan}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Scan Barcode
          </button>
        </>
      )}
      {error && data === "No result" && (
        <p className="text-red-500 mt-4">{error}</p>
      )}
      <p className="mt-4">Scanned Data: {data}</p>

      <div className="mt-6 w-full max-w-sm">
        <label className="block text-sm font-medium text-gray-700">
          Serial Number (for testing : 7301234)
        </label>
        <input
          type="text"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          className="w-full p-2 border rounded mt-1 mb-4"
          placeholder="Type manually if barcode is not available"
        />
        <label className="block text-sm font-medium text-gray-700">
          Model ID (for testing : R2900)
        </label>
        <input
          type="text"
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="w-full p-2 border rounded mt-1 mb-4"
          placeholder="Type manually if barcode is not available"
        />
      </div>

      <button
        onClick={handleContinue}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-6"
      >
        Continue
      </button>

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCapture}
        stepId="barcodeCapture"
      />
    </div>
  );
};

export default ImageBarcodeScanner;
