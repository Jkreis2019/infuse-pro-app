import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'

export default function NPHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'

  return (
    <View style={styles.container}>
      <Text style={[styles.company, { color: primaryColor }]}>{company?.name}</Text>
      <Text style={styles.title}>NP Dashboard</Text>
      <Text style={styles.subtitle}>Coming soon — GFE requests, chart review</Text>
      <Text style={styles.user}>Logged in as {user?.firstName} · {user?.role}</Text>
      <TouchableOpacity style={styles.logout} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center', padding: 32 },
  company: { fontSize: 16, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32 },
  user: { fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 32 },
  logout: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 32 },
  logoutText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 }
})