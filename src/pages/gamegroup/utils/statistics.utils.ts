import { GameGroup } from '../../../model/GameGroup';
import { Game } from '../../../model/Game';
import { Round } from '../../../model/Round';
import { PlayerStats } from '../types/statistics.types';

export const calculatePlayerStats = (groupData: GameGroup): PlayerStats[] => {
  if (!groupData.players?.length || !groupData.games?.length) {
    return [];
  }

  const statsMap = new Map<string, PlayerStats>();
  const allGameParticipants = new Set<string>();
  const allGameWinners = new Set<string>();

  // Initialize player stats
  groupData.players.forEach((player) => {
    if (!player) return;
    
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
      averagePointsPerRound: 0,
    });
  });

  const gamePoints = new Map<string, number>();

  // Process each game
  groupData.games.forEach((game) => {
    if (!game.rounds?.length) return;

    const gameParticipants = new Set<string>();
    const gameRoundPoints = new Map<string, number>();
    const roundWinners = new Set<string>();
    
    // Process each round
    game.rounds.forEach((round: Round) => {
      if (!round.results) return;

      const processResult = (playerId: string, result: number) => {
        const points = result === 2 ? 1 : 0; // 1 = win (0 points), 2 = loss (1 point)
        gameParticipants.add(playerId);
        allGameParticipants.add(playerId);
        
        gameRoundPoints.set(playerId, (gameRoundPoints.get(playerId) || 0) + points);
        
        if (points === 0) {
          roundWinners.add(playerId);
        }
        
        const playerStat = statsMap.get(playerId);
        if (playerStat) {
          statsMap.set(playerId, {
            ...playerStat,
            roundsPlayed: playerStat.roundsPlayed + 1,
            roundsWon: playerStat.roundsWon + (points === 0 ? 1 : 0),
            roundsLost: playerStat.roundsLost + (points > 0 ? 1 : 0),
            totalPoints: playerStat.totalPoints + points,
          });
        }
        
        gamePoints.set(playerId, (gamePoints.get(playerId) || 0) + points);
      };

      if (Array.isArray(round.results)) {
        round.results.forEach((result: { key: string | number; value: number }) => {
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

    // Determine game winners (players with minimum points)
    const gameWinners = Array.from(gameRoundPoints.entries())
      .sort((a, b) => a[1] - b[1])
      .filter(([_playerId, points], _index, arr) => points === arr[0][1])
      .map(([playerId]) => playerId);

    gameWinners.forEach((winner) => allGameWinners.add(winner));

    // Update games played count for all participants
    gameParticipants.forEach((playerId) => {
      const playerStat = statsMap.get(playerId);
      if (playerStat) {
        const isWinner = gameWinners.includes(playerId);
        statsMap.set(playerId, {
          ...playerStat,
          gamesPlayed: playerStat.gamesPlayed + 1,
          gamesWon: playerStat.gamesWon + (isWinner ? 1 : 0),
          gamesLost: playerStat.gamesLost + (isWinner ? 0 : 1),
        });
      }
    });
  });

  // Calculate averages
  return Array.from(statsMap.values()).map((stat) => ({
    ...stat,
    averagePointsPerGame: stat.gamesPlayed > 0 ? stat.totalPoints / stat.gamesPlayed : 0,
    averagePointsPerRound: stat.roundsPlayed > 0 ? stat.totalPoints / stat.roundsPlayed : 0,
  }));
};

export const processGroupData = (groupId: string, groupData: any): GameGroup | null => {
  if (!groupData) return null;

  let games: Game[] = [];
  
  if (Array.isArray(groupData.games)) {
    games = groupData.games
      .filter(Boolean)
      .map((game: any) => ({
        ...game,
        date: game.date ? new Date(game.date) : new Date(),
        rounds: Array.isArray(game.rounds) ? game.rounds : [],
      }));
  } else if (groupData.games && typeof groupData.games === 'object') {
    games = Object.entries(groupData.games)
      .filter(([_, game]) => game)
      .map(([id, game]: [string, any]) => ({
        ...game,
        id,
        date: game.date ? new Date(game.date) : new Date(),
        rounds: Array.isArray(game.rounds) ? game.rounds : [],
      }));
  }

  return {
    ...groupData,
    id: groupId,
    name: groupData.name || 'Unbenannte Gruppe',
    games,
    players: groupData.players || [],
    createdBy: groupData.createdBy || '',
    createdAt: groupData.createdAt || '',
    updatedAt: groupData.updatedAt || new Date().toISOString(),
  };
};
