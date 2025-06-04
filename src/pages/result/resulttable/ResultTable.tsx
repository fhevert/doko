import * as React from 'react';
import {useEffect} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button'

import {ResultCell, getResult} from "../resultcell/ResultCell";
import {useGameContext} from "../../../model/context/GameContext";
import PointCell from "../pointcell/PointCell";
import DialogComponent from "../dialog/DialogComponent";
import {Round} from "../../../model/Round";
import {Game} from "../../../model/Game";
import { firebaseApp, firebaseDB, analytics } from "../../../firebase-config";
import {ref, set} from "firebase/database";

function ResultTable(parameters: { gameId: string }) {
    const {game, setGame} = useGameContext();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(9);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    const createRound = (): Round => {
        const  resultsMap= new Map<string, number>();

        game.players.forEach((player) => {
            resultsMap.set(player.id, 0);
        });

        return {
            id: game.rounds.length,
            roundPoints: 0,
            cowardicePoints: 0,
            results: resultsMap
        }
    }

    const handleNeueZeileClick = () => {
        game.rounds.push(createRound());
        setGame({
            ...game
        })
    };

    useEffect(() => {
        game.players.forEach(p => {
            if(p.aktiv){
               let playerResult: number = 0;
               game.rounds.forEach((round) => {
                   const point = getResult(round, p.id);
                   if(point){
                       playerResult += point;
                   }
               });
               p.result = playerResult;
            }
        });
        let gesamtPunkte: number = 0;
        let anzahlAktiveSpieler: number = 0;
        game.players.forEach(p => {
            if(p.aktiv){
                anzahlAktiveSpieler++;
                var playerScore = p.result;
                if(playerScore){
                   gesamtPunkte+= playerScore;
                }
            }
        });
        game.players.forEach(p => {
            if(!p.aktiv){
               p.result = gesamtPunkte / anzahlAktiveSpieler;
            }
        });

        if(game.rounds && game.rounds.length > 0 ){
          saveGameToFirebase(game)
        }
    }, [game]);

  function saveGameToFirebase(game: Game): Promise<void> {
        const firebaseResult: { [playerId: string]: number | undefined } = {};

        const gameRef = ref(firebaseDB, 'game'); // Pfad in der Datenbank
        const gameToSave = {
            players: game.players.map(player => ({
                                 id: player.id,
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

    return <>
        <TableContainer>
            <Table stickyHeader aria-label="sticky table">
                <TableHead>
                    <TableRow>
                        <TableCell align={'center'} className='cellWithRightLine'>
                            Runde
                        </TableCell>
                        <TableCell align={'center'} className='cellWithRightLine'>
                            Punkte
                        </TableCell>
                        {game?.rounds?.length > 0 && game.players.map(player => (
                            player.aktiv === true &&
                                <TableCell>
                                    {player.name + ': ' + ' ' + player.result}
                                </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {game.rounds
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((round) => (
                                <TableRow tabIndex={-1} key={round.id}>
                                    <TableCell align={'center'} className='cellWithRightLine' key={'TC-ROUND' + round.id}>
                                        <DialogComponent round={round} />
                                    </TableCell>
                                    <PointCell round={round}/>
                                    {game.players.map(player => (
                                        player.aktiv === true ?
                                            <ResultCell round={round} player={player}/>
                                        : null
                                    ))}
                                </TableRow>
                            )
                        )}
                </TableBody>
            </Table>
        </TableContainer>
        <TablePagination
            rowsPerPageOptions={[9, 25, 100]}
            component="div"
            count={game.rounds.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
        <Button onClick={handleNeueZeileClick}>Neue Runde</Button>
    </>
}

export default ResultTable;
