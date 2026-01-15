import React from 'react';
import {Box, Card, CardContent, Divider, Typography} from '@mui/material';
import {PlayerStats} from '../types/statistics.types';

interface StatItemProps {
  label: string;
  value: React.ReactNode;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => (
  <Box display="flex" justifyContent="space-between" mb={1}>
    <Typography variant="body2">{label}:</Typography>
    <Typography 
      variant="body2" 
      fontWeight="bold"
      sx={{ color: color || 'inherit' }}
    >
      {value}
    </Typography>
  </Box>
);

interface PlayerStatsCardProps {
  player: PlayerStats;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ player }) => (
  <Card elevation={3}>
    <CardContent>
      <Typography variant="h6" gutterBottom>{player.name}</Typography>
      <Divider sx={{ mb: 2 }} />

        <StatItem
            label="Spiele gespielt"
            value={player.gamesPlayed}
        />

      <StatItem 
        label="Runden gespielt" 
        value={player.roundsPlayed} 
      />
      
      <StatItem 
        label="Runden gewonnen" 
        value={player.roundsWon || 0} 
        color="success.main"
      />
      
      <StatItem 
        label="Runden verloren" 
        value={player.roundsLost || 0} 
        color="error.main"
      />
      
      <StatItem 
        label="Gewinnrate (Runden)" 
        value={
          player.roundsPlayed > 0 
            ? `${((player.roundsWon / player.roundsPlayed) * 100).toFixed(1)}%` 
            : 'N/A'
        } 
      />

        <StatItem
            label="Gesamtpunkte"
            value={player.totalPoints}
        />

      <StatItem 
        label="Durchschnittl. Punkte/Spiel" 
        value={
          player.gamesPlayed > 0 
            ? player.averagePointsPerGame.toFixed(2) 
            : 'N/A'
        } 
      />
      
      <StatItem 
        label="Durchschnittl. Punkte/Runde" 
        value={
          player.roundsPlayed > 0 
            ? player.averagePointsPerRound.toFixed(2) 
            : 'N/A'
        } 
      />
    </CardContent>
  </Card>
);

export default PlayerStatsCard;
