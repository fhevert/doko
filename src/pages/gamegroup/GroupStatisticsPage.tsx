import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Grid, Button, CircularProgress } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';

// Firebase
import { ref, onValue } from 'firebase/database';
import { firebaseDB as db } from '../../firebase/firebase-config';

// Types
import { GameGroup } from '../../model/GameGroup';
import { PlayerStats, ChartData } from './types/statistics.types';

// Utils
import { calculatePlayerStats, processGroupData } from './utils/statistics.utils';

// Components
import PlayerStatsCard from './components/PlayerStatsCard';
import StatisticsChart from './components/StatisticsChart';

const GroupStatisticsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<GameGroup | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle group data loading and processing
  const loadGroupData = useCallback(() => {
    if (!groupId) {
      setError('Keine Gruppen-ID angegeben');
      setLoading(false);
      return;
    }

    setLoading(true);
    const groupRef = ref(db, `gameGroups/${groupId}`);
    
    const unsubscribe = onValue(
      groupRef, 
      (snapshot) => {
        try {
          const groupData = snapshot.val();
          if (groupData) {
            const processedGroup = processGroupData(groupId, groupData);
            setGroup(processedGroup);
            
            if (processedGroup) {
              const stats = calculatePlayerStats(processedGroup);
              setPlayerStats(stats);
            }
          }
          setError(null);
        } catch (err) {
          console.error('Error processing group data:', err);
          setError('Fehler beim Verarbeiten der Gruppendaten');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error loading group data:', error);
        setError('Fehler beim Laden der Gruppendaten');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [groupId]);

  // Load group data on component mount
  useEffect(() => {
    const unsubscribe = loadGroupData();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadGroupData]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Prepare chart data
  const winLossData: ChartData[] = useMemo(() => {
    return playerStats.map(stat => ({
      name: stat.name.split(' ')[0],
      'Gewonnen': stat.roundsWon || 0,
      'Verloren': stat.roundsLost || 0
    }));
  }, [playerStats]);

  const averagePointsData: ChartData[] = React.useMemo(() => {
    return playerStats
      .filter(stat => stat.gamesPlayed > 0)
      .map(stat => ({
        name: stat.name.split(' ')[0],
        'Durchschnittliche Punkte': parseFloat(stat.averagePointsPerGame.toFixed(2))
      }));
  }, [playerStats]);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Box textAlign="center">
            <CircularProgress />
            <Typography variant="body1" mt={2}>Lade Statistiken...</Typography>
          </Box>
        </Box>
      </Container>
    );
  }

  if (error || !group) {
    return (
      <Container maxWidth="lg">
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Gruppe nicht gefunden'}
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Zurück
          </Button>
        </Box>
      </Container>
    );
  }

  const totalRounds = playerStats.reduce((sum, stat) => sum + stat.roundsPlayed, 0);

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" alignItems="center" mb={4}>
          <Button 
            variant="outlined" 
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          <Typography variant="h4" component="h1">
            {group.name} - Statistiken
          </Typography>
        </Box>

        {/* Player Stats Grid */}
        <Grid container spacing={3}>
          {playerStats.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.id}>
              <PlayerStatsCard player={stat} />
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} mt={2}>
          {/* Won Rounds Chart */}
          <Grid item xs={12} md={6}>
            <StatisticsChart 
              title="Gewonnene Runden"
              data={winLossData}
              dataKey="Gewonnen"
              color="#4caf50"
              formatter={(value) => `${value} Runden`}
            />
          </Grid>

          {/* Lost Rounds Chart */}
          <Grid item xs={12} md={6}>
            <StatisticsChart 
              title="Verlorene Runden"
              data={winLossData}
              dataKey="Verloren"
              color="#f44336"
              formatter={(value) => `${value} Runden`}
            />
          </Grid>

          {/* Average Points Chart */}
          <Grid item xs={12}>
            <StatisticsChart 
              title="Durchschnittliche Punkte pro Spiel"
              data={averagePointsData}
              dataKey="Durchschnittliche Punkte"
              color="#2196f3"
              formatter={(value) => `${value} Punkte`}
            />
          </Grid>
        </Grid>

        {/* Summary */}
        <Box mt={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Insgesamt {totalRounds} Runden in {group.games?.length || 0} Spielen gespielt
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default GroupStatisticsPage;
