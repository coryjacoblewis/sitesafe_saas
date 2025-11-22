import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

const SignaturePad = forwardRef((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastX = useRef(0);
  const lastY = useRef(0);

  const getCanvasAndContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return { canvas: null, ctx: null };
    return { canvas, ctx: canvas.getContext('2d') };
  };

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current) return;
    const { canvas, ctx } = getCanvasAndContext();
    if (!ctx) return;

    let currentX, currentY;
    if (e instanceof MouseEvent) {
      currentX = e.offsetX;
      currentY = e.offsetY;
    } else {
      const rect = canvas!.getBoundingClientRect();
      currentX = e.touches[0].clientX - rect.left;
      currentY = e.touches[0].clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(lastX.current, lastY.current);
    ctx.lineTo(currentX, currentY);
    ctx.stroke();
    [lastX.current, lastY.current] = [currentX, currentY];
  };

  const startDrawing = (e: MouseEvent | TouchEvent) => {
    const { canvas } = getCanvasAndContext();
    if (!canvas) return;
    isDrawing.current = true;
    let currentX, currentY;
    if (e instanceof MouseEvent) {
        currentX = e.offsetX;
        currentY = e.offsetY;
    } else {
        const rect = canvas.getBoundingClientRect();
        currentX = e.touches[0].clientX - rect.left;
        currentY = e.touches[0].clientY - rect.top;
    }
    [lastX.current, lastY.current] = [currentX, currentY];
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  useEffect(() => {
    const { canvas, ctx } = getCanvasAndContext();
    if (!canvas || !ctx) return;
    
    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Set drawing styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Mouse events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Touch events
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, []);

  const clear = () => {
    const { canvas, ctx } = getCanvasAndContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  
  const isCanvasBlank = () => {
    const { canvas } = getCanvasAndContext();
    if (!canvas) return true;
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    return canvas.toDataURL() === blank.toDataURL();
  };

  const getSignature = () => {
    const { canvas } = getCanvasAndContext();
    if (!canvas || isCanvasBlank()) {
      return null;
    }
    return canvas.toDataURL('image/png');
  };

  useImperativeHandle(ref, () => ({
    clear,
    getSignature,
  }));

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-48 border border-gray-300 rounded-md bg-gray-50 touch-none"
    />
  );
});

export default SignaturePad;
