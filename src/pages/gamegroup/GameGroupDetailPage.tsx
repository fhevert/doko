import React, {useContext, useEffect, useState} from 'react';
import {
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {useNavigate, useParams} from 'react-router-dom';
import {Add as AddIcon, ArrowBack as ArrowBackIcon} from '@mui/icons-material';
import {GameGroup} from '../../model/GameGroup';
import {GameContext} from '../../model/context/GameContext';
import {Game} from '../../model/Game';
import {auth, firebaseDB as db} from '../../firebase/firebase-config';
import {DataSnapshot, get, onValue, ref, remove, set} from 'firebase/database';
import {saveGameToFirebase} from "../../firebase/DbFunctions";
import {ResultType} from "../../model/Round"; // Import from modular SDK

const GameGroupDetailPage: React.FC = () => {
    const {groupId} = useParams<{ groupId: string }>();
    const [group, setGroup] = useState<GameGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [gameToDelete, setGameToDelete] = useState<{id: string, index: number} | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Safe access to games array with type safety
    const games: Game[] = group?.games || [];
    // Safe access to players array with type safety
    const players = group?.players || [];

    const handleConfirmDelete = async () => {
        if (!gameToDelete || !group || !groupId) {
            setIsDeleteDialogOpen(false);
            return;
        }
        
        setLoading(true);
        try {
            // Get the game to be deleted
            const gameToRemove = group.games?.[gameToDelete.index];
            if (!gameToRemove) throw new Error('Spiel nicht gefunden');
            
            // Delete the game from the user's games
            const user = auth.currentUser;
            if (!user) throw new Error('Nicht angemeldet');
            
            // Remove the game from the user's games
            const gameRef = ref(db, `games/${gameToDelete.id}`);
            await remove(gameRef);
            
            // Update the group's games list
            const updatedGames = [...(group.games || [])];
            if (gameToDelete.index >= 0 && gameToDelete.index < updatedGames.length) {
                updatedGames.splice(gameToDelete.index, 1);
                
                // Update the group in the database
                const groupRef = ref(db, `gameGroups/${groupId}`);
                await set(groupRef, {
                    ...group,
                    games: updatedGames,
                    updatedAt: Date.now()
                });
                
                // Update local state
                setGroup(prev => prev ? {
                    ...prev,
                    games: updatedGames,
                    updatedAt: Date.now()
                } : null);
            }
            
            // Show success message
            setError(null);
        } catch (error) {
            console.error('Fehler beim Löschen des Spiels:', error);
            setError('Fehler beim Löschen des Spiels');
        } finally {
            // Close the dialog and reset state
            setIsDeleteDialogOpen(false);
            setGameToDelete(null);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!groupId) return;
        
        setLoading(true);
        
        const user = auth.currentUser;
        if (!user) {
            setError('Benutzer nicht angemeldet');
            setLoading(false);
            return;
        }
        
        // Set up real-time listener for the game group with the correct user path
        const groupRef = ref(db, `gameGroups/${groupId}`);
        
        // Handle successful data retrieval
        const onData = (snapshot: DataSnapshot) => {
            try {
                const groupData = snapshot.val();
                if (groupData) {
                    let games: Game[] = [];
                    
                    // Handle both array and object formats for games
                    if (Array.isArray(groupData.games)) {
                        games = groupData.games
                            .filter((game: any) => game) // Filter out any null/undefined games
                            .map((game: any) => ({
                                ...game,
                                date: game.date ? new Date(game.date) : new Date(),
                                // Ensure rounds is an array
                                rounds: Array.isArray(game.rounds) ? game.rounds : []
                            }));
                    } else if (groupData.games && typeof groupData.games === 'object') {
                        // Convert object of games to array
                        games = Object.entries(groupData.games)
                            .filter(([_, game]) => game) // Filter out any null/undefined games
                            .map(([id, game]: [string, any]) => ({
                                ...game,
                                id: id, // Ensure the ID is set
                                date: game.date ? new Date(game.date) : new Date(),
                                // Ensure rounds is an array
                                rounds: Array.isArray(game.rounds) ? game.rounds : []
                            }));
                    }

                    setGroup({
                        ...groupData,
                        id: groupId,
                        games: games
                    } as GameGroup);
                    setError(null);
                } else {
                    setError('Gruppe nicht gefunden');
                }
            } catch (err) {
                console.error('Fehler beim Aktualisieren der Gruppe:', err);
                setError('Fehler beim Aktualisieren der Gruppen-Daten');
            } finally {
                setLoading(false);
            }
        };
        
        // Handle errors
        const onError = (error: Error) => {
            console.error('Fehler beim Abonnieren der Gruppen-Daten:', error);
            setError('Verbindungsfehler beim Laden der Gruppe');
            setLoading(false);
        };
        
        // Set up the listener
        const unsubscribe = onValue(groupRef, onData, onError);

        // Cleanup function
        return () => {
            // Unsubscribe from real-time updates when component unmounts
            // or when groupId changes
            unsubscribe();
        };
    }, [groupId]);

    const { setGame, game } = useContext(GameContext);

    const loadGame = async (gameId: string) => {
        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) throw new Error('User not authenticated');
            
            const gameRef = ref(db, `gameGroups/${groupId}/games/${gameId}`);
            const snapshot = await get(gameRef);
            
            if (snapshot.exists()) {
                const gameData = snapshot.val() as Game;
                
                // Ensure rounds is an array and convert results back to Map with proper ResultType handling
                const rounds = Array.isArray(gameData?.rounds) 
                    ? gameData.rounds.map((round) => {
                        const resultsMap = new Map<string, ResultType>();
                        
                        if (round.results) {
                            if (Array.isArray(round.results)) {
                                // Handle array format
                                round.results.forEach((result: {key: string, value: number}) => {
                                    if (result && result.key !== undefined && result.value !== undefined) {
                                        resultsMap.set(String(result.key), result.value as ResultType);
                                    }
                                });
                            } else if (typeof round.results === 'object') {
                                // Handle object format
                                Object.entries(round.results).forEach(([key, value]) => {
                                    if (value !== undefined) {
                                        resultsMap.set(String(key), value as ResultType);
                                    }
                                });
                            }
                        }
                        
                        return {
                            ...round,
                            results: resultsMap,
                            date: round.date ? new Date(round.date) : new Date()
                        };
                    })
                    : [];
                
                const gameWithRounds = {
                    ...gameData,
                    id: gameId,
                    gameGroupId: groupId,
                    rounds: rounds,
                    date: gameData.date ? new Date(gameData.date) : new Date()
                } as Game;
                
                // Update the game in the context
                setGame(gameWithRounds);
                
                // Navigate to the results page if there are rounds, otherwise to player selection
                if (rounds.length > 0) {
                    navigate('/game-groups/:groupId/games/:gameId');
                } else {
                    navigate('/players');
                }
            } else {
                setError('Spiel nicht gefunden');
            }
        } catch (error) {
            console.error('Error loading game:', error);
            setError('Fehler beim Laden des Spiels');
        } finally {
            setLoading(false);
        }
    };

    const handleStartNewGame = async () => {
        if (group && groupId) {
            try {
                setLoading(true);
                const user = auth.currentUser;
                if (!user) throw new Error('User not authenticated');

                // Create a new game with the group's players
                const newGame: Game = {
                    id: `game_${Date.now()}`, // More descriptive ID
                    gameGroupId: groupId,
                    players: group.players.map(player => ({
                        ...player,
                        aktiv: true,
                        result: 0
                    })),
                    rounds: [],
                    averagePoints: 0,
                    date: new Date()
                };
                
                // Save the new game using the dedicated function
                await saveGameToFirebase(newGame);
                
                // Update local state with the new game
                const updatedGames = [...(group.games || []), newGame];
                setGroup(prev => prev ? {
                    ...prev,
                    games: updatedGames,
                    updatedAt: Date.now()
                } : null);
                
                // Set the game in context
                setGame(newGame);
                
                // Navigate to the player selection screen
                navigate('/players');
            } catch (error) {
                console.error('Error creating new game:', error);
                setError('Fehler beim Erstellen des Spiels');
            }
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress/>
            </Box>
        );
    }

    if (error || !group) {
        return (
            <Container maxWidth="md">
                <Box my={4}>
                    <Typography color="error">{error || 'Gruppe nicht gefunden'}</Typography>
                    <Button 
                        variant="outlined" 
                        onClick={() => navigate(-1)}
                        sx={{ mt: 2 }}
                    >
                        Zurück zur Übersicht
                    </Button>
                </Box>
            </Container>
        );
    }

    return (
        <Container maxWidth="md">
            <Box my={4}>
                <Box mb={2}>
                    <IconButton onClick={() => navigate(-1)}>
                        <ArrowBackIcon/>
                    </IconButton>
                </Box>
                
                {games.length > 0 ? (
                    <List>
                        {games.map((game, index) => (
                            <React.Fragment key={game.id || index}>
                                <ListItem 
                                    button 
                                    onClick={() => loadGame(game.id)}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                            cursor: 'pointer'
                                        }
                                    }}
                                >
                                    <ListItemText
                                        primary={`Spiel am ${new Date(game.date).toLocaleDateString()}`}
                                        secondary={`${game.players?.length || 0} Spieler • ${game.rounds?.length || 0} Runden`}
                                    />
                                </ListItem>
                                {index < games.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body1" color="textSecondary">
                        Noch keine Spiele vorhanden. Starten Sie ein neues Spiel!
                    </Typography>
                )}
                <Box sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    bgcolor: 'background.paper',
                    boxShadow: '0 -2px 4px rgba(0,0,0,0.1)'
                }}>
                    <Container maxWidth="md">
                        <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon/>}
                            onClick={handleStartNewGame}
                            disabled={group.players === undefined || group.players.length === 0}
                            size="large"
                        >
                            Neues Spiel starten
                        </Button>
                    </Container>
                </Box>
            </Box>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setGameToDelete(null);
                }}
            >
                <DialogTitle>Spiel löschen</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Möchten Sie dieses Spiel wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{
                    px: isMobile ? 2 : 3,
                    pb: isMobile ? 2 : 3,
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: isMobile ? 1 : 2
                }}>
                    <Button
                        onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setGameToDelete(null);
                        }}
                        color="primary"
                        variant={isMobile ? 'outlined' : 'text'}
                        fullWidth={isMobile}
                        size={isMobile ? 'large' : 'medium'}
                        disabled={loading}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={handleConfirmDelete}
                        color="error"
                        variant={isMobile ? 'contained' : 'outlined'}
                        disabled={loading}
                        fullWidth={isMobile}
                        size={isMobile ? 'large' : 'medium'}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loading ? 'Wird gelöscht...' : 'Löschen'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default GameGroupDetailPage;
