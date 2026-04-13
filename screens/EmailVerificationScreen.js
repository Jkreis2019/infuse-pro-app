import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
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
      if (res.ok) {
        setResent(true);
      } else {
        Alert.alert('Error', data.message || 'Could not resend email');
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📧</Text>
      <Text style={styles.title}>Check your email</Text>
      <Text style={styles.subtitle}>
        We sent a verification link to
      </Text>
      <Text style={styles.email}>{email}</Text>
      <Text style={styles.body}>
        Click the link in the email to verify your account before logging in.
      </Text>

      {resent ? (
        <Text style={styles.resentText}>✅ Verification email resent!</Text>
      ) : (
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResend}
          disabled={resending}
        >
          {resending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.resendText}>Resend Email</Text>
          )}
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.loginText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1B4B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  icon: {
    fontSize: 64,
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center'
  },
  email: {
    fontSize: 16,
    color: '#5BBFB5',
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center'
  },
  body: {
    fontSize: 15,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22
  },
  resendButton: {
    backgroundColor: '#5BBFB5',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginBottom: 16
  },
  resendText: {
    color: '#0D1B4B',
    fontWeight: 'bold',
    fontSize: 16
  },
  resentText: {
    color: '#4CAF50',
    fontSize: 16,
    marginBottom: 16
  },
  loginButton: {
    paddingVertical: 12
  },
  loginText: {
    color: '#aaa',
    fontSize: 15
  }
});