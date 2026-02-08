import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Path } from 'react-native-svg';

import { Redirect } from 'expo-router';
import CategoryChart from '../../components/CategoryChart';
import { getMonthRange } from '../../constants/date';
import { getDB } from '../../constants/db';
import { useUser } from '../../hooks/UserContext';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function Dashboard() {
    const { user, logout } = useUser();
    const currentDate = new Date();

    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

    const [total, setTotal] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0);
    const [balance, setBalance] = useState(0);

    const [chartData, setChartData] = useState([]);
    const [topCategory, setTopCategory] = useState(null);
    const [recent, setRecent] = useState([]);

    const [budgetLimit, setBudgetLimit] = useState(0);
    const [budgetUsed, setBudgetUsed] = useState(0);

    const [monthlyTrend, setMonthlyTrend] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    const animation = useRef(new Animated.Value(0)).current;
    const router = useRouter();

    // Redirect to login if user is null
    if (!user) return <Redirect href="/login" />;

    const loadData = async () => {
        if (!user) return;
        const db = await getDB();
        const { start, end } = getMonthRange(selectedYear, selectedMonth);

        /* ---- EXPENSE ---- */
        const expenseResult = await db.getFirstAsync(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM transactions
             WHERE user_id = ?
             AND type = 'expense'
             AND date BETWEEN ? AND ?`,
            [user.id, start, end]
        );

        /* ---- INCOME ---- */
        const incomeResult = await db.getFirstAsync(
            `SELECT COALESCE(SUM(amount), 0) as total
             FROM transactions
             WHERE user_id = ?
             AND type = 'income'
             AND date BETWEEN ? AND ?`,
            [user.id, start, end]
        );

        const expenseTotal = expenseResult?.total || 0;
        const incomeTotal = incomeResult?.total || 0;

        setTotal(expenseTotal);
        setTotalIncome(incomeTotal);
        setBalance(incomeTotal - expenseTotal);

        /* ---- MONTHLY TREND ---- */
        const trendResult = await db.getAllAsync(
            `SELECT strftime('%Y-%m', date) as month,
                    COALESCE(SUM(amount), 0) as total
             FROM transactions
             WHERE user_id = ?
             AND type = 'expense'
             AND date >= date('now', '-6 months')
             GROUP BY strftime('%Y-%m', date)
             ORDER BY month ASC`,
            [user.id]
        );
        setMonthlyTrend(trendResult);

        /* ---- CATEGORY BREAKDOWN ---- */
        const categoryResult = await db.getAllAsync(
            `SELECT c.name as category, SUM(t.amount) as amount, c.color as color
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ? AND t.type = 'expense'
             AND t.date BETWEEN ? AND ?
             GROUP BY t.category_id
             ORDER BY amount DESC`,
            [user.id, start, end]
        );

        setTopCategory(categoryResult[0] || null);
        setChartData(
            categoryResult.map((item, index) => ({
                name: item.category || 'Other',
                amount: item.amount,
                color: item.color || `hsl(${index * 60},70%,60%)`
            }))
        );

        /* ---- RECENT ---- */
        const recentResult = await db.getAllAsync(
            `SELECT t.id, t.title, t.amount, t.date, c.name as category
             FROM transactions t
             LEFT JOIN categories c ON t.category_id = c.id
             WHERE t.user_id = ? AND t.type = 'expense'
             AND t.date BETWEEN ? AND ?
             ORDER BY t.date DESC
             LIMIT 5`,
            [user.id, start, end]
        );
        setRecent(recentResult || []);

        /* ---- BUDGET ---- */
        const budgetResult = await db.getFirstAsync(
            `SELECT limit_amount FROM budgets WHERE user_id = ? AND month = ? AND year = ?`,
            [user.id, selectedMonth + 1, selectedYear]
        );

        if (budgetResult) {
            setBudgetLimit(budgetResult.limit_amount);
            setBudgetUsed(expenseTotal);
        } else {
            setBudgetLimit(0);
            setBudgetUsed(0);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [user?.id, selectedMonth, selectedYear])
    );

    // Refresh handler
    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    /* ==============================
       TREND ANIMATION
    ============================== */
    useEffect(() => {
        animation.setValue(0);
        Animated.timing(animation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false
        }).start();
    }, [monthlyTrend]);

    const screenWidth = Dimensions.get('window').width;
    const width = screenWidth - 64; // padding safe
    const height = 200;
    const safeTotals = monthlyTrend.map(m => Number(m.total) || 0);
    const maxValue = Math.max(...safeTotals, 1);

    const points = monthlyTrend.map((item, index) => {
        const value = Number(item.total) || 0;
        const x = (index / (monthlyTrend.length - 1 || 1)) * width;
        const y = height - (value / maxValue) * height;
        return `${x},${y}`;
    });

    const pathData = points.length > 0 ? `M ${points.join(' L ')}` : '';
    const animatedPath = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [1000, 0]
    });

    const logoutCurrentUser = async () => {
        await logout()
        router.push()
    }

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            {/* Logout */}
            {/* <Pressable onPress={logoutCurrentUser} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Logout</Text>
            </Pressable> */}

            {/* Financial Overview */}
            <View style={styles.card}>
                <Text style={styles.title}>Financial Overview</Text>
                <Text style={{ color: '#10B981' }}>Income: ₹ {totalIncome}</Text>
                <Text style={{ color: '#EF4444', marginTop: 4 }}>Expense: ₹ {total}</Text>
                <Text style={styles.balance}>Net Balance: ₹ {balance}</Text>
            </View>

            {/* Budget Progress */}
            {budgetLimit > 0 && (
                <View style={styles.card}>
                    <Text style={styles.title}>Budget Progress</Text>
                    <View style={styles.progressBar}>
                        <View
                            style={[styles.progressFill, {
                                width: `${Math.min((budgetUsed / budgetLimit) * 100, 100)}%`,
                                backgroundColor: budgetUsed > budgetLimit ? '#EF4444' : '#10B981'
                            }]}
                        />
                    </View>
                    <Text>₹ {budgetUsed} / ₹ {budgetLimit}</Text>
                </View>
            )}

            {/* Trend */}
            {/* {monthlyTrend.length > 0 && (
                <View style={styles.trendCard}>
                    <View style={styles.trendHeader}>
                        <Text style={styles.trendTitle}>6 Month Expense Trend</Text>
                        <Text style={styles.trendAmount}>₹ {total}</Text>
                    </View>
                    <View style={styles.chartContainer}>
                        <Svg width={width} height={height}>
                            {monthlyTrend.length === 1 ? (
                                <Circle
                                    cx={width / 2}
                                    cy={height - (safeTotals[0] / maxValue) * height}
                                    r="8"
                                    fill="#4F46E5"
                                />
                            ) : (
                                <AnimatedPath
                                    d={pathData}
                                    stroke="#4F46E5"
                                    strokeWidth="4"
                                    fill="none"
                                    strokeDasharray="1000"
                                    strokeDashoffset={animatedPath}
                                />
                            )}
                        </Svg>
                    </View>
                </View>
            )} */}

            {/* Category Chart */}
            <View style={styles.card}>
                {chartData.length > 0 ? <CategoryChart data={chartData} /> : <Text>No expenses this month</Text>}
            </View>

            {/* Recent Transactions */}
            <View style={styles.card}>
                <Text style={styles.title}>Recent Transactions</Text>
                {recent.map(item => (
                    <View key={item.id} style={styles.row}>
                        <Text>{item.category}/{item.title}</Text>
                        <Text>₹ {item.amount}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA', padding: 16 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 3 },
    title: { fontWeight: '600', marginBottom: 10 },
    balance: { fontSize: 20, fontWeight: '700', marginTop: 8 },
    progressBar: { height: 10, backgroundColor: '#E5E7EB', borderRadius: 8, marginVertical: 8 },
    progressFill: { height: 10, borderRadius: 8 },
    row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    trendCard: { backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginBottom: 20, elevation: 4 },
    trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    trendTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
    trendAmount: { fontSize: 18, fontWeight: '700', color: '#4F46E5' },
    chartContainer: { alignItems: 'center', justifyContent: 'center' },
    logoutBtn: { backgroundColor: '#EF4444', padding: 10, borderRadius: 12, alignSelf: 'flex-end', marginBottom: 12 },
    logoutText: { color: '#fff', fontWeight: '600' }
});
