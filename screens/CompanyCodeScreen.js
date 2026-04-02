import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useState } from 'react'

const API_URL = 'https://api.infusepro.app'

export default function CompanyCodeScreen({ navigation }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState(null)
  const [error, setError] = useState('')

  const lookupCode = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    setCompany(null)
    try {
      const response = await fetch(`${API_URL}/company/${code.toUpperCase()}`)
      const data = await response.json()
      if (data.success) {
        setCompany(data.company)
      } else {
        setError('Company not found. Check your code and try again.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter company code</Text>
      <Text style={styles.subtitle}>Your IV company will give you this code</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. MIVD"
        placeholderTextColor="#666"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        maxLength={10}
      />
      <TouchableOpacity style={styles.button} onPress={lookupCode} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#0D1B4B" />
        ) : (
          <Text style={styles.buttonText}>Find my company</Text>
        )}
      </TouchableOpacity>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {company ? (
        <View style={[styles.companyCard, { borderColor: company.primary_color }]}>
          <Text style={[styles.companyName, { color: company.primary_color }]}>{company.name}</Text>
          <Text style={styles.companyLocation}>{company.location}</Text>
          <Text style={styles.companyBio}>{company.bio}</Text>
          <TouchableOpacity style={[styles.joinButton, { backgroundColor: company.primary_color }]}>
            <Text style={[styles.joinButtonText, { color: company.secondary_color }]}>Join {company.name} →</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B', paddingHorizontal: 24, paddingTop: 40 },
  title: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 32, fontWeight: '300' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', borderRadius: 10, padding: 16, fontSize: 22, color: '#fff', letterSpacing: 6, marginBottom: 12, textAlign: 'center' },
  button: { backgroundColor: '#C9A84C', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#0D1B4B', fontSize: 15, fontWeight: '600' },
  error: { color: '#f09090', textAlign: 'center', fontSize: 13, marginBottom: 16 },
  companyCard: { borderWidth: 1.5, borderRadius: 12, padding: 20, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  companyName: { fontSize: 22, fontWeight: '600', marginBottom: 4 },
  companyLocation: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: '300' },
  companyBio: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 16, lineHeight: 20 },
  joinButton: { borderRadius: 8, padding: 12, alignItems: 'center' },
  joinButtonText: { fontSize: 14, fontWeight: '600' },
})
