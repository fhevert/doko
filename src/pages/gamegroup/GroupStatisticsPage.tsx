import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Grid, Card, CardContent, Divider, Button } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Game } from '../../model/Game';
import { Round } from '../../model/Round';
import { GameGroup } from '../../model/GameGroup';
import { Player } from '../../model/Player';
import { auth, firebaseDB as db } from '../../firebase/firebase-config';
import { ref, onValue } from 'firebase/database';
import { ArrowBack } from '@mui/icons-material';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface PlayerStats {
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

const GroupStatisticsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [group, setGroup] = useState<GameGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId) return;

    const groupRef = ref(db, `gameGroups/${groupId}`);
    
    const unsubscribe = onValue(groupRef, (snapshot) => {
      const groupData = snapshot.val();
      if (groupData) {
        // Process games data
        let games: Game[] = [];
        if (Array.isArray(groupData.games)) {
          games = groupData.games.filter((g: Game) => g).map((game: any) => ({
            ...game,
            date: game.date ? new Date(game.date) : new Date(),
            rounds: Array.isArray(game.rounds) ? game.rounds : []
          }));
        } else if (groupData.games && typeof groupData.games === 'object') {
          games = Object.entries(groupData.games)
            .filter(([_, game]) => game)
            .map(([id, game]: [string, any]) => ({
              ...game,
              id,
              date: game.date ? new Date(game.date) : new Date(),
              rounds: Array.isArray(game.rounds) ? game.rounds : []
            }));
        }

        const processedGroup: GameGroup = {
          ...groupData,
          id: groupId || '',
          name: groupData.name || 'Unbenannte Gruppe',
          games: games,
          players: groupData.players || [],
          createdBy: groupData.createdBy || '',
          createdAt: groupData.createdAt || '',
          updatedAt: groupData.updatedAt || new Date().toISOString()
        };

        setGroup(processedGroup);
        calculateStats(processedGroup);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading group data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  const calculateStats = (groupData: GameGroup) => {
    if (!groupData.players || !groupData.games) return;

    const statsMap = new Map<string, PlayerStats>();
    const allGameParticipants = new Set<string>(); // Track all players who participated in any game
    const allGameWinners = new Set<string>(); // Track all game winners across all games

    // Initialize player stats
    groupData.players.forEach((player: Player) => {
      if (player) {
        statsMap.set(player.id, {
          id: player.id,
          name: `${player.firstname || ''} ${player.name || ''}`.trim() || `Spieler ${player.id}`,
          totalPoints: 0,
          roundsPlayed: 0,
          gamesPlayed: 0,
          gamesWon: 0,
          gamesLost: 0,
          roundsWon: 0,
          roundsLost: 0,
          averagePointsPerGame: 0,
          averagePointsPerRound: 0
        });
      }
    });

    const gamePoints = new Map<string, number>(); // Track points per player across all games
    
    // Process each game
    groupData.games.forEach(game => {
      if (!game.rounds || game.rounds.length === 0) return;

      const gameParticipants = new Set<string>();
      const currentGameWinners = new Set<string>();
      const currentGameLosers = new Set<string>();
      const gameRoundPoints = new Map<string, number>(); // Points for current game only
      
      // Process each round to collect points and track round wins/losses
      game.rounds.forEach((round: Round) => {
        if (!round.results) return;

        // Process round results
        const processResult = (playerId: string, result: number) => {
          const points = result === 2 ? 1 : 0; // 1 = win (0 points), 2 = loss (1 point)
          gameParticipants.add(playerId);
          allGameParticipants.add(playerId);
          
          // Update points for this game
          gameRoundPoints.set(playerId, (gameRoundPoints.get(playerId) || 0) + points);
          
          // Track if player won or lost this round
          if (points === 0) {
            currentGameWinners.add(playerId);
          } else {
            currentGameLosers.add(playerId);
          }
          
          // Update round statistics
          const playerStat = statsMap.get(playerId);
          if (playerStat) {
            statsMap.set(playerId, {
              ...playerStat,
              roundsPlayed: playerStat.roundsPlayed + 1,
              roundsWon: playerStat.roundsWon + (points === 0 ? 1 : 0),
              roundsLost: playerStat.roundsLost + (points > 0 ? 1 : 0),
              totalPoints: playerStat.totalPoints + points
            });
          }
          
          // Track points for this game
          gamePoints.set(playerId, (gamePoints.get(playerId) || 0) + points);
        };

        if (Array.isArray(round.results)) {
          round.results.forEach((result: { key: string | number, value: number }) => {
            if (result?.key !== undefined && result.value !== undefined) {
              processResult(result.key.toString(), result.value);
            }
          });
        } else if (round.results && typeof round.results === 'object') {
          Object.entries(round.results).forEach(([playerId, result]) => {
            if (typeof result === 'number') {
              processResult(playerId, result);
            }
          });
        }
      });
      
      // After processing all rounds in a game, determine the game winner (player with most points in this game)
      let minPoints = Infinity;
      let gameWinners: string[] = [];
      
      gameRoundPoints.forEach((points, playerId) => {
        if (points < minPoints) {
          minPoints = points;
          gameWinners = [playerId];
        } else if (points === minPoints) {
          gameWinners.push(playerId);
        }
      });
      
      // Add the winners to the global winners set
      gameWinners.forEach(winner => allGameWinners.add(winner));
      
      // Update games played count for all participants
      gameParticipants.forEach(playerId => {
        const playerStat = statsMap.get(playerId);
        if (playerStat) {
          const isWinner = gameWinners.includes(playerId);
          statsMap.set(playerId, {
            ...playerStat,
            gamesPlayed: playerStat.gamesPlayed + 1,
            gamesWon: playerStat.gamesWon + (isWinner ? 1 : 0),
            gamesLost: playerStat.gamesLost + (isWinner ? 0 : 1)
          });
        }
      });
    });

    // After processing all games, update player statistics
    Array.from(allGameParticipants).forEach(playerId => {
      const playerStat = statsMap.get(playerId);
      if (playerStat) {
        const totalPoints = playerStat.totalPoints;
        const gamesPlayed = playerStat.gamesPlayed;
        const roundsPlayed = playerStat.roundsPlayed;
        const roundsWon = playerStat.roundsWon;
        const roundsLost = playerStat.roundsLost;
        statsMap.set(playerId, {
          ...playerStat,
          roundsPlayed,
          roundsWon,
          roundsLost,
          averagePointsPerGame: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
          averagePointsPerRound: roundsPlayed > 0 ? totalPoints / roundsPlayed : 0
        });
      }
    });
    
    // Calculate averages
    statsMap.forEach((stat, playerId) => {
      if (stat.roundsPlayed > 0) {
        statsMap.set(playerId, {
          ...stat,
          averagePointsPerRound: stat.totalPoints / stat.roundsPlayed,
          averagePointsPerGame: stat.gamesPlayed > 0 ? stat.totalPoints / stat.gamesPlayed : 0
        });
      }
    });

    setPlayerStats(Array.from(statsMap.values()));
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <Typography>Lade Statistiken...</Typography>
        </Box>
      </Container>
    );
  }

  if (!group) {
    return (
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h5">Gruppe nicht gefunden</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
          >
            Zurück
          </Button>
        </Box>
      </Container>
    );
  }

  const gamesPlayedData = playerStats.map(stat => ({
    name: stat.name.split(' ')[0],
    'Gespielte Spiele': stat.gamesPlayed || 0
  }));

  const averagePointsData = playerStats
    .filter(stat => stat.gamesPlayed > 0)
    .map(stat => ({
      name: stat.name.split(' ')[0],
      'Durchschnittliche Punkte': parseFloat(stat.averagePointsPerGame.toFixed(2))
    }));

  const totalRounds = playerStats.reduce((sum, stat) => sum + stat.roundsPlayed, 0);

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" alignItems="center" mb={4}>
          <Button 
            variant="outlined" 
            onClick={() => navigate(-1)}
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Zurück
          </Button>
          <Typography variant="h4" component="h1">
            {group?.name || 'Gruppe'} - Statistiken
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Player Stats Cards */}
          {playerStats.map((stat) => (
            <Grid item xs={12} sm={6} md={4} key={stat.id}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{stat.name}</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Runden gespielt:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.roundsPlayed}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Gespielte Spiele:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.gamesPlayed}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Gewonnene Spiele:</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {stat.gamesWon || 0}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Gewinnrate (Spiele):</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.gamesPlayed > 0 
                        ? `${((stat.gamesWon / stat.gamesPlayed) * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Durchschnittl. Punkte/Spiel:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.gamesPlayed > 0 ? (stat.totalPoints / stat.gamesPlayed).toFixed(2) : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Durchschnittl. Punkte/Runde:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.roundsPlayed > 0 ? stat.averagePointsPerRound.toFixed(2) : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Games Played Statistics */}
        <Grid container spacing={3} mt={2}>
          {/* Games Played Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom align="center">
                Gespielte Spiele
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={gamesPlayedData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | string | undefined) => [`${value} Spiele`, '']}
                    labelFormatter={(label) => `Spieler: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="Gespielte Spiele" name="Gespielte Spiele" fill="#2196f3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Average Points Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom align="center">
                Durchschnittliche Punkte pro Spiel
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={averagePointsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | string | undefined) => [`${value ?? 0} Punkte`, 'Durchschnitt']}
                    labelFormatter={(label) => `Spieler: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="Durchschnittliche Punkte"
                    name="Durchschnittliche Punkte pro Spiel"
                    fill="#2196f3"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Rounds Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom align="center">
                Verteilung der Runden
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={playerStats.map(stat => ({
                    name: stat.name.split(' ')[0],
                    'Gewonnen': stat.roundsWon,
                    'Verloren': stat.roundsLost,
                    'Gesamt': stat.roundsPlayed
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number | undefined, name: string | undefined) => {
                      if (value === undefined) return [''].filter(Boolean) as [string];
                      if (name === 'Gesamt') {
                        return [`${value} Runden insgesamt`];
                      }
                      return [`${value} ${name?.toLowerCase() ?? ''}e Runden`];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Gewonnen" name="Gewonnene Runden" stackId="a" fill="#4caf50" />
                  <Bar dataKey="Verloren" name="Verlorene Runden" stackId="a" fill="#f44336" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default GroupStatisticsPage;
