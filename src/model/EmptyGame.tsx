import {Game} from "./Game";
import {Player} from "./Player";
import {ResultType, Round} from "./Round";

export const emptyGame = {
    players: [],
    rounds: [],
    result: new Map<Player, number | undefined>()
} as Game;