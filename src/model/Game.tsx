import {Player} from "./Player";
import {Round} from "./Round";

export interface Game {
    players: Player[];
    rounds: Round[];
    result: Map<Player, number | undefined>
}