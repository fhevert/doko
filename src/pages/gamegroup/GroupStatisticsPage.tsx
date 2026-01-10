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
  gamesPlayed: number;
  wins: number;
  losses: number;
  averagePoints: number;
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

        const processedGroup = {
          ...groupData,
          id: groupId,
          games: games,
          players: groupData.players || []
        } as GameGroup;

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

    // Initialize player stats
    groupData.players.forEach((player: Player) => {
      statsMap.set(player.id, {
        id: player.id,
        name: `${player.firstname} ${player.name}`,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        averagePoints: 0
      });
    });

    // Process each game
    groupData.games.forEach(game => {
      if (!game.rounds || game.rounds.length === 0) return;

      // Track points per player for this game
      const gamePoints = new Map<string, number>();
      
      // Track which players participated in this game
      const participants = new Set<string>();
      
      // Process each round in the game
      game.rounds.forEach((round: Round) => {
        if (!round.results) return;

        if (Array.isArray(round.results)) {
          round.results.forEach((result: any) => {
            if (result && result.key && result.value !== undefined) {
              const playerId = result.key.toString();
              // 1 = win (0 points), 2 = loss (1 point)
              const points = result.value === 2 ? 1 : 0;
              gamePoints.set(
                playerId,
                (gamePoints.get(playerId) || 0) + points
              );
              participants.add(playerId);
            }
          });
        } else if (typeof round.results === 'object') {
          Object.entries(round.results).forEach(([playerId, result]) => {
            // 1 = win (0 points), 2 = loss (1 point)
            const points = result === 2 ? 1 : 0;
            gamePoints.set(
              playerId,
              (gamePoints.get(playerId) || 0) + points
            );
            participants.add(playerId);
          });
        }
      });
      
      // Calculate average points for this game
      let totalPoints = 0;
      let participantCount = 0;
      
      participants.forEach(playerId => {
        totalPoints += gamePoints.get(playerId) || 0;
        participantCount++;
      });
      
      const averagePoints = participantCount > 0 ? totalPoints / participantCount : 0;
      
      // Assign average points to non-participating players
      groupData.players.forEach((player: Player) => {
        if (!participants.has(player.id)) {
          gamePoints.set(player.id, averagePoints);
        }
      });

      // Update player stats based on game results
      const sortedPlayers = Array.from(gamePoints.entries())
        .sort((a, b) => a[1] - b[1]); // Sort by points ascending (lowest points first)

      if (sortedPlayers.length > 0) {
        const minPoints = sortedPlayers[0][1];
        const winners = sortedPlayers.filter(([_, points]) => points === minPoints);
        
        gamePoints.forEach((points, playerId) => {
          const playerStat = statsMap.get(playerId);
          if (!playerStat) return;

          const isWinner = winners.some(([id]) => id === playerId);
          
          statsMap.set(playerId, {
            ...playerStat,
            totalPoints: playerStat.totalPoints + points,
            gamesPlayed: playerStat.gamesPlayed + 1,
            wins: playerStat.wins + (isWinner ? 1 : 0),
            losses: playerStat.losses + (isWinner ? 0 : 1)
          });
        });
      }
    });

    // Calculate averages
    statsMap.forEach((stat, playerId) => {
      statsMap.set(playerId, {
        ...stat,
        averagePoints: stat.gamesPlayed > 0 ? stat.totalPoints / stat.gamesPlayed : 0
      });
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

  const winLossData = playerStats.map(stat => ({
    name: stat.name.split(' ')[0],
    Gewonnen: stat.wins,
    Verloren: stat.losses
  }));

  const averagePointsData = playerStats
    .filter(stat => stat.gamesPlayed > 0)
    .map(stat => ({
      name: stat.name.split(' ')[0],
      'Durchschnittliche Punkte': stat.averagePoints.toFixed(2)
    }));

  const totalGames = playerStats.reduce((max, stat) => Math.max(max, stat.gamesPlayed), 0);

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
            {group.name} - Statistiken
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Player Stats Cards */}
          {playerStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={stat.id}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{stat.name}</Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Spiele gespielt:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.gamesPlayed} / {totalGames}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Gewonnen:</Typography>
                    <Typography variant="body2" color="success.main" fontWeight="bold">
                      {stat.wins}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Verloren:</Typography>
                    <Typography variant="body2" color="error.main" fontWeight="bold">
                      {stat.losses}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2">Gewinnrate:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.gamesPlayed > 0 
                        ? `${((stat.wins / stat.gamesPlayed) * 100).toFixed(1)}%` 
                        : 'N/A'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Durchschnittliche Punkte:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {stat.averagePoints.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} mt={2}>
          {/* Win/Loss Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom align="center">
                Gewonnen vs. Verloren
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={winLossData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Gewonnen" fill="#4caf50" />
                  <Bar dataKey="Verloren" fill="#f44336" />
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
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="Durchschnittliche Punkte" 
                    fill="#2196f3" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Win/Loss Distribution Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom align="center">
                Gewinnverteilung
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={playerStats
                      .filter(stat => stat.wins > 0)
                      .map(stat => ({
                        name: stat.name.split(' ')[0],
                        value: stat.wins
                      }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name}: ${(percent ? percent * 100 : 0).toFixed(0)}%`
                    }
                  >
                    {playerStats
                      .filter(stat => stat.wins > 0)
                      .map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]} 
                        />
                      ))
                    }
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [
                    `${props.payload.name}: ${value} Siege`,
                    'Anzahl Siege'
                  ]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Games Played Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom align="center">
                Teilnahme an Spielen
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={playerStats.map(stat => ({
                    name: stat.name.split(' ')[0],
                    'Gesamte Spiele': totalGames,
                    'Teilgenommen': stat.gamesPlayed,
                    'Nicht teilgenommen': totalGames - stat.gamesPlayed
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  stackOffset="expand"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Teilgenommen" stackId="a" fill="#4caf50" />
                  <Bar dataKey="Nicht teilgenommen" stackId="a" fill="#e0e0e0" />
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
