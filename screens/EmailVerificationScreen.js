import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';

const API_URL = 'https://api.infusepro.app';

export default function EmailVerificationScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) { setResent(true); }
      else { Alert.alert('Error', data.message || 'Could not resend email'); }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>✉️</Text>
      </View>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>We sent a verification link to</Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.body}>
        Click the link in the email to verify your account before logging in.
      </Text>

      {resent ? (
        <View style={styles.resentBox}>
          <Text style={styles.resentText}>✅ Verification email resent!</Text>
        </View>
      ) : (
        <TouchableOpacity style={styles.resendButton} onPress={handleResend} disabled={resending}>
          {resending ? <ActivityIndicator color="#fff" /> : <Text style={styles.resendText}>Resend Email</Text>}
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Back to Sign In</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 32 },
  iconBox: { width: 90, height: 90, borderRadius: 24, backgroundColor: '#F7FBFB', borderWidth: 1.5, borderColor: 'rgba(10,186,181,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
  iconText: { fontSize: 40 },
  title: { fontSize: 28, fontWeight: '700', color: '#1A2E2E', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#9BB5B4', textAlign: 'center' },
  email: { fontSize: 15, color: '#0ABAB5', fontWeight: '700', marginBottom: 16, textAlign: 'center' },
  body: { fontSize: 14, color: '#9BB5B4', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  resentBox: { backgroundColor: 'rgba(46,204,143,0.1)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(46,204,143,0.3)' },
  resentText: { color: '#2ECC8F', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  resendButton: { backgroundColor: '#0ABAB5', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 14, marginBottom: 16, shadowColor: '#0ABAB5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  resendText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  loginButton: { paddingVertical: 14 },
  loginText: { color: '#C4876A', fontSize: 14, fontWeight: '600' },
});
