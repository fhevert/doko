import React from 'react';
import {
    ToggleButtonGroup,
    Stack,
    ToggleButton,
    Typography,
    TextField,
    Button,
    Dialog,
    Checkbox
} from "@mui/material";
import {ResultType, Round} from "../../../model/Round";
import {useGameContext} from "../../../model/context/GameContext";
import {saveGameToFirebase} from "../../../firebase/DbFunctions";
import {Check, CheckBox} from "@mui/icons-material";

function DialogComponent(parameters: { round: Round, open?: boolean }) {
    const {game, setGame} = useGameContext()
    const [open, setOpen] = React.useState(parameters.open || false);
    React.useEffect(() => {
        setOpen(parameters.open || false);
    }, [parameters.open]
    )
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
        saveGameToFirebase(game);
        setOpen(false);
    };


    function handeCowardicePointsChange(event: React.ChangeEvent<HTMLInputElement>) {
        // Remove leading zeros, but keep a single "0"
        let value = event.currentTarget.value;
        if (value !== "0") {
            value = value.replace(/^0+/, '');
        }
        // If the value is empty, set it to 0
        if (value === '') {
            value = '0';
        }
        parameters.round.cowardicePoints = Number(value);
        event.currentTarget.value = value;
        setGame({
            ...game
        })
    }

    function handeRoundPointsChange(event: React.ChangeEvent<HTMLInputElement>) {
        // Remove leading zeros, but keep a single "0"
        let value = event.currentTarget.value;
        if (value !== "0") {
            value = value.replace(/^0+/, '');
        }
        // If the value is empty, set it to 0
        if (value === '') {
            value = '0';
        }
        parameters.round.roundPoints = Number(value);
        event.currentTarget.value = value;
        setGame({
            ...game
        })
    }

    const handleToggleGroupChange = (playerId: string) =>(event: React.ChangeEvent<any>): void => {
        const player = game.players.find((p) => p.id ===playerId);
        if (player){
             parameters.round.results.set(player.id, Number(event.currentTarget.value));

            // Check if there's exactly one winner or one loser
            const results = Array.from(parameters.round.results.values());
            const winCount = results.filter(r => r === ResultType.WIN).length;
            const loseCount = results.filter(r => r === ResultType.LOSE).length;

            // Set solo to true if there's exactly one winner or one loser
            parameters.round.solo = (winCount === 1 || loseCount === 1);
            setGame({
                ...game
            })
        }
    };


    function onBockChange(event: React.ChangeEvent<HTMLInputElement>) {
        parameters.round.bock = event.target.checked;
        setMultiplier();
        setGame({
            ...game
        });
    }

    function setMultiplier() {
        parameters.round.multiplier = 1;
        if (parameters.round.bock) {
            parameters.round.multiplier *= 2;
        }
    }

    return (
        <>
            <Button variant="outlined" onClick={handleClickOpen} sx={{ minWidth: '40px', width: '40px' }}>
                {parameters.round.id + 1}
            </Button>
            <Dialog onClose={handleClose} open={open}>
              <Stack sx={{padding:1}} spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography>{parameters.round.multiplier > 1 ? parameters.round.multiplier + ' x ': ''} </Typography>
                      <TextField type="number" label="Punkte" onChange={handeRoundPointsChange} value={parameters.round.roundPoints}/>
                      <TextField type="number" label="Feigheit" onChange={handeCowardicePointsChange} value={parameters.round.cowardicePoints}/>
                  </Stack>
                  <Stack direction="row" alignItems="center">
                      <Checkbox  
                        checked={parameters.round.bock} 
                        onChange={onBockChange}
                        icon={<CheckBox />} 
                        checkedIcon={<Check />}
                      />
                      <Typography>Bock</Typography>
                      <Checkbox
                          checked={parameters.round.solo}
                          icon={<CheckBox />}
                          checkedIcon={<Check />}
                      />
                      <Typography>Solo</Typography>
                  </Stack>

                  {
                      game.players.map((player) => (
                       player.aktiv ? (
                           <Stack key={player.id}> {/* Wichtig: key muss im äussersten Element sein */}
                             <Typography>{(player.firstname || "") + ' ' + player.name}</Typography>
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
