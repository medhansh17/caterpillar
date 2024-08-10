import React, { useRef, useState } from "react";

const SignatureCanvas = ({ onSave, width = 300, height = 150 }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { offsetX, offsetY } = e.nativeEvent;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const { offsetX, offsetY } = e.nativeEvent;
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL();
    onSave(dataUrl);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleEvent = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type.startsWith("touch")) {
      e.nativeEvent.offsetX =
        e.nativeEvent.touches[0].clientX -
        e.currentTarget.getBoundingClientRect().left;
      e.nativeEvent.offsetY =
        e.nativeEvent.touches[0].clientY -
        e.currentTarget.getBoundingClientRect().top;
    }
    return e;
  };

  return (
    <div className="signature-canvas">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseOut={endDrawing}
        onTouchStart={(e) => startDrawing(handleEvent(e))}
        onTouchMove={(e) => draw(handleEvent(e))}
        onTouchEnd={endDrawing}
        onTouchCancel={endDrawing}
        className="border border-gray-300"
      />
      <div className="mt-2">
        <button
          onClick={saveSignature}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Save
        </button>
        <button
          onClick={clearSignature}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear
        </button>
      </div>
    </div>
  );
};

export default SignatureCanvas;
