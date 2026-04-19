import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native'
import { useState } from 'react'
import { useFonts, CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'

const API_URL = 'https://api.infusepro.app'

const DEFAULT_COMPANY = {
  name: 'Infuse Pro',
  primaryColor: '#C9A84C',
  secondaryColor: '#0D1B4B',
  location: ''
}

export default function LoginScreen({ route, navigation }) {
  const message = route.params?.message || ''
  const [fontsLoaded] = useFonts({ CormorantGaramond_600SemiBold })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const registerPushToken = async (token) => {
    try {
      if (!Device.isDevice) return
      if (Platform.OS === 'web') return
      const { status } = await Notifications.getPermissionsAsync()
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync()
        if (newStatus !== 'granted') return
      }
      const pushToken = (await Notifications.getExpoPushTokenAsync({
        projectId: '824f080c-a62b-417d-8d02-4554a9578672'
      })).data
      if (!pushToken) return
      await fetch(`${API_URL}/auth/device-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: pushToken })
      })
    } catch (err) {
      console.log('Push token registration error:', err)
    }
  }

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
        console.log('Login role:', role, 'passwordChanged:', data.user.passwordChanged)
        // Register push token
        registerPushToken(data.token)
        // Notify session manager
        try { const { sessionManager } = require('../utils/sessionManager'); sessionManager.notifyLogin(role, data.token, { ...company, userEmail: data.user.email }) } catch(e) {}

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
        } else if (role === 'super_admin') {
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'SuperAdminHome', params: { token: data.token, user: data.user, company } }] })
          )
        } else if (role === 'admin' || role === 'owner') {
          if (!data.user.passwordChanged) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ChangePassword', params: { token: data.token, user: data.user, company, forced: true } }]
            })
          } else if (role === 'owner' && !company?.platformActive && company?.subscriptionTier === 'none' && company?.listingTier === 'free') {
            const { CommonActions } = require('@react-navigation/native')
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'FreeListing', params: { token: data.token, user: data.user, company } }] })
            )
          } else if (!company?.platformActive && role === 'owner') {
            const { CommonActions } = require('@react-navigation/native')
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'PendingApproval', params: { token: data.token, user: data.user, company } }] })
            )
          } else {
            const { CommonActions } = require('@react-navigation/native')
            navigation.dispatch(
              CommonActions.reset({ index: 0, routes: [{ name: 'AdminHome', params: { token: data.token, user: data.user, company } }] })
            )
          }
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
        } else if (role === 'solo') {
          if (!data.user.passwordChanged) {
            navigation.reset({
              index: 0,
              routes: [{ name: 'ChangePassword', params: { token: data.token, user: data.user, company, forced: true } }]
            })
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SoloHome', params: { token: data.token, user: data.user, company } }]
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
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoMark}>IP</Text>
        </View>
        <Text style={styles.logoText}>Infuse Pro</Text>
        <Text style={styles.tagline}>Mobile IV Operations Platform</Text>
      </View>

      {message ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{message}</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="you@email.com"
          placeholderTextColor="rgba(10,186,181,0.35)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Your password"
          placeholderTextColor="rgba(10,186,181,0.35)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={login} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('Signup')}>
        <Text style={styles.signupLinkText}>Don't have an account? <Text style={styles.signupLinkAccent}>Sign up</Text></Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.signupLink} onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={styles.signupLinkText}>Forgot your password? <Text style={styles.signupLinkAccent}>Reset it</Text></Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingTop: 60 },
  logoContainer: { alignItems: 'center', marginBottom: 36, marginTop: 20 },
  logoBox: {
    width: 64, height: 64, borderRadius: 18, backgroundColor: '#0ABAB5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  logoMark: { fontSize: 24, fontWeight: '800', color: '#fff' },
  logoText: { fontSize: 26, fontFamily: 'CormorantGaramond_600SemiBold', color: '#1A2E2E', letterSpacing: 0.5, marginBottom: 4 },
  tagline: { fontSize: 11, color: '#C4876A', letterSpacing: 1, textTransform: 'uppercase' },
  successBanner: { backgroundColor: 'rgba(46,204,143,0.1)', borderWidth: 1, borderColor: 'rgba(46,204,143,0.3)', borderRadius: 10, padding: 12, marginBottom: 16 },
  successText: { color: '#2ECC8F', fontSize: 13, textAlign: 'center' },
  card: {
    backgroundColor: '#F7FBFB', borderRadius: 20, padding: 20,
    borderWidth: 1.5, borderColor: 'rgba(10,186,181,0.15)',
    shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },
  label: { fontSize: 10, fontWeight: '700', color: '#0ABAB5', letterSpacing: 1.5, marginBottom: 8, marginTop: 14, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(10,186,181,0.2)',
    borderRadius: 12, padding: 14, fontSize: 14, color: '#1A2E2E',
  },
  error: { color: '#E05A5A', fontSize: 13, marginTop: 12, marginBottom: 4 },
  button: {
    backgroundColor: '#0ABAB5', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20,
    shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  signupLink: { padding: 14, alignItems: 'center' },
  signupLinkText: { color: '#9BB5B4', fontSize: 13 },
  signupLinkAccent: { color: '#C4876A', fontWeight: '600' },
})