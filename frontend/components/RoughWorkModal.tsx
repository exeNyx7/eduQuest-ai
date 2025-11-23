"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RoughWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type DrawingMode = "pen" | "eraser";

interface DrawingState {
  mode: DrawingMode;
  color: string;
  lineWidth: number;
}

export default function RoughWorkModal({ isOpen, onClose }: RoughWorkModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const [drawingState, setDrawingState] = useState<DrawingState>({
    mode: "pen",
    color: "#FFFFFF",
    lineWidth: 3,
  });
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  // Available colors
  const colors = [
    "#FFFFFF", // White
    "#000000", // Black
    "#FF0000", // Red
    "#00FF00", // Green
    "#0000FF", // Blue
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
  ];

  // Pen sizes
  const penSizes = [
    { value: 2, label: "Thin" },
    { value: 3, label: "Normal" },
    { value: 5, label: "Medium" },
    { value: 8, label: "Thick" },
    { value: 12, label: "Very Thick" },
  ];

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Set canvas size
        canvas.width = 800;
        canvas.height = 600;
        
        // Fill with dark background
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Set initial drawing properties
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        setContext(ctx);
        saveToHistory(ctx);
      }
    }
  }, [isOpen]);

  const saveToHistory = (ctx: CanvasRenderingContext2D) => {
    if (!canvasRef.current) return;
    
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    
    // Limit history to 20 steps
    if (newHistory.length > 20) {
      newHistory.shift();
    } else {
      setHistoryStep(historyStep + 1);
    }
    
    setHistory(newHistory);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!context || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !context || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (drawingState.mode === "pen") {
      context.strokeStyle = drawingState.color;
      context.lineWidth = drawingState.lineWidth;
    } else {
      // Eraser mode - draw with background color
      context.strokeStyle = "#1a1a2e";
      context.lineWidth = drawingState.lineWidth * 3; // Eraser is wider
    }
    
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (context) {
      context.closePath();
      saveToHistory(context);
    }
  };

  const undo = () => {
    if (historyStep > 0 && context && canvasRef.current) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      context.putImageData(history[newStep], 0, 0);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1 && context && canvasRef.current) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      context.putImageData(history[newStep], 0, 0);
    }
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    context.fillStyle = "#1a1a2e";
    context.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory(context);
  };

  const saveAsImage = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `rough-work-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "y" || (e.shiftKey && e.key === "z")) {
        e.preventDefault();
        redo();
      }
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen, historyStep, history]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-2xl border-4 border-purple-400/50 max-w-5xl w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b-2 border-purple-400/30">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📝</span>
              <div>
                <h2 className="text-2xl font-bold text-white">Rough Work</h2>
                <p className="text-sm text-gray-300">Draw, calculate, and brainstorm</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-purple-700/50"
            >
              <span className="text-2xl">✕</span>
            </button>
          </div>

          {/* Toolbar */}
          <div className="p-4 border-b-2 border-purple-400/30 bg-purple-900/50">
            <div className="flex flex-wrap items-center gap-4">
              {/* Drawing Mode */}
              <div className="flex gap-2">
                <button
                  onClick={() => setDrawingState({ ...drawingState, mode: "pen" })}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    drawingState.mode === "pen"
                      ? "bg-blue-500 text-white shadow-lg"
                      : "bg-purple-800/60 text-gray-300 hover:bg-purple-700"
                  }`}
                >
                  ✏️ Pen
                </button>
                <button
                  onClick={() => setDrawingState({ ...drawingState, mode: "eraser" })}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    drawingState.mode === "eraser"
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-purple-800/60 text-gray-300 hover:bg-purple-700"
                  }`}
                >
                  🧹 Eraser
                </button>
              </div>

              {/* Color Picker */}
              {drawingState.mode === "pen" && (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-gray-300 font-medium">Color:</span>
                  <div className="flex gap-1">
                    {colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setDrawingState({ ...drawingState, color })}
                        className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                          drawingState.color === color
                            ? "border-yellow-400 ring-2 ring-yellow-400/50"
                            : "border-gray-600"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pen Size */}
              <div className="flex gap-2 items-center">
                <span className="text-sm text-gray-300 font-medium">Size:</span>
                <div className="flex gap-1">
                  {penSizes.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setDrawingState({ ...drawingState, lineWidth: size.value })}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        drawingState.lineWidth === size.value
                          ? "bg-green-500 text-white"
                          : "bg-purple-800/60 text-gray-300 hover:bg-purple-700"
                      }`}
                      title={size.label}
                    >
                      {size.value}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 ml-auto">
                <button
                  onClick={undo}
                  disabled={historyStep <= 0}
                  className="px-3 py-2 rounded-lg bg-purple-800/60 text-white font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Undo (Ctrl+Z)"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyStep >= history.length - 1}
                  className="px-3 py-2 rounded-lg bg-purple-800/60 text-white font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Redo (Ctrl+Y)"
                >
                  ↷ Redo
                </button>
                <button
                  onClick={clearCanvas}
                  className="px-3 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition-all"
                >
                  🗑️ Clear
                </button>
                <button
                  onClick={saveAsImage}
                  className="px-3 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-500 transition-all"
                >
                  💾 Save
                </button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="p-4 flex items-center justify-center bg-gradient-to-br from-purple-900/50 to-indigo-900/50">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="border-4 border-purple-400/50 rounded-lg shadow-2xl cursor-crosshair bg-[#1a1a2e]"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>

          {/* Footer */}
          <div className="p-3 border-t-2 border-purple-400/30 bg-purple-900/50">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <div className="flex items-center gap-4">
                <span>💡 Tip: Use this space to work through problems</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="opacity-60">Ctrl+Z: Undo</span>
                <span className="opacity-60">Ctrl+Y: Redo</span>
                <span className="opacity-60">ESC: Close</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
