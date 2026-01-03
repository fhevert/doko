import React, { useState, FormEvent } from 'react';
import {
    TextField,
    Button,
    Container,
    Typography,
    Box,
    Alert,
    CircularProgress,
} from '@mui/material';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from "../firebase/firebase-config";

function Login() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Bitte geben Sie E-Mail und Passwort ein');
            return;
        }
        
        setError('');
        setIsLoading(true);
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/doko');
        } catch (err: any) {
            console.error('Login error:', err);
            setError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Bitte geben Sie E-Mail und Passwort ein');
            return;
        }
        
        setError('');
        setIsLoading(true);
        
        try {
            // User creation and profile creation is handled in AuthContext
            await createUserWithEmailAndPassword(auth, email, password);
            // No need to navigate here, as the AuthContext will handle the redirect
            // after the user profile is created
        } catch (err: any) {
            console.error('Registration error:', err);
            setError('Registrierung fehlgeschlagen. ' + 
                (err.code === 'auth/email-already-in-use' 
                    ? 'Diese E-Mail wird bereits verwendet.' 
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
                    Login / Registrierung
                </Typography>
                <Box component="form" onSubmit={handleLogin} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="E-Mail-Adresse"
                        name="email"
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} // Typisierung des ChangeEvent
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="password"
                        label="Passwort"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} // Typisierung des ChangeEvent
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
                        onClick={handleLogin}
                    >
                        Login
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 1, mb: 2 }}
                        onClick={handleRegister}
                    >
                        Registrieren
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default Login;
// Add this line at the very end of the file if you're still getting TS1208
export {};