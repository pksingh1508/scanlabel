import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>ScanLabel</Text>
        <Text style={styles.subtitle}>Project foundation ready.</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F4',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#17352A',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#4C6259',
    fontSize: 16,
    marginTop: 8,
  },
});
