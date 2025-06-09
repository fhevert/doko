import {Game} from "../model/Game";
import { firebaseDB } from "./firebase-config";
import {ref, set} from "firebase/database";

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
