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
            let playerResult: number = 0;
            game.rounds.forEach((round) => {
                const point = round.results.get(p);
                switch (point){
                    case ResultType.WIN:
                        playerResult += round.roundPoints;
                        break;
                    case ResultType.LOSE:
                        playerResult -= round.roundPoints;
                        break;
                    default:
                        break;
                }
            });
            game.result.set(p, playerResult);
        });
        setGame({
            ...game,
            result: game.result
        })
    }, [game]);

    return <>
        <TableContainer sx={{maxHeight: 440}}>
            <Table stickyHeader aria-label="sticky table">
                <TableHead>
                    <TableRow>
                        <TableCell align={'center'} className='cellWithRightLine' key='roundTC'>
                            Runde
                        </TableCell>
                        <TableCell align={'center'} className='cellWithRightLine' key='pointTC'>
                            Punkte
                        </TableCell>
                        {game.players.map((player) => (
                            <TableCell key='pointTC'>
                                {player.name + ': ' + game.result.get(player)}
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
                                        {round.id}
                                    </TableCell>
                                    <PointCell round={round}/>
                                    {game.players.map(player => {
                                        return (
                                            <ResultCell round={round} player={player}/>
                                        );
                                    })}
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
