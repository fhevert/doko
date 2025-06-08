import React, {ChangeEvent} from 'react';
import '../css/Result.css';
import {ToggleButtonGroup, Stack, ToggleButton, Typography, TextField, Button, Dialog, DialogTitle} from "@mui/material";
import {ResultType, Round} from "../../../model/Round";
import {Player} from "../../../model/Player";
import {useGameContext} from "../../../model/context/GameContext";
import {saveGameToFirebase} from "../../../firebase/DbFunctions";

function DialogComponent(parameters: { round: Round}) {
    const {game, setGame} = useGameContext()
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = (event: React.SyntheticEvent, reason?: string) => {
        setOpen(false);
        saveGameToFirebase(game);
    };

    const handleDeleteClick = () => {
        game.rounds.splice(parameters.round.id, 1);
        game.rounds = game.rounds.filter(obj => obj.id !== parameters.round.id)
        var i = 0;
        game.rounds.forEach((round) =>{
            round.id = i;
            i++;
        });

        setGame({
            ...game
        })
        setOpen(false);
    };


    function handeCowardicePointsChange(event: React.ChangeEvent<HTMLInputElement>) {
        parameters.round.cowardicePoints = Number(event.currentTarget.value);
        setGame({
            ...game
        })
    }

    function handeRoundPointsChange(event: React.ChangeEvent<HTMLInputElement>) {
        parameters.round.roundPoints = Number(event.currentTarget.value);
        setGame({
            ...game
        })
    }

    const handleToggleGroupChange = (playerId: string) =>(event: React.ChangeEvent<any>): void => {
        const player = game.players.find((p) => p.id ===playerId);
        if (player){
             parameters.round.results.set(player.id, Number(event.currentTarget.value));
            setGame({
                ...game
            })
        }
    };

    return (
        <>
            <Button variant="outlined" onClick={handleClickOpen}>
                {parameters.round.id + 1}
              </Button>
            <Dialog onClose={handleClose} open={open}>
              <Stack sx={{padding:1}} spacing={1}>
                  <TextField type="number" label="Punkte" onChange={handeRoundPointsChange} value={parameters.round.roundPoints}/>
                  <TextField type="number" label="Feigheit" onChange={handeCowardicePointsChange} value={parameters.round.cowardicePoints}/>
                  {
                      game.players.map((player) => (
                       player.aktiv ? (
                           <Stack key={player.id}> {/* Wichtig: key muss im äussersten Element sein */}
                             <Typography>{player.name}</Typography>
                            <ToggleButtonGroup
                                   value={parameters.round.results.get(player.id)}
                                   exclusive
                                   id={player.id}
                                   onChange={handleToggleGroupChange(player.id)}
                                   aria-label="text alignment"
                                 >
                                   <ToggleButton value={ResultType.WIN} aria-label="left aligned">
                                   +
                                   </ToggleButton>
                                   <ToggleButton value={ResultType.UNCHANGED} aria-label="centered">
                                     0
                                   </ToggleButton>
                                   <ToggleButton value={ResultType.LOSE} aria-label="right aligned">
                                    -
                                   </ToggleButton>
                                 </ToggleButtonGroup>
                           </Stack>
                         ) : null
                      ))
                  }
                  <Button variant="outlined" onClick={handleDeleteClick}>
                      Delete
                  </Button>
              </Stack>
            </Dialog>
        </>
    )
}

export default DialogComponent;
