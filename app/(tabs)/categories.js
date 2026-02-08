import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View
} from 'react-native';
import { getDB } from '../../constants/db';
import { useUser } from '../../hooks/UserContext';

export default function Categories() {
    const { user } = useUser();
    const [editingId, setEditingId] = useState(null);

    const [categories, setCategories] = useState([]);
    const [name, setName] = useState('');
    const [type, setType] = useState('expense');

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');

    const filteredCategories = categories.filter((item) => {
        const matchesSearch = item.name
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesFilter =
            filter === 'all' ? true : item.type === filter;

        return matchesSearch && matchesFilter;
    });


    const loadCategories = async () => {
        const db = await getDB();

        const result = await db.getAllAsync(
            `SELECT * FROM categories 
       WHERE user_id = ? 
       ORDER BY type ASC, name ASC`,
            [user.id]
        );

        setCategories(result);
    };

    useFocusEffect(
        useCallback(() => {
            loadCategories();
        }, [])
    );

    const addCategory = async () => {
        if (!name.trim()) {
            Alert.alert("Enter category name");
            return;
        }

        const db = await getDB();

        // Duplicate check (ignore current editing item)
        const existing = await db.getFirstAsync(
            `SELECT * FROM categories 
         WHERE user_id = ? 
         AND LOWER(name) = LOWER(?) 
         AND type = ?
         AND id != ?`,
            [user.id, name.trim(), type, editingId || 0]
        );

        if (existing) {
            Alert.alert("Duplicate Category", "Category already exists.");
            return;
        }

        if (editingId) {
            // UPDATE
            await db.runAsync(
                `UPDATE categories 
             SET name = ?, type = ? 
             WHERE id = ?`,
                [name.trim(), type, editingId]
            );

            setEditingId(null);
        } else {
            // INSERT
            await db.runAsync(
                `INSERT INTO categories 
             (user_id, name, type, color) 
             VALUES (?, ?, ?, ?)`,
                [
                    user.id,
                    name.trim(),
                    type,
                    randomColor()
                ]
            );
        }

        setName('');
        setType('expense');
        loadCategories();
    };



    const deleteCategory = async (id) => {
        Alert.alert(
            "Delete Category",
            "This will not delete past transactions. Continue?",
            [
                { text: "Cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        const db = await getDB();
                        await db.runAsync(
                            `DELETE FROM categories WHERE id = ?`,
                            [id]
                        );
                        loadCategories();
                    }
                }
            ]
        );
    };

    const randomColor = () => {
        const colors = [
            '#EF4444',
            '#F59E0B',
            '#10B981',
            '#3B82F6',
            '#8B5CF6'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    };

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.row}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View
                        style={{
                            width: 12,
                            height: 12,
                            borderRadius: 6,
                            backgroundColor: item.color,
                            marginRight: 10
                        }}
                    />
                    <View>
                        <Text style={styles.title}>{item.name}</Text>
                        <Text style={styles.type}>{item.type}</Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row' }}>
                    <Pressable
                        onPress={() => {
                            setName(item.name);
                            setType(item.type);
                            setEditingId(item.id);
                        }}
                        style={{ marginRight: 15 }}
                    >
                        <Text style={{ color: '#2563EB' }}>Edit</Text>
                    </Pressable>

                    <Pressable onPress={() => deleteCategory(item.id)}>
                        <Text style={styles.delete}>Delete</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );



    return (
        <View style={styles.container}>

            {/* Header */}
            <Text style={styles.header}>Manage Categories</Text>

            {/* Search */}
            <TextInput
                placeholder="Search category..."
                value={search}
                onChangeText={setSearch}
                style={styles.searchInput}
            />

            {/* Filter Tabs */}
            <View style={styles.filterRow}>
                {['all', 'expense', 'income'].map((item) => (
                    <Pressable
                        key={item}
                        style={[
                            styles.filterBtn,
                            filter === item && styles.activeFilter
                        ]}
                        onPress={() => setFilter(item)}
                    >
                        <Text
                            style={{
                                color: filter === item ? '#fff' : '#374151'
                            }}
                        >
                            {item.toUpperCase()}
                        </Text>
                    </Pressable>
                ))}
            </View>

            {/* Add Section */}
            <View style={styles.addBox}>
                <TextInput
                    placeholder="Category Name"
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                />

                <View style={styles.typeRow}>
                    <Pressable
                        style={[
                            styles.typeBtn,
                            type === 'expense' && styles.active
                        ]}
                        onPress={() => setType('expense')}
                    >
                        <Text style={{ color: type === 'expense' ? '#fff' : '#000' }}>
                            Expense
                        </Text>
                    </Pressable>

                    <Pressable
                        style={[
                            styles.typeBtn,
                            type === 'income' && styles.active
                        ]}
                        onPress={() => setType('income')}
                    >
                        <Text style={{ color: type === 'income' ? '#fff' : '#000' }}>
                            Income
                        </Text>
                    </Pressable>
                </View>

                <Pressable style={styles.button} onPress={addCategory}>
                    <Text style={{ color: '#fff' }}>Add Category</Text>
                </Pressable>
            </View>

            {/* List */}
            <FlatList
                data={filteredCategories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                ListEmptyComponent={() => (
                    <Text style={styles.empty}>
                        No categories found
                    </Text>
                )}
                contentContainerStyle={{ paddingBottom: 50 }}
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
    addBox: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 14,
        marginBottom: 20
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 12,
        marginBottom: 10
    },
    typeRow: {
        flexDirection: 'row',
        marginBottom: 10
    },
    typeBtn: {
        flex: 1,
        padding: 10,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        borderRadius: 8,
        marginRight: 5
    },
    active: {
        backgroundColor: '#3B82F6'
    },
    button: {
        backgroundColor: '#2563EB',
        padding: 12,
        alignItems: 'center',
        borderRadius: 10
    },
    card: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        marginBottom: 10
    },
    title: {
        fontWeight: '600',
        fontSize: 15
    },
    type: {
        fontSize: 12,
        color: '#6B7280'
    },
    delete: {
        color: '#DC2626'
    },
    header: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 15,
        color: '#111827'
    },

    searchInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB'
    },

    filterRow: {
        flexDirection: 'row',
        marginBottom: 15
    },

    filterBtn: {
        flex: 1,
        padding: 10,
        backgroundColor: '#E5E7EB',
        alignItems: 'center',
        borderRadius: 8,
        marginRight: 5
    },

    activeFilter: {
        backgroundColor: '#2563EB'
    },

    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    empty: {
        textAlign: 'center',
        marginTop: 30,
        color: '#6B7280'
    }

});
