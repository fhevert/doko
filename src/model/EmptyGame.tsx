import {Game} from "./Game";
import {Player} from "./Player";
import {ResultType, Round} from "./Round";

const fabi: Player = {
    id: '0',
    name: 'Fabian',
    aktiv: true,
    result: 0
}
const chrissi: Player = {
    id: '1',
    name: 'Chrissi',
    aktiv: true,
    result: 0
}
const joschi: Player = {
    id: '2',
    name: 'Joschi',
    aktiv: true,
    result: 0
}
const marcus: Player = {
    id: '3',
    name: 'Marcus',
    aktiv: true,
    result: 0
}
const marci: Player = {
    id: '4',
    name: 'Marci',
    aktiv: true,
    result: 0
}

const johannes: Player = {
    id: '5',
    name: 'Johannes',
    aktiv: true,
    result: 0
}

const basti: Player = {
    id: '6',
    name: 'Basti',
    aktiv: true,
    result: 0
}

export const emptyGame = {
    players: [fabi, chrissi, marcus, joschi, marci, johannes, basti],
    rounds: [],
    result: new Map<Player, number | undefined>()
} as Game;
