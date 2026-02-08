import { Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

export default function CategoryChart({ data }) {
    return (
        <PieChart
            data={data}
            width={Dimensions.get('window').width}
            height={220}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            chartConfig={{
                color: () => '#000'
            }}
        />
    );
}
