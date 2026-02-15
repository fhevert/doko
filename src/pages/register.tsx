import React, {FormEvent, useState} from 'react';
import {Alert, Box, Button, Container, TextField, Typography,} from '@mui/material';
import {createUserWithEmailAndPassword} from 'firebase/auth';
import {useNavigate} from 'react-router-dom';
import {auth} from "../firebase/firebase-config";
import {createUserProfile} from "../firebase/UserService";

function Register() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password || !firstName || !lastName) {
            setError('Bitte füllen Sie alle Felder aus');
            return;
        }
        
        setError('');
        setIsLoading(true);
        
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Profil direkt erstellen, da AuthContext nicht mehr stört
            await createUserProfile(userCredential.user, {
                firstName,
                lastName
            });
            
            console.log('Registration completed for:', userCredential.user.email);
            navigate('/game-groups');
        } catch (err: any) {
            console.error('Registration error:', err);
            setError('Registrierung fehlgeschlagen. ' + 
                (err.code === 'auth/email-already-in-use' 
                    ? 'Diese E-Mail wird bereits verwendet.' 
                    : err.code === 'auth/weak-password'
                    ? 'Das Passwort ist zu schwach. Bitte wählen Sie ein stärkeres Passwort.'
                    : err.code === 'auth/invalid-email'
                    ? 'Die E-Mail-Adresse ist ungültig.'
                    : err.message || 'Bitte versuchen Sie es später erneut.')
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Registrieren
                </Typography>
                <Box component="form" onSubmit={handleRegister} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="firstName"
                        label="Vorname"
                        name="firstName"
                        autoComplete="given-name"
                        autoFocus
                        value={firstName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
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
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="E-Mail-Adresse"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="password"
                        label="Passwort"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                    {error && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registrierung...' : 'Registrieren'}
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 1, mb: 2 }}
                        onClick={() => navigate('/login')}
                    >
                        Zurück zum Login
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Register;
export {};
