import React, { useRef, useEffect, useState } from 'react';
import { getMediaUrl } from '../services/api';

const CCTVCanvas = ({
  cameraId = 'CAM-01',
  sector = 'Sector A',
  streamType = 'optical',
  videoUrl = '',
  detections = [],
  showOverlay = true,
  status = 'ONLINE',
  isReplayMode = false,
  replayTimeSeconds = 15,
  movementDirection = 'NORTH_EAST',
  directionDescription = 'Moving towards restricted zone',
  riskScore = 85,
  currentStage = 'STAGE_1_NORMAL', // STAGE_1_NORMAL, STAGE_2_APPROACH, STAGE_3_PERIMETER, STAGE_4_INTRUSION
  normalZone = { x: 0.05, y: 0.35, w: 0.28, h: 0.50, label: 'Normal Base Activity Area' },
  warningZone = { x: 0.35, y: 0.30, w: 0.25, h: 0.55, label: 'Approach Warning Zone' },
  perimeterLine = { x1: 0.62, y1: 0.20, x2: 0.62, y2: 0.90, label: 'Perimeter Defense Fence' },
  restrictedZone = { x: 0.65, y: 0.25, w: 0.32, h: 0.65, label: 'Red Restricted Exclusion Zone' }
}) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const animFrameRef = useRef(null);
  const targetsRef = useRef([]);
  const [videoLoaded, setVideoLoaded] = useState(false);

  useEffect(() => {
    if (detections && detections.length > 0) {
      targetsRef.current = detections.map((d, idx) => ({
        id: idx,
        type: d.object_type || 'PERSON',
        conf: d.confidence || 92.5,
        stage: d.stage || 'STAGE_1_NORMAL',
        x: (d.bbox?.x || 0.4) * 480,
        y: (d.bbox?.y || 0.35) * 270,
        w: (d.bbox?.w || 0.15) * 480,
        h: (d.bbox?.h || 0.3) * 270,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.4,
        direction: d.movement_direction || movementDirection
      }));
    } else {
      if (isReplayMode) {
        const progress = Math.min(45, Math.max(0, replayTimeSeconds)) / 45;
        const startX = 60;
        const endX = 350;
        const currentX = startX + progress * (endX - startX);
        const currentY = 135 - Math.sin(progress * Math.PI) * 20;

        targetsRef.current = [
          {
            id: 101,
            type: riskScore >= 80 ? 'INTRUDER' : 'PERSON',
            conf: 96.4,
            stage: progress > 0.6 ? 'STAGE_4_INTRUSION' : (progress > 0.4 ? 'STAGE_3_PERIMETER' : (progress > 0.2 ? 'STAGE_2_APPROACH' : 'STAGE_1_NORMAL')),
            x: currentX,
            y: currentY,
            w: 48,
            h: 92,
            vx: 0.6,
            vy: -0.2,
            direction: movementDirection
          }
        ];
      } else {
        if (cameraId === 'CAM-01') {
          targetsRef.current = [
            { id: 1, type: 'PERSON', conf: 96.4, stage: 'STAGE_1_NORMAL', x: 90, y: 110, w: 45, h: 90, vx: 0.4, vy: 0.1, direction: 'EAST' }
          ];
        } else if (cameraId === 'CAM-02') {
          targetsRef.current = [
            { id: 2, type: 'INTRUDER', conf: 96.4, stage: 'STAGE_4_INTRUSION', x: 330, y: 115, w: 48, h: 92, vx: 0.5, vy: -0.2, direction: 'NORTH_EAST' }
          ];
        } else if (cameraId === 'CAM-03') {
          targetsRef.current = [
            { id: 3, type: 'INTRUDER', conf: 94.8, stage: 'STAGE_4_INTRUSION', x: 320, y: 100, w: 45, h: 90, vx: 0.4, vy: 0.2, direction: 'SOUTH_EAST' },
            { id: 4, type: 'PERSON', conf: 91.2, stage: 'STAGE_4_INTRUSION', x: 375, y: 105, w: 42, h: 85, vx: 0.3, vy: -0.1, direction: 'SOUTH_EAST' }
          ];
        } else if (cameraId === 'CAM-04') {
          targetsRef.current = [
            { id: 5, type: 'VEHICLE', conf: 87.2, stage: 'STAGE_3_PERIMETER', x: 260, y: 130, w: 90, h: 60, vx: 0.0, vy: -0.3, direction: 'NORTH' }
          ];
        } else {
          targetsRef.current = [
            { id: 6, type: 'PERSON', conf: 88.0, stage: 'STAGE_1_NORMAL', x: 100, y: 120, w: 45, h: 90, vx: 0.3, vy: 0.0, direction: 'WEST' }
          ];
        }
      }
    }
  }, [cameraId, detections, isReplayMode, replayTimeSeconds, movementDirection, riskScore]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frameCount = 0;

    const render = () => {
      frameCount++;
      const width = canvas.width;
      const height = canvas.height;

      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Background terrain spectrum (only draw background if video is not actively rendering)
      if (!videoLoaded || !videoUrl) {
        if (streamType === 'thermal') {
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#0a0d14');
          grad.addColorStop(0.5, '#1e293b');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = '#2d3748';
          ctx.beginPath();
          ctx.moveTo(0, height * 0.6);
          ctx.bezierCurveTo(width * 0.3, height * 0.55, width * 0.7, height * 0.65, width, height * 0.58);
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.fill();
        } else if (streamType === 'night_vision' || streamType === 'infrared') {
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#04160a');
          grad.addColorStop(0.5, '#072412');
          grad.addColorStop(1, '#051a0d');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          ctx.fillStyle = '#0a381c';
          ctx.beginPath();
          ctx.moveTo(0, height * 0.62);
          ctx.bezierCurveTo(width * 0.25, height * 0.58, width * 0.75, height * 0.64, width, height * 0.6);
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.fill();
        } else {
          const grad = ctx.createLinearGradient(0, 0, 0, height);
          grad.addColorStop(0, '#0a1424');
          grad.addColorStop(0.6, '#13233a');
          grad.addColorStop(1, '#1b2d42');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, width, height);

          // Ground
          ctx.fillStyle = '#152438';
          ctx.beginPath();
          ctx.moveTo(0, height * 0.65);
          ctx.bezierCurveTo(width * 0.35, height * 0.6, width * 0.65, height * 0.7, width, height * 0.64);
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.fill();
        }
      }

      // 2. RENDER MULTI-TIER ZONES
      if (showOverlay) {
        // A. Stage 1: Normal Base Activity Zone (Emerald)
        if (normalZone) {
          const nzX = (normalZone.x || 0.05) * width;
          const nzY = (normalZone.y || 0.35) * height;
          const nzW = (normalZone.w || 0.28) * width;
          const nzH = (normalZone.h || 0.50) * height;

          ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
          ctx.fillRect(nzX, nzY, nzW, nzH);
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(nzX, nzY, nzW, nzH);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
          ctx.font = '7px "JetBrains Mono", monospace';
          ctx.fillText(`⯀ STAGE 1: ${normalZone.label || 'NORMAL ACTIVITY'}`, nzX + 4, nzY - 3);
        }

        // B. Stage 2: Warning Approach Zone (Amber)
        if (warningZone) {
          const wzX = (warningZone.x || 0.35) * width;
          const wzY = (warningZone.y || 0.30) * height;
          const wzW = (warningZone.w || 0.25) * width;
          const wzH = (warningZone.h || 0.55) * height;

          ctx.fillStyle = 'rgba(245, 158, 11, 0.06)';
          ctx.fillRect(wzX, wzY, wzW, wzH);
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 3]);
          ctx.strokeRect(wzX, wzY, wzW, wzH);
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.85)';
          ctx.font = '7px "JetBrains Mono", monospace';
          ctx.fillText(`⯀ STAGE 2: ${warningZone.label || 'APPROACH ZONE'}`, wzX + 4, wzY - 3);
        }

        // C. Stage 3: Perimeter Fence Line (Cyan)
        if (perimeterLine) {
          const fx1 = (perimeterLine.x1 || 0.62) * width;
          const fy1 = (perimeterLine.y1 || 0.20) * height;
          const fx2 = (perimeterLine.x2 || 0.62) * width;
          const fy2 = (perimeterLine.y2 || 0.90) * height;

          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2;
          ctx.setLineDash([8, 4]);
          ctx.beginPath();
          ctx.moveTo(fx1, fy1);
          ctx.lineTo(fx2, fy2);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 7px "JetBrains Mono", monospace';
          ctx.fillText(`│ ${perimeterLine.label || 'PERIMETER FENCE'}`, fx1 + 4, fy1 + 10);
        }

        // D. Stage 4: Restricted Red Exclusion Zone (Red Glow)
        if (restrictedZone) {
          const rzX = (restrictedZone.x || 0.65) * width;
          const rzY = (restrictedZone.y || 0.25) * height;
          const rzW = (restrictedZone.w || 0.32) * width;
          const rzH = (restrictedZone.h || 0.65) * height;

          ctx.fillStyle = 'rgba(239, 68, 68, 0.10)';
          ctx.fillRect(rzX, rzY, rzW, rzH);

          ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(rzX, rzY, rzW, rzH);

          const cLen = 10;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(rzX, rzY + cLen); ctx.lineTo(rzX, rzY); ctx.lineTo(rzX + cLen, rzY);
          ctx.moveTo(rzX + rzW - cLen, rzY); ctx.lineTo(rzX + rzW, rzY); ctx.lineTo(rzX + rzW, rzY + cLen);
          ctx.moveTo(rzX, rzY + rzH - cLen); ctx.lineTo(rzX, rzY + rzH); ctx.lineTo(rzX + cLen, rzY + rzH);
          ctx.moveTo(rzX + rzW - cLen, rzY + rzH); ctx.lineTo(rzX + rzW, rzY + rzH); ctx.lineTo(rzX + rzW, rzY + rzH - cLen);
          ctx.stroke();

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 8px "JetBrains Mono", monospace';
          ctx.fillText(`⯀ STAGE 4: ${restrictedZone.label || 'RED RESTRICTED EXCLUSION ZONE'}`, rzX + 4, rzY - 4);
        }
      }

      // 3. Render Targets & Movement Vectors (Only for synthetic streams / fallback)
      if (!videoLoaded || (!videoUrl?.includes('processed_') && detections.length === 0)) {
        targetsRef.current.forEach((t) => {
        if (!isReplayMode) {
          t.x += t.vx;
          t.y += t.vy;
          if (t.x < 30 || t.x > width - 100) t.vx *= -1;
          if (t.y < height * 0.38 || t.y > height * 0.68) t.vy *= -1;
        }

        const isThreat = t.stage === 'STAGE_4_INTRUSION' || riskScore >= 75;
        const isSuspicious = t.stage === 'STAGE_2_APPROACH' || t.stage === 'STAGE_3_PERIMETER';

        // Target Body (if no video background, render simulation silhouette)
        if (!videoLoaded || !videoUrl) {
          if (streamType === 'thermal') {
            ctx.fillStyle = isThreat ? '#ff3b30' : (isSuspicious ? '#fbbf24' : '#ffffff');
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.ellipse(t.x + t.w / 2, t.y + 15, 8, 10, 0, 0, Math.PI * 2);
            ctx.roundRect(t.x + 10, t.y + 25, t.w - 20, t.h - 30, 4);
            ctx.fill();
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = streamType === 'night_vision' ? '#041f0f' : '#070f1a';
            ctx.beginPath();
            ctx.ellipse(t.x + t.w / 2, t.y + 15, 7, 9, 0, 0, Math.PI * 2);
            ctx.roundRect(t.x + 10, t.y + 25, t.w - 20, t.h - 30, 3);
            ctx.fill();
          }
        }

        // Bounding Box & HUD
        if (showOverlay) {
          const boxColor = isThreat ? '#ef4444' : (isSuspicious ? '#f59e0b' : '#10b981');
          
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(t.x, t.y, t.w, t.h);

          // Corner Brackets
          const cL = 8;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(t.x, t.y + cL); ctx.lineTo(t.x, t.y); ctx.lineTo(t.x + cL, t.y);
          ctx.moveTo(t.x + t.w - cL, t.y); ctx.lineTo(t.x + t.w, t.y); ctx.lineTo(t.x + t.w, t.y + cL);
          ctx.moveTo(t.x, t.y + t.h - cL); ctx.lineTo(t.x, t.y + t.h); ctx.lineTo(t.x + cL, t.y + t.h);
          ctx.moveTo(t.x + t.w - cL, t.y + t.h); ctx.lineTo(t.x + t.w, t.y + t.h); ctx.lineTo(t.x + t.w, t.y + t.h - cL);
          ctx.stroke();

          // Header Badge
          ctx.fillStyle = boxColor;
          const stageBadge = t.stage === 'STAGE_4_INTRUSION' ? 'STAGE 4: INTRUSION' : (
            t.stage === 'STAGE_3_PERIMETER' ? 'STAGE 3: PERIMETER' : (
              t.stage === 'STAGE_2_APPROACH' ? 'STAGE 2: APPROACH' : 'STAGE 1: NORMAL'
            )
          );
          const labelText = `${t.type} ${t.conf}% [${stageBadge}]`;
          ctx.font = 'bold 8.5px "JetBrains Mono", monospace';
          const textMetrics = ctx.measureText(labelText);
          const badgeWidth = textMetrics.width + 10;
          
          ctx.fillRect(t.x, t.y - 16, badgeWidth, 16);
          ctx.fillStyle = '#000000';
          ctx.fillText(labelText, t.x + 5, t.y - 4);

          // Direction Vector
          const targetDir = t.direction || movementDirection;
          let angleRad = 0;
          if (targetDir === 'NORTH') angleRad = -Math.PI / 2;
          else if (targetDir === 'NORTH_EAST') angleRad = -Math.PI / 4;
          else if (targetDir === 'EAST') angleRad = 0;
          else if (targetDir === 'SOUTH_EAST') angleRad = Math.PI / 4;
          else if (targetDir === 'SOUTH') angleRad = Math.PI / 2;
          else if (targetDir === 'SOUTH_WEST') angleRad = (3 * Math.PI) / 4;
          else if (targetDir === 'WEST') angleRad = Math.PI;
          else if (targetDir === 'NORTH_WEST') angleRad = -(3 * Math.PI) / 4;

          const arrowOriginX = t.x + t.w / 2;
          const arrowOriginY = t.y + t.h / 2;
          const arrowLen = 26;
          const arrowEndX = arrowOriginX + Math.cos(angleRad) * arrowLen;
          const arrowEndY = arrowOriginY + Math.sin(angleRad) * arrowLen;

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(arrowOriginX, arrowOriginY);
          ctx.lineTo(arrowEndX, arrowEndY);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          const headLen = 6;
          ctx.beginPath();
          ctx.moveTo(arrowEndX, arrowEndY);
          ctx.lineTo(arrowEndX - headLen * Math.cos(angleRad - Math.PI / 6), arrowEndY - headLen * Math.sin(angleRad - Math.PI / 6));
          ctx.lineTo(arrowEndX - headLen * Math.cos(angleRad + Math.PI / 6), arrowEndY - headLen * Math.sin(angleRad + Math.PI / 6));
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(t.x, t.y + t.h + 3, badgeWidth, 14);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillText(`VECTOR: ${targetDir}`, t.x + 4, t.y + t.h + 13);
        }
      });
    }

      // 4. REPLAY HUD
      if (isReplayMode) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.fillRect(0, 0, width, 24);

        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`● 45s BUFFERED INCIDENT REPLAY: ${replayTimeSeconds.toFixed(1)}s / 45.0s`, 12, 16);

        let phaseText = '';
        if (replayTimeSeconds < 15) {
          phaseText = `STAGE 1/2: PRE-INTRUSION BUFFER (T-${(15 - replayTimeSeconds).toFixed(1)}s)`;
          ctx.fillStyle = '#10b981';
        } else if (replayTimeSeconds <= 18) {
          phaseText = `STAGE 4: ⚠️ RESTRICTED BOUNDARY BREACHED!`;
          ctx.fillStyle = '#ef4444';
        } else {
          phaseText = `STAGE 4: POST-BREACH TRACKING (T+${(replayTimeSeconds - 15).toFixed(1)}s)`;
          ctx.fillStyle = '#f59e0b';
        }
        ctx.fillText(phaseText, width - 310, 16);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [cameraId, sector, streamType, videoLoaded, videoUrl, showOverlay, status, isReplayMode, replayTimeSeconds, movementDirection, riskScore, normalZone, warningZone, perimeterLine, restrictedZone]);

  const resolvedVideoUrl = getMediaUrl(videoUrl);

  return (
    <div className="relative w-full h-full bg-[#050911] overflow-hidden">
      {resolvedVideoUrl && (
        <video
          ref={videoRef}
          src={resolvedVideoUrl}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoLoaded(false)}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}
      <canvas
        ref={canvasRef}
        width={480}
        height={270}
        className="relative z-10 w-full h-full object-cover"
      />
      <div className="absolute inset-0 cctv-scanlines pointer-events-none z-20"></div>
      <div className="absolute inset-0 cctv-vignette pointer-events-none z-20"></div>
    </div>
  );
};

export default CCTVCanvas;
