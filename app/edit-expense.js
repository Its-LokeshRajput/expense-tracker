import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Button,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { getDB } from '../constants/db';
import { useUser } from '../hooks/UserContext';

export default function EditExpense() {
    const { id } = useLocalSearchParams();
    const expenseId = Number(id);
    const { user } = useUser();

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [categoryId, setCategoryId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [date, setDate] = useState(new Date());

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    /* ================= LOAD ================= */

    useEffect(() => {
        if (!expenseId) {
            setError('Invalid expense ID.');
            setLoading(false);
            return;
        }

        const loadData = async () => {
            try {
                const db = await getDB();

                const expense = await db.getFirstAsync(
                    `SELECT * FROM transactions WHERE id = ?`,
                    [expenseId]
                );

                if (!expense) {
                    setError('Expense not found.');
                    return;
                }

                const categoryResult = await db.getAllAsync(
                    `SELECT * FROM categories
           WHERE user_id = ? AND type = 'expense'
           ORDER BY name ASC`,
                    [user.id]
                );

                setCategories(categoryResult || []);

                setTitle(expense.title);
                setAmount(String(expense.amount));
                setNotes(expense.notes || '');
                setCategoryId(expense.category_id);
                setDate(new Date(expense.date));
            } catch (err) {
                setError('Failed to load expense.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [expenseId]);

    /* ================= UPDATE ================= */

    const updateExpense = async () => {
        if (!title.trim()) {
            Alert.alert('Validation', 'Title is required');
            return;
        }

        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            Alert.alert('Validation', 'Enter valid amount');
            return;
        }

        if (!categoryId) {
            Alert.alert('Validation', 'Select category');
            return;
        }

        try {
            setSaving(true);
            const db = await getDB();

            await db.runAsync(
                `UPDATE transactions
         SET title = ?, 
             amount = ?, 
             notes = ?, 
             category_id = ?, 
             date = ?
         WHERE id = ?`,
                [
                    title.trim(),
                    Number(amount),
                    notes.trim(),
                    categoryId,
                    date.toISOString().split('T')[0],
                    expenseId
                ]
            );

            Alert.alert('Success', 'Expense updated successfully');
            router.back();
        } catch (err) {
            Alert.alert('Error', 'Failed to update expense');
        } finally {
            setSaving(false);
        }
    };

    /* ================= UI STATES ================= */

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563EB" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 18, color: '#DC2626' }}>{error}</Text>
                <Button title="Go Back" onPress={() => router.back()} />
            </View>
        );
    }

    /* ================= UI ================= */

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.heading}>Edit Expense</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Title"
                    value={title}
                    onChangeText={setTitle}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Amount"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.pickerWrapper}>
                    <Picker
                        selectedValue={categoryId}
                        onValueChange={(value) => setCategoryId(value)}
                    >
                        <Picker.Item label="Select Category" value={null} />
                        {categories.map(cat => (
                            <Picker.Item
                                key={cat.id}
                                label={cat.name}
                                value={cat.id}
                            />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>Date</Text>
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        if (selectedDate) setDate(selectedDate);
                    }}
                />

                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Notes (optional)"
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                />

                <View style={{ marginTop: 12 }}>
                    <Button
                        title={saving ? "Updating..." : "Update Expense"}
                        onPress={updateExpense}
                        disabled={saving}
                    />
                </View>
            </View>
        </View>
    );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6FA',
        padding: 16
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 3
    },
    heading: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        padding: 12,
        fontSize: 15,
        marginBottom: 12,
        backgroundColor: '#F9FAFB'
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        marginBottom: 12,
        backgroundColor: '#F9FAFB'
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    }
});
