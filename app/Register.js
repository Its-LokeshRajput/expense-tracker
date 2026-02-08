import { useState } from 'react';

import { useRouter } from 'expo-router';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getDB } from '../constants/db';
import { useUser } from '../hooks/UserContext';

export default function Register() {
    const router = useRouter();

    const { login } = useUser();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const registerUser = async () => {
        if (!name || !email || !password) {
            Alert.alert('All fields are required');
            return;
        }

        console.log({ name, email, password })

        const db = getDB();

        try {
            await db.runAsync(
                `INSERT INTO users (name, email, password)
         VALUES (?, ?, ?)`,
                name,
                email,
                password
            );

            const user = await db.getFirstAsync(
                `SELECT * FROM users WHERE email = ?`,
                email
            );

            await login(user);
            router.push('/login')
        } catch (err) {
            Alert.alert('Email already exists');
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Create Account</Text>

            <TextInput
                placeholder="Full Name"
                style={styles.input}
                value={name}
                onChangeText={setName}
            />

            <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
            />

            <TextInput
                placeholder="Password"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={registerUser}>
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={{ marginTop: 15 }}>Already have account? Login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', padding: 20 },
    heading: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        marginBottom: 15
    },
    button: {
        backgroundColor: '#2563EB',
        padding: 14,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonText: { color: '#fff', fontWeight: '600' }
});
