import * as React from 'react';
import {useEffect} from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';

import {ResultCell, getResult} from "../resultcell/ResultCell";
import {useGameContext} from "../../../model/context/GameContext";
import PointCell from "../pointcell/PointCell";
import DialogComponent from "../dialog/DialogComponent";
import {Round} from "../../../model/Round";
import {Stack} from "@mui/material";
import {saveGameToFirebase} from "../../../firebase/DbFunctions";

function ResultTable(parameters: { gameId: string }) {
    const {game, setGame} = useGameContext();
    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(8);

    const getInitials = (firstname: string, name: string): string => {
        const firstInitial = firstname ? firstname.charAt(0).toUpperCase() : '';
        const lastInitial = name ? name.charAt(0).toUpperCase() : '';
        return `${firstInitial}${lastInitial}`;
    };

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
            bock: false,
            cowardicePoints: 0,
            results: resultsMap
        }
    }

    const handleNeueZeileClick = () => {
        game.rounds.push(createRound());
        setGame({
            ...game
        })
        saveGameToFirebase(game);
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

        game.averagePoints = gesamtPunkte / anzahlAktiveSpieler
    }, [game]);



    return (
        <Stack direction="column" sx={{
            width: '100%',
            height: 'calc(100vh - 50px)', // 50px ist die neue Höhe der AppBar
            overflow: 'hidden',
            '& .MuiTable-root': {
                width: '100%',
                tableLayout: 'fixed'
            }
        }}>
            <TableContainer sx={{
                flex: 1,
                overflow: 'auto'
            }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">
                                Runde
                            </TableCell>
                            <TableCell align={'center'}>
                                {'P(' + String.fromCharCode(216) + ')'}
                            </TableCell>
                            {game?.rounds?.length > 0 && game.players.map(player => (player.aktiv && 
                            <TableCell 
                                align={'center'}
                                sx={{
                                    width: 'auto',
                                    minWidth: 'fit-content',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                }}
                            >
                                <Stack sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 55, height: 55 }}>
                                        <Stack direction="column" spacing={0}>
                                            <Stack direction="column" spacing={0}>
                                                {getInitials(player.firstname, player.name)}
                                            </Stack>
                                            <Stack direction="column" spacing={0}>
                                                {player.result}
                                            </Stack>
                                        </Stack>
                                    </Avatar>
                                </Stack>
                            </TableCell>))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {game.rounds
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((round) => (
                                    <TableRow tabIndex={-1} key={round.id}>
                                        <TableCell 
                                            sx={{ 
                                                whiteSpace: 'nowrap',
                                                width: 'auto',
                                                minWidth: 'fit-content',
                                                padding: '8px 4px',
                                                borderRight: '1px solid #e0e0e0',
                                                textAlign: 'center'
                                            }}
                                            align="center"
                                        >
                                            <DialogComponent round={round} />
                                        </TableCell>
                                        <PointCell round={round}/>
                                        {game.players.map(player => (
                                            player.aktiv ?
                                                <ResultCell round={round} player={player}/>
                                                : null
                                        ))}
                                    </TableRow>
                                )
                            )}
                    </TableBody>
                </Table>
            </TableContainer>
            <Stack direction="column" spacing={0}>
                <TablePagination 
                    rowsPerPageOptions={[8, { label: 'All', value: -1 }]}
                    component="div"
                    count={game.rounds.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                />
                <Button 
                    onClick={handleNeueZeileClick}
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{
                        borderRadius: 0,
                        py: 1,
                    }}
                >
                    Neue Runde
                </Button>
            </Stack>
        </Stack>
    )
}


export default ResultTable;
