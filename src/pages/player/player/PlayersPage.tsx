import React from 'react';
import './PlayersPage.css';
import {useGameContext} from "../../../model/context/GameContext";
import {Avatar, Button, Card, CardContent, Grid, Stack, TextField, ToggleButton} from "@mui/material";
import CheckIcon from '@mui/icons-material/Check';
import {Link} from "react-router-dom";
import Layout from "../../../layout/Layout";
import NewGame from "./components/NewGame";

function PlayersPage() {
    const {game, setGame, isLoading} = useGameContext()

    const getInitials = (firstname: string, name: string): string => {
        const firstInitial = firstname ? firstname.charAt(0).toUpperCase() : '';
        const lastInitial = name ? name.charAt(0).toUpperCase() : '';
        return `${firstInitial}${lastInitial}`;
    };

    function changeListener(event: React.ChangeEvent<HTMLInputElement>) {
        const playerId = event.currentTarget.name;
        const player = game.players.find((p) => p.id ===playerId);
        if (player){
            player.name = event.currentTarget.value;
            setGame({
                ...game
            })
        }
    }

    const handleChangeAktiv = (event: React.ChangeEvent<any>): void => {
         const playerId = event.currentTarget.name;
         const player = game.players.find((p) => p.id ===playerId);
         if (player){
             player.aktiv = !player.aktiv
             setGame({
                 ...game
             })
         }
    };

    const calculateTotalResults = (): number => {
        return game.players.reduce((total, player) => {
            return total + (player.result || 0);
        }, 0);
    };


    return (
        <>
            <Layout>
                <Grid container spacing={2} sx={{padding: 5}}>
                   {
                       game.players.map((player) => (
                           <Grid item xs={12} sm={6} md={4} key={player.id}>
                               <Card variant="outlined" sx={{padding:1, height: '100%'}} >
                                   <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                       <Stack direction="row" spacing={2} sx={{ width: '100%', marginBottom: 2 }}>
                                           <TextField fullWidth onChange={changeListener} name={player.id} type="text" variant="standard" value={player.firstname} disabled={isLoading} inputProps={{ style: { textAlign: 'center' } }}/>
                                           <TextField fullWidth onChange={changeListener} name={player.id} type="text" variant="standard" value={player.name} disabled={isLoading} inputProps={{ style: { textAlign: 'center' } }}/>
                                       </Stack>

                                       <Stack direction="row" width="100%" spacing={2} alignItems="center" sx={{ marginTop: 2 }}>
                                           <Stack width="100%" alignItems="center">
                                               <Avatar sx={{ bgcolor: player.aktiv ? 'primary.main' : 'grey.400'}}>
                                                   {getInitials(player.firstname, player.name)}
                                               </Avatar>
                                           </Stack>
                                           <Stack width="100%" alignItems="center">
                                               <ToggleButton
                                                   disabled={calculateTotalResults() > 0 || isLoading}
                                                   value="check"
                                                   selected={player.aktiv}
                                                   name={player.id}
                                                   onChange={handleChangeAktiv}
                                               >
                                                   <CheckIcon />
                                               </ToggleButton>
                                           </Stack>
                                       </Stack>
                                   </CardContent>
                               </Card>
                           </Grid>
                       ))
                   }
                   <Grid item xs={12} sx={{display: 'flex', justifyContent: 'center', marginTop: 2}}>
                       <Stack  direction="row" justifyContent="space-between" sx={{ width: '100%'}}>
                           <NewGame/>
                           <Link to={isLoading ? "#" : "/results"}>
                               <Button variant="outlined" disabled={isLoading}>
                                   <p>Ergebnisse</p>
                               </Button>
                           </Link>
                       </Stack>
                   </Grid>
               </Grid>
            </Layout>
        </>
    );
}

export default PlayersPage;
