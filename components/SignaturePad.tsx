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
    if (!ctx || !canvas) return;

    let currentX, currentY;
    if (e instanceof MouseEvent) {
      currentX = e.offsetX;
      currentY = e.offsetY;
    } else {
      const rect = canvas.getBoundingClientRect();
      const touch = (e as TouchEvent).touches[0];
      currentX = touch.clientX - rect.left;
      currentY = touch.clientY - rect.top;
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
        const touch = (e as TouchEvent).touches[0];
        currentX = touch.clientX - rect.left;
        currentY = touch.clientY - rect.top;
    }
    [lastX.current, lastY.current] = [currentX, currentY];
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get the content box dimensions
        const { width, height } = entry.contentRect;
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate required buffer size based on DPR (physical pixels)
        const requiredWidth = Math.floor(width * dpr);
        const requiredHeight = Math.floor(height * dpr);

        // Only resize if the buffer size doesn't match the required size
        if (canvas.width !== requiredWidth || canvas.height !== requiredHeight) {
          // 1. Save existing signature
          const savedData = canvas.toDataURL();

          // 2. Resize the canvas buffer
          canvas.width = requiredWidth;
          canvas.height = requiredHeight;

          // 3. Scale context to match DPR so drawing coordinates correspond to CSS pixels
          ctx.scale(dpr, dpr);

          // 4. Restore drawing settings (context reset on resize)
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.strokeStyle = '#000000';

          // 5. Restore the signature image
          if (savedData && savedData !== 'data:,') {
             const img = new Image();
             img.onload = () => {
               // Draw image to fit the logical dimensions (CSS pixels)
               ctx.drawImage(img, 0, 0, width, height);
             };
             img.src = savedData;
          }
        }
      }
    });

    resizeObserver.observe(canvas);

    // Event Listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    // Passive: false is required to prevent scrolling while signing on some touch devices
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      resizeObserver.disconnect();
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
      ctx.save();
      // Reset transform to clear the entire physical canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
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
    // Returns the high-resolution image
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
      style={{ touchAction: 'none' }} 
    />
  );
});

export default SignaturePad;