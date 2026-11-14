
'use client';
import React, { useRef, useEffect } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream;
  isMicOn: boolean;
}

export function AudioVisualizer({ stream, isMicOn }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!stream || !canvasRef.current || !isMicOn) {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 32;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barHeight = (canvas.height / bufferLength) * 1.5;
      let barWidth;
      let y = canvas.height;

      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();

      for (let i = 0; i < bufferLength; i++) {
        const barValue = dataArray[i];
        barWidth = barValue / 4;
        
        const blueIntensity = Math.min(255, (barValue / 200) * 255);
        ctx.fillStyle = `hsl(${primaryColor} / ${0.5 + blueIntensity / 510})`;

        if (barValue > 200) {
            ctx.fillStyle = `rgb(0, 0, ${blueIntensity})`;
        }

        ctx.fillRect(0, y, barWidth, barHeight);

        y -= barHeight + 1;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [stream, isMicOn]);

  return <canvas ref={canvasRef} width="15" height="30" />;
}
