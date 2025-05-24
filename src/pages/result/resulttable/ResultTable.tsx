import * as React from 'react';
import {useEffect} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';

import ResultCell from "../resultcell/ResultCell";
import {useGameContext} from "../../../model/context/GameContext";
import PointCell from "../pointcell/PointCell";
import DialogComponent from "../dialog/DialogComponent";
import {ResultType} from "../../../model/Round";

function ResultTable(parameters: { gameId: string }) {
    const {game, setGame} = useGameContext();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(+event.target.value);
        setPage(0);
    };

    useEffect(() => {
        game.players.forEach(p => {
            if(p.aktiv){
               let playerResult: number = 0;
               game.rounds.forEach((round) => {
                   const point = round.results.get(p);
                   if(point){
                       playerResult += point;
                   }
               });
               game.result.set(p, playerResult);
            }
        });
        let gesamtPunkte: number = 0;
        let anzahlAktiveSpieler: number = 0;
        game.players.forEach(p => {
            if(p.aktiv){
                anzahlAktiveSpieler++;
                var playerScore = game.result?.get(p);
                if(playerScore){
                   gesamtPunkte+= playerScore;
                }
            }
        });
        game.players.forEach(p => {
            if(!p.aktiv){
               game.result.set(p, gesamtPunkte / anzahlAktiveSpieler);
            }
        });
        console.log("test");
        setGame({
            ...game,
            result: game.result
        })
    }, [game]);

    return <>
        <TableContainer>
            <Table stickyHeader aria-label="sticky table">
                <TableHead>
                    <TableRow>
                        <TableCell align={'center'} className='cellWithRightLine' key='roundTC'>
                            Runde
                        </TableCell>
                        <TableCell align={'center'} className='cellWithRightLine' key='pointTC'>
                            Punkte
                        </TableCell>
                        {game.players.map(player => (
                            player.aktiv === true ?
                                <TableCell key='pointTC'>
                                    {player.name + ': ' + game.result.get(player)}
                                </TableCell>
                            : null
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
            rowsPerPageOptions={[10, 25, 100]}
            component="div"
            count={game.rounds.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
        />
    </>
}

export default ResultTable;
