import { useEffect, useRef } from "react";

/** The survey-map backdrop: wobbly elevation rings around an off-center summit. */
export default function Contours() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth;
      const h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = getComputedStyle(cv).getPropertyValue("--contour").trim();
      const cx = w * 0.76;
      const cy = h * 0.46;
      for (let r = 18; r < Math.max(w, h) * 1.1; r += 22) {
        ctx.lineWidth = (r / 22) % 5 < 1 ? 1.6 : 0.8;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.05) {
          const k = r * (1 + 0.08 * Math.sin(a * 3 + r * 0.013) + 0.05 * Math.cos(a * 5 - r * 0.02));
          const x = cx + Math.cos(a) * k * 1.15;
          const y = cy + Math.sin(a) * k * 0.85;
          if (a === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };
    draw();
    const dark = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("resize", draw);
    dark.addEventListener("change", draw);
    return () => {
      window.removeEventListener("resize", draw);
      dark.removeEventListener("change", draw);
    };
  }, []);

  return <canvas ref={ref} className="contours" aria-hidden="true" />;
}
