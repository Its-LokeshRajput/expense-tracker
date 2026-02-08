import { useRouter } from 'expo-router';
import { useState } from 'react';
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

export default function Login() {
    const { login } = useUser();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const router = useRouter();


    const loginUser = async () => {
        if (!email || !password) {
            Alert.alert('Enter email & password');
            return;
        }

        const db = getDB();

        const user = await db.getFirstAsync(
            `SELECT * FROM users WHERE email = ? AND password = ?`,
            email,
            password
        );

        if (!user) {
            Alert.alert('Invalid credentials');
            return;
        }

        await login(user);
        router.push('/dashboard')
        // console.log('user :: ', user)
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Welcome Back</Text>

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

            <TouchableOpacity style={styles.button} onPress={loginUser}>
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push('/Register')}>
                <Text style={{ marginTop: 15 }}>Don't have account? Register</Text>
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
