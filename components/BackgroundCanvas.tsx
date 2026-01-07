import React, { useRef, useEffect, useState } from 'react';
import { CanvasElement } from '../types';

interface BackgroundCanvasProps {
  elements: CanvasElement[];
  isEditing: boolean;
  onElementsChange: (elements: CanvasElement[]) => void;
  userId: string;
  userColor: string;
  brushSize: number;
  brushColor: string;
}

export const BackgroundCanvas: React.FC<BackgroundCanvasProps> = ({
  elements,
  isEditing,
  onElementsChange,
  userId,
  userColor,
  brushSize,
  brushColor
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{x: number, y: number}[]>([]);

  const getPos = (e: any) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    if (!isEditing) return;
    setIsDrawing(true);
    const pos = getPos(e);
    setCurrentPath([pos]);
  };

  const draw = (e: any) => {
    if (!isDrawing || !isEditing) return;
    const pos = getPos(e);
    setCurrentPath(prev => [...prev, pos]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath.length > 1) {
      const newElement: CanvasElement = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'path',
        x: 0,
        y: 0,
        color: brushColor,
        brushSize: brushSize,
        points: currentPath,
        authorId: userId
      };
      onElementsChange([...elements, newElement]);
    }
    setCurrentPath([]);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    elements.forEach(el => {
      if (el.type === 'path' && el.points) {
        ctx.strokeStyle = el.color || '#000';
        ctx.lineWidth = el.brushSize || 3;
        ctx.beginPath();
        el.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.font = 'bold 24px Inter';
        ctx.fillStyle = el.color || '#000';
        ctx.fillText(el.content || '', el.x, el.y);
      } else if (el.type === 'image' && el.content) {
        const img = new Image();
        img.src = el.content;
        img.onload = () => {
           ctx.drawImage(img, el.x, el.y, el.width || 150, el.height || 150);
        };
      }
    });

    if (currentPath.length > 0) {
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.beginPath();
      currentPath.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    }

    return () => window.removeEventListener('resize', resize);
  }, [elements, currentPath, brushColor, brushSize]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className={`w-full h-full ${isEditing ? 'pointer-events-auto cursor-crosshair' : ''}`}
      />
    </div>
  );
};