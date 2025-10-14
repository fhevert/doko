import React from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    Paper,
    Table,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from "@mui/material";
import {useGameContext} from "../../../model/context/GameContext";
import {saveGameToFirebase} from "../../../firebase/DbFunctions";
import TableBody from "@mui/material/TableBody";
import {Player} from "../../../model/Player";

function RundenDialog(parameters: {}) {
    const {game, setGame} = useGameContext()
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (event: React.SyntheticEvent, reason?: string) => {
        setOpen(false);
        saveGameToFirebase(game);
    };
    const getSpielerergenis = (player: Player) => {
        return player.result * 0.1 + 5
    };
    const getGesamtergebnis = () => {
        return game.players.reduce((total, player) => total + getSpielerergenis(player), 0);
    };

    return (
        <>
            <Button variant="outlined" onClick={handleClickOpen} sx={{ minWidth: '40px', width: '40px' }}>
                {'P(' + String.fromCharCode(216) + ')'}
            </Button>
            <Dialog onClose={handleClose} open={open}>
                <DialogTitle id="doko-ergebnis-titel" sx={{ textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                    {'Ergebnis: ' + new Intl.NumberFormat('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                        minimumFractionDigits: 2, // Zeigt zwei Nachkommastellen (z.B. 45,00 €)
                    }).format(getGesamtergebnis())}
                </DialogTitle>

                <DialogContent dividers>
                    {/* Tabelle zur Anzeige der sortierten Ergebnisse */}
                    <TableContainer component={Paper} elevation={0}>
                        <Table size="small" aria-label="Doppelkopf Ergebnisse">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                    <TableCell align="center" sx={{ width: 50 }}>Platz</TableCell>
                                    <TableCell>Spieler</TableCell>
                                    <TableCell align="right">Punkte</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {game.players.sort((a, b) => a.result - b.result).map((spieler, index) => (
                                    <TableRow
                                        key={spieler.id}
                                        sx={{
                                            '&:last-child td, &:last-child th': { border: 0 },
                                            ...(spieler.aktiv && { bgcolor: 'success.light', '& td, & th': { color: 'white' } }),
                                            ...(!spieler.aktiv && { bgcolor: 'action.hover', '& td, & th': { color: 'black' } })
                                        }}
                                    >
                                        <TableCell align="center">
                                            <Typography variant="h6" color={spieler.aktiv ? 'white' : 'text.primary'}>
                                                {index + 1}.
                                            </Typography>
                                        </TableCell>
                                        <TableCell component="th" scope="row">
                                            {spieler.firstname} {spieler.name}
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                variant="h6"
                                                color={spieler.result >= 0 ? (spieler.aktiv ? 'white' : 'success.dark') : 'error.dark'}
                                            >
                                                {new Intl.NumberFormat('de-DE', {
                                                    style: 'currency',
                                                    currency: 'EUR',
                                                    minimumFractionDigits: 2, // Zeigt zwei Nachkommastellen (z.B. 45,00 €)
                                                }).format(getSpielerergenis(spieler))}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default RundenDialog;
