import React, {useEffect, useState} from 'react';
import './App.css';
import {createTheme, CssBaseline, ThemeProvider} from "@mui/material";
import ResultTable from "./pages/result/resulttable/ResultTable";
import {bspGame} from "./model/bsp/BspGame";
import {Game} from "./model/Game";
import {GameContext} from './model/context/GameContext';
import PlayersPage from "./pages/player/player/PlayersPage";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import { firebaseApp, firebaseDB, analytics } from "./firebase-config";
import {ref, set, onValue, DataSnapshot } from "firebase/database";

function App() {
    const [gameId, setGameId] = useState('gameId');
    const [game, setGame] = React.useState(bspGame);

    const darkTheme = createTheme({
        palette: {
            mode: 'light',
        },
    });

     useEffect(() => {
        set(ref(firebaseDB, 'game/'), game);

        const collectionRef = ref(firebaseDB, "game/");
        const fetchData = () => {
            // Listen for changes in the collection
            onValue(collectionRef, (snapshot: DataSnapshot) => {
                if (snapshot.exists()) {
                    const dataItem = snapshot.val() as Game
                    // Check if dataItem exists
                    if (dataItem) {
                      //setGame(dataItem);
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
                            <Route index path="doko" element={<PlayersPage/>}/>
                            <Route path="results" element={<ResultTable gameId={gameId}/>}/>
                        </Routes>
                    </BrowserRouter>
                </GameContext.Provider>
            </ThemeProvider>
        </>
    );
}

export default App;