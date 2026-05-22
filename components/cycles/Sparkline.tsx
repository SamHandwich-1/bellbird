import { tokens } from '@/lib/tokens';

type Point = { date: string; value: number | null };

export type SparklineProps = {
  data: readonly Point[];
  width?: number;
  height?: number;
  stroke?: string;
  // Optional vertical markers for historical analogs (e.g. 1968, 2000, 2007).
  markers?: ReadonlyArray<{ date: string; label?: string }>;
};

export function Sparkline({
  data,
  width = 200,
  height = 36,
  stroke = tokens.ink,
  markers,
}: SparklineProps) {
  const valid = data.filter((d): d is { date: string; value: number } => d.value !== null);
  if (valid.length < 2) {
    return (
      <svg width={width} height={height} aria-hidden="true">
        <line
          x1={0}
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke={tokens.hairline}
          strokeWidth={1}
          strokeDasharray="2 3"
        />
      </svg>
    );
  }

  const xs = valid.map((d) => Date.parse(d.date));
  const ys = valid.map((d) => d.value);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const xRange = Math.max(xMax - xMin, 1);
  const yRange = Math.max(yMax - yMin, 1e-9);

  const padX = 1;
  const padY = 2;
  const projectX = (t: number) =>
    padX + ((t - xMin) / xRange) * (width - padX * 2);
  const projectY = (v: number) =>
    height - padY - ((v - yMin) / yRange) * (height - padY * 2);

  const path = valid
    .map((d, i) => {
      const x = projectX(Date.parse(d.date));
      const y = projectY(d.value);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const lastX = projectX(Date.parse(valid[valid.length - 1].date));
  const lastY = projectY(valid[valid.length - 1].value);

  return (
    <svg width={width} height={height} aria-hidden="true">
      {markers?.map((m) => {
        const t = Date.parse(m.date);
        if (Number.isNaN(t) || t < xMin || t > xMax) return null;
        const x = projectX(t);
        return (
          <line
            key={m.date}
            x1={x}
            y1={padY}
            x2={x}
            y2={height - padY}
            stroke={tokens.fade}
            strokeWidth={1}
            strokeDasharray="1 2"
          />
        );
      })}
      <path d={path} fill="none" stroke={stroke} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={1.8} fill={stroke} />
    </svg>
  );
}
