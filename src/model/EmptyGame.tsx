import {Game} from "./Game";
import {Player} from "./Player";

const fabi: Player = {
    id: '0',
    firstname: 'Fabian',
    name: 'Hevert',
    aktiv: true,
    result: 0
}
const chrissi: Player = {
    id: '1',
    firstname: 'Christopher',
    name: 'Kintrup',
    aktiv: true,
    result: 0
}
const joschi: Player = {
    id: '2',
    firstname: 'Aljoscha',
    name: 'Vogt',
    aktiv: true,
    result: 0
}
const marcus: Player = {
    id: '3',
    firstname: 'Marcus',
    name: 'Wissing',
    aktiv: true,
    result: 0
}
const marci: Player = {
    id: '4',
    firstname: 'Marcel',
    name: 'Meinert',
    aktiv: true,
    result: 0
}

const johannes: Player = {
    id: '5',
    firstname: 'Johannes',
    name: 'Richard',
    aktiv: true,
    result: 0
}

const basti: Player = {
    id: '6',
    firstname: 'Basti',
    name: 'Krämer',
    aktiv: true,
    result: 0
}

export const emptyGame = {
    players: [fabi, chrissi, marcus, joschi, marci, johannes, basti],
    rounds: [],
    averagePoints:0,
    result: new Map<Player, number | undefined>()
} as Game;
