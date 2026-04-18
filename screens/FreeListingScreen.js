import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Linking, Modal, Platform, ActivityIndicator } from 'react-native'
import * as DocumentPicker from 'expo-document-picker'

const API_URL = 'https://api.infusepro.app'

export default function FreeListingScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [phone, setPhone] = useState(company?.phone || '')
  const [website, setWebsite] = useState(company?.website || '')
  const [bio, setBio] = useState(company?.bio || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [upgradeModal, setUpgradeModal] = useState(false)
  const [mdName, setMdName] = useState('')
  const [mdNpi, setMdNpi] = useState('')
  const [npiVerified, setNpiVerified] = useState(false)
  const [npiData, setNpiData] = useState(null)
  const [npiLoading, setNpiLoading] = useState(false)
  const [npiError, setNpiError] = useState('')
  const [mdAgreement, setMdAgreement] = useState(null)
  const [coi, setCoi] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [listingStatus, setListingStatus] = useState('pending')

  useEffect(() => {
    fetch(`${API_URL}/company/status`, { headers })
      .then(r => r.json())
      .then(d => { if (d.listingStatus) setListingStatus(d.listingStatus) })
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/company/update-listing`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ phone, website, bio })
      })
      const data = await res.json()
      if (data.success) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
      else Alert.alert('Error', data.message || 'Could not save')
    } catch (e) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  const verifyNPI = async (npi) => {
    setMdNpi(npi)
    setNpiVerified(false)
    setNpiData(null)
    setNpiError('')
    if (npi.length !== 10) return
    setNpiLoading(true)
    try {
      const res = await fetch(`${API_URL}/verify-npi?npi=${npi}`)
      const data = await res.json()
      if (data.success) {
        setNpiVerified(true)
        setNpiData(data.provider)
      } else {
        setNpiError('NPI not found in registry')
      }
    } catch (e) {
      setNpiError('Verification failed')
    } finally {
      setNpiLoading(false)
    }
  }

  const pickDocument = async (setter) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] })
      if (!result.canceled && result.assets?.[0]) setter(result.assets[0])
    } catch (e) { Alert.alert('Error', 'Could not pick file') }
  }

  const submitUpgrade = async () => {
    if (!mdName || !mdNpi) { Alert.alert('Required', 'Medical director name and NPI are required'); return }
    if (!npiVerified) { Alert.alert('Required', 'Please wait for NPI verification'); return }
    if (!mdAgreement) { Alert.alert('Required', 'Please upload your Medical Director Agreement'); return }
    if (!coi) { Alert.alert('Required', 'Please upload your Certificate of Insurance'); return }
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('mdName', mdName)
      formData.append('mdNpi', mdNpi)
      formData.append('mdCredentials', npiData?.credentials || '')
      formData.append('mdState', npiData?.state || '')
      if (Platform.OS === 'web') {
        formData.append('mdAgreement', mdAgreement.file, mdAgreement.name)
        formData.append('coi', coi.file, coi.name)
      } else {
        formData.append('mdAgreement', { uri: mdAgreement.uri, name: mdAgreement.name, type: mdAgreement.mimeType || 'application/pdf' })
        formData.append('coi', { uri: coi.uri, name: coi.name, type: coi.mimeType || 'application/pdf' })
      }
      const res = await fetch(`${API_URL}/company/upgrade-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        setUpgradeModal(false)
        Alert.alert('Application Submitted', 'We will review your documents and send you a link to complete your subscription within 1-2 business days.')
      } else {
        Alert.alert('Error', data.message || 'Could not submit')
      }
    } catch (e) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>INFUSE PRO</Text>
        <Text style={styles.headerSub}>Free Map Listing</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>

        <View style={styles.statusCard}>
          <View style={[styles.badge, { borderColor: listingStatus === 'approved' ? '#4CAF50' : '#FF9800', backgroundColor: listingStatus === 'approved' ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)' }]}>
            <Text style={[styles.badgeText, { color: listingStatus === 'approved' ? '#4CAF50' : '#FF9800' }]}>
              {listingStatus === 'approved' ? 'LISTING ACTIVE' : 'PENDING REVIEW'}
            </Text>
          </View>
          <Text style={styles.companyName}>{company?.name}</Text>
          <Text style={styles.companySub}>Free map listing — patients can find and contact you</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPDATE YOUR LISTING</Text>
          <Text style={styles.fieldLabel}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="(602) 555-0100" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="phone-pad" />
          <Text style={styles.fieldLabel}>Website</Text>
          <TextInput style={styles.input} value={website} onChangeText={setWebsite} placeholder="https://yourcompany.com" placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="none" />
          <Text style={styles.fieldLabel}>About Your Company</Text>
          <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={bio} onChangeText={setBio} placeholder="Tell patients about your services..." placeholderTextColor="rgba(255,255,255,0.3)" multiline />
          <TouchableOpacity style={[styles.saveBtn, { opacity: saving ? 0.6 : 1, backgroundColor: saved ? '#4CAF50' : '#C9A84C' }]} onPress={save} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.upgradeCard}>
          <Text style={styles.upgradeTitle}>Ready for Full Platform Access?</Text>
          <Text style={styles.upgradeSub}>Get dispatch, patient management, HIPAA-compliant charting, and more.</Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => setUpgradeModal(true)}>
            <Text style={styles.upgradeBtnText}>Get Started →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>

    <Modal visible={upgradeModal} animationType="slide" presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
        <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0a1540', borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.2)' }}>
          <TouchableOpacity onPress={() => setUpgradeModal(false)}>
            <Text style={{ color: '#C9A84C', fontSize: 16, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Platform Upgrade</Text>
          <View style={{ width: 60 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 22, marginBottom: 24 }}>Complete your application to unlock full platform access. We will review your documents within 1-2 business days and send you a subscription link.</Text>

          <Text style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12 }}>MEDICAL DIRECTOR</Text>
          <TextInput style={styles.input} placeholder="Medical Director Full Name *" placeholderTextColor="rgba(255,255,255,0.3)" value={mdName} onChangeText={setMdName} />
          <TextInput style={styles.input} placeholder="NPI Number (10 digits) *" placeholderTextColor="rgba(255,255,255,0.3)" value={mdNpi} onChangeText={verifyNPI} keyboardType="numeric" maxLength={10} />
          {npiLoading && <ActivityIndicator color="#C9A84C" style={{ marginBottom: 12 }} />}
          {npiVerified && npiData && (
            <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 14 }}>✓ {npiData.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 }}>{npiData.credentials} — {npiData.specialty} — {npiData.state}</Text>
            </View>
          )}
          {npiError.length > 0 && (
            <View style={{ backgroundColor: 'rgba(240,100,100,0.1)', borderWidth: 1, borderColor: '#f06060', borderRadius: 10, padding: 12, marginBottom: 12 }}>
              <Text style={{ color: '#f06060', fontSize: 13 }}>{npiError}</Text>
            </View>
          )}

          <Text style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, marginTop: 8 }}>REQUIRED DOCUMENTS</Text>
          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: mdAgreement ? '#4CAF50' : 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 12 }} onPress={() => pickDocument(setMdAgreement)}>
            <Text style={{ color: mdAgreement ? '#4CAF50' : '#C9A84C', fontSize: 14, fontWeight: '600' }}>{mdAgreement ? '✓ ' + mdAgreement.name : 'Upload Medical Director Agreement *'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>PDF, DOC, or image</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: coi ? '#4CAF50' : 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 24 }} onPress={() => pickDocument(setCoi)}>
            <Text style={{ color: coi ? '#4CAF50' : '#C9A84C', fontSize: 14, fontWeight: '600' }}>{coi ? '✓ ' + coi.name : 'Upload Certificate of Insurance *'}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>PDF, DOC, or image</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ backgroundColor: '#C9A84C', borderRadius: 12, padding: 18, alignItems: 'center', opacity: submitting ? 0.6 : 1 }} onPress={submitUpgrade} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#0D1B4B" /> : <Text style={{ color: '#0D1B4B', fontSize: 16, fontWeight: '700' }}>Submit Application</Text>}
          </TouchableOpacity>
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 }}>Your NPI, documents, and IP address will be recorded. We will contact you within 1-2 business days.</Text>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  header: { backgroundColor: '#0a1540', paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.2)' },
  logo: { color: '#C9A84C', fontSize: 20, fontWeight: '800', letterSpacing: 3, marginBottom: 4 },
  headerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  content: { padding: 24 },
  statusCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  badge: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  companyName: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  companySub: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  section: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  sectionTitle: { color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 16 },
  fieldLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, fontSize: 14, color: '#fff', marginBottom: 4 },
  saveBtn: { backgroundColor: '#C9A84C', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: '#0D1B4B', fontSize: 15, fontWeight: '700' },
  upgradeCard: { backgroundColor: 'rgba(201,168,76,0.08)', borderRadius: 14, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' },
  upgradeTitle: { color: '#C9A84C', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  upgradeSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  upgradeBtn: { backgroundColor: '#C9A84C', borderRadius: 10, padding: 14, alignItems: 'center' },
  upgradeBtnText: { color: '#0D1B4B', fontSize: 14, fontWeight: '700' },
  logoutBtn: { padding: 16, alignItems: 'center' },
  logoutBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
})
