import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useUser } from '../hooks/UserContext';

export default function Index() {
    const { user, loading } = useUser();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Redirect href={user ? '/(tabs)/dashboard' : '/login'} />;
}
