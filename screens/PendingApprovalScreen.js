import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, ScrollView } from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function PendingApprovalScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const [status, setStatus] = useState('pending')
  const [docs, setDocs] = useState([])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const checkStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/company/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.platformActive) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'AdminHome', params: { token, user, company: { ...company, platformActive: true } } }]
        })
      }
      if (data.docs) setDocs(data.docs)
    } catch (e) {}
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>INFUSE PRO</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>UNDER REVIEW</Text>
          </View>
          <Text style={styles.title}>Application Pending</Text>
          <Text style={styles.subtitle}>
            Thank you, {user?.firstName}. Your application for {company?.name} is currently under review. We will notify you by email once approved.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>WHAT HAPPENS NEXT</Text>
          {[
            { step: '1', label: 'Document Review', detail: 'We verify your medical director agreement and insurance certificate.' },
            { step: '2', label: 'Account Approval', detail: 'You will receive an email with a link to set up your subscription.' },
            { step: '3', label: 'Subscription Setup', detail: 'Select your plan and complete payment to activate your account.' },
            { step: '4', label: 'Full Access', detail: 'Log back in to sign your BAA and access the full platform.' },
          ].map(item => (
            <View key={item.step} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{item.step}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepLabel}>{item.label}</Text>
                <Text style={styles.stepDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DOCUMENTS SUBMITTED</Text>
          {docs.length === 0 ? (
            <Text style={styles.docNone}>Loading document status...</Text>
          ) : docs.map((doc, i) => (
            <View key={i} style={styles.docRow}>
              <Text style={styles.docCheck}>✓</Text>
              <Text style={styles.docName}>{doc.doc_type === 'md_agreement' ? 'Medical Director Agreement' : 'Certificate of Insurance'}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:joshua@infusepro.app')}>
          <Text style={styles.contactBtnText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  header: { backgroundColor: '#0a1540', padding: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.2)', paddingTop: 56 },
  logo: { color: '#C9A84C', fontSize: 20, fontWeight: '800', letterSpacing: 3 },
  content: { padding: 24 },
  statusCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, marginBottom: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statusBadge: { backgroundColor: 'rgba(255,152,0,0.15)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 16 },
  statusBadgeText: { color: '#FF9800', fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  section: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16 },
  stepNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(201,168,76,0.15)', borderWidth: 1, borderColor: '#C9A84C', alignItems: 'center', justifyContent: 'center' },
  stepNumText: { color: '#C9A84C', fontSize: 13, fontWeight: '700' },
  stepLabel: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  stepDetail: { color: 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 18 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  docCheck: { color: '#4CAF50', fontSize: 16, fontWeight: '700' },
  docName: { color: '#fff', fontSize: 14 },
  docNone: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  contactBtn: { backgroundColor: '#C9A84C', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  contactBtnText: { color: '#0D1B4B', fontSize: 15, fontWeight: '700' },
  logoutBtn: { padding: 16, alignItems: 'center' },
  logoutBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
})
