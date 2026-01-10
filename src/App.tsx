import React, {memo, ReactNode, useEffect, useState} from 'react';
import './App.css';
import {
    AppBar,
    Avatar,
    Box,
    Button,
    createTheme,
    CssBaseline,
    IconButton,
    Menu,
    MenuItem,
    ThemeProvider,
    Toolbar,
    Typography
} from "@mui/material";
import GamePage from "./pages/result/resulttable/GamePage";
import {emptyGame} from "./model/EmptyGame";
import {Game} from "./model/Game";
import {GameContext} from './model/context/GameContext';
import PlayersPage from "./pages/player/player/PlayersPage";
import GameGroupPage from "./pages/gamegroup";
import GameGroupDetailPage from "./pages/gamegroup/GameGroupDetailPage";
import {Link as RouterLink, MemoryRouter, Navigate, Route, Routes} from "react-router-dom";
import {auth, firebaseDB} from "./firebase/firebase-config";
import {DataSnapshot, onValue, ref} from "firebase/database";
import {useAuth} from './firebase/AuthContext';
import {signOut} from 'firebase/auth';
import Login from "./pages/login";
import ProfilePage from "./pages/profile/ProfilePage";
import {convertFromDbGame} from "./firebase/DbFunctions";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import {MobileNavigation} from './components/MobileNavigation';
import {useTheme} from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Separate component for auth-dependent UI parts
const AuthStatusBar = memo(() => {
    const { currentUser } = useAuth();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            handleClose();
        } catch (error) {
            console.error('Fehler beim Abmelden:', error);
        }
    };

    return (
        <Toolbar sx={{ 
            minHeight: '64px', 
            display: 'flex', 
            justifyContent: 'space-between',
            padding: isMobile ? '0 8px' : '0 16px'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <MobileNavigation />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {currentUser ? (
                    <>
                        <IconButton
                            size="large"
                            aria-label="account of current user"
                            aria-controls="menu-appbar"
                            aria-haspopup="true"
                            onClick={handleMenu}
                            color="inherit"
                            sx={{ p: 0, ml: 2 }}
                        >
                            <Avatar 
                                alt={currentUser.email || 'User'} 
                                src={currentUser.photoURL || ''}
                                sx={{ width: 40, height: 40 }}
                            >
                                {currentUser.email?.[0]?.toUpperCase() || 'U'}
                            </Avatar>
                        </IconButton>
                        <Menu
                            id="menu-appbar"
                            anchorEl={anchorEl}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={open}
                            onClose={handleClose}
                        >
                            <MenuItem 
                                component={RouterLink} 
                                to="/profile"
                                onClick={handleClose}
                            >
                                <AccountCircleIcon sx={{ mr: 1 }} />
                                Mein Profil
                            </MenuItem>
                            <MenuItem onClick={handleLogout}>
                                <Typography color="error">
                                    Abmelden
                                </Typography>
                            </MenuItem>
                        </Menu>
                    </>
                ) : (
                    <Button 
                        component={RouterLink}
                        to="/login"
                        color="inherit"
                        sx={{ 
                            textTransform: 'none',
                            '&:hover': {
                                backgroundColor: 'rgba(255, 255, 255, 0.08)'
                            }
                        }}
                    >
                        <Typography variant="body1" component="div">
                            Anmelden
                        </Typography>
                    </Button>
                )}
            </Box>
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

     useEffect(() => {
         const collectionRef = ref(firebaseDB, 'game');
         const fetchData = () => {
            setIsLoading(true);
            // Listen for changes in the collection
            onValue(collectionRef, (firebaseDbSnapshot: DataSnapshot) => {
                if (firebaseDbSnapshot.exists()) {
                    const game = firebaseDbSnapshot.val() as Game
                    if (game) {
                        setGame(convertFromDbGame(game));
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
                        <AppBar position="static" sx={{ position: 'relative' }}>
                            <AuthStatusBar />
                        </AppBar>
                        <Routes>
                            <Route path="/" element={
                                <PrivateRoute>
                                    <GameGroupPage />
                                </PrivateRoute>
                            } />
                            <Route path="/login" element={<Login />} />
                            <Route path="/profile" element={
                                <PrivateRoute>
                                    <ProfilePage />
                                </PrivateRoute>
                            } />
                            <Route path="/" element={<Navigate to="/doko" replace />} />
                            <Route path="*" element={<div>404 Not Found</div>} />
                            <Route path="/players" element={
                                <PrivateRoute>
                                    <PlayersPage/>
                                </PrivateRoute>
                            } />
                            <Route path="/game-groups" element={
                                <PrivateRoute>
                                    <GameGroupPage />
                                </PrivateRoute>
                            } />
                            <Route path="/game-groups/:groupId" element={
                                <PrivateRoute>
                                    <GameGroupDetailPage />
                                </PrivateRoute>
                            } />
                            <Route path="/game-groups/:groupId/games/:gameId" element={
                                <PrivateRoute>
                                    <GamePage />
                                </PrivateRoute>
                            } />
                        </Routes>
                    </MemoryRouter>
                </GameContext.Provider>
            </ThemeProvider>
        </>
    );
}

export default App;
