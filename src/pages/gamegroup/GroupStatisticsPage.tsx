import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Box, Button, CircularProgress, Container, Grid, Typography, FormControl, InputLabel, Select, MenuItem, Chip} from '@mui/material';
import {ArrowBack, Person} from '@mui/icons-material';

// Firebase
import {onValue, ref} from 'firebase/database';
import {firebaseDB as db} from '../../firebase/firebase-config';
import {useAuth} from '../../firebase/AuthContext';

// Types
import {GameGroup} from '../../model/GameGroup';
import {ChartData, PlayerStats} from './types/statistics.types';

// Utils
import {calculatePlayerStats, processGroupData} from './utils/statistics.utils';

// Components
import PlayerStatsCard from './components/PlayerStatsCard';
import StatisticsChart from './components/StatisticsChart';
import CashSharePieChart from './components/CashSharePieChart';

const GroupStatisticsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useAuth();
  const [group, setGroup] = useState<GameGroup | null>(null);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Handle group data loading and processing
  const loadGroupData = useCallback(async () => {
    if (!groupId) {
      setError('Keine Gruppen-ID angegeben');
      setLoading(false);
      return;
    }

    setLoading(true);
    const groupRef = ref(db, `gameGroups/${groupId}`);
    
    const unsubscribe = onValue(
      groupRef, 
      async (snapshot) => {
        try {
          const groupData = snapshot.val();
          if (groupData) {
            const processedGroup = processGroupData(groupId, groupData);
            setGroup(processedGroup);
            
            if (processedGroup) {
              const stats = await calculatePlayerStats(processedGroup);
              setPlayerStats(stats);
              
              // Set default selected player to current user if available
              if (currentUser && !selectedPlayerId) {
                const currentUserInGroup = stats.find(stat => stat.id === currentUser.uid);
                if (currentUserInGroup) {
                  setSelectedPlayerId(currentUserInGroup.id);
                } else if (stats.length > 0) {
                  setSelectedPlayerId(stats[0].id);
                }
              }
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
    loadGroupData();
  }, [loadGroupData]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // Handle player selection
  const handlePlayerSelect = useCallback((playerId: string) => {
    setSelectedPlayerId(playerId);
  }, []);

  // Get selected player stats
  const selectedPlayerStats = useMemo(() => {
    return playerStats.find(stat => stat.id === selectedPlayerId);
  }, [playerStats, selectedPlayerId]);

  // Filter chart data for selected player only
  const selectedPlayerWinLossData = useMemo(() => {
    if (!selectedPlayerStats) return [];
    return [{
      name: selectedPlayerStats.name.split(' ')[0],
      'Gewonnen': selectedPlayerStats.roundsWon || 0,
      'Verloren': selectedPlayerStats.roundsLost || 0
    }];
  }, [selectedPlayerStats]);

  const selectedPlayerAveragePointsData = useMemo(() => {
    if (!selectedPlayerStats || selectedPlayerStats.gamesPlayed === 0) return [];
    return [{
      name: selectedPlayerStats.name.split(' ')[0],
      'Durchschnittliche Punkte': parseFloat(selectedPlayerStats.averagePointsPerGame.toFixed(2))
    }];
  }, [selectedPlayerStats]);

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

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
      <Box my={{ xs: 2, sm: 4 }}>
        <Box mb={{ xs: 2, sm: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            {group.name} - Statistiken
          </Typography>
        </Box>

        {/* Player Selector */}
        {playerStats.length > 0 && (
          <Box mb={{ xs: 2, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="player-select-label">Spieler auswählen</InputLabel>
              <Select
                labelId="player-select-label"
                value={selectedPlayerId}
                label="Spieler auswählen"
                onChange={(e) => handlePlayerSelect(e.target.value)}
                startAdornment={<Person sx={{ mr: 1, color: 'action.active' }} />}
              >
                {playerStats.map((player) => (
                  <MenuItem key={player.id} value={player.id}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                      <Typography variant="body2">{player.name}</Typography>
                      {currentUser && player.id === currentUser.uid && (
                        <Chip 
                          label="Du" 
                          size="small" 
                          color="primary" 
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}

        
        
        {/* Selected Player Stats */}
        {selectedPlayerStats && (
          <Grid container spacing={{ xs: 2, sm: 3 }} mb={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} sm={6} md={4}>
              <PlayerStatsCard player={selectedPlayerStats} />
            </Grid>
          </Grid>
        )}

        
        
        {/* Charts Section */}
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          
          {/* Group Comparison Charts */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Gruppenvergleich
            </Typography>
          </Grid>
          
          {/* Group Rounds Chart */}
          <Grid item xs={12}>
            <StatisticsChart 
              title="Rundenstatistik (alle Spieler)"
              data={winLossData}
              series={[
                { key: 'Gewonnen', name: 'Gewonnene Runden', color: '#4caf50' },
                { key: 'Verloren', name: 'Verlorene Runden', color: '#f44336' }
              ]}
              formatter={(value) => `${value} Runden`}
            />
          </Grid>

          {/* Group Average Points Chart */}
          <Grid item xs={12} sm={6}>
            <StatisticsChart 
              title="Durchschnittliche Punkte pro Spiel (alle Spieler)"
              data={averagePointsData}
              series={{
                key: 'Durchschnittliche Punkte',
                name: 'Durchschnittliche Punkte',
                color: '#2196f3'
              }}
              formatter={(value) => `${value} Punkte`}
            />
          </Grid>

          {/* Cash Share Pie Chart */}
          <Grid item xs={12} sm={6}>
            <CashSharePieChart 
              players={playerStats}
              title="Anteil an der Kasse"
            />
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default GroupStatisticsPage;
