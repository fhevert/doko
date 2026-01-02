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
import {updateGameGroup} from '../../firebase/GameGroupService';
import {GameContext} from '../../model/context/GameContext';
import {Game} from '../../model/Game';
import {auth, firebaseDB as db} from '../../firebase/firebase-config';
import {DataSnapshot, get, onValue, ref, remove, set} from 'firebase/database'; // Import from modular SDK

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
            const gameRef = ref(db, `users/${user.uid}/games/${gameToDelete.id}`);
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
        const groupRef = ref(db, `users/${user.uid}/gameGroups/${groupId}`);
        
        // Handle successful data retrieval
        const onData = (snapshot: DataSnapshot) => {
            try {
                const groupData = snapshot.val();
                if (groupData) {
                    setGroup({
                        ...groupData,
                        id: groupId
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
            
            const gameRef = ref(db, `users/${user.uid}/games/${gameId}`);
            const snapshot = await get(gameRef);
            
            if (snapshot.exists()) {
                const gameData = snapshot.val() as Game;
                
                // Ensure rounds is an array and convert results back to Map
                const rounds = Array.isArray(gameData?.rounds) 
                    ? gameData.rounds.map((round) => ({
                        ...round,
                        results: new Map(round.results ? Object.entries(round.results) : [])
                    }))
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
                    navigate('/results');
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
                // Create a new game with the group's players
                const newGame: Game = {
                    id: Date.now().toString(), // Convert to string for Firebase
                    gameGroupId: groupId, // Add the required gameGroupId
                    players: group.players.map(player => ({
                        ...player,
                        aktiv: true, // Set all group players as active by default
                        result: 0    // Reset any previous results
                    })),
                    rounds: [], // Ensure rounds is always an array
                    averagePoints: 0,
                    date: new Date()
                };
                
                // Save the game to the database
                const user = auth.currentUser;
                if (!user) throw new Error('User not authenticated');
                
                const gameRef = ref(db, `users/${user.uid}/games/${newGame.id}`);
                await set(gameRef, newGame);
                
                // Update the group's games list
                const updatedGroup: GameGroup = {
                    ...group,
                    games: [...(group.games || []), newGame],
                    updatedAt: Date.now()
                };
                
                await updateGameGroup(groupId, updatedGroup);
                
                // Set the new game in context
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
                <Box display="flex" alignItems="center" mb={3}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
                        <ArrowBackIcon/>
                    </IconButton>
                    <Typography variant="h4" component="h1">
                        {group.name || `Gruppe ${group.id}`}
                    </Typography>
                </Box>

                <Box mb={4}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">Spiele</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon/>}
                            onClick={handleStartNewGame}
                            disabled={group.players === undefined || group.players.length === 0}
                        >
                            Neues Spiel starten
                        </Button>
                    </Box>

                    {games.length > 0 ? (
                        <List sx={{ bgcolor: 'background.paper' }}>
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
                                    {index < group.games!.length - 1 && <Divider component="li" />}
                                </React.Fragment>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="body1" color="textSecondary">
                            Noch keine Spiele vorhanden. Starten Sie ein neues Spiel!
                        </Typography>
                    )}
                </Box>

                <Box>
                    <Typography variant="h6" gutterBottom>Spieler</Typography>
                    <List>
                        {players.map((player, index) => (
                            <React.Fragment key={player.id || index}>
                                <ListItem>
                                    <ListItemText 
                                        primary={`${player.firstname || ''} ${player.name || ''}`.trim() || 'Unbenannter Spieler'}
                                        secondary={player.aktiv ? 'Aktiv' : 'Inaktiv'}
                                    />
                                </ListItem>
                                {index < players.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))}
                    </List>
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
