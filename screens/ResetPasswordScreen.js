import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function ResetPasswordScreen({ route, navigation }) {
  const { token } = route.params || {}
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async () => {
    if (!newPassword || !confirm) { setError('All fields are required'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.message || 'Could not reset password')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.logo}>Infuse Pro</Text>
        <Text style={styles.title}>Password Set! ✅</Text>
        <Text style={styles.subtitle}>Your password has been updated. You can now log in.</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Infuse Pro</Text>
      <Text style={styles.title}>Set your password</Text>
      <Text style={styles.subtitle}>Choose a password to access your account and track your appointments.</Text>

      <Text style={styles.label}>New Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Min 8 characters"
        placeholderTextColor="#666"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <Text style={styles.label}>Confirm Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Repeat new password"
        placeholderTextColor="#666"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={styles.button}
        onPress={handleReset}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#0D1B4B" /> : <Text style={styles.buttonText}>Set Password</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginLinkText}>Already have a password? Log in</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B', paddingHorizontal: 24, paddingTop: 60 },
  logo: { fontSize: 28, fontWeight: '600', color: '#5BBFB5', letterSpacing: 3, marginBottom: 32, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.7)', letterSpacing: 0.5, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff' },
  error: { color: '#f09090', fontSize: 13, marginTop: 12, marginBottom: 4 },
  button: { backgroundColor: '#5BBFB5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { color: '#0D1B4B', fontSize: 15, fontWeight: '600' },
  loginLink: { padding: 16, alignItems: 'center' },
  loginLinkText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
})