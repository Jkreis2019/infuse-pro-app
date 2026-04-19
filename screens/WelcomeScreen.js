import { StyleSheet, Text, View, Pressable } from 'react-native'
import { useFonts, CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond'

export default function WelcomeScreen({ navigation }) {
  const [fontsLoaded] = useFonts({ CormorantGaramond_600SemiBold })

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoBox}>
          <Text style={styles.logoMark}>IP</Text>
        </View>
        <Text style={styles.logo}>Infuse Pro</Text>
        <Text style={styles.tagline}>Premium mobile IV therapy,{'\n'}delivered to you</Text>
        <View style={styles.badges}>
          <View style={styles.badge}><Text style={styles.badgeText}>🔒 HIPAA</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>🔐 Encrypted</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>⚡ Real-time</Text></View>
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Login', {})}>
          <Text style={styles.primaryButtonText}>Sign In</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.secondaryButtonText}>Create account</Text>
        </Pressable>

        <Pressable style={styles.mapButton} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.mapButtonText}>Browse companies near me →</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingHorizontal: 28, paddingTop: 80, paddingBottom: 48, justifyContent: 'space-between' },
  hero: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  logoBox: {
    width: 80, height: 80, borderRadius: 22, backgroundColor: '#0ABAB5',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 12,
  },
  logoMark: { fontSize: 32, fontWeight: '800', color: '#fff' },
  logo: { fontSize: 48, fontFamily: 'CormorantGaramond_600SemiBold', color: '#1A2E2E', letterSpacing: 1, marginBottom: 12 },
  tagline: { fontSize: 16, color: '#9BB5B4', textAlign: 'center', lineHeight: 26, fontWeight: '300', marginBottom: 28 },
  badges: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: '#F7FBFB', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(10,186,181,0.15)' },
  badgeText: { fontSize: 11, color: '#0ABAB5', fontWeight: '600' },
  actions: { marginBottom: 8 },
  primaryButton: { backgroundColor: '#0ABAB5', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 10, shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  secondaryButton: { backgroundColor: '#F7FBFB', borderRadius: 14, padding: 18, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(10,186,181,0.2)', marginBottom: 10 },
  secondaryButtonText: { color: '#0ABAB5', fontSize: 16, fontWeight: '600' },
  mapButton: { padding: 14, alignItems: 'center' },
  mapButtonText: { color: '#C4876A', fontSize: 13, fontWeight: '500' },
})
