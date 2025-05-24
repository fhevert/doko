import {Game} from "../Game";
import {Player} from "../Player";
import {ResultType, Round} from "../Round";

const fabi: Player = {
    id: '1',
    name: 'Fabian',
    aktiv: true
}
const chrissi: Player = {
    id: '2',
    name: 'Chrissi',
    aktiv: true
}
const joschi: Player = {
    id: '3',
    name: 'Joschi',
     aktiv: true
}
const marcus: Player = {
    id: '4',
    name: 'Marcus',
    aktiv: true
}
const marci: Player = {
    id: '5',
    name: 'Marci',
    aktiv: true
}

const johannes: Player = {
    id: '6',
    name: 'Johannes',
    aktiv: false
}

const basti: Player = {
    id: '7',
    name: 'Basti',
    aktiv: false
}

const createRound = (id: string, points: number): Round => {
    const  resultsMap= new Map<Player, number>();

    resultsMap.set(fabi, -points);
    resultsMap.set(chrissi, 0);
    resultsMap.set(joschi, 0);
    resultsMap.set(marcus, 0);
    resultsMap.set(marci, -points);
    resultsMap.set(johannes, 0);
    resultsMap.set(basti, 0);

    return {
        id: id,
        roundPoints: points,
        results: resultsMap
    }
}

export const bspGame = {
    players: [fabi, chrissi, marcus, joschi, marci, johannes, basti],
    rounds: [
        createRound('1', 2),
    ],
    result: new Map<Player, number | undefined>()
} as Game;