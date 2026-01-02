import React, {useEffect, useState} from 'react';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    List,
    ListItem,
    ListItemText,
    Snackbar,
    Typography
} from '@mui/material';
import {GameGroup} from '../../model/GameGroup';
import {Link, useNavigate} from 'react-router-dom';
import GameGroupDialog from './GameGroupDialog';
import {
    createGameGroup,
    deleteGameGroup,
    subscribeToGameGroups,
    updateGameGroup
} from "../../firebase/GameGroupService";

interface GameGroups {
    [key: string]: GameGroup;
}

const GameGroupPage: React.FC = () => {
    const [gameGroups, setGameGroups] = useState<GameGroups>({});
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GameGroup | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

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

    const handleSaveGroup = async (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => {
        try {
            if (selectedGroup) {
                await updateGameGroup(selectedGroup.id, group);
            } else {
                await createGameGroup(group);
            }
            setOpenDialog(false);
            setSelectedGroup(null);
        } catch (error) {
            console.error('Error saving game group:', error);
            setError('Fehler beim Speichern der Spielgruppe');
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (window.confirm('Möchten Sie diese Spielgruppe wirklich löschen?')) {
            try {
                await deleteGameGroup(groupId);
            } catch (error) {
                console.error('Error deleting game group:', error);
                setError('Fehler beim Löschen der Spielgruppe');
            }
        }
    };

    const handleStartNewGame = (group: GameGroup) => {
        navigate(`/game?groupId=${group.id}`);
    };

    return (
        <Container maxWidth="md">
            <Box sx={{mt: 4, mb: 4}}>
                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3}}>
                    <Typography variant="h4" component="h1">Spielgruppen</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                            setSelectedGroup(null);
                            setOpenDialog(true);
                        }}
                        disabled={loading}
                    >
                        Neue Gruppe erstellen
                    </Button>
                </Box>

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
                                    pr: 20 // Add padding to prevent text overlap with buttons
                                }}
                                secondaryAction={
                                    <Box sx={{display: 'flex', gap: 1}} onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="outlined"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSelectedGroup(group);
                                                setOpenDialog(true);
                                            }}
                                            disabled={loading}
                                        >
                                            Bearbeiten
                                        </Button>
                                        <Button
                                            variant="contained"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleStartNewGame(group);
                                            }}
                                            disabled={loading}
                                        >
                                            Neues Spiel
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDeleteGroup(id);
                                            }}
                                            disabled={loading}
                                        >
                                            Löschen
                                        </Button>
                                    </Box>
                                }
                            >
                                <ListItemText
                                    primary={group.name || `Gruppe ${id}`}
                                    secondary={`${group.players?.length || 0} Spieler | ${group.games?.length || 0} Spiele`}
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

            <GameGroupDialog
                open={openDialog}
                onClose={() => {
                    setOpenDialog(false);
                    setSelectedGroup(null);
                }}
                onSave={handleSaveGroup}
                group={selectedGroup}
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
        </Container>
    );
};

export default GameGroupPage;
