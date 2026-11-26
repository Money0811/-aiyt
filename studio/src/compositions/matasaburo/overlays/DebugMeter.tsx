import React from 'react';
import { useCurrentFrame } from 'remotion';
import {
  LIP_SYNC_FULL,
  LIP_SYNC_GATE,
  VOCAL_OFFSET_FRAMES,
} from '../constants';

export interface DebugMeterProps {
  level: number;
  raw: number;
  bassPulse: number;
}

export const DebugMeter: React.FC<DebugMeterProps> = ({
  level,
  raw,
  bassPulse,
}) => {
  const frame = useCurrentFrame();

  return (
    <div
      style={{
        position: 'absolute',
        top: 28,
        left: 28,
        width: 340,
        padding: '14px 18px',
        borderRadius: 12,
        backgroundColor: 'rgba(10, 18, 30, 0.82)',
        border: '1px solid rgba(255, 255, 255, 0.22)',
        color: '#F4F7FA',
        fontFamily: 'monospace',
        fontSize: 16,
        lineHeight: 1.45,
        zIndex: 999,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontWeight: 700, color: '#FFD25A', marginBottom: 6 }}>
        LIP-SYNC DEBUG (f={frame})
      </div>
      <div>
        level: <strong>{level.toFixed(4)}</strong> | raw: {raw.toFixed(5)}
      </div>
      <div
        style={{
          marginTop: 6,
          marginBottom: 8,
          height: 14,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.14)',
          borderRadius: 7,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.round(level * 100)}%`,
            backgroundColor:
              level > 0.5 ? '#7BC67B' : level > 0.25 ? '#FFD25A' : '#8A9BAE',
          }}
        />
      </div>
      <div style={{ fontSize: 13, color: '#B9C8D9' }}>
        offset={VOCAL_OFFSET_FRAMES}f | gate={LIP_SYNC_GATE} | full=
        {LIP_SYNC_FULL}
      </div>
      <div style={{ fontSize: 13, color: '#B9C8D9' }}>
        bassPulse={bassPulse.toFixed(3)}
      </div>
    </div>
  );
};
