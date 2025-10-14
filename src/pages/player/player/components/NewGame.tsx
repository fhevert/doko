import React from 'react';
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,} from "@mui/material";
import {useGameContext} from "../../../../model/context/GameContext";
import {saveGameToFirebase} from "../../../../firebase/DbFunctions";


function NewGame(parameters: { }) {
    const [open, setOpen] = React.useState(false);
    const {game, isLoading} = useGameContext();


    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleNewGame = () => {
        setOpen(false);
        game.rounds = [];
        game.players.forEach((player) => {
            player.result = 0;
            player.aktiv = true;
        })
        saveGameToFirebase(game);
    };

    return (
        <React.Fragment>
            <Button variant="outlined" disabled={isLoading} onClick={handleClickOpen}>
                Neues Spiel
            </Button>
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">
                    {"Use Google's location service?"}
                </DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Willst du wirklich ein neues Spiel starten? Der aktuelle Spielstand wird verworfen.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleNewGame}>OK</Button>
                    <Button onClick={handleClose} autoFocus>
                        Abbrechen
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default NewGame;
