import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useState } from 'react'

const API_URL = 'https://api.infusepro.app'

const DEFAULT_COMPANY = {
  name: 'Infuse Pro',
  primaryColor: '#C9A84C',
  secondaryColor: '#0D1B4B',
  location: ''
}

export default function LoginScreen({ route, navigation }) {
  const message = route.params?.message || ''
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async () => {
    if (!email || !password) {
      setError('Email and password are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await response.json()
      if (data.success) {
        const company = data.user.company || DEFAULT_COMPANY
        const role = data.user.role

        if (role === 'guest') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home', params: { token: data.token, user: data.user, company } }]
          })
        } else if (role === 'dispatcher') {
          if (!data.user.passwordChanged) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ChangePassword', params: { token: data.token, user: data.user, company, forced: true } }]
            })
          } else {
            const serviceType = company?.serviceType || 'mobile'
            const destination = serviceType === 'clinic' ? 'ClinicHome' : 'DispatcherHome'
            navigation.replace(destination, { token: data.token, user: data.user, company })
          }
        } else if (role === 'admin') {
          if (!data.user.passwordChanged) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ChangePassword', params: { token: data.token, user: data.user, company, forced: true } }]
            })
          } else {
            navigation.replace('AdminHome', { token: data.token, user: data.user, company })
          }
          console.log('serviceType:', company?.serviceType, 'role:', role)
        } else if (role === 'tech') {
          if (!data.user.passwordChanged) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ChangePassword', params: { token: data.token, user: data.user, company, forced: true } }]
            })
          } else {
            const serviceType = company?.serviceType || 'mobile'
            const destination = serviceType === 'clinic' ? 'ClinicTechHome' : 'TechHome'
            navigation.replace(destination, { token: data.token, user: data.user, company })
          }
        } else if (role === 'np') {
          if (!data.user.passwordChanged) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ChangePassword', params: { token: data.token, user: data.user, company, forced: true } }]
            })
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'NPHome', params: { token: data.token, user: data.user, company } }]
            })
          }
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Home', params: { token: data.token, user: data.user, company } }]
          })
        }
      } else {
        setError(data.message || 'Invalid email or password')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Infuse Pro</Text>
      {message ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{message}</Text>
        </View>
      ) : null}
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="you@email.com"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Your password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={login} disabled={loading}>
        {loading ? <ActivityIndicator color="#0D1B4B" /> : <Text style={styles.buttonText}>Log in</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signupLinkText}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B', paddingHorizontal: 24, paddingTop: 60 },
  logo: { fontSize: 28, fontWeight: '600', color: '#C9A84C', letterSpacing: 3, marginBottom: 32, textAlign: 'center' },
  successBanner: { backgroundColor: 'rgba(100,180,80,0.15)', borderWidth: 1, borderColor: 'rgba(100,180,80,0.3)', borderRadius: 8, padding: 12, marginBottom: 20 },
  successText: { color: '#8fda74', fontSize: 13, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '600', color: '#fff', marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.7)', letterSpacing: 0.5, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff' },
  error: { color: '#f09090', fontSize: 13, marginTop: 12, marginBottom: 4 },
  button: { backgroundColor: '#C9A84C', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#0D1B4B', fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  signupLink: { padding: 16, alignItems: 'center' },
  signupLinkText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
})