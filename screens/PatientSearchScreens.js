import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function PatientSearchScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [profileModal, setProfileModal] = useState(false)
  const [profileData, setProfileData] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [activeTab, setActiveTab] = useState('bookings')

  const searchPatients = useCallback(async (q) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(q)}`, { headers })
      const data = await res.json()
      setResults(data.patients || [])
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setSearching(false)
    }
  }, [token])

  const openProfile = async (patient) => {
    setSelectedPatient(patient)
    setProfileModal(true)
    setLoadingProfile(true)
    setActiveTab('bookings')
    try {
      const res = await fetch(`${API_URL}/patients/${patient.id}/profile`, { headers })
      const data = await res.json()
      if (data.success) setProfileData(data)
      else Alert.alert('Error', 'Could not load patient profile')
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setLoadingProfile(false)
    }
  }

  const STATUS_COLORS = {
    confirmed: '#C9A84C', en_route: '#2196F3', on_scene: '#4CAF50',
    completed: '#aaa', cancelled: '#e53e3e', pending: '#888'
  }

  return (
    <View style={styles.container}>
      {/* Profile Modal */}
      <Modal visible={profileModal} animationType="slide" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: secondaryColor }]}>
            <TouchableOpacity onPress={() => { setProfileModal(false); setProfileData(null) }}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
              {selectedPatient?.first_name} {selectedPatient?.last_name}
            </Text>
            <View style={{ width: 60 }} />
          </View>

          {/* Patient Info */}
          <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 20, paddingBottom: 16 }}>
            {selectedPatient?.phone && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>📞 {selectedPatient.phone}</Text>}
            {selectedPatient?.email && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>✉️ {selectedPatient.email}</Text>}
            {selectedPatient?.dob && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>🎂 {new Date(selectedPatient.dob).toLocaleDateString()}</Text>}
            {profileData && <Text style={{ color: primaryColor, fontSize: 13, marginTop: 4 }}>
              {profileData.totalBookings} total visits · Member since {new Date(selectedPatient?.created_at).toLocaleDateString()}
            </Text>}
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            {['bookings', 'intake', 'gfe'].map(tab => (
              <TouchableOpacity
                key={tab}
                style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? primaryColor : 'transparent' }}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={{ color: activeTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>
                  {tab === 'bookings' ? '📅 Bookings' : tab === 'intake' ? '📋 Intake' : '🩺 GFE'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loadingProfile ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={primaryColor} size="large" />
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

              {/* Bookings Tab */}
              {activeTab === 'bookings' && (
                <>
                  {!profileData?.bookings?.length ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No bookings on record</Text>
                  ) : (
                    profileData.bookings.map(b => (
                      <View key={b.id} style={styles.profileCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{b.service}</Text>
                          <View style={{ backgroundColor: (STATUS_COLORS[b.status] || '#888') + '33', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                            <Text style={{ color: STATUS_COLORS[b.status] || '#888', fontSize: 11, fontWeight: '700' }}>{b.status?.toUpperCase()}</Text>
                          </View>
                        </View>
                        {b.requested_time && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📅 {new Date(b.requested_time).toLocaleDateString()} {new Date(b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
                        {b.address && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📍 {b.address}</Text>}
                        {b.tech_name && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>🧑‍⚕️ {b.tech_name}</Text>}
                      </View>
                    ))
                  )}
                </>
              )}

              {/* Intake Tab */}
              {activeTab === 'intake' && (
                <>
                  {!profileData?.intake ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No intake form on file</Text>
                  ) : (
                    <>
                      <View style={styles.profileCard}>
                        <Text style={[styles.profileSectionTitle, { color: primaryColor }]}>SUBMITTED</Text>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{new Date(profileData.intake.submitted_at).toLocaleDateString()}</Text>
                      </View>
                      {profileData.intake.medications && (
                        <View style={styles.profileCard}>
                          <Text style={[styles.profileSectionTitle, { color: primaryColor }]}>MEDICATIONS</Text>
                          <Text style={{ color: '#fff', fontSize: 13 }}>{profileData.intake.medications}</Text>
                        </View>
                      )}
                      {profileData.intake.allergies_detail?.length > 0 && (
                        <View style={styles.profileCard}>
                          <Text style={[styles.profileSectionTitle, { color: primaryColor }]}>ALLERGIES</Text>
                          {profileData.intake.allergies_detail.map((a, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {a}</Text>)}
                        </View>
                      )}
                      {profileData.intake.medical_history_cardiovascular?.length > 0 && (
                        <View style={styles.profileCard}>
                          <Text style={[styles.profileSectionTitle, { color: primaryColor }]}>CARDIOVASCULAR</Text>
                          {profileData.intake.medical_history_cardiovascular.map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}
                        </View>
                      )}
                      {profileData.intake.important_history?.length > 0 && (
                        <View style={styles.profileCard}>
                          <Text style={[styles.profileSectionTitle, { color: primaryColor }]}>IMPORTANT HISTORY</Text>
                          {profileData.intake.important_history.map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {/* GFE Tab */}
              {activeTab === 'gfe' && (
                <>
                  {!profileData?.gfe ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No GFE on file</Text>
                  ) : (
                    <>
                      <View style={[styles.profileCard, { borderWidth: 1, borderColor: profileData.gfe.not_a_candidate ? '#e53e3e' : '#4CAF50' }]}>
                        <Text style={[styles.profileSectionTitle, { color: profileData.gfe.not_a_candidate ? '#e53e3e' : '#4CAF50' }]}>
                          {profileData.gfe.not_a_candidate ? '🚫 NOT A CANDIDATE' : '✅ APPROVED'}
                        </Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                          Signed by {profileData.gfe.np_name} · Valid until {new Date(profileData.gfe.valid_until).toLocaleDateString()}
                        </Text>
                      </View>
                      {profileData.gfe.approved_services?.length > 0 && (
                        <View style={styles.profileCard}>
                          <Text style={[styles.profileSectionTitle, { color: primaryColor }]}>APPROVED SERVICES</Text>
                          {profileData.gfe.approved_services.map((s, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {s}</Text>)}
                        </View>
                      )}
                      {profileData.gfe.restrictions && (
                        <View style={styles.profileCard}>
                          <Text style={[styles.profileSectionTitle, { color: '#e53e3e' }]}>RESTRICTIONS</Text>
                          <Text style={{ color: '#fff', fontSize: 13 }}>{profileData.gfe.restrictions}</Text>
                        </View>
                      )}
                      {profileData.gfe.np_orders && (
                        <View style={styles.profileCard}>
                          <Text style={[styles.profileSectionTitle, { color: primaryColor }]}>NP ORDERS</Text>
                          <Text style={{ color: '#fff', fontSize: 13 }}>{profileData.gfe.np_orders}</Text>
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Patient Search</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Search Input */}
      <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 16, paddingBottom: 16 }}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or phone..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={searchPatients}
          autoFocus
        />
      </View>

      {/* Results */}
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {searching && (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator color={primaryColor} />
          </View>
        )}

        {!searching && query.length >= 2 && results.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No patients found for "{query}"</Text>
          </View>
        )}

        {results.map(patient => (
          <TouchableOpacity key={patient.id} style={styles.resultCard} onPress={() => openProfile(patient)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.resultName}>{patient.first_name} {patient.last_name}</Text>
              <Text style={styles.resultSub}>{patient.phone || 'No phone'} · {patient.email}</Text>
              {patient.last_address && <Text style={styles.resultSub}>📍 {patient.last_address}</Text>}
              <Text style={styles.resultSub}>{patient.total_bookings || 0} visits</Text>
            </View>
            <Text style={{ color: primaryColor, fontSize: 18 }}>›</Text>
          </TouchableOpacity>
        ))}

        {!searching && query.length < 2 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Search for a patient by name or phone</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, fontSize: 15, color: '#fff' },
  resultCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 },
  resultName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  resultSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  modalHeader: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  profileCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 },
  profileSectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
})