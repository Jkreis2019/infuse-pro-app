import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, RefreshControl, KeyboardAvoidingView, Platform, Image , StatusBar} from 'react-native'

const API_URL = 'https://api.infusepro.app'

const SERVICES = [
  'Hangover Rescue', 'Myers Cocktail', 'Immunity Boost',
  'NAD+ Therapy', 'Migraine Relief', 'Energy Boost'
]

export default function ClinicHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#1D9E75'
  const secondaryColor = company?.secondaryColor || '#0a2420'
  const headers = { Authorization: `Bearer ${token}` }

  const [activeTab, setActiveTab] = useState('checkin')
  const [queue, setQueue] = useState([])
  const [active, setActive] = useState([])
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Walk-in modal
  const [walkinModal, setWalkinModal] = useState(false)
  const [wName, setWName] = useState('')
  const [wPhone, setWPhone] = useState('')
  const [wService, setWService] = useState('')
  const [wNotes, setWNotes] = useState('')
  const [showServiceList, setShowServiceList] = useState(false)
  const [submittingWalkin, setSubmittingWalkin] = useState(false)
  const [wSearchQuery, setWSearchQuery] = useState('')
  const [wSearchResults, setWSearchResults] = useState([])
  const [wSelectedPatient, setWSelectedPatient] = useState(null)
  const [wSearchNoResults, setWSearchNoResults] = useState(false)
const [showCreateWalkin, setShowCreateWalkin] = useState(false)
const [wcFirstName, setWcFirstName] = useState('')
const [wcLastName, setWcLastName] = useState('')
const [wcEmail, setWcEmail] = useState('')
const [wcPhone, setWcPhone] = useState('')
const [wcDob, setWcDob] = useState('')
const [creatingWalkin, setCreatingWalkin] = useState(false)
const [clinicPatientSearchModal, setClinicPatientSearchModal] = useState(false)
const [clinicProfileModal, setClinicProfileModal] = useState(false)
const [cpsQuery, setCpsQuery] = useState('')
const [cpsResults, setCpsResults] = useState([])
const [cpsSearching, setCpsSearching] = useState(false)
const [cpsSelectedPatient, setCpsSelectedPatient] = useState(null)
const [cpsProfileData, setCpsProfileData] = useState(null)
const [cpsLoadingProfile, setCpsLoadingProfile] = useState(false)
const [cpsActiveTab, setCpsActiveTab] = useState('bookings')
const [cpsProfileModal, setCpsProfileModal] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, aRes, lRes] = await Promise.all([
        fetch(`${API_URL}/clinic/queue`, { headers }),
        fetch(`${API_URL}/clinic/active`, { headers }),
        fetch(`${API_URL}/clinic/log`, { headers })
      ])
      const [qData, aData, lData] = await Promise.all([
        qRes.json(), aRes.json(), lRes.json()
      ])
      if (qData.queue) setQueue(qData.queue)
      if (aData.active) setActive(aData.active)
      if (lData.log) setLog(lData.log)
    } catch (err) {
      console.error('Clinic fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  const [companyServices, setCompanyServices] = useState([])
  const [assignTechModal, setAssignTechModal] = useState(false)
const [assignBookingId, setAssignBookingId] = useState(null)
const [assignPatientName, setAssignPatientName] = useState('')
const [clinicTechs, setClinicTechs] = useState([])
const [assigningTech, setAssigningTech] = useState(false)

  React.useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  React.useEffect(() => {
    fetch(`${API_URL}/companies/${company?.id}/services`)
      .then(r => r.json())
      .then(d => { if (d.services) setCompanyServices(d.services.map(s => s.name)) })
      .catch(() => {})
  }, [company?.id])

  const onRefresh = () => { setRefreshing(true); fetchAll() }
  const openAssignTech = async (bookingId, patientName) => {
    setAssignBookingId(bookingId)
    setAssignPatientName(patientName)
    setClinicTechs([])
    setAssignTechModal(true)
    try {
      const res = await fetch(`${API_URL}/clinic/techs`, { headers })
      const data = await res.json()
      if (data.success) setClinicTechs(data.techs)
    } catch (err) {
      Alert.alert('Error', 'Could not load techs')
    }
  }

  const assignTech = async (techId, techName) => {
    setAssigningTech(true)
    try {
      const res = await fetch(`${API_URL}/clinic/assign-tech`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: assignBookingId, techId })
      })
      const data = await res.json()
      if (data.success) {
        setAssignTechModal(false)
        fetchAll()
        Alert.alert('✅ Assigned', `${techName} has been assigned to ${assignPatientName}`)
      } else {
        Alert.alert('Error', data.error || 'Could not assign tech')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setAssigningTech(false)
    }
  }

  const searchWalkinPatients = async (query) => {
  setWSearchQuery(query)
  setWSearchNoResults(false)
  if (query.length < 2) { setWSearchResults([]); return }
  try {
    const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(query)}`, { headers })
    const data = await res.json()
    setWSearchResults(data.patients || [])
    setWSearchNoResults(data.patients?.length === 0)
  } catch (e) {
    setWSearchResults([])
  }
}

const searchCpsPatients = useCallback(async (q) => {
  setCpsQuery(q)
  if (q.length < 2) { setCpsResults([]); return }
  setCpsSearching(true)
  try {
    const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(q)}`, { headers })
    const data = await res.json()
    setCpsResults(data.patients || [])
  } catch (err) {
    console.error('CPS Search error:', err)
  } finally {
    setCpsSearching(false)
  }
}, [token])

const openCpsProfile = async (patient) => {
  setCpsSelectedPatient(patient)
  setCpsProfileModal(true)
  setCpsLoadingProfile(true)
  setCpsActiveTab('bookings')
  try {
    const res = await fetch(`${API_URL}/patients/${patient.id}/profile`, { headers })
    const data = await res.json()
    if (data.success) setCpsProfileData(data)
    else Alert.alert('Error', 'Could not load patient profile')
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setCpsLoadingProfile(false)
  }
}

const createWalkinPatient = async () => {
  if (!wcFirstName || !wcLastName || !wcEmail || !wcDob) {
    Alert.alert('Required', 'First name, last name, email and date of birth are required')
    return
  }
  setCreatingWalkin(true)
  try {
    const dobParts = wcDob.split('/')
    const formattedDob = dobParts.length === 3
      ? `${dobParts[2]}-${dobParts[0].padStart(2,'0')}-${dobParts[1].padStart(2,'0')}`
      : wcDob
    const res = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: wcEmail.toLowerCase(),
        password: Math.random().toString(36).slice(-10) + 'Aa1!',
        firstName: wcFirstName,
        lastName: wcLastName,
        phone: wcPhone || null,
        dob: formattedDob,
        companyCode: company?.code
      })
    })
    const data = await res.json()
    if (data.success) {
      selectWalkinPatient({
        id: data.user.id,
        first_name: wcFirstName,
        last_name: wcLastName,
        phone: wcPhone || '',
        last_address: ''
      })
      setShowCreateWalkin(false)
      setWalkinModal(true)
      setWcFirstName(''); setWcLastName(''); setWcEmail(''); setWcPhone(''); setWcDob('')
      Alert.alert('✅ Patient Created', `${wcFirstName} ${wcLastName} has been added to the system`)
    } else {
      Alert.alert('Error', data.message || 'Could not create patient')
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setCreatingWalkin(false)
  }
}

  const selectWalkinPatient = (patient) => {
  setWSelectedPatient(patient)
  setWName(`${patient.first_name} ${patient.last_name}`)
  setWPhone(patient.phone || '')
  setWSearchQuery('')
  setWSearchResults([])
  setWSearchNoResults(false)
}

  const submitWalkin = async () => {
    if (!wName.trim() || !wService) return Alert.alert('Please enter patient name and select a service')
    setSubmittingWalkin(true)
    try {
      const res = await fetch(`${API_URL}/clinic/walkin`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: wName, phone: wPhone, service: wService, notes: wNotes, userId: wSelectedPatient?.id || null })
      })
      const data = await res.json()
      if (data.success) {
        setWalkinModal(false)
        setWName(''); setWPhone(''); setWService(''); setWNotes('')
        setWSearchQuery(''); setWSearchResults([]); setWSelectedPatient(null)
        fetchAll()
        Alert.alert('✅ Checked In', `${wName} has been added to the queue`)
      } else {
        Alert.alert('Error', data.message || 'Could not check in patient')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSubmittingWalkin(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = { pending: '#C9A84C', confirmed: '#2196F3', on_scene: '#4CAF50', completed: '#aaa', cancelled: '#e53e3e' }
    return colors[status] || '#aaa'
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={primaryColor} size="large" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            {company?.logoUrl ? (
  <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: primaryColor + '20', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 }}>
    <Image source={{ uri: company.logoUrl }} style={{ width: 42, height: 42, resizeMode: 'contain' }} />
  </View>
) : (
  <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
)}
            <Text style={styles.headerTitle}>Clinic Console</Text>
            <Text style={styles.headerSub}>{user?.firstName} · FRONT DESK</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[styles.walkinBtn, { backgroundColor: primaryColor }]}
              onPress={() => setWalkinModal(true)}
            >
              <Text style={[styles.walkinBtnText, { color: secondaryColor }]}>+ Walk-In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
              onPress={() => setClinicPatientSearchModal(true)}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>🔍 Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
              onPress={() => setClinicProfileModal(true)}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>👤 Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        {[
          { key: 'checkin', label: `Check-In (${queue.length})` },
          { key: 'active', label: `In Treatment (${active.length})` },
          { key: 'log', label: `Done (${log.length})` }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab.key ? primaryColor : 'transparent' }}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={{ color: activeTab === tab.key ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Check-In Tab */}
      {activeTab === 'checkin' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {queue.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🏥</Text>
              <Text style={styles.emptyText}>No patients waiting</Text>
              <Text style={styles.emptySub}>Tap + Walk-In to add a patient</Text>
            </View>
          ) : (
            queue.map(booking => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{booking.service}</Text>
                  <View style={[styles.statusBadge, { borderColor: primaryColor, backgroundColor: '#fff' }]}>
                    <Text style={[styles.statusBadgeText, { color: primaryColor }]}>WAITING</Text>
                  </View>
                </View>
                <Text style={styles.cardPatient}>👤 {booking.patient_name}</Text>
                {booking.has_valid_intake ? (
                  <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>✅ Intake on file</Text>
                ) : (
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>⚠️ No intake on file</Text>
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {booking.patient_email && (
                        <TouchableOpacity
                          style={{ backgroundColor: 'rgba(33,150,243,0.15)', borderWidth: 1, borderColor: '#2196F3', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                          onPress={async () => {
                            try {
                              const res = await fetch(`${API_URL}/dispatch/send-intake`, {
                                method: 'POST',
                                headers: { ...headers, 'Content-Type': 'application/json' },
                                body: JSON.stringify({ bookingId: booking.id, userId: booking.user_id })
                              })
                              const data = await res.json()
                              if (data.success) Alert.alert('✅ Sent', `Intake link sent to ${booking.patient_email}`)
                              else Alert.alert('Error', data.message || 'Could not send intake')
                            } catch (err) { Alert.alert('Error', 'Network error') }
                          }}
                        >
                          <Text style={{ color: '#2196F3', fontSize: 11, fontWeight: '700' }}>📧 Send Email</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={{ backgroundColor: 'rgba(76,175,80,0.15)', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                        onPress={() => {
                          const { Linking } = require('react-native')
                          Linking.openURL(`https://intake.infusepro.app?bookingId=${booking.id}`)
                        }}
                      >
                        <Text style={{ color: '#4CAF50', fontSize: 11, fontWeight: '700' }}>📱 Open on Device</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ backgroundColor: 'rgba(255,152,0,0.15)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}
                        onPress={async () => {
                          try {
                            const DocumentPicker = require('expo-document-picker')
                            const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true })
                            if (result.canceled) return
                            Alert.alert('📄 Paper Upload', 'PDF upload for paper forms coming soon — for now use Send Email or Open on Device')
                          } catch (err) { Alert.alert('Error', 'Could not open file picker') }
                        }}
                      >
                        <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700' }}>📄 Upload Paper</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                {booking.notes && <Text style={styles.cardNotes}>📝 {booking.notes}</Text>}
                <Text style={styles.cardTime}>🕐 {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.assignButton, { backgroundColor: primaryColor }]}
                    onPress={() => openAssignTech(booking.id, booking.patient_name)}
                  >
                    <Text style={[styles.assignButtonText, { color: secondaryColor }]}>Assign Tech →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelCardButton}
                    onPress={() => Alert.alert('Cancel', 'Cancel this walk-in?', [
                      { text: 'No', style: 'cancel' },
                      { text: 'Yes', style: 'destructive', onPress: async () => {
                        await fetch(`${API_URL}/bookings/${booking.id}/cancel`, { method: 'POST', headers })
                        fetchAll()
                      }}
                    ])}
                  >
                    <Text style={styles.cancelCardText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* In Treatment Tab */}
      {activeTab === 'active' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {active.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💉</Text>
              <Text style={styles.emptyText}>No active treatments</Text>
            </View>
          ) : (
            active.map(call => (
              <View key={call.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{call.service}</Text>
                  <View style={[styles.statusBadge, { borderColor: '#4CAF50', backgroundColor: '#fff' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#4CAF50' }]}>IN TREATMENT</Text>
                  </View>
                </View>
                <Text style={styles.cardPatient}>👤 {call.patient_name}</Text>
                {call.tech_first && <Text style={styles.cardTech}>🧑‍⚕️ {call.tech_first} {call.tech_last}</Text>}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Done Tab */}
      {activeTab === 'log' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {log.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>No completed treatments today</Text>
            </View>
          ) : (
            log.map(entry => (
              <View key={entry.id} style={styles.card}>
                <Text style={styles.cardService}>{entry.service}</Text>
                <Text style={styles.cardPatient}>👤 {entry.patient_name}</Text>
{entry.tech_first && <Text style={styles.cardTech}>🧑‍⚕️ {entry.tech_first} {entry.tech_last}</Text>}
<Text style={[styles.cardTime, { color: entry.status === 'cancelled' ? '#e53e3e' : '#aaa' }]}>
  {entry.status === 'cancelled' ? '❌ Cancelled' : '✅ Completed'}
</Text>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Assign Tech Modal */}
      <Modal visible={assignTechModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Assign Tech</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
              Patient: {assignPatientName}
            </Text>
            {clinicTechs.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <ActivityIndicator color={primaryColor} />
              </View>
            ) : (
              clinicTechs.map(tech => (
                <TouchableOpacity
                  key={tech.id}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 10 }}
                  onPress={() => assignTech(tech.id, `${tech.first_name} ${tech.last_name}`)}
                  disabled={assigningTech}
                >
                  <View>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{tech.first_name} {tech.last_name}</Text>
                    <Text style={{ color: tech.status === 'available' ? '#4CAF50' : 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>
                      {tech.status === 'available' ? '🟢 Available' : tech.status === 'on_scene' ? '🟣 On Scene' : tech.status === 'assigned' ? '🟡 Assigned' : '⚪ ' + (tech.status || 'Offline')}
                    </Text>
                  </View>
                  <Text style={{ color: primaryColor, fontSize: 20 }}>›</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.cancelModal} onPress={() => setAssignTechModal(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
<Modal visible={clinicProfileModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>{user?.firstName} {user?.lastName}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>{user?.email}</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Role</Text>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>FRONT DESK</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', marginBottom: 24 }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Company</Text>
        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{company?.name}</Text>
      </View>
      <TouchableOpacity
        style={{ backgroundColor: 'rgba(220,80,80,0.15)', borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 }}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
      >
        <Text style={{ color: '#f09090', fontSize: 15, fontWeight: '500' }}>Log out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => setClinicProfileModal(false)}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Create Walkin Patient Modal */}
<Modal visible={showCreateWalkin} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>New Patient</Text>
          <Text style={styles.sectionLabel}>First Name *</Text>
          <TextInput style={styles.input} placeholder="First name" placeholderTextColor="#666" value={wcFirstName} onChangeText={setWcFirstName} />
          <Text style={styles.sectionLabel}>Last Name *</Text>
          <TextInput style={styles.input} placeholder="Last name" placeholderTextColor="#666" value={wcLastName} onChangeText={setWcLastName} />
          <Text style={styles.sectionLabel}>Email *</Text>
          <TextInput style={styles.input} placeholder="email@example.com" placeholderTextColor="#666" value={wcEmail} onChangeText={setWcEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.sectionLabel}>Phone</Text>
          <TextInput style={styles.input} placeholder="(602) 555-0100" placeholderTextColor="#666" value={wcPhone} onChangeText={setWcPhone} keyboardType="phone-pad" />
          <Text style={styles.sectionLabel}>Date of Birth *</Text>
          <TextInput style={styles.input} placeholder="MM/DD/YYYY" placeholderTextColor="#666" value={wcDob} onChangeText={(text) => {
            let v = text.replace(/\D/g, '').slice(0, 8)
            if (v.length > 4) v = v.slice(0,2) + '/' + v.slice(2,4) + '/' + v.slice(4)
            else if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2)
            setWcDob(v)
          }} keyboardType="numeric" />
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: primaryColor, marginBottom: 10 }, creatingWalkin && { opacity: 0.6 }]}
            onPress={createWalkinPatient}
            disabled={creatingWalkin}
          >
            {creatingWalkin ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.submitBtnText, { color: secondaryColor }]}>Create Patient</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelModal} onPress={() => {
            setShowCreateWalkin(false)
            setWalkinModal(true)
            setWcFirstName(''); setWcLastName(''); setWcEmail(''); setWcPhone(''); setWcDob('')
          }}>
            <Text style={styles.cancelModalText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>
</Modal>

{/* Clinic Patient Search Modal */}
<Modal visible={clinicPatientSearchModal} animationType="slide" presentationStyle="fullScreen">
  <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
    {/* Profile Modal */}
    <Modal visible={cpsProfileModal} animationType="slide" presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
        <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
          <TouchableOpacity onPress={() => { setCpsProfileModal(false); setCpsProfileData(null) }}>
            <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{cpsSelectedPatient?.first_name} {cpsSelectedPatient?.last_name}</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 20, paddingBottom: 16 }}>
          {cpsSelectedPatient?.phone && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>📞 {cpsSelectedPatient.phone}</Text>}
          {cpsSelectedPatient?.email && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>✉️ {cpsSelectedPatient.email}</Text>}
          {cpsProfileData && <Text style={{ color: primaryColor, fontSize: 13, marginTop: 4 }}>{cpsProfileData.totalBookings} total visits</Text>}
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
          {['bookings', 'intake', 'gfe'].map(tab => (
            <TouchableOpacity key={tab} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: cpsActiveTab === tab ? primaryColor : 'transparent' }} onPress={() => setCpsActiveTab(tab)}>
              <Text style={{ color: cpsActiveTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>
                {tab === 'bookings' ? '📅 Bookings' : tab === 'intake' ? '📋 Intake' : '🩺 GFE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {cpsLoadingProfile ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={primaryColor} size="large" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
            {cpsActiveTab === 'bookings' && (
              <>
                {!cpsProfileData?.bookings?.length ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No bookings on record</Text>
                ) : (
                  cpsProfileData.bookings.map(b => (
                    <View key={b.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{b.service}</Text>
                        <Text style={{ color: '#aaa', fontSize: 11, fontWeight: '700' }}>{b.status?.toUpperCase()}</Text>
                      </View>
                      {b.requested_time && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📅 {new Date(b.requested_time).toLocaleDateString()}</Text>}
                      {b.address && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📍 {b.address}</Text>}
                      {b.tech_name && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>🧑‍⚕️ {b.tech_name}</Text>}
                    </View>
                  ))
                )}
              </>
            )}
            {cpsActiveTab === 'intake' && (
              <>
                {!cpsProfileData?.intake ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No intake form on file</Text>
                ) : (
                  <>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                      <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>SUBMITTED</Text>
                      <Text style={{ color: '#fff', fontSize: 13 }}>{new Date(cpsProfileData.intake.submitted_at).toLocaleDateString()}</Text>
                    </View>
                    {cpsProfileData.intake.medications && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>MEDICATIONS</Text>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{cpsProfileData.intake.medications_text || psProfileData.intake.medications}</Text>
                      </View>
                    )}
                    {cpsProfileData.intake.allergies_detail?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>ALLERGIES</Text>
                        {(Array.isArray(cpsProfileData.intake.allergies_detail) ? cpsProfileData.intake.allergies_detail : []).map((a, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {a}</Text>)}
                      </View>
                    )}
                    {cpsProfileData.intake.important_history?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>IMPORTANT HISTORY</Text>
                        {(Array.isArray(cpsProfileData.intake.important_history) ? cpsProfileData.intake.important_history : []).map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}
                      </View>
                    )}
                  </>
                )}
              </>
            )}
            {cpsActiveTab === 'gfe' && (
              <>
                {!cpsProfileData?.gfe ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No GFE on file</Text>
                ) : (
                  <>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: cpsProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50' }}>
                      <Text style={{ color: cpsProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>
                        {cpsProfileData.gfe.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ APPROVED'}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Signed by {cpsProfileData.gfe.npName} · Valid until {new Date(cpsProfileData.gfe.validUntil).toLocaleDateString()}</Text>
                    </View>
                    {cpsProfileData.gfe.approvedServices?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>APPROVED SERVICES</Text>
                        {cpsProfileData.gfe.approvedServices.map((s, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {s}</Text>)}
                      </View>
                    )}
                    {cpsProfileData.gfe.restrictions && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>RESTRICTIONS</Text>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{cpsProfileData.gfe.restrictions}</Text>
                      </View>
                    )}
                    {cpsProfileData.gfe.npOrders && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>NP ORDERS</Text>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{cpsProfileData.gfe.npOrders}</Text>
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
    <View style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
      <TouchableOpacity onPress={() => { setClinicPatientSearchModal(false); setCpsQuery(''); setCpsResults([]) }}>
        <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Patient Search</Text>
      <View style={{ width: 60 }} />
    </View>

    <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 16, paddingBottom: 16 }}>
      <TextInput
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, fontSize: 15, color: '#fff' }}
        placeholder="Search by name or phone..."
        placeholderTextColor="#666"
        value={cpsQuery}
        onChangeText={searchCpsPatients}
        autoFocus
      />
    </View>

    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      {cpsSearching && <View style={{ alignItems: 'center', padding: 20 }}><ActivityIndicator color={primaryColor} /></View>}
      {!cpsSearching && cpsQuery.length >= 2 && cpsResults.length === 0 && (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No patients found for "{cpsQuery}"</Text>
        </View>
      )}
      {cpsResults.map(patient => (
        <TouchableOpacity key={patient.id} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }} onPress={() => openCpsProfile(patient)}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{patient.first_name} {patient.last_name}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{patient.phone || 'No phone'} · {patient.email}</Text>
            {patient.last_address && <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📍 {patient.last_address}</Text>}
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{patient.total_bookings || 0} visits</Text>
          </View>
          <Text style={{ color: primaryColor, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}
      {!cpsSearching && cpsQuery.length < 2 && (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Search by name or phone</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  </View>
</Modal>

      {/* Walk-In Modal */}
      <Modal visible={walkinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Walk-In Patient</Text>
                <Text style={styles.sectionLabel}>Search existing patient</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Search by name or phone..."
                  placeholderTextColor="#666"
                  value={wSearchQuery}
                  onChangeText={searchWalkinPatients}
                />
                {wSearchResults.length > 0 && (
                  <View style={{ backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 10 }}>
                    {wSearchResults.map(p => (
                      <TouchableOpacity
                        key={p.id}
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' }}
                        onPress={() => selectWalkinPatient(p)}
                      >
                        <Text style={{ color: '#fff', fontWeight: '600' }}>{p.first_name} {p.last_name}</Text>
                        <Text style={{ color: '#aaa', fontSize: 12 }}>{p.phone || 'No phone'} · {p.last_address || 'No address'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                {wSearchNoResults && wSearchQuery.length >= 2 && (
                  <View style={{ backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 10, padding: 12 }}>
                    <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No patients found for "{wSearchQuery}"</Text>
                    <TouchableOpacity
                      style={{ backgroundColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center' }}
                      onPress={() => { setWalkinModal(false); setShowCreateWalkin(true) }}
                    >
                      <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 13 }}>+ Create New Patient</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <Text style={styles.sectionLabel}>Patient name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full name"
                  placeholderTextColor="#666"
                  value={wName}
                  onChangeText={setWName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Phone number (optional)"
                  placeholderTextColor="#666"
                  value={wPhone}
                  onChangeText={setWPhone}
                  keyboardType="phone-pad"
                />
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowServiceList(!showServiceList)}
                >
                  <Text style={{ color: wService ? '#fff' : '#666' }}>{wService || 'Select service *'}</Text>
                </TouchableOpacity>
                {showServiceList && (
                  <View style={{ backgroundColor: '#1a2a5e', borderRadius: 8, marginBottom: 10 }}>
                    {(companyServices.length > 0 ? companyServices : SERVICES).map(s => (
                      <TouchableOpacity
                        key={s}
                        style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                        onPress={() => { setWService(s); setShowServiceList(false) }}
                      >
                        <Text style={{ color: '#fff' }}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <TextInput
                  style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                  placeholder="Notes (optional)"
                  placeholderTextColor="#666"
                  value={wNotes}
                  onChangeText={setWNotes}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: primaryColor, marginBottom: 10 }]}
                  onPress={submitWalkin}
                  disabled={submittingWalkin}
                >
                  {submittingWalkin ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.submitBtnText, { color: secondaryColor }]}>Check In Patient</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelModal} onPress={() => {
                  setWalkinModal(false)
                  setWSearchQuery('')
                  setWSearchResults([])
                  setWSelectedPatient(null)
                  setWName('')
                  setWPhone('')
                  setWService('')
                  setWNotes('')
                }}>
                  <Text style={styles.cancelModalText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a2420' },
  centered: { flex: 1, backgroundColor: '#0a2420', alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: Platform.OS === 'web' ? 16 : 56, paddingBottom: 20, paddingHorizontal: 24 },
  companyName: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  walkinBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  walkinBtnText: { fontSize: 14, fontWeight: '700' },
  scroll: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  card: { marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardService: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardPatient: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  cardTech: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  cardNotes: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  cardTime: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  assignButton: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  assignButtonText: { fontSize: 13, fontWeight: '700' },
  cancelCardButton: { borderWidth: 1, borderColor: 'rgba(220,80,80,0.4)', borderRadius: 10, padding: 12, paddingHorizontal: 16 },
  cancelCardText: { color: '#f09090', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0a2420', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  sectionLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff', marginBottom: 10 },
  submitBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '700' },
  cancelModal: { alignItems: 'center', padding: 12 },
  cancelModalText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
})