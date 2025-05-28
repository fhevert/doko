import {Game} from "../Game";
import {Player} from "../Player";
import {ResultType, Round} from "../Round";

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

const createRound = (id: string, points: number): Round => {
    const  resultsMap= new Map<string, number>();

    resultsMap.set(fabi.id, -points);
    resultsMap.set(chrissi.id, 0);
    resultsMap.set(joschi.id, 0);
    resultsMap.set(marcus.id, 0);
    resultsMap.set(marci.id, -points);
    resultsMap.set(johannes.id, 0);
    resultsMap.set(basti.id, 0);

    return {
        id: id,
        roundPoints: points,
        results: resultsMap
    }
}

export const bspGame = {
    players: [fabi, chrissi, marcus, joschi, marci, johannes, basti],
    rounds: [
        createRound('0', 2),
        createRound('1', 1),
    ],
    result: new Map<Player, number | undefined>()
} as Game;