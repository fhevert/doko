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
    Typography
} from '@mui/material';
import {Player} from '../../model/Player';
import {GameGroup} from '../../model/GameGroup';
import {Add as AddIcon, Delete as DeleteIcon} from '@mui/icons-material';

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
    const [newPlayerName, setNewPlayerName] = useState('');
    const [newPlayerFirstname, setNewPlayerFirstname] = useState('');

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

    const handleAddPlayer = () => {
        if (newPlayerName.trim() && newPlayerFirstname.trim()) {
            const newPlayer: Player = {
                id: Date.now().toString(),
                name: newPlayerName.trim(),
                firstname: newPlayerFirstname.trim(),
                result: 0,
                aktiv: true
            };
            setFormData(prev => ({
                ...prev,
                players: [...prev.players, newPlayer]
            }));
            setNewPlayerName('');
            setNewPlayerFirstname('');
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
                <Box sx={{display: 'flex', gap: 2, mb: 2}}>
                    <TextField
                        label="Vorname"
                        value={newPlayerFirstname}
                        onChange={(e) => setNewPlayerFirstname(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                    />
                    <TextField
                        label="Nachname"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddPlayer}
                        startIcon={<AddIcon/>}
                        disabled={!newPlayerName.trim() || !newPlayerFirstname.trim()}
                    >
                        Hinzufügen
                    </Button>
                </Box>

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
