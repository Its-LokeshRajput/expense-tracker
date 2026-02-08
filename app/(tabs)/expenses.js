import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { getMonthRange } from '../../constants/date';
import { getDB } from '../../constants/db';
import { useUser } from '../../hooks/UserContext';

export default function Expenses() {
    const { user } = useUser();

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);

    const [month, setMonth] = useState(new Date().getMonth());
    const [year, setYear] = useState(new Date().getFullYear());

    const [refreshing, setRefreshing] = useState(false);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [minAmount, setMinAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [sortType, setSortType] = useState('date_desc');

    /* ================= LOAD ================= */
    const loadExpenses = async () => {
        const db = await getDB();
        const { start, end } = getMonthRange(year, month);

        const result = await db.getAllAsync(
            `SELECT t.*, c.name as category, c.color as color
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ?
               AND t.type = 'expense'
               AND t.date BETWEEN ? AND ?
             ORDER BY t.date DESC`,
            [user.id, start, end]
        );

        const categoryResult = await db.getAllAsync(
            `SELECT * FROM categories
             WHERE user_id = ? AND type = 'expense'
             ORDER BY name ASC`,
            [user.id]
        );

        setExpenses(result || []);
        setCategories(categoryResult || []);
    };

    useFocusEffect(
        useCallback(() => {
            loadExpenses();
        }, [month, year])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadExpenses();
        setRefreshing(false);
    };

    /* ================= FILTER + SORT ================= */
    const filteredExpenses = useMemo(() => {
        let data = [...expenses];

        // Search
        if (search.trim()) {
            data = data.filter(item =>
                item.title?.toLowerCase().includes(search.toLowerCase())
            );
        }

        // Category
        if (selectedCategory) {
            data = data.filter(
                item => item.category_id === selectedCategory
            );
        }

        // Min amount
        if (minAmount) {
            data = data.filter(
                item => item.amount >= Number(minAmount)
            );
        }

        // Max amount
        if (maxAmount) {
            data = data.filter(
                item => item.amount <= Number(maxAmount)
            );
        }

        // Sorting
        switch (sortType) {
            case 'date_asc':
                data.sort((a, b) => new Date(a.date) - new Date(b.date));
                break;
            case 'amount_desc':
                data.sort((a, b) => b.amount - a.amount);
                break;
            case 'amount_asc':
                data.sort((a, b) => a.amount - b.amount);
                break;
            default:
                data.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return data;
    }, [expenses, search, selectedCategory, minAmount, maxAmount, sortType]);

    const totalAmount = useMemo(() => {
        return filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
    }, [filteredExpenses]);

    const deleteExpense = async (id) => {
        const db = await getDB();
        await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
        loadExpenses();
    };

    /* ================= UI ================= */
    return (
        <View style={styles.container}>

            {/* SEARCH */}
            <TextInput
                placeholder="Search..."
                value={search}
                onChangeText={setSearch}
                style={styles.input}
            />

            {/* AMOUNT RANGE */}
            <View style={styles.rowBetween}>
                <TextInput
                    placeholder="Min ₹"
                    value={minAmount}
                    onChangeText={setMinAmount}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1, marginRight: 8 }]}
                />
                <TextInput
                    placeholder="Max ₹"
                    value={maxAmount}
                    onChangeText={setMaxAmount}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1 }]}
                />
            </View>

            {/* SORT */}
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[
                    { id: 'date_desc', name: 'Newest' },
                    { id: 'date_asc', name: 'Oldest' },
                    { id: 'amount_desc', name: 'High ₹' },
                    { id: 'amount_asc', name: 'Low ₹' }
                ]}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => setSortType(item.id)}
                        style={[
                            styles.chip,
                            sortType === item.id && styles.chipActive

                        ]}
                    >
                        <Text
                            style={{
                                color: sortType === item.id ? '#fff' : '#111827',
                                fontSize: 14,
                                fontWeight: '500'
                            }}
                        >
                            {item.name}
                        </Text>

                    </Pressable>
                )}
                style={{
                    marginBottom: 10
                }}
            />

            {/* SUMMARY */}
            <View style={styles.summary}>
                <Text style={styles.summaryText}>
                    {filteredExpenses.length} Expenses
                </Text>
                <Text style={styles.summaryAmount}>
                    ₹ {totalAmount}
                </Text>
            </View>

            {/* LIST */}
            <FlatList

                data={filteredExpenses}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                initialNumToRender={15}
                maxToRenderPerBatch={20}
                windowSize={10}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 80 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ fontSize: 40 }}>📉</Text>
                        <Text style={styles.emptyText}>
                            No expenses found
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <View style={styles.rowBetween}>
                            <View>
                                <Text style={styles.title}>
                                    {item.title}
                                </Text>
                                <Text style={styles.category}>
                                    {item.category}
                                </Text>
                            </View>

                            <Text style={styles.amount}>
                                ₹ {item.amount}
                            </Text>
                        </View>

                        <View style={styles.actions}>
                            <Pressable
                                onPress={() =>
                                    router.push(`/edit-expense?id=${item.id}`)
                                }
                            >
                                <Text style={styles.edit}>Edit</Text>
                            </Pressable>

                            <Pressable
                                onPress={() => deleteExpense(item.id)}
                            >
                                <Text style={styles.delete}>Delete</Text>
                            </Pressable>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6FA',
        padding: 16
    },

    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 10
    },

    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    chip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E5E7EB',
        borderRadius: 20,
        marginRight: 8,
        minHeight: 36,   // prevents height jump
    },


    chipActive: {
        backgroundColor: '#2563EB'
    },

    summary: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        elevation: 2
    },

    summaryText: {
        color: '#6B7280'
    },

    summaryAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#DC2626'
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        elevation: 2
    },

    title: {
        fontSize: 15,
        fontWeight: '600'
    },

    category: {
        fontSize: 12,
        color: '#6B7280'
    },

    amount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#DC2626'
    },

    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 20
    },

    edit: {
        color: '#2563EB',
        fontWeight: '600'
    },

    delete: {
        color: '#DC2626',
        fontWeight: '600'
    },

    emptyContainer: {
        alignItems: 'center',
        marginTop: 60
    },

    emptyText: {
        color: '#6B7280',
        marginTop: 8
    }
});
