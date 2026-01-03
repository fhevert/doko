import React, { useState, useEffect } from 'react';
import {
    Container,
    TextField,
    Button,
    Typography,
    Box,
    Avatar,
    IconButton,
    CircularProgress,
    Alert
} from '@mui/material';
import { useAuth } from '../../firebase/AuthContext';
import { updateUserProfile, uploadProfileImage } from '../../firebase/UserService';
import { useNavigate } from 'react-router-dom';
import { ArrowBack as ArrowBackIcon, CameraAlt as CameraAltIcon } from '@mui/icons-material';

const ProfilePage: React.FC = () => {
    const { currentUser } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            setFirstName(currentUser.displayName?.split(' ')[0] || '');
            setLastName(currentUser.displayName?.split(' ').slice(1).join(' ') || '');
            setPhotoURL(currentUser.photoURL || '');
        }
    }, [currentUser]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setLoading(true);
            const downloadURL = await uploadProfileImage(file, currentUser!.uid);
            setPhotoURL(downloadURL);
            await updateUserProfile(currentUser!.uid, { photoURL: downloadURL });
            setSuccess('Profilbild erfolgreich aktualisiert');
        } catch (err) {
            console.error('Error uploading image:', err);
            setError('Fehler beim Hochladen des Profilbilds');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!firstName.trim() || !lastName.trim()) {
            setError('Bitte geben Sie Vor- und Nachname ein');
            return;
        }

        try {
            setLoading(true);
            setError('');
            
            await updateUserProfile(currentUser!.uid, {
                displayName: `${firstName.trim()} ${lastName.trim()}`,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                photoURL: photoURL || ''
            });
            
            setSuccess('Profil erfolgreich aktualisiert');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Fehler beim Aktualisieren des Profils');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" component="h1">
                        Mein Profil
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={photoURL}
                            sx={{ width: 120, height: 120, fontSize: 40 }}
                            alt={currentUser?.displayName || 'Profilbild'}
                        >
                            {!photoURL && (currentUser?.email?.[0]?.toUpperCase() || 'U')}
                        </Avatar>
                        <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="profile-image-upload"
                            type="file"
                            onChange={handleImageUpload}
                        />
                        <label htmlFor="profile-image-upload">
                            <IconButton
                                color="primary"
                                aria-label="upload picture"
                                component="span"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    backgroundColor: 'background.paper',
                                    '&:hover': { backgroundColor: 'action.hover' }
                                }}
                            >
                                <CameraAltIcon />
                            </IconButton>
                        </label>
                    </Box>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                {success && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        {success}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="firstName"
                        label="Vorname"
                        name="firstName"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="lastName"
                        label="Nachname"
                        name="lastName"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="email"
                        label="E-Mail"
                        name="email"
                        autoComplete="email"
                        value={currentUser?.email || ''}
                        disabled
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Profil speichern'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default ProfilePage;
