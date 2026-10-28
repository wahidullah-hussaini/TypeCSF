/* ResultsChart - net WPM (solid), raw WPM (dashed) and per-second mistakes for one run. */
import { useEffect, useRef } from 'react';
import { clamp } from '../../lib/core.js';
import { useTranslation } from '../../i18n/index.jsx';
import { useStore } from '../../context/StoreContext.jsx';

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';

function rgba(color, alpha) {
  const m = String(color).trim();
  if (m[0] === '#') {
    let hex = m.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const v = parseInt(hex, 16);
    if (!Number.isNaN(v)) return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${alpha})`;
  }
  return `rgba(45,212,191,${alpha})`;
}

export default function ResultsChart({ samples }) {
  const { t, n } = useTranslation();
  const { resolvedTheme } = useStore();
  const canvas = useRef(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return undefined;
    const draw = () => {
      const ctx = cv.getContext('2d');
      if (!ctx || !cv.parentElement) return;
      const width = Math.max(280, cv.parentElement.clientWidth || 600);
      const height = 190;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(width * dpr); cv.height = Math.round(height * dpr);
      cv.style.width = width + 'px'; cv.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const pad = { l: 40, r: 12, t: 14, b: 24 };
      const plotW = width - pad.l - pad.r, plotH = height - pad.t - pad.b;
      const data = samples.length ? samples : [{ t: 1, raw: 0, wpm: 0, err: 0 }];
      const maxV = Math.max(10, Math.ceil(Math.max(...data.map((s) => Math.max(s.raw, s.wpm))) / 10) * 10);
      const line = cssVar('--line'), faint = cssVar('--text-faint'), accent = cssVar('--accent'), wrong = cssVar('--wrong');
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.font = '11px ui-monospace, monospace'; ctx.fillStyle = faint;
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      for (let g = 0; g <= 4; g++) {
        const y = pad.t + plotH - (g / 4) * plotH;
        ctx.beginPath(); ctx.moveTo(pad.l, Math.round(y) + 0.5); ctx.lineTo(pad.l + plotW, Math.round(y) + 0.5); ctx.stroke();
        ctx.fillText(n(Math.round((maxV / 4) * g)), pad.l - 8, y);
      }
      const len = data.length;
      const xAt = (i) => (len <= 1 ? pad.l + plotW / 2 : pad.l + (i / (len - 1)) * plotW);
      const yAt = (v) => pad.t + plotH - clamp(v / maxV, 0, 1) * plotH;
      const maxErr = Math.max(1, ...data.map((s) => s.err));
      ctx.fillStyle = wrong;
      data.forEach((s, i) => { if (!s.err) return; const h = clamp((s.err / maxErr) * 22, 3, 24); ctx.globalAlpha = 0.5; ctx.fillRect(xAt(i) - 1.5, pad.t + plotH - h, 3, h); ctx.globalAlpha = 1; });
      const path = (key) => { ctx.beginPath(); data.forEach((s, i) => (i ? ctx.lineTo(xAt(i), yAt(s[key])) : ctx.moveTo(xAt(i), yAt(s[key])))); };
      path('wpm'); ctx.lineTo(xAt(len - 1), pad.t + plotH); ctx.lineTo(xAt(0), pad.t + plotH); ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + plotH);
      grad.addColorStop(0, rgba(accent, 0.28)); grad.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = grad; ctx.fill();
      ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      path('raw'); ctx.strokeStyle = faint; ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
      path('wpm'); ctx.strokeStyle = accent; ctx.stroke();
      ctx.beginPath(); ctx.arc(xAt(len - 1), yAt(data[len - 1].wpm), 3.4, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillStyle = faint;
      const step = Math.max(1, Math.ceil(len / 8));
      data.forEach((s, i) => { if (i % step === 0 || i === len - 1) ctx.fillText(n(s.t) + t('units.secShort'), xAt(i), pad.t + plotH + 7); });
    };
    draw();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(draw) : null;
    if (ro && cv.parentElement) ro.observe(cv.parentElement);
    return () => ro && ro.disconnect();
  }, [samples, resolvedTheme, t, n]);

  return (
    <div className="mt-4" dir="ltr">
      <canvas ref={canvas} role="img" aria-label={t('results.chart') + '. ' + t('results.chartDesc')} className="block max-w-full" />
    </div>
  );
}
