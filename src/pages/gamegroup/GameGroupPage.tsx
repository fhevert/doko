import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Snackbar,
    Typography
} from '@mui/material';
import {GameGroup} from '../../model/GameGroup';
import {Game} from '../../model/Game';
import {Link, useNavigate} from 'react-router-dom';
import GameGroupDialog from './GameGroupDialog';
import {Delete as DeleteIcon, Edit as EditIcon} from '@mui/icons-material';
import {
    createGameGroup,
    deleteGameGroup,
    getGameGroup,
    subscribeToGameGroups,
    updateGameGroup,
    updateGamesInGroup
} from "../../firebase/GameGroupService";
import { saveGameToFirebase } from '../../firebase/DbFunctions';
import AddIcon from "@mui/icons-material/Add";
import {useGameGroups} from '../../contexts/GameGroupsContext';

interface GameGroups {
    [key: string]: GameGroup;
}

const GameGroupPage: React.FC = () => {
    const { gameGroups, setGameGroups } = useGameGroups();
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GameGroup | null>(null);
    const [groupGames, setGroupGames] = useState<{ [key: string]: Game[] }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(false);
    const navigate = useNavigate();

    // Check if mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 600);
        };
        
        // Initial check
        checkMobile();
        
        // Add event listener for window resize
        window.addEventListener('resize', checkMobile);
        
        // Cleanup
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const unsubscribe = subscribeToGameGroups(
            (groups) => {
                setGameGroups(groups);
                setLoading(false);
            },
            (error) => {
                console.error('Error loading game groups:', error);
                setError('Fehler beim Laden der Spielgruppen');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    // Funktion zum Laden der Spiele einer Gruppe
    const loadGroupGames = async (groupId: string) => {
        try {
            const group = await getGameGroup(groupId);
            if (group?.games) {
                const games = Object.values(group.games);
                setGroupGames(prev => ({ ...prev, [groupId]: games }));
            }
        } catch (error) {
            console.error('Error loading group games:', error);
        }
    };

    // Lade Spiele wenn eine Gruppe zum Bearbeiten ausgewählt wird
    useEffect(() => {
        if (selectedGroup) {
            loadGroupGames(selectedGroup.id);
        }
    }, [selectedGroup]);

    const handleSaveGroup = async (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => {
        try {
            if (selectedGroup) {
                await updateGameGroup(selectedGroup.id, group);
            } else {
                // Erstelle die Gruppe und füge sie sofort zum State hinzu
                const newGroup = await createGameGroup(group);
                // Füge die neue Gruppe sofort zum lokalen State hinzu
                setGameGroups(prev => ({
                    ...prev,
                    [newGroup.id]: newGroup
                }));
            }
            setOpenDialog(false);
            setSelectedGroup(null);
        } catch (error) {
            console.error('Error saving game group:', error);
            setError('Fehler beim Speichern der Spielgruppe');
        }
    };

    const handleDeleteGroup = (groupId: string) => {
        setGroupToDelete(groupId);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!groupToDelete) return;
        
        try {
            await deleteGameGroup(groupToDelete);
            // Entferne die Gruppe sofort aus dem lokalen State
            setGameGroups(prev => {
                const newGroups = { ...prev };
                delete newGroups[groupToDelete];
                return newGroups;
            });
            setIsDeleteDialogOpen(false);
            setGroupToDelete(null);
        } catch (error) {
            console.error('Error deleting game group:', error);
            setError('Fehler beim Löschen der Spielgruppe');
            setIsDeleteDialogOpen(false);
            setGroupToDelete(null);
        }
    };

    // Callback für aktualisierte Spiele nach Tausch
    const handleGamesUpdate = async (updatedGames: Game[]) => {
        if (selectedGroup) {
            try {
                // Speichere die aktualisierten Spiele direkt in der Gruppe
                await updateGamesInGroup(selectedGroup.id, updatedGames);
                
                // Update local state
                setGroupGames(prev => ({ ...prev, [selectedGroup.id]: updatedGames }));
                console.log('Games updated successfully in group:', selectedGroup.id);
            } catch (error) {
                console.error('Error updating games in group:', error);
            }
        }
    };

    const handleOpenDialog = () => {
        setSelectedGroup(null);
        setOpenDialog(true);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{mt: 4, mb: 4}}>

                {loading ? (
                    <Box display="flex" justifyContent="center" my={4}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <List>
                        {Object.entries(gameGroups).map(([id, group]) => (
                            <ListItem
                                key={id}
                                divider
                                button
                                component={Link}
                                to={`/game-groups/${id}`}
                                sx={{
                                    '&:hover': {
                                        backgroundColor: 'action.hover',
                                    },
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    display: 'block',
                                    pr: 12 // Reduced padding for icon buttons
                                }}
                                secondaryAction={
                                    <Box sx={{display: 'flex', gap: 1}} onClick={(e) => e.stopPropagation()}>
                                        <IconButton
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedGroup(group);
                                                setOpenDialog(true);
                                            }}
                                            disabled={loading}
                                            size="small"
                                            title="Bearbeiten"
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteGroup(id);
                                            }}
                                            disabled={loading}
                                            size="small"
                                            color="error"
                                            title="Löschen"
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={group.name || `Gruppe ${id}`}
                                    secondary={
                                        `${group.players?.length || 0} Spieler | 
                                        ${group.games ? Object.keys(group.games).length : 0} Spiele`
                                    }
                                />
                            </ListItem>
                        ))}
                        {Object.keys(gameGroups).length === 0 && !loading && (
                            <Typography variant="body1" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                                Noch keine Spielgruppen vorhanden. Erstellen Sie eine neue Spielgruppe.
                            </Typography>
                        )}
                    </List>
                )}
            </Box>

            {/* Fixed bottom button */}
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
                        startIcon={<AddIcon />}
                        onClick={handleOpenDialog}
                        size="large"
                    >
                        Neue Gruppe erstellen
                    </Button>
                </Container>
            </Box>

            <GameGroupDialog
                open={openDialog}
                onClose={() => {
                    setOpenDialog(false);
                    setSelectedGroup(null);
                }}
                onSave={handleSaveGroup}
                group={selectedGroup}
                games={selectedGroup ? groupGames[selectedGroup.id] || [] : []}
                onGamesUpdate={handleGamesUpdate}
            />
            <Snackbar
                open={!!error}
                autoHideDuration={6000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onClose={() => {
                    setIsDeleteDialogOpen(false);
                    setGroupToDelete(null);
                }}
            >
                <DialogTitle>Spielgruppe löschen</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Möchten Sie diese Spielgruppe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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
                            setGroupToDelete(null);
                        }}
                        variant="outlined"
                        color="primary"
                        fullWidth={isMobile}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        color="error"
                        variant="contained"
                        fullWidth={isMobile}
                    >
                        Löschen
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default GameGroupPage;
