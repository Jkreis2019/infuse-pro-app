import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.logo}>Infuse Pro</Text>
        <Text style={styles.tagline}>Premium mobile IV therapy,{'\n'}delivered to you</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('CompanyCode')}
        >
          <Text style={styles.primaryButtonText}>I have a company code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.secondaryButtonText}>Browse companies near me</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.staffButton}>
          <Text style={styles.staffButtonText}>I am a staff member</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>Secure · HIPAA compliant · Encrypted</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B4B',
    paddingHorizontal: 28,
    paddingTop: 100,
    paddingBottom: 48,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: '600',
    color: '#C9A84C',
    letterSpacing: 4,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300',
  },
  actions: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#C9A84C',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#0D1B4B',
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'rgba(201,168,76,0.1)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    marginBottom: 10,
  },
  secondaryButtonText: {
    color: '#C9A84C',
    fontSize: 15,
    fontWeight: '500',
  },
  staffButton: {
    padding: 16,
    alignItems: 'center',
  },
  staffButtonText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
  },
  footer: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1,
  },
})