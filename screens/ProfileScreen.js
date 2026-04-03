import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native'

export default function ProfileScreen({ route, navigation }) {
  const { token, user, company } = route.params

  const logout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }]
    })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.avatar, { borderColor: company.primaryColor }]}>
        <Text style={[styles.avatarText, { color: company.primaryColor }]}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </Text>
      </View>
      <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <View style={[styles.companyBadge, { borderColor: company.primaryColor }]}>
        <Text style={[styles.companyName, { color: company.primaryColor }]}>{company.name}</Text>
        <Text style={styles.companyLocation}>{company.location}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Edit profile</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Change password</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Company</Text>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Linked company</Text>
          <Text style={[styles.rowValue, { color: company.primaryColor }]}>{company.name}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row}>
          <Text style={styles.rowLabel}>Switch company</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 48, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontSize: 24, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, fontWeight: '300' },
  companyBadge: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 28, width: '100%', backgroundColor: 'rgba(255,255,255,0.04)' },
  companyName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  companyLocation: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  section: { width: '100%', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLabel: { fontSize: 14, color: '#fff', fontWeight: '400' },
  rowValue: { fontSize: 13, fontWeight: '500' },
  rowArrow: { fontSize: 20, color: 'rgba(255,255,255,0.25)' },
  logoutButton: { marginTop: 16, width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', backgroundColor: 'rgba(220,80,80,0.08)' },
  logoutText: { color: '#f09090', fontSize: 15, fontWeight: '500' },
})
