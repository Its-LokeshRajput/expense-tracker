import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs screenOptions={({ route }) => ({
      tabBarIcon: ({ color, size }) => {
        let icon;
        if (route.name === 'dashboard') icon = 'home';
        if (route.name === 'add-expense') icon = 'add-circle';
        if (route.name === 'expenses') icon = 'list';
        if (route.name === 'categories') icon = 'list';
        return <Ionicons name={icon} size={size} color={color} />;
      }
    })}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="add-expense" options={{ title: 'Add Expense' }} />
      <Tabs.Screen name="expenses" options={{ title: 'Expenses' }} />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categories",
        }}
      />

    </Tabs>
  );
}
