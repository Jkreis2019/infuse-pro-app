import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      })
      const data = await res.json()
      if (data.success) setSent(true)
      else setError(data.message || 'Something went wrong')
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Infuse Pro</Text>
        <Text style={styles.title}>Check your email 📬</Text>
        <Text style={styles.subtitle}>
          If an account exists for {email}, we sent a link to set your password. Check your inbox and spam folder.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Infuse Pro</Text>
      <Text style={styles.title}>Forgot password?</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a link to set a new password.</Text>

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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#0D1B4B" /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B', paddingHorizontal: 24, paddingTop: 60 },
  logo: { fontSize: 28, fontWeight: '600', color: '#C9A84C', letterSpacing: 3, marginBottom: 32, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.7)', letterSpacing: 0.5, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff' },
  error: { color: '#f09090', fontSize: 13, marginTop: 12, marginBottom: 4 },
  button: { backgroundColor: '#C9A84C', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#0D1B4B', fontSize: 15, fontWeight: '600' },
  backLink: { padding: 16, alignItems: 'center' },
  backLinkText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
})