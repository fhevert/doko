import {Game} from "./Game";

export const emptyGame: Game = {
    id: '0',
    gameGroupId: '', // Add empty string as default gameGroupId
    players: [],
    rounds: [],
    averagePoints: 0,
    date: new Date()
}; // Removed 'as Game' since we're now properly typing it
