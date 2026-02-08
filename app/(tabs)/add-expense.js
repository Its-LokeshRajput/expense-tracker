import { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { getDB } from '../../constants/db';
import { useUser } from '../../hooks/UserContext';

export default function AddExpense() {
    const { user } = useUser();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [categories, setCategories] = useState([]);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date());

    const [refreshing, setRefreshing] = useState(false);


    const [selectedCategory, setSelectedCategory] = useState(null);

    // Load categories from DB
    useEffect(() => {
        loadCategories();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadCategories();
        setRefreshing(false);
    };

    const loadCategories = async () => {
        const db = await getDB()

        const result = await db.getAllAsync(
            `SELECT * FROM categories WHERE user_id = ? AND type = 'expense' ORDER BY name ASC`, [user.id]
        );


        setCategories(result || []);
    };

    const addExpense = async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Please enter title');
            return;
        }

        if (!amount || isNaN(amount)) {
            Alert.alert('Validation', 'Please enter valid amount');
            return;
        }

        if (!selectedCategory) {
            Alert.alert('Validation', 'Please select category');
            return;
        }

        const db = await getDB();

        const formattedDate = new Date().toISOString().split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        await db.runAsync(
            `INSERT INTO transactions
   (user_id, title, amount, type, category_id, notes, date)
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                user.id,
                title.trim(),
                Number(amount),
                'expense',
                selectedCategory.id,
                notes,
                today
            ]
        );


        setTitle('');
        setAmount('');
        setSelectedCategory(null);

        Alert.alert('Success', 'Expense added 🎉', [
            { text: 'OK' }
        ]);

    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >

            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                <View style={styles.container}>
                    <Text style={{ marginBottom: 10, color: '#6B7280' }}>
                        Date: {new Date().toDateString()}
                    </Text>

                    <View style={styles.card}>
                        <Text style={styles.pageTitle}>Add Expense</Text>
                        <Text style={styles.pageSubtitle}>
                            Track where your money goes 💸
                        </Text>

                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Grocery, Petrol"
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Amount</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 250"
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <Text style={styles.label}>Category</Text>

                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {categories.map((item) => (
                                <TouchableOpacity
                                    key={item.id}
                                    onPress={() => setSelectedCategory(item)}
                                    style={[
                                        styles.categoryChip,
                                        selectedCategory?.id === item.id && {
                                            backgroundColor: item.color || '#2563EB'
                                        }
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.categoryText,
                                            selectedCategory?.id === item.id && {
                                                color: '#fff'
                                            }
                                        ]}
                                    >
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>

                            ))}
                        </View>

                        <Text style={styles.label}>Notes</Text>
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Optional notes..."
                            multiline
                            value={notes}
                            onChangeText={setNotes}
                        />


                        <TouchableOpacity
                            style={[
                                styles.button,
                                (!title || !amount || !selectedCategory) && {
                                    backgroundColor: '#D1D5DB',
                                    shadowOpacity: 0
                                }
                            ]}

                            onPress={addExpense}
                            disabled={!title || !amount || !selectedCategory}
                        >
                            <Text style={styles.buttonText}>Add Expense</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6FA',
        padding: 20,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4
    },

    pageSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20
    },

    categoryChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 30,
        marginRight: 10,
        marginBottom: 10,
        backgroundColor: '#F3F4F6'
    },

    categoryText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#374151'
    },


    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }
    },

    heading: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        color: '#111827'
    },

    label: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 6
    },

    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 18
    },


    button: {
        backgroundColor: '#2563EB',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 16,
        elevation: 4,
        shadowColor: '#2563EB',
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 }
    },


    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600'
    }
});
