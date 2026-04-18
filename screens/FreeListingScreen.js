import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, Linking } from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function FreeListingScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  const [phone, setPhone] = useState(company?.phone || '')
  const [website, setWebsite] = useState(company?.website || '')
  const [bio, setBio] = useState(company?.bio || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => Linking.openURL('https://api.infusepro.app/get-started')}>
            <Text style={styles.upgradeBtnText}>Get Started →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
          <Text style={styles.logoutBtnText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
