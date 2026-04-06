import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native'
import { useState, useEffect, useCallback } from 'react'

const API_URL = 'https://api.infusepro.app'

export default function ProfileScreen({ route, navigation, onCompanyChange }) {
  const { token, user, company } = route.params
  const primaryColor = company?.primaryColor || '#C9A84C'
  const headers = { Authorization: `Bearer ${token}` }

  const [linkedCompanies, setLinkedCompanies] = useState([])
  const [codeInput, setCodeInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)

  const fetchLinkedCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/my-companies`, { headers })
      const data = await res.json()
      setLinkedCompanies(data.companies || [])
    } catch (err) {
      console.error('Fetch companies error:', err)
    } finally {
      setLoadingCompanies(false)
    }
  }, [token])

  useEffect(() => {
    fetchLinkedCompanies()
  }, [fetchLinkedCompanies])

  const linkCompany = async () => {
    if (!codeInput.trim()) return Alert.alert('Enter a company code')
    setLinking(true)
    try {
      const res = await fetch(`${API_URL}/auth/link-company`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyCode: codeInput.trim().toUpperCase() })
      })
      const data = await res.json()
      if (data.success) {
        setCodeInput('')
        setShowCodeInput(false)
        fetchLinkedCompanies()
        if (onCompanyChange) onCompanyChange()
        Alert.alert('Linked!', `You are now linked to ${data.company.name}`)
      } else {
        Alert.alert('Error', data.message || 'Invalid company code')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setLinking(false)
    }
  }

  const unlinkCompany = (companyId, companyName) => {
    Alert.alert(
      'Unlink Company',
      `Unlink from ${companyName}? Your booking history will be retained.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink', style: 'destructive', onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/auth/unlink-company`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId })
              })
              const data = await res.json()
              if (data.success) {
                fetchLinkedCompanies()
                if (onCompanyChange) onCompanyChange()
              } else {
                Alert.alert('Error', data.message || 'Could not unlink')
              }
            } catch (err) {
              Alert.alert('Error', 'Network error')
            }
          }
        }
      ]
    )
  }

  const logout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.avatar, { borderColor: primaryColor }]}>
        <Text style={[styles.avatarText, { color: primaryColor }]}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </Text>
      </View>
      <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
      <Text style={styles.email}>{user.email}</Text>

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
        <Text style={styles.sectionTitle}>My Companies</Text>
        {loadingCompanies ? (
          <ActivityIndicator color={primaryColor} style={{ marginVertical: 12 }} />
        ) : linkedCompanies.length === 0 ? (
          <Text style={styles.noCompanies}>No linked companies yet</Text>
        ) : (
          linkedCompanies.map(c => (
            <View key={c.id} style={[styles.companyCard, { borderColor: c.primary_color || primaryColor }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.companyName, { color: c.primary_color || primaryColor }]}>{c.name}</Text>
                {c.phone && <Text style={styles.companyDetail}>📞 {c.phone}</Text>}
                {c.bio && <Text style={styles.companyDetail}>{c.bio}</Text>}
              </View>
              <TouchableOpacity onPress={() => unlinkCompany(c.id, c.name)}>
                <Text style={styles.unlinkText}>Unlink</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        {showCodeInput && linkedCompanies.length === 0 ? (
          <View style={styles.codeInputContainer}>
            <TextInput
              style={[styles.codeInput, { borderColor: primaryColor }]}
              placeholder="Enter company code (e.g. MIVD)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={codeInput}
              onChangeText={setCodeInput}
              autoCapitalize="characters"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.linkBtn, { backgroundColor: primaryColor }]}
              onPress={linkCompany}
              disabled={linking}
            >
              {linking ? <ActivityIndicator color="#0D1B4B" /> : <Text style={[styles.linkBtnText, { color: '#0D1B4B' }]}>Link Company</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowCodeInput(false); setCodeInput('') }}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : linkedCompanies.length === 0 && (
          <TouchableOpacity style={[styles.addCompanyBtn, { borderColor: primaryColor }]} onPress={() => setShowCodeInput(true)}>
            <Text style={[styles.addCompanyText, { color: primaryColor }]}>+ Link a Company</Text>
          </TouchableOpacity>
        )}
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
  section: { width: '100%', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLabel: { fontSize: 14, color: '#fff', fontWeight: '400' },
  rowArrow: { fontSize: 20, color: 'rgba(255,255,255,0.25)' },
  companyCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  companyName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  companyDetail: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  unlinkText: { color: '#f09090', fontSize: 13, fontWeight: '600' },
  noCompanies: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginVertical: 12, textAlign: 'center' },
  addCompanyBtn: { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8, borderStyle: 'dashed' },
  addCompanyText: { fontSize: 14, fontWeight: '600' },
  codeInputContainer: { marginTop: 8 },
  codeInput: { borderWidth: 1, borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, marginBottom: 10, letterSpacing: 2 },
  linkBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  linkBtnText: { fontSize: 15, fontWeight: '700' },
  cancelLink: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  logoutButton: { marginTop: 16, width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', backgroundColor: 'rgba(220,80,80,0.08)' },
  logoutText: { color: '#f09090', fontSize: 15, fontWeight: '500' },
})