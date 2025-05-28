import React, {useEffect, useState} from 'react';
import './App.css';
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import ResultTable from "./pages/result/resulttable/ResultTable";
import {bspGame} from "./model/bsp/BspGame";
import {emptyGame} from "./model/EmptyGame";
import {Game} from "./model/Game";
import {Round} from "./model/Round";
import {GameContext} from './model/context/GameContext';
import PlayersPage from "./pages/player/player/PlayersPage";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import { firebaseApp, firebaseDB, analytics } from "./firebase-config";
import {ref, get, set, onValue, DataSnapshot } from "firebase/database";

function App() {
    const [gameId, setGameId] = useState('gameId');
    const [game, setGame] = React.useState(emptyGame);

    const darkTheme = createTheme({
        palette: {
            mode: 'light',
        },
    });
    // Funktion, um aus einem Array von RoundResult eine Map zu erstellen
    function resultsArrayToMap(results: {key: string, value: number}[]): Map<string, number> {
      const resultsMap = new Map<string, number>();
      for (const result of results) {
        resultsMap.set(result.key, result.value);
      }
      return resultsMap;
    }

    function convertToRoundsResultsMaps(gameToConvert: any): Game {
         var rounds: Round[];
        if(gameToConvert.rounds){
            rounds= new Array(gameToConvert.rounds.length);
            var i: number =0
            for (const round of gameToConvert.rounds) {
                rounds[i] = {
                    id: round.id,
                    roundPoints: round.roundPoints,
                    results: resultsArrayToMap(round.results)
                }as Round
                i++;
            }
        }else{
            rounds = new Array(0);
        }

        var result = {
           players: gameToConvert.players,
           rounds: rounds
        } as Game;
        return result;
      }

     useEffect(() => {
         const collectionRef = ref(firebaseDB, 'game');
         const fetchData = () => {
            // Listen for changes in the collection
            onValue(collectionRef, (firebaseDbSnapshot: DataSnapshot) => {
                if (firebaseDbSnapshot.exists()) {
                    const game = firebaseDbSnapshot.val() as Game
                    if (game) {
                        setGame(convertToRoundsResultsMaps(game));
                    }
               }
            });
          };

          // Fetch data when the component mounts
          fetchData();
     }, []);

    return (
        <>
            <CssBaseline/>
            <ThemeProvider theme={darkTheme}>
                <GameContext.Provider value={{game, setGame}}>
                    <BrowserRouter>
                        <Routes>
                            <Route index element={<PlayersPage/>}/>
                            <Route path="results" element={<ResultTable gameId={gameId}/>}/>
                        </Routes>
                    </BrowserRouter>
                </GameContext.Provider>
            </ThemeProvider>
        </>
    );
}

export default App;