import {Game} from "../model/Game";
import { firebaseDB } from "./firebase-config";
import {ref, set} from "firebase/database";
import {Round} from "../model/Round";

export function saveGameToFirebase(game: Game): Promise<void> {
    const gameRef = ref(firebaseDB, 'game'); // Pfad in der Datenbank
    const gameToSave = {
        players: game.players.map(player => ({
            id: player.id,
            firstname: player.firstname || "",
            name: player.name,
            result: player.result,
            aktiv: player.aktiv
        })),
        averagePoints: game.averagePoints,
        rounds: game.rounds.map(round => {
            var result = {
                id: round.id,
                roundPoints: round.roundPoints,
                cowardicePoints: round.cowardicePoints,
                results: Array.from(round.results, ([key, value]) => ({ key, value }))
            }
            return result;
        })
    }

    return set(gameRef, gameToSave);
}

// Funktion, um aus einem Array von RoundResult eine Map zu erstellen
function resultsArrayToMap(results: {key: string, value: number}[]): Map<string, number> {
    const resultsMap = new Map<string, number>();
    for (const result of results) {
        resultsMap.set(result.key, result.value);
    }
    return resultsMap;
}

export function convertFromDbGame(gameToConvert: any): Game {
    var rounds: Round[];
    if(gameToConvert.rounds){
        rounds= new Array(gameToConvert.rounds.length);
        var i: number =0
        for (const round of gameToConvert.rounds) {
            rounds[i] = {
                id: round.id,
                roundPoints: round.roundPoints,
                cowardicePoints: round.cowardicePoints,
                results: resultsArrayToMap(round.results)
            }as Round
            i++;
        }
    }else{
        rounds = new Array(0);
    }

    return {
        players: JSON.parse(JSON.stringify(gameToConvert.players)),
        rounds: rounds,
        averagePoints: gameToConvert.averagePoints,
    } as Game;
}
