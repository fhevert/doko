import {GameGroup} from '../../../model/GameGroup';

export interface PlayerStats {
  id: string;
  name: string;
  totalPoints: number;
  roundsPlayed: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  roundsWon: number;
  roundsLost: number;
  averagePointsPerGame: number;
  cashShare: number;
}

export interface ChartData {
  name: string;
  [key: string]: string | number;
}

export interface GroupStatisticsProps {
  group: GameGroup | null;
  loading: boolean;
  onBack: () => void;
}

export interface PlayerStatsCardProps {
  player: PlayerStats;
}

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

export interface StatisticsChartProps {
  title: string;
  data: ChartData[];
  series: ChartSeries | ChartSeries[];
  formatter?: (value: number | string) => string;
}
