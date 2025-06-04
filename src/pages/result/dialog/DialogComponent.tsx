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
                  <Button variant="outlined" onClick={handleDeleteClick}>
                      Delete
                  </Button>
              </Stack>

            </Dialog>
        </>
    )
}

export default DialogComponent;
