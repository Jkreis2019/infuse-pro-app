import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useState } from 'react'

const API_URL = 'https://api.infusepro.app'

const DEFAULT_COMPANY = {
  name: 'Infuse Pro',
  location: '',
  primary_color: '#0ABAB5',
  secondary_color: '#FFFFFF',
  code: null
}

export default function SignupScreen({ route, navigation }) {
  const company = route.params?.company || DEFAULT_COMPANY

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [password, setPassword] = useState('')
  const [companyCode, setCompanyCode] = useState(company.code || '')
  const [referralCode, setReferralCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const signup = async () => {
    if (!firstName || !email || !password) {
      setError('First name, email, and password are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, password, firstName, lastName, phone,
          dob: dob || undefined,
          companyCode: companyCode || undefined
        })
      })
      const data = await response.json()
      if (data.success) {
        if (referralCode) {
          try {
            await fetch(`${API_URL}/referrals/apply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: referralCode.toUpperCase(), newUserId: data.user.id })
            })
          } catch (e) {}
        }
        navigation.navigate('EmailVerification', { email: data.user.email })
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  const primaryColor = company.primary_color || '#0ABAB5'

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFFFF' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>

        {company.name !== 'Infuse Pro' && (
          <View style={[styles.companyBadge, { borderColor: primaryColor }]}>
            <Text style={[styles.companyName, { color: primaryColor }]}>{company.name}</Text>
            {company.location ? <Text style={styles.companyLocation}>{company.location}</Text> : null}
          </View>
        )}

        <Text style={styles.title}>Create your account</Text>

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>First name</Text>
            <TextInput style={styles.input} placeholder="Jessica" placeholderTextColor="rgba(10,186,181,0.35)" value={firstName} onChangeText={setFirstName} />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Last name</Text>
            <TextInput style={styles.input} placeholder="Reyes" placeholderTextColor="rgba(10,186,181,0.35)" value={lastName} onChangeText={setLastName} />
          </View>
        </View>

        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor="rgba(10,186,181,0.35)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} placeholder="(602) 555-0100" placeholderTextColor="rgba(10,186,181,0.35)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

        <Text style={styles.label}>Date of birth</Text>
        <TextInput
          style={styles.input}
          placeholder="MM/DD/YYYY"
          placeholderTextColor="rgba(10,186,181,0.35)"
          value={dob}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, '')
            let formatted = cleaned
            if (cleaned.length >= 3 && cleaned.length <= 4) {
              formatted = `${cleaned.slice(0,2)}/${cleaned.slice(2)}`
            } else if (cleaned.length > 4) {
              formatted = `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4,8)}`
            }
            setDob(formatted)
          }}
          keyboardType="numeric"
          maxLength={10}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput style={styles.input} placeholder="Min 8 characters" placeholderTextColor="rgba(10,186,181,0.35)" value={password} onChangeText={setPassword} secureTextEntry />

        {!company.code && (
          <>
            <Text style={styles.label}>Company code (optional)</Text>
            <TextInput style={styles.input} placeholder="e.g. MIVD" placeholderTextColor="rgba(10,186,181,0.35)" value={companyCode} onChangeText={setCompanyCode} autoCapitalize="characters" />
          </>
        )}

        <Text style={styles.label}>Referral code (optional)</Text>
        <TextInput style={styles.input} placeholder="e.g. PATRIO964" placeholderTextColor="rgba(10,186,181,0.35)" value={referralCode} onChangeText={setReferralCode} autoCapitalize="characters" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, { backgroundColor: primaryColor }]} onPress={signup} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLinkText}>Already have an account? <Text style={styles.loginLinkAccent}>Sign in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48 },
  companyBadge: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 24, backgroundColor: '#F7FBFB' },
  companyName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  companyLocation: { fontSize: 12, color: '#9BB5B4' },
  title: { fontSize: 26, fontWeight: '700', color: '#1A2E2E', marginBottom: 24 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  label: { fontSize: 10, fontWeight: '700', color: '#0ABAB5', letterSpacing: 1.5, marginBottom: 8, marginTop: 14, textTransform: 'uppercase' },
  input: { backgroundColor: '#F7FBFB', borderWidth: 1.5, borderColor: 'rgba(10,186,181,0.2)', borderRadius: 12, padding: 14, fontSize: 14, color: '#1A2E2E' },
  error: { color: '#E05A5A', fontSize: 13, marginTop: 12, marginBottom: 4 },
  button: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  loginLink: { padding: 16, alignItems: 'center' },
  loginLinkText: { color: '#9BB5B4', fontSize: 13 },
  loginLinkAccent: { color: '#C4876A', fontWeight: '600' },
})
