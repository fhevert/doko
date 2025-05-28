import React, {ChangeEvent} from 'react';
import '../css/Result.css';
import {Stack, ToggleButton, Typography, TextField, Button, Dialog, DialogTitle} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import {ResultType, Round} from "../../../model/Round";
import {Player} from "../../../model/Player";
import {useGameContext} from "../../../model/context/GameContext";

function DialogComponent(parameters: { round: Round}) {
    const {game, setGame} = useGameContext()
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (value: string) => {
        setOpen(false);
    };

    function changeListener(event: React.ChangeEvent<HTMLInputElement>) {
        parameters.round.roundPoints = Number(event.currentTarget.value);
        setGame({
            ...game
        })
    }

    const handleChangeVerloren = (event: React.ChangeEvent<any>): void => {
        const playerId = event.currentTarget.name;
        const player = game.players.find((p) => p.id ===playerId);
        if (player){
            if(parameters.round.results.get(player.id) === 0){
                parameters.round.results.set(player.id, -parameters.round.roundPoints)
            }else{
                parameters.round.results.set(player.id, 0)
            }

            var anzahlVerlierer:number = 0;
            var soloSpieler;
            //Solo beruecksichtigen
            parameters.round.results.forEach((value: number, id: string) => {
                if(value != 0){
                    soloSpieler = id;
                    anzahlVerlierer++;
                    parameters.round.results.set(id, -parameters.round.roundPoints);
                }
            });

            if(anzahlVerlierer == 1 && soloSpieler){
                parameters.round.results.set(soloSpieler, -parameters.round.roundPoints *3);
            }

            if(anzahlVerlierer == 4){
                parameters.round.results.set(player.id, 0)
            }
            setGame({
                ...game
            })
        }
    };

    return (
        <>
            <Button variant="outlined" onClick={handleClickOpen}>
                {parameters.round.id}
              </Button>
            <Dialog onClose={handleClose} open={open}>
              <TextField type="number" onChange={changeListener} value={parameters.round.roundPoints}/>
                {
                    game.players.map((player) => (
                     player.aktiv ? (
                         <Stack key={player.id}> {/* Wichtig: key muss im äussersten Element sein */}
                           <Typography>{player.name}</Typography>
                           <ToggleButton
                             value="check"
                             selected={parameters.round.results.get(player.id) !== 0}
                             name={player.id}
                             onChange={handleChangeVerloren}
                           >
                             <CheckIcon />
                           </ToggleButton>
                         </Stack>
                       ) : null
                    ))
                }
            </Dialog>
        </>
    )
}

export default DialogComponent;
