import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function ChangePasswordScreen({ route, navigation }) {
  const { token, user, company, forced } = route.params || {}
  const primaryColor = company?.primaryColor || '#5BBFB5'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'

  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = async () => {
   if (forced) {
  if (!newPass || !confirm) {
    setError('All fields are required')
    return
  }
} else {
  if (!current || !newPass || !confirm) {
    setError('All fields are required')
    return
  }
}
    if (newPass.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (newPass !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword: forced ? '' : current, newPassword: newPass })
      })
      const data = await res.json()
      if (data.success) {
        if (forced) {
          const role = user?.role
          if (role === 'admin' || role === 'owner') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'AdminHome', params: { token, user, company } }]
            })
          } else if (role === 'dispatcher') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'DispatcherHome', params: { token, user, company } }]
            })
          } else if (role === 'tech') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'TechHome', params: { token, user, company } }]
            })
          } else if (role === 'np') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'NPHome', params: { token, user, company } }]
            })
          }
        } else {
          Alert.alert('Success', 'Password changed successfully', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ])
        }
      } else {
        setError(data.message || 'Failed to change password')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.company, { color: primaryColor }]}>{company?.name}</Text>
      <Text style={styles.title}>
        {forced ? 'Set your password' : 'Change password'}
      </Text>
      {forced && (
        <Text style={styles.subtitle}>
          Please set a new password before continuing.
        </Text>
      )}

      {!forced && (
  <>
    <Text style={styles.label}>Current password</Text>
    <TextInput
      style={styles.input}
      placeholder="Your current password"
      placeholderTextColor="#666"
      value={current}
      onChangeText={setCurrent}
      secureTextEntry
    />
  </>
)}

      <Text style={styles.label}>New password</Text>
      <TextInput
        style={styles.input}
        placeholder="Min 8 characters"
        placeholderTextColor="#666"
        value={newPass}
        onChangeText={setNewPass}
        secureTextEntry
      />

      <Text style={styles.label}>Confirm new password</Text>
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
        style={[styles.button, { backgroundColor: primaryColor }]}
        onPress={handleChange}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={secondaryColor} />
        ) : (
          <Text style={[styles.buttonText, { color: secondaryColor }]}>
            {forced ? 'Set password & continue' : 'Change password'}
          </Text>
        )}
      </TouchableOpacity>

      {!forced && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B', paddingHorizontal: 24, paddingTop: 60 },
  company: { fontSize: 14, fontWeight: '600', letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.7)', letterSpacing: 0.5, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff' },
  error: { color: '#f09090', fontSize: 13, marginTop: 12, marginBottom: 4 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  cancelButton: { padding: 16, alignItems: 'center' },
  cancelText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 }
})