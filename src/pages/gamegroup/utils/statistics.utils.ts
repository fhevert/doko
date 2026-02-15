import {GameGroup} from '../../../model/GameGroup';
import {Game} from '../../../model/Game';
import {PlayerStats} from '../types/statistics.types';
import PlayerDataService from '../../../services/PlayerDataService';

const PLAYER_RESULT = {
  WINNER: 1,
  LOSER: 2,
} as const;

// Hilfsfunktionen
const getPlayerName = (player: any): string => {
  return `${player.firstname || ''} ${player.name || ''}`.trim() || `Spieler ${player.id}`;
};

const normalizeRoundResults = (results: any): Map<string, number> => {
  const normalizedResults = new Map<string, number>();

  if (Array.isArray(results)) {
    results.forEach((result: { key: string | number; value: number }) => {
      if (result?.key !== undefined && result.value !== undefined) {
        normalizedResults.set(result.key.toString(), result.value);
      }
    });
  } else if (results && typeof results === 'object') {
    Object.entries(results).forEach(([playerId, result]) => {
      if (typeof result === 'number') {
        normalizedResults.set(playerId, result);
      }
    });
  }

  return normalizedResults;
};

const isPlayerActiveInGame = (game: Game, playerId: string): boolean => {
  const playerInGame = game.players.find(p => p.id === playerId);
  return playerInGame?.aktiv === true;
};

// Unabhängige Statistik-Methoden
export const calculateTotalPoints = (groupData: GameGroup): Map<string, number> => {
  const pointsMap = new Map<string, number>();

  if (!groupData.players?.length || !groupData.games?.length) {
    return pointsMap;
  }

  // Initialisiere mit 0 für alle Spieler
  groupData.players.forEach(player => {
    if (player) pointsMap.set(player.id, 0);
  });

  groupData.games.forEach(game => {
    if (!game.rounds?.length) return;

    const gameRoundPoints = new Map<string, number>();

    game.rounds.forEach(round => {
      if (!round.results) return;

      const normalizedResults = normalizeRoundResults(round.results);

      normalizedResults.forEach((result, playerId) => {
        if (isPlayerActiveInGame(game, playerId)){
          let points = 0;

          if (result === PLAYER_RESULT.LOSER) {
            points = round.roundPoints * round.multiplier;
          } else if (result === PLAYER_RESULT.WINNER) {
            points = round.cowardicePoints * round.multiplier;
          }

          gameRoundPoints.set(playerId, (gameRoundPoints.get(playerId) || 0) + points);
        }
      });
    });

    // Addiere Punkte für aktive Spieler
    gameRoundPoints.forEach((points, playerId) => {
      if (isPlayerActiveInGame(game, playerId)) {
        pointsMap.set(playerId, (pointsMap.get(playerId) || 0) + points);
      }
    });

    // Durchschnittspunkte für abwesende Spieler
    const participatingPlayers = Array.from(gameRoundPoints.keys());
    const totalGamePoints = Array.from(gameRoundPoints.values()).reduce((sum, points) => sum + points, 0);
    const averageGamePoints = participatingPlayers.length > 0 ? totalGamePoints / participatingPlayers.length : 0;

    groupData.players.forEach(player => {
      if (player && !isPlayerActiveInGame(game, player.id)) {
        pointsMap.set(player.id, (pointsMap.get(player.id) || 0) + averageGamePoints);
      }
    });
  });

  return pointsMap;
};

export const calculateRoundsPlayed = (groupData: GameGroup): Map<string, number> => {
  const roundsMap = new Map<string, number>();

  if (!groupData.players?.length || !groupData.games?.length) {
    return roundsMap;
  }

  // Initialisiere mit 0 für alle Spieler
  groupData.players.forEach(player => {
    if (player) roundsMap.set(player.id, 0);
  });

  groupData.games.forEach(game => {
    if (!game.rounds?.length) return;

    game.rounds.forEach(round => {
      if (!round.results) return;

      const normalizedResults = normalizeRoundResults(round.results);

      normalizedResults.forEach((result, playerId) => {
        if (result === PLAYER_RESULT.WINNER || result === PLAYER_RESULT.LOSER) {
          roundsMap.set(playerId, (roundsMap.get(playerId) || 0) + 1);
        }
      });
    });
  });

  return roundsMap;
};

export const calculateRoundsWon = (groupData: GameGroup): Map<string, number> => {
  const winsMap = new Map<string, number>();

  if (!groupData.players?.length || !groupData.games?.length) {
    return winsMap;
  }

  // Initialisiere mit 0 für alle Spieler
  groupData.players.forEach(player => {
    if (player) winsMap.set(player.id, 0);
  });

  groupData.games.forEach(game => {
    if (!game.rounds?.length) return;

    game.rounds.forEach(round => {
      if (!round.results) return;

      const normalizedResults = normalizeRoundResults(round.results);

      normalizedResults.forEach((result, playerId) => {
        if (result === PLAYER_RESULT.WINNER) {
          winsMap.set(playerId, (winsMap.get(playerId) || 0) + 1);
        }
      });
    });
  });

  return winsMap;
};

export const calculateRoundsLost = (groupData: GameGroup): Map<string, number> => {
  const lossesMap = new Map<string, number>();

  if (!groupData.players?.length || !groupData.games?.length) {
    return lossesMap;
  }

  // Initialisiere mit 0 für alle Spieler
  groupData.players.forEach(player => {
    if (player) lossesMap.set(player.id, 0);
  });

  groupData.games.forEach(game => {
    if (!game.rounds?.length) return;

    game.rounds.forEach(round => {
      if (!round.results) return;

      const normalizedResults = normalizeRoundResults(round.results);

      normalizedResults.forEach((result, playerId) => {
        if (result === PLAYER_RESULT.LOSER) {
          lossesMap.set(playerId, (lossesMap.get(playerId) || 0) + 1);
        }
      });
    });
  });

  return lossesMap;
};

export const calculateGamesPlayed = (groupData: GameGroup): Map<string, number> => {
  const gamesMap = new Map<string, number>();

  if (!groupData.players?.length || !groupData.games?.length) {
    return gamesMap;
  }

  // Initialisiere mit 0 für alle Spieler
  groupData.players.forEach(player => {
    if (player) gamesMap.set(player.id, 0);
  });

  groupData.games.forEach(game => {
    if (!game.rounds?.length) return;

    const gameParticipants = new Set<string>();

    game.rounds.forEach(round => {
      if (!round.results) return;

      const normalizedResults = normalizeRoundResults(round.results);

      normalizedResults.forEach((result, playerId) => {
        if (result === PLAYER_RESULT.WINNER || result === PLAYER_RESULT.LOSER) {
          gameParticipants.add(playerId);
        }
      });
    });

    // Zähle nur aktive Spieler
    gameParticipants.forEach(playerId => {
      if (isPlayerActiveInGame(game, playerId)) {
        gamesMap.set(playerId, (gamesMap.get(playerId) || 0) + 1);
      }
    });
  });

  return gamesMap;
};

export const calculateGamesWon = (groupData: GameGroup): Map<string, number> => {
  const winsMap = new Map<string, number>();

  if (!groupData.players?.length || !groupData.games?.length) {
    return winsMap;
  }

  // Initialisiere mit 0 für alle Spieler
  groupData.players.forEach(player => {
    if (player) winsMap.set(player.id, 0);
  });

  groupData.games.forEach(game => {
    if (!game.rounds?.length) return;

    const gameRoundPoints = new Map<string, number>();

    game.rounds.forEach(round => {
      if (!round.results) return;

      const normalizedResults = normalizeRoundResults(round.results);

      normalizedResults.forEach((result, playerId) => {
        let points = 0;

        if (result === PLAYER_RESULT.LOSER) {
          points = round.roundPoints * round.multiplier;
        } else if (result === PLAYER_RESULT.WINNER) {
          points = round.cowardicePoints * round.multiplier;
        }

        gameRoundPoints.set(playerId, (gameRoundPoints.get(playerId) || 0) + points);
      });
    });

    // Finde Gewinner (niedrigste Punktzahl)
    const sortedEntries = Array.from(gameRoundPoints.entries())
        .sort(([, pointsA], [, pointsB]) => pointsA - pointsB);

    if (sortedEntries.length > 0) {
      const lowestScore = sortedEntries[0][1];
      const winners = sortedEntries
          .filter(([, points]) => points === lowestScore)
          .map(([playerId]) => playerId);

      winners.forEach(winnerId => {
        if (isPlayerActiveInGame(game, winnerId)) {
          winsMap.set(winnerId, (winsMap.get(winnerId) || 0) + 1);
        }
      });
    }
  });

  return winsMap;
};

export const calculateGamesLost = (groupData: GameGroup): Map<string, number> => {
  const lossesMap = new Map<string, number>();

  if (!groupData.players?.length || !groupData.games?.length) {
    return lossesMap;
  }

  // Initialisiere mit 0 für alle Spieler
  groupData.players.forEach(player => {
    if (player) lossesMap.set(player.id, 0);
  });

  groupData.games.forEach(game => {
    if (!game.rounds?.length) return;

    const gameRoundPoints = new Map<string, number>();

    game.rounds.forEach(round => {
      if (!round.results) return;

      const normalizedResults = normalizeRoundResults(round.results);

      normalizedResults.forEach((result, playerId) => {
        let points = 0;

        if (result === PLAYER_RESULT.LOSER) {
          points = round.roundPoints * round.multiplier;
        } else if (result === PLAYER_RESULT.WINNER) {
          points = round.cowardicePoints * round.multiplier;
        }

        gameRoundPoints.set(playerId, (gameRoundPoints.get(playerId) || 0) + points);
      });
    });

    // Finde Gewinner (niedrigste Punktzahl)
    const sortedEntries = Array.from(gameRoundPoints.entries())
        .sort(([, pointsA], [, pointsB]) => pointsA - pointsB);

    if (sortedEntries.length > 0) {
      const lowestScore = sortedEntries[0][1];
      const winners = sortedEntries
          .filter(([, points]) => points === lowestScore)
          .map(([playerId]) => playerId);

      // Alle aktiven Spieler, die nicht gewonnen haben, haben verloren
      gameRoundPoints.forEach((points, playerId) => {
        if (isPlayerActiveInGame(game, playerId) && !winners.includes(playerId)) {
          lossesMap.set(playerId, (lossesMap.get(playerId) || 0) + 1);
        }
      });
    }
  });

  return lossesMap;
};

export const calculateAveragePointsPerGame = (groupData: GameGroup): Map<string, number> => {
  const totalPoints = calculateTotalPoints(groupData);
  const averagesMap = new Map<string, number>();

  totalPoints.forEach((points, playerId) => {
    const games = groupData.games.length;
    const average = games > 0 ? Math.round((points / games) * 10) / 10 : 0;
    averagesMap.set(playerId, average);
  });

  return averagesMap;
};

export const calculateCashShare = (groupData: GameGroup): Map<string, number> => {
  const totalPoints = calculateTotalPoints(groupData);
  const totalGroupGames = groupData.games?.length || 0;
  const cashMap = new Map<string, number>();

  totalPoints.forEach((points, playerId) => {
    const startFee = groupData.startFee || 0; // Verwende die dynamische Startgeb�hr, fallback auf 5�\n    const groupGameTotal = totalGroupGames * startFee;
    const groupGameTotal = totalGroupGames * startFee;
    const cashShare = groupGameTotal + (points * 0.1);
    cashMap.set(playerId, Math.round(cashShare * 100) / 100);
  });

  return cashMap;
};

// Hauptfunktion, die alle Statistiken kombiniert
export const calculatePlayerStats = async (groupData: GameGroup): Promise<PlayerStats[]> => {
  if (!groupData.players?.length || !groupData.games?.length) {
    return [];
  }

  // Lade vollständige Spielerdaten aus PlayerDataService (inkl. temporäre Spieler aus Firebase)
  const fullPlayers = await PlayerDataService.groupPlayersToFullPlayers(groupData.players);
  
  const totalPoints = calculateTotalPoints(groupData);
  const roundsPlayed = calculateRoundsPlayed(groupData);
  const roundsWon = calculateRoundsWon(groupData);
  const roundsLost = calculateRoundsLost(groupData);
  const gamesPlayed = calculateGamesPlayed(groupData);
  const gamesWon = calculateGamesWon(groupData);
  const gamesLost = calculateGamesLost(groupData);
  const avgPointsPerGame = calculateAveragePointsPerGame(groupData);
  const cashShare = calculateCashShare(groupData);

  return fullPlayers
      .filter(Boolean)
      .map(player => ({
        id: player.id,
        name: `${player.firstname || ''} ${player.name || ''}`.trim() || `Spieler ${player.id}`,
        totalPoints: Math.round((totalPoints.get(player.id) || 0) * 10) / 10,
        roundsPlayed: roundsPlayed.get(player.id) || 0,
        roundsWon: roundsWon.get(player.id) || 0,
        roundsLost: roundsLost.get(player.id) || 0,
        gamesPlayed: gamesPlayed.get(player.id) || 0,
        gamesWon: gamesWon.get(player.id) || 0,
        gamesLost: gamesLost.get(player.id) || 0,
        averagePointsPerGame: avgPointsPerGame.get(player.id) || 0,
        cashShare: cashShare.get(player.id) || 0
      }));
};

const normalizeGameData = (games: any): Game[] => {
  if (Array.isArray(games)) {
    return games
        .filter(Boolean)
        .map((game: any) => ({
          ...game,
          date: game.date ? new Date(game.date) : new Date(),
          rounds: Array.isArray(game.rounds) ? game.rounds : [],
        }));
  }

  if (games && typeof games === 'object') {
    return Object.entries(games)
        .filter(([, game]) => game)
        .map(([id, game]: [string, any]) => ({
          ...game,
          id,
          date: game.date ? new Date(game.date) : new Date(),
          rounds: Array.isArray(game.rounds) ? game.rounds : [],
        }));
  }

  return [];
};

export const processGroupData = (groupId: string, groupData: any): GameGroup | null => {
  if (!groupData) return null;

  const games = normalizeGameData(groupData.games);

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
