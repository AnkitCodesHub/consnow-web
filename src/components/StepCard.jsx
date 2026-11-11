import { Eye } from './Icons';

const R = 75, C = 80;                 // arc radius / centre inside the 160 px canvas
const ARC_LEN = R * (240 * Math.PI / 180);
const pt = (deg) => [C + R * Math.cos(deg * Math.PI / 180), C + R * Math.sin(deg * Math.PI / 180)];
const [sx, sy] = pt(150), [ex, ey] = pt(390);
const ARC = `M${sx},${sy} A${R},${R} 0 1 1 ${ex},${ey}`;

/** ui/components/Stepcard.kt — 240° progress arc to a 10,000 step goal, steps + distance. */
export default function StepCard({ stepCount = 0, isActive = false, name = null, goalSteps = 10000, strideMeters = 0.71, watchersHint = false }) {
  const progress = Math.min(1, Math.max(0, stepCount / goalSteps));
  const meters = Math.round(stepCount * strideMeters);
  const distance = meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
  const [dx, dy] = pt(150 + 240 * progress);

  return (
    <div className={`step-card ${isActive ? 'active' : ''}`}>
      <svg className="arc" width="160" height="160" viewBox="0 0 160 160" aria-hidden="true">
        <path d={ARC} className="arc-track" />
        <path d={ARC} className="arc-progress" style={{ strokeDasharray: ARC_LEN, strokeDashoffset: ARC_LEN * (1 - progress) }} />
        {isActive && progress > 0.01 && <circle className="arc-glow" cx={dx} cy={dy} r="15" />}
      </svg>
      <div className="step-center">
        {name && <div className="step-name">{name}</div>}
        <div className="step-count">{stepCount.toLocaleString()}</div>
        <div className="step-distance">{distance}</div>
      </div>
      {watchersHint && <span className="eye-hint"><Eye size={22} opacity={0.45} /></span>}
    </div>
  );
}
