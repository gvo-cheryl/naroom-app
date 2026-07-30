import Svg, { Circle, Defs, LinearGradient, Polygon, Rect, Stop } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

export interface RibbonDay {
  date: string;
  energy: number | null;
  hasRecord: boolean;
}

const WIDTH = 318;
const HEIGHT = 104;
const MID = HEIGHT / 2;
const PAD = 10;

function halfHeight(energy: number): number {
  return 3 + (energy / 100) * 11;
}

// 프로토타입 ribbon() 대응 — 시그니처 시각화. 점수 막대가 아니라 두께가 변하는 띠로 에너지 흐름을
// 표현하고, 기록이 없는 날은 0이 아니라 끊긴 자리(점)로 비워 둔다.
export function EnergyRibbon({ days }: { days: RibbonDay[] }) {
  const theme = useTheme();
  const step = (WIDTH - PAD * 2) / Math.max(days.length - 1, 1);

  const segments: React.ReactNode[] = [];
  const gapDots: React.ReactNode[] = [];
  const recordDots: React.ReactNode[] = [];
  let seg: { index: number; energy: number }[] = [];

  const flush = () => {
    if (seg.length === 0) {
      return;
    }
    if (seg.length === 1) {
      const point = seg[0];
      const x = PAD + point.index * step;
      const h = halfHeight(point.energy);
      segments.push(
        <Rect key={`seg-${point.index}`} x={x - 3} y={MID - h} width={6} height={h * 2} rx={3} fill="url(#energyGradient)" />,
      );
    } else {
      const top = seg.map((point) => `${PAD + point.index * step},${MID - halfHeight(point.energy)}`).join(' ');
      const bottom = [...seg]
        .reverse()
        .map((point) => `${PAD + point.index * step},${MID + halfHeight(point.energy)}`)
        .join(' ');
      segments.push(<Polygon key={`seg-${seg[0].index}`} points={`${top} ${bottom}`} fill="url(#energyGradient)" />);
    }
    seg = [];
  };

  days.forEach((day, index) => {
    if (day.energy == null) {
      flush();
      gapDots.push(<Circle key={`gap-${index}`} cx={PAD + index * step} cy={MID} r={1.6} fill={theme.border} />);
    } else {
      seg.push({ index, energy: day.energy });
    }
    if (day.hasRecord) {
      recordDots.push(<Circle key={`rec-${index}`} cx={PAD + index * step} cy={HEIGHT - 6} r={2.4} fill={theme.slate} />);
    }
  });
  flush();

  return (
    <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
      <Defs>
        <LinearGradient id="energyGradient" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%" stopColor={theme.slate} stopOpacity={0.55} />
          <Stop offset="100%" stopColor={theme.moss} stopOpacity={0.85} />
        </LinearGradient>
      </Defs>
      {segments}
      {gapDots}
      {recordDots}
    </Svg>
  );
}
