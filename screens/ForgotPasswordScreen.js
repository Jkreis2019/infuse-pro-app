import React, { useState } from 'react'
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [showCodeEntry, setShowCodeEntry] = useState(false)
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleCodeReset = async () => {
    if (!resetCode.trim()) { setError('Please enter your reset code'); return }
    if (!newPassword || !confirmPassword) { setError('Please enter your new password'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setResetting(true); setError('')
    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetCode.trim(), newPassword })
      })
      const data = await res.json()
      if (data.success) setResetSuccess(true)
      else setError(data.message || 'Invalid or expired code')
    } catch { setError('Connection error. Please try again.') }
    setResetting(false)
  }

  const handleSubmit = async () => {
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      })
      const data = await res.json()
      if (data.success) setSent(true)
      else setError(data.message || 'Something went wrong')
    } catch { setError('Connection error. Please try again.') }
    setLoading(false)
  }

  if (resetSuccess) return (
    <View style={styles.container}>
      <View style={styles.iconBox}><Text style={styles.iconText}>✅</Text></View>
      <Text style={styles.title}>Password Updated!</Text>
      <Text style={styles.subtitle}>Your password has been set. You can now sign in.</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.buttonText}>Go to Sign In</Text>
      </TouchableOpacity>
    </View>
  )

  if (showCodeEntry) return (
    <View style={styles.container}>
      <View style={styles.iconBox}><Text style={styles.iconText}>🔑</Text></View>
      <Text style={styles.title}>Enter your code</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code from your email and set a new password.</Text>
      <Text style={styles.label}>Reset Code</Text>
      <TextInput style={styles.input} placeholder="123456" placeholderTextColor="rgba(10,186,181,0.35)" value={resetCode} onChangeText={setResetCode} keyboardType="number-pad" maxLength={6} />
      <Text style={styles.label}>New Password</Text>
      <TextInput style={styles.input} placeholder="Min 8 characters" placeholderTextColor="rgba(10,186,181,0.35)" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <Text style={styles.label}>Confirm Password</Text>
      <TextInput style={styles.input} placeholder="Repeat new password" placeholderTextColor="rgba(10,186,181,0.35)" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleCodeReset} disabled={resetting}>
        {resetting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Set Password</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => setShowCodeEntry(false)}>
        <Text style={styles.backLinkText}>← Back</Text>
      </TouchableOpacity>
    </View>
  )

  if (sent) return (
    <View style={styles.container}>
      <View style={styles.iconBox}><Text style={styles.iconText}>📬</Text></View>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>If an account exists for {email}, we sent a 6-digit code. Check your inbox and spam folder.</Text>
      <TouchableOpacity style={styles.button} onPress={() => setShowCodeEntry(true)}>
        <Text style={styles.buttonText}>Enter Reset Code</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backLinkText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}><Text style={styles.iconText}>🔒</Text></View>
      <Text style={styles.title}>Forgot password?</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a code to reset your password.</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} placeholder="you@email.com" placeholderTextColor="rgba(10,186,181,0.35)" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => setShowCodeEntry(true)}>
        <Text style={styles.backLinkText}>Have a reset code? Enter it here</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
        <Text style={styles.backLinkText}>← Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingTop: 60 },
  iconBox: { width: 80, height: 80, borderRadius: 22, backgroundColor: '#F7FBFB', borderWidth: 1.5, borderColor: 'rgba(10,186,181,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 24, alignSelf: 'center', shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  iconText: { fontSize: 36 },
  title: { fontSize: 26, fontWeight: '700', color: '#1A2E2E', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9BB5B4', textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  label: { fontSize: 10, fontWeight: '700', color: '#0ABAB5', letterSpacing: 1.5, marginBottom: 8, marginTop: 14, textTransform: 'uppercase' },
  input: { backgroundColor: '#F7FBFB', borderWidth: 1.5, borderColor: 'rgba(10,186,181,0.2)', borderRadius: 12, padding: 14, fontSize: 14, color: '#1A2E2E' },
  error: { color: '#E05A5A', fontSize: 13, marginTop: 12, marginBottom: 4 },
  button: { backgroundColor: '#0ABAB5', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24, shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backLink: { padding: 14, alignItems: 'center' },
  backLinkText: { color: '#C4876A', fontSize: 13, fontWeight: '500' },
})
