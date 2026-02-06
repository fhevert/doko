import {GameGroup} from '../../../model/GameGroup';
import {Game} from '../../../model/Game';
import {Round} from '../../../model/Round';
import {PlayerStats} from '../types/statistics.types';

const initializePlayerStats = (players: any[]): Map<string, PlayerStats> => {
  const statsMap = new Map<string, PlayerStats>();
  
  players.forEach((player) => {
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
      cashShare: 0,
    });
  });
  
  return statsMap;
};

const processRoundResults = (round: Round, gameParticipants: Set<string>, gameRoundPoints: Map<string, number>, statsMap: Map<string, PlayerStats>) => {
  if (!round.results) return;

  const processResult = (playerId: string, result: number) => {
    const isWinner = result === 1;
    const isLoser = result === 2;

    let points = 0;
    if (isLoser) {
      points = round.roundPoints * round.multiplier;
    } else if (isWinner) {
      points = round.cowardicePoints * round.multiplier;
    }

    gameParticipants.add(playerId);
    gameRoundPoints.set(playerId, (gameRoundPoints.get(playerId) || 0) + points);
    
    const playerStat = statsMap.get(playerId);
    if (playerStat) {
      const hasPlayed = isWinner || isLoser;
      statsMap.set(playerId, {
        ...playerStat,
        roundsPlayed: playerStat.roundsPlayed + (hasPlayed ? 1 : 0),
        roundsWon: playerStat.roundsWon + (isWinner ? 1 : 0),
        roundsLost: playerStat.roundsLost + (isLoser ? 1 : 0),
        totalPoints: playerStat.totalPoints + points,
      });
    }
  };

  const roundResults = new Map<string, number>();
  
  const collectResults = (results: any) => {
    if (Array.isArray(results)) {
      results.forEach((result: { key: string | number; value: number }) => {
        if (result?.key !== undefined && result.value !== undefined) {
          roundResults.set(result.key.toString(), result.value);
        }
      });
    } else if (results && typeof results === 'object') {
      Object.entries(results).forEach(([playerId, result]) => {
        if (typeof result === 'number') {
          roundResults.set(playerId, result);
        }
      });
    }
  };
  
  collectResults(round.results);
  
  roundResults.forEach((result, playerId) => {
    processResult(playerId, result);
  });
};

const determineGameWinners = (gameRoundPoints: Map<string, number>): string[] => {
  return Array.from(gameRoundPoints.entries())
    .sort((a, b) => a[1] - b[1])
    .filter(([_playerId, points], _index, arr) => points === arr[0][1])
    .map(([playerId]) => playerId);
};

const updateGameStatistics = (
  game: Game, 
  gameParticipants: Set<string>, 
  gameWinners: string[], 
  averageGamePoints: number, 
  statsMap: Map<string, PlayerStats>,
  groupPlayers: any[]
) => {
  // Update statistics for participants (they get gamesPlayed++)
  gameParticipants.forEach((playerId) => {
    const playerStat = statsMap.get(playerId);
    if (playerStat) {
      const playerInGame = game.players.find(p => p.id === playerId);
      const isActiveInGame = playerInGame?.aktiv === true;
      
      if (isActiveInGame) {
        const isWinner = gameWinners.includes(playerId);
        statsMap.set(playerId, {
          ...playerStat,
          gamesPlayed: playerStat.gamesPlayed + 1,
          gamesWon: playerStat.gamesWon + (isWinner ? 1 : 0),
          gamesLost: playerStat.gamesLost + (isWinner ? 0 : 1),
        });
      }
    }
  });

  // Give average points to group players who are not present in this game at all
  groupPlayers.forEach((groupPlayer) => {
    if (!groupPlayer) return;
    
    const playerStat = statsMap.get(groupPlayer.id);
    const playerInGame = game.players.find(p => p.id === groupPlayer.id);
    
    // Player is in group but not in this game at all
    if (playerStat && (!playerInGame || playerInGame?.aktiv === false)) {
      statsMap.set(groupPlayer.id, {
        ...playerStat,
        totalPoints: playerStat.totalPoints + averageGamePoints,
        // gamesPlayed is NOT incremented here!
      });
    }
  });
};

export const calculatePlayerStats = (groupData: GameGroup): PlayerStats[] => {
  if (!groupData.players?.length || !groupData.games?.length) {
    return [];
  }

  const statsMap = initializePlayerStats(groupData.players);
  const allGameWinners = new Set<string>();

  // Process each game
  groupData.games.forEach((game) => {
    if (!game.rounds?.length) return;

    const gameParticipants = new Set<string>();
    const gameRoundPoints = new Map<string, number>();
    
    // Process all rounds in the game
    game.rounds.forEach((round: Round) => {
      processRoundResults(round, gameParticipants, gameRoundPoints, statsMap);
    });

    // Determine game winners and calculate averages
    const gameWinners = determineGameWinners(gameRoundPoints);
    gameWinners.forEach((winner) => allGameWinners.add(winner));

    const participatingPlayers = Array.from(gameRoundPoints.keys());
    const totalGamePoints = Array.from(gameRoundPoints.values()).reduce((sum, points) => sum + points, 0);
    const averageGamePoints = participatingPlayers.length > 0 ? totalGamePoints / participatingPlayers.length : 0;

    // Update game statistics
    updateGameStatistics(game, gameParticipants, gameWinners, averageGamePoints, statsMap, groupData.players);
  });

  // Calculate final averages
  const totalGroupGames = groupData.games.length;
  const groupGameTotal = totalGroupGames * 5;
  
  return Array.from(statsMap.values()).map((stat) => {
    const avgPointsPerGame = stat.gamesPlayed > 0 ? Math.round((stat.totalPoints / stat.gamesPlayed) * 10) / 10 : 0;
    const avgPointsPerRound = stat.roundsPlayed > 0 ? Math.round((stat.totalPoints / stat.roundsPlayed) * 10) / 10 : 0;
    const cashShare = groupGameTotal + (stat.totalPoints * 0.1);
    
    return {
      ...stat,
      totalPoints: Math.round(stat.totalPoints * 10) / 10, // Round to 1 decimal place
      averagePointsPerGame: avgPointsPerGame,
      averagePointsPerRound: avgPointsPerRound,
      cashShare: Math.round(cashShare * 100) / 100, // Round to 2 decimal places for money
    };
  });
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
