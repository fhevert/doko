import React, {useEffect, useState} from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemSecondaryAction,
    TextField,
    Typography,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {Player} from '../../model/Player';
import {GameGroup} from '../../model/GameGroup';
import {Delete as DeleteIcon, PersonAdd as PersonAddIcon} from '@mui/icons-material';
import {getAllUsers, UserProfile} from '../../firebase/UserService';

type GameGroupFormData = Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>;

interface GameGroupDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (group: Omit<GameGroup, 'id' | 'createdAt' | 'updatedAt' | 'games' | 'rounds'>) => void;
    group: GameGroup | null;
}

const GameGroupDialog: React.FC<GameGroupDialogProps> = ({open, onClose, onSave, group}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [formData, setFormData] = useState<GameGroupFormData>({
        name: '',
        players: [],
        startFee: 5
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
                players: [...group.players],
                startFee: group.startFee || 0
            });
        } else {
            setFormData({
                name: '',
                players: [],
                startFee: 0
            });
        }
    }, [group]);

    const handleAddPlayer = (user: UserProfile) => {
        if (!formData.players.some(p => p.id === user.uid)) {
            const newPlayer: Player = {
                id: user.uid,
                email: user.email || '',
                name: user.lastName || 'Unbekannt',
                firstname: user.firstName || user.email?.split('@')[0] || 'Unbekannt',
                result: 0,
                aktiv: true
            };

            setFormData(prev => ({
                ...prev,
                players: [...prev.players, newPlayer]
            }));
            
            // Find the next available user who isn't already in the group
            const nextUser = availableUsers.find(u => 
                !formData.players.some(p => p.id === u.uid) && u.uid !== user.uid
            );
            
            // Set the next user as selected
            setSelectedUser(nextUser || null);
        }
    };

    const handleUserSelect = (event: React.SyntheticEvent, value: UserProfile | null) => {
        setSelectedUser(value);
    };

    const handleRemovePlayer = (id: string) => {
        // Only check for active players if it's an existing group
        if (group) {
            const activePlayers = formData.players.filter(p => p.aktiv);
            if (activePlayers.length === 1 && activePlayers[0].id === id) {
                return; // Don't remove the last active player in an existing group
            }
        }

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
            players: formData.players.filter(p => p.aktiv),
            startFee: formData.startFee
        });
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth={isMobile ? 'xs' : 'sm'} 
            fullWidth
            fullScreen={isMobile}
        >
            <DialogTitle sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
                {group ? 'Gruppe bearbeiten' : 'Neue Gruppe erstellen'}
            </DialogTitle>
            <DialogContent sx={{ pb: 2 }}>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Gruppenname"
                    fullWidth
                    variant="outlined"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                    sx={{mb: 2}}
                    size={isMobile ? 'small' : 'medium'}
                />

                <TextField
                    margin="dense"
                    label="Startgebühr (€)"
                    type="number"
                    fullWidth
                    variant="outlined"
                    value={formData.startFee}
                    onChange={(e) => setFormData(prev => ({...prev, startFee: parseFloat(e.target.value) || 0}))}
                    sx={{mb: 3}}
                    size={isMobile ? 'small' : 'medium'}
                    inputProps={{ min: 0, step: 0.5 }}
                />

                <Typography variant={isMobile ? 'subtitle1' : 'h6'} gutterBottom>
                    Spieler
                </Typography>
                <Box sx={{
                    display: 'flex', 
                    gap: 2, 
                    mb: 2, 
                    alignItems: 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    width: '100%'
                }}>
                    <Autocomplete
                        options={availableUsers.filter(user => 
                            !formData.players.some(player => player.id === user.uid)
                        )}
                        getOptionLabel={(user) => 
                            user.firstName && user.lastName 
                                ? `${user.firstName} ${user.lastName}` 
                                : user.email?.split('@')[0] || 'Unbekannt'
                        }
                        value={selectedUser}
                        onChange={handleUserSelect}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Spieler auswählen"
                                variant="outlined"
                                size={isMobile ? 'small' : 'small'}
                                sx={{ 
                                    minWidth: isMobile ? '100%' : 300,
                                    width: isMobile ? '100%' : 'auto'
                                }}
                            />
                        )}
                        renderOption={(props, user) => (
                            <li {...props}>
                                {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : user.email?.split('@')[0] || 'Unbekannter Benutzer'}
                            </li>
                        )}
                        isOptionEqualToValue={(option, value) => option.uid === value.uid}
                        noOptionsText="Keine weiteren Spieler verfügbar"
                        loadingText="Lade Benutzer..."
                        loading={loading}
                        disabled={loading}
                        fullWidth={isMobile}
                    />
                    <Button
                        variant="contained"
                        onClick={() => selectedUser && handleAddPlayer(selectedUser)}
                        startIcon={<PersonAddIcon/>}
                        disabled={!selectedUser}
                        sx={{ 
                            height: '40px',
                            width: isMobile ? '100%' : 'auto',
                            minWidth: isMobile ? '100%' : 'auto'
                        }}
                    >
                        Hinzufügen
                    </Button>
                </Box>
                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <List dense sx={{ maxHeight: isMobile ? '300px' : 'auto', overflowY: 'auto' }}>
                    {formData.players.map((player) => (
                        <ListItem key={player.id} divider sx={{ pr: isMobile ? 8 : 16 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={player.aktiv}
                                        onChange={() => handleToggleActive(player.id)}
                                        size={isMobile ? 'small' : 'medium'}
                                    />
                                }
                                label={`${player.firstname} ${player.name}`}
                                sx={{ 
                                    textDecoration: player.aktiv ? 'none' : 'line-through', 
                                    opacity: player.aktiv ? 1 : 0.7,
                                    fontSize: isMobile ? '0.875rem' : '1rem'
                                }}
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
            <DialogActions sx={{ 
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? 1 : 0,
                px: isMobile ? 2 : 3,
                pb: isMobile ? 2 : 3
            }}>
                <Button 
                    onClick={onClose}
                    fullWidth={isMobile}
                    sx={{ order: isMobile ? 2 : 1 }}
                >
                    Abbrechen
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={!formData.name.trim() || formData.players.filter(p => p.aktiv).length < 1}
                    fullWidth={isMobile}
                    sx={{ order: isMobile ? 1 : 2 }}
                >
                    Speichern
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default GameGroupDialog;
