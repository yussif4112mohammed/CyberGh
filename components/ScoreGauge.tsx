'use client';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'lg';
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#2E7D32'; // green
  if (score >= 60) return '#F57C00'; // amber
  if (score >= 40) return '#E65100'; // orange
  return '#C8102E'; // red
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  if (score >= 40) return 'Poor';
  return 'Critical';
}

export default function ScoreGauge({ score, size = 'lg' }: ScoreGaugeProps) {
  const isLg = size === 'lg';
  const dim = isLg ? 160 : 80;
  const strokeWidth = isLg ? 12 : 7;
  const r = (dim / 2) - strokeWidth;
  const circumference = 2 * Math.PI * r;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          {/* Background track */}
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none" stroke="#E8EDF5" strokeWidth={strokeWidth}
          />
          {/* Score arc */}
          <circle
            cx={dim / 2} cy={dim / 2} r={r}
            fill="none" stroke={color} strokeWidth={strokeWidth}
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-display font-bold leading-none ${isLg ? 'text-4xl' : 'text-xl'}`}
            style={{ color }}
          >
            {score}
          </span>
          {isLg && <span className="text-xs text-gray-500 mt-0.5">/ 100</span>}
        </div>
      </div>
      <span
        className={`font-semibold ${isLg ? 'text-base' : 'text-xs'}`}
        style={{ color }}
      >
        {label}
      </span>
    </div>
  );
}
