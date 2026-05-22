import { tokens } from '@/lib/tokens';
import { stageRotation } from './stage-rotation';

export function StageRotationMap() {
  return (
    <div>
      <div
        className="font-sans text-[10px] tracking-[0.22em] uppercase mb-4"
        style={{ color: tokens.whisper }}
      >
        Cycle stage rotation map
      </div>
      <div className="space-y-2">
        {stageRotation.map((s) => (
          <p
            key={s.stage}
            className="font-serif text-[15px] leading-[1.6] italic"
            style={{ fontWeight: 340, color: tokens.ash, maxWidth: '62ch' }}
          >
            <span style={{ color: tokens.ink, fontStyle: 'normal' }}>
              Stage {s.stage} ({s.label}):
            </span>{' '}
            {s.items.join(' · ')}
          </p>
        ))}
      </div>
      <p
        className="font-sans text-[10px] mt-4 italic"
        style={{ color: tokens.fade, maxWidth: '62ch' }}
      >
        Editorial copy — edit components/cycles/stage-rotation.tsx when your rotation view shifts.
      </p>
    </div>
  );
}
