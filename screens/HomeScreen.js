import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native'

export default function HomeScreen({ route, navigation }) {
  const { token, user, company } = route.params

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      
      <View style={[styles.header, { backgroundColor: company.secondaryColor }]}>
        <Text style={[styles.companyName, { color: company.primaryColor }]}>{company.name}</Text>
        <Text style={styles.greeting}>Good morning, {user.firstName}</Text>
        <Text style={styles.location}>{company.location}</Text>
      </View>

      <TouchableOpacity style={[styles.bookButton, { backgroundColor: company.primaryColor }]}>
        <Text style={[styles.bookButtonText, { color: company.secondaryColor }]}>Book an appointment</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your appointments</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No upcoming appointments</Text>
          <Text style={styles.emptySubtext}>Book your first IV session above</Text>
        </View>
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B4B',
  },
  content: {
    paddingBottom: 48,
  },
  header: {
    padding: 28,
    paddingTop: 48,
    marginBottom: 20,
  },
  companyName: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  bookButton: {
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 28,
  },
  bookButtonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  section: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    fontWeight: '300',
  },
})