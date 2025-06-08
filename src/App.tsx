import React, {ReactNode, useEffect, useState, memo} from 'react';
import './App.css';
import {AppBar, Button, createTheme, CssBaseline, ThemeProvider, Toolbar, Typography} from "@mui/material";
import ResultTable from "./pages/result/resulttable/ResultTable";
import {emptyGame} from "./model/EmptyGame";
import {Game} from "./model/Game";
import {Round} from "./model/Round";
import {GameContext} from './model/context/GameContext';
import PlayersPage from "./pages/player/player/PlayersPage";
import {MemoryRouter, Navigate, Route, Routes, Link} from "react-router-dom";
import {firebaseApp, firebaseDB, analytics, auth} from "./firebase/firebase-config";
import {ref, get, set, onValue, DataSnapshot } from "firebase/database";
import {AuthProvider, useAuth} from './firebase/AuthContext';
import { signOut } from 'firebase/auth';
import Login from "./pages/login";

// Separate component for auth-dependent UI parts
const AuthStatusBar = memo(() => {
    const { currentUser } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('Fehler beim Abmelden:', error);
        }
    };

    return (
        <Toolbar>
            <Link to="/doko" style={{ textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
                <Typography variant="h6" component="div">
                    Doko
                </Typography>
            </Link>
            {currentUser ? (
                <Button color="inherit" onClick={handleLogout}>
                    Logout ({currentUser.email})
                </Button>
            ) : (
                <Link to="/login">
                    <Button color="inherit">
                        Login
                    </Button>
                </Link>
            )}
        </Toolbar>
    );
});

// Definieren Sie den Typ für die Props der PrivateRoute
interface PrivateRouteProps {
    children: ReactNode;
}

// Separate component for private routes
const PrivateRoute: React.FC<PrivateRouteProps> = memo(({ children }) => {
    const { currentUser } = useAuth();
    return currentUser ? <>{children}</> : <Navigate to="/login" />; // Verwende <></> für fragment
});

function App() {
    const [gameId, setGameId] = useState('gameId');
    const [game, setGame] = React.useState(emptyGame);
    const [isLoading, setIsLoading] = React.useState(true);


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
                    cowardicePoints: round.cowardicePoints,
                    results: resultsArrayToMap(round.results)
                }as Round
                i++;
            }
        }else{
            rounds = new Array(0);
        }

        var result = {
           players: JSON.parse(JSON.stringify(gameToConvert.players)),
           rounds: rounds
        } as Game;
        return result;
      }

     useEffect(() => {
         const collectionRef = ref(firebaseDB, 'game');
         const fetchData = () => {
            setIsLoading(true);
            // Listen for changes in the collection
            onValue(collectionRef, (firebaseDbSnapshot: DataSnapshot) => {
                if (firebaseDbSnapshot.exists()) {
                    const game = firebaseDbSnapshot.val() as Game
                    if (game) {
                        setGame(convertToRoundsResultsMaps(game));
                    }
               }
               setIsLoading(false);
            });
          };

          // Fetch data when the component mounts
          fetchData();
     }, []);

    return (
        <>
            <CssBaseline/>
            <ThemeProvider theme={darkTheme}>
                <GameContext.Provider value={{game, setGame, isLoading}}>
                    <MemoryRouter>
                        <AppBar position="static">
                            <AuthStatusBar />
                        </AppBar>
                        <Routes>
                            <Route path="/" element={<Navigate to="/doko" />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/doko" element={
                                    <PrivateRoute>
                                        <PlayersPage/>
                                    </PrivateRoute>
                                }
                            />
                            <Route path="/results" element={
                                    <PrivateRoute>
                                        <ResultTable gameId={gameId}/>
                                    </PrivateRoute>
                                }
                            />
                        </Routes>
                    </MemoryRouter>
                </GameContext.Provider>
            </ThemeProvider>
        </>
    );
}

export default App;
