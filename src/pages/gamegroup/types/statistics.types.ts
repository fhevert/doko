import { GameGroup } from '../../../model/GameGroup';
import { Player } from '../../../model/Player';

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
  averagePointsPerRound: number;
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

export interface StatisticsChartProps {
  title: string;
  data: ChartData[];
  dataKey: string;
  color: string;
  formatter?: (value: number | string) => string;
}
