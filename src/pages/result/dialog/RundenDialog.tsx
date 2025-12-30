import React from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    Stack,
    TextField,
    ToggleButton,
    ToggleButtonGroup,
    Typography
} from "@mui/material";
import {
    DeleteOutline,
    EmojiEvents,
    LocalFireDepartment,
    RemoveCircleOutline,
    SentimentVeryDissatisfied
} from "@mui/icons-material";
import {ResultType, Round} from "../../../model/Round";
import {useGameContext} from "../../../model/context/GameContext";
import {saveGameToFirebase} from "../../../firebase/DbFunctions";

function RundenDialog(parameters: { round: Round, open?: boolean, onClose?: () => void }) {
    const { game, setGame } = useGameContext();
    const [open, setOpen] = React.useState(parameters.open || false);

    React.useEffect(() => {
        setOpen(parameters.open || false);
    }, [parameters.open]);

    const handleClose = () => {
        setOpen(false);
        saveGameToFirebase(game);
        parameters.onClose?.();
    };

    const handleDeleteClick = () => {
        const filteredRounds = game.rounds.filter(obj => obj.id !== parameters.round.id);
        const reindexedRounds = filteredRounds.map((r, index) => ({ ...r, id: index }));

        setGame({ ...game, rounds: reindexedRounds });
        saveGameToFirebase({ ...game, rounds: reindexedRounds });
        setOpen(false);
        parameters.onClose?.();
    };

    const handleValueChange = (field: 'roundPoints' | 'cowardicePoints') => (event: React.ChangeEvent<HTMLInputElement>) => {
        let value = event.currentTarget.value.replace(/^0+/, '');
        if (value === '') value = '0';

        parameters.round[field] = Number(value);
        setGame({ ...game });
    };

    const handleToggleGroupChange = (playerId: string) => (_: any, newValue: number | null) => {
        if (newValue !== null) {
            parameters.round.results.set(playerId, newValue);

            const results = Array.from(parameters.round.results.values());
            const winCount = results.filter(r => r === ResultType.WIN).length;
            const loseCount = results.filter(r => r === ResultType.LOSE).length;

            parameters.round.solo = (winCount === 1 || loseCount === 1);
            setGame({ ...game });
        }
    };

    const toggleBock = () => {
        parameters.round.bock = !parameters.round.bock;
        parameters.round.multiplier = parameters.round.bock ? 2 : 1;
        setGame({ ...game });
    };

    return (
        <>
            <Dialog 
                open={open}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                fullWidth 
                maxWidth="xs"
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    Runde {parameters.round.id + 1} bearbeiten
                    {parameters.round.bock && <LocalFireDepartment color="error" />}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        {/* Punkte-Sektion */}
                        <Stack direction="row" spacing={2}>
                            <TextField
                                label="Punkte"
                                type="number"
                                fullWidth
                                variant="filled"
                                value={parameters.round.roundPoints}
                                onChange={handleValueChange('roundPoints')}
                            />
                            <TextField
                                label="Feigheit"
                                type="number"
                                fullWidth
                                variant="filled"
                                value={parameters.round.cowardicePoints}
                                onChange={handleValueChange('cowardicePoints')}
                            />
                        </Stack>

                        {/* Bock-Button */}
                        <Button
                            variant={parameters.round.bock ? "contained" : "outlined"}
                            color="error"
                            onClick={toggleBock}
                            startIcon={<LocalFireDepartment />}
                        >
                            {parameters.round.bock ? "Bock Aktiv (2x)" : "Bock setzen?"}
                        </Button>

                        <Divider>Spieler Ergebnisse</Divider>

                        {/* Spieler-Liste */}
                        <Stack spacing={2}>
                            {game.players.filter(p => p.aktiv).map((player) => (
                                <Box key={player.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {player.firstname || player.name}
                                    </Typography>

                                    <ToggleButtonGroup
                                        value={parameters.round.results.get(player.id)}
                                        exclusive
                                        onChange={handleToggleGroupChange(player.id)}
                                        size="small"
                                    >
                                        <ToggleButton value={ResultType.WIN} sx={{ "&.Mui-selected": { bgcolor: "success.main", color: "white", "&:hover": { bgcolor: "success.dark" } } }}>
                                            <EmojiEvents fontSize="small" />
                                        </ToggleButton>
                                        <ToggleButton value={ResultType.UNCHANGED}>
                                            <RemoveCircleOutline fontSize="small" />
                                        </ToggleButton>
                                        <ToggleButton value={ResultType.LOSE} sx={{ "&.Mui-selected": { bgcolor: "error.main", color: "white", "&:hover": { bgcolor: "error.dark" } } }}>
                                            <SentimentVeryDissatisfied fontSize="small" />
                                        </ToggleButton>
                                    </ToggleButtonGroup>
                                </Box>
                            ))}
                        </Stack>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ justifyContent: 'space-between', p: 2 }}>
                    <IconButton color="error" onClick={handleDeleteClick} title="Löschen">
                        <DeleteOutline />
                    </IconButton>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default RundenDialog;