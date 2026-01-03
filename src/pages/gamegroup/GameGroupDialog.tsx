import React, {useState, useEffect} from 'react';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Checkbox,
    FormControlLabel,
    Box,
    Typography,
    SelectChangeEvent,
    Autocomplete
} from '@mui/material';
import {Player} from '../../model/Player';
import {GameGroup} from '../../model/GameGroup';
import {Add as AddIcon, Delete as DeleteIcon, PersonAdd as PersonAddIcon} from '@mui/icons-material';
import {getAllUsers, UserProfile} from '../../firebase/UserService';

type GameGroupFormData = Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>;

interface GameGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => void;
    group: GameGroup | null;
}

const GameGroupDialog: React.FC<GameGroupDialogProps> = ({open, onClose, onSave, group}) => {
    const [formData, setFormData] = useState<GameGroupFormData>({
        name: '',
        players: []
    });
    const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const users = await getAllUsers();
                setAvailableUsers(users);
                setError(null);
            } catch (err) {
                console.error('Error loading users:', err);
                setError('Fehler beim Laden der Benutzer');
            } finally {
                setLoading(false);
            }
        };

        if (open) {
            fetchUsers();
        }
    }, [open]);

    useEffect(() => {
        if (group) {
            setFormData({
                name: group.name || '',
                players: [...group.players]
            });
        } else {
            setFormData({
                name: '',
                players: []
            });
        }
    }, [group]);

    const handleAddPlayer = (user: UserProfile) => {
        if (!formData.players.some(p => p.id === user.uid)) {
            const newPlayer: Player = {
                id: user.uid,
                name: user.displayName?.split(' ').slice(-1)[0] || 'Unbekannt',
                firstname: user.displayName?.split(' ')[0] || 'Unbekannt',
                result: 0,
                aktiv: true
            };

            setFormData(prev => ({
                ...prev,
                players: [...prev.players, newPlayer]
            }));
            
            // Reset the selected user
            setSelectedUser(null);
        }
    };

    const handleUserSelect = (event: React.SyntheticEvent, value: UserProfile | null) => {
        if (value) {
            handleAddPlayer(value);
        }
    };

    const handleRemovePlayer = (id: string) => {
        setFormData(prev => ({
            ...prev,
            players: prev.players.filter(player => player.id !== id)
        }));
    };

    const handleToggleActive = (id: string) => {
        setFormData(prev => ({
            ...prev,
            players: prev.players.map(player =>
                player.id === id ? {...player, aktiv: !player.aktiv} : player
            )
        }));
    };

    const handleSubmit = () => {
        onSave({
            name: formData.name,
            players: formData.players.filter(p => p.aktiv)
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>{group ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Gruppenname"
                    fullWidth
                    variant="outlined"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    sx={{mb: 3}}
                />

                <Typography variant="h6" gutterBottom>Spieler</Typography>
                <Box sx={{display: 'flex', gap: 2, mb: 2, alignItems: 'center'}}>
                    <Autocomplete
                        options={availableUsers}
                        getOptionLabel={(user) => 
                            user.displayName || `${user.email?.split('@')[0] || 'Unbekannt'}`
                        }
                        value={selectedUser}
                        onChange={handleUserSelect}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Spieler auswählen"
                                variant="outlined"
                                size="small"
                                sx={{ minWidth: 300 }}
                            />
                        )}
                        renderOption={(props, user) => (
                            <li {...props}>
                                {user.displayName || user.email?.split('@')[0] || 'Unbekannter Benutzer'}
                            </li>
                        )}
                        isOptionEqualToValue={(option, value) => option.uid === value.uid}
                        noOptionsText="Keine Benutzer gefunden"
                        loading={loading}
                        loadingText="Lade Benutzer..."
                        disabled={loading}
                    />
                    <Button
                        variant="contained"
                        onClick={() => selectedUser && handleAddPlayer(selectedUser)}
                        startIcon={<PersonAddIcon/>}
                        disabled={!selectedUser}
                        sx={{ height: '40px' }}
                    >
                        Hinzufügen
                    </Button>
                </Box>
                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <List dense>
                    {formData.players.map((player) => (
                        <ListItem key={player.id} divider>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={player.aktiv}
                                        onChange={() => handleToggleActive(player.id)}
                                    />
                                }
                                label={`${player.firstname} ${player.name}`}
                                sx={{ textDecoration: player.aktiv ? 'none' : 'line-through', opacity: player.aktiv ? 1 : 0.7 }}
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => handleRemovePlayer(player.id)}
                                >
                                    <DeleteIcon/>
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Abbrechen</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!formData.name.trim() || formData.players.filter(p => p.aktiv).length < 2}
                >
                    Speichern
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GameGroupDialog;
