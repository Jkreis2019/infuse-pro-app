import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, Alert, TextInput
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

const STATUS_COLORS = {
  available: '#4CAF50',
  assigned: '#C9A84C',
  en_route: '#2196F3',
  on_scene: '#9C27B0',
  clear: '#4CAF50'
}

const STATUS_LABELS = {
  available: 'Available',
  assigned: 'Assigned',
  en_route: 'En Route',
  on_scene: 'On Scene',
  clear: 'Clear'
}

const BOOKING_STATUS_COLORS = {
  confirmed: '#C9A84C',
  en_route: '#2196F3',
  on_scene: '#9C27B0'
}

const SERVICES = [
  'Hangover Rescue',
  'Myers Cocktail',
  'NAD+ Therapy',
  'Immunity Boost',
  'Energy Boost',
  'Beauty Drip',
  'Hydration Drip',
  'Performance Recovery',
  'Custom Drip'
]

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

export default function DispatcherHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'

  const [activeTab, setActiveTab] = useState('queue')
  const [queue, setQueue] = useState([])
  const [active, setActive] = useState([])
  const [techs, setTechs] = useState([])
  const [stats, setStats] = useState({ pending: 0, active: 0, completed_today: 0, cancelled_today: 0 })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Assign modal
  const [assignModal, setAssignModal] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [isReassign, setIsReassign] = useState(false)

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)
  const [cancelStatus, setCancelStatus] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  // New booking modal
  const [newBookingModal, setNewBookingModal] = useState(false)
  const [nbPatientName, setNbPatientName] = useState('')
  const [nbPhone, setNbPhone] = useState('')
  const [nbAddress, setNbAddress] = useState('')
  const [nbService, setNbService] = useState('')
  const [nbNotes, setNbNotes] = useState('')
  const [showServiceList, setShowServiceList] = useState(false)
  const [submittingBooking, setSubmittingBooking] = useState(false)

  // Add patient modal
  const [addPatientModal, setAddPatientModal] = useState(false)
  const [addPatientBookingId, setAddPatientBookingId] = useState(null)
  const [apName, setApName] = useState('')
  const [apPhone, setApPhone] = useState('')
  const [apDob, setApDob] = useState('')
  const [addingPatient, setAddingPatient] = useState(false)

  // Patient list modal
  const [patientListModal, setPatientListModal] = useState(false)
  const [patientListBookingId, setPatientListBookingId] = useState(null)
  const [patientListName, setPatientListName] = useState('')
  const [patients, setPatients] = useState([])
  const [loadingPatients, setLoadingPatients] = useState(false)

  // Send intake modal
const [sendIntakeModal, setSendIntakeModal] = useState(false)
const [intakePatientName, setIntakePatientName] = useState('')
const [intakePatientEmail, setIntakePatientEmail] = useState('')
const [patientListEmail, setPatientListEmail] = useState('')
const [intakeBookingId, setIntakeBookingId] = useState(null)
const [sendingIntake, setSendingIntake] = useState(false)
const [profileModal, setProfileModal] = useState(false)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, aRes, tRes, sRes] = await Promise.all([
        fetch(`${API_URL}/dispatch/queue`, { headers }),
        fetch(`${API_URL}/dispatch/active`, { headers }),
        fetch(`${API_URL}/dispatch/techs`, { headers }),
        fetch(`${API_URL}/dispatch/stats`, { headers })
      ])
      const [qData, aData, tData, sData] = await Promise.all([
        qRes.json(), aRes.json(), tRes.json(), sRes.json()
      ])
      if (qData.queue) setQueue(qData.queue)
      if (aData.active) setActive(aData.active)
      if (tData.techs) setTechs(tData.techs)
      if (sData.stats) setStats(sData.stats)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const onRefresh = () => {
    setRefreshing(true)
    fetchAll()
  }

  const openAssignModal = (booking, reassign = false) => {
    setSelectedBooking(booking)
    setIsReassign(reassign)
    setAssignModal(true)
  }

  const assignTech = async (techId) => {
    try {
      const url = isReassign
        ? `${API_URL}/bookings/${selectedBooking.id}/reassign`
        : `${API_URL}/dispatch/assign`
      const body = isReassign
        ? { techId }
        : { bookingId: selectedBooking.id, techId }
      const res = await fetch(url, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (data.success) {
        setAssignModal(false)
        setSelectedBooking(null)
        setIsReassign(false)
        fetchAll()
      } else {
        Alert.alert('Error', data.message || 'Could not assign tech')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    }
  }

  const openCancelModal = (bookingId, status) => {
    setCancelBookingId(bookingId)
    setCancelStatus(status)
    setCancelReason('')
    setCancelModal(true)
  }

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      Alert.alert('Required', 'Please enter a reason for cancellation')
      return
    }
    setCancelling(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${cancelBookingId}/cancel`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      })
      const data = await res.json()
      if (data.success) {
        setCancelModal(false)
        setCancelReason('')
        fetchAll()
      } else {
        Alert.alert('Error', data.message || 'Could not cancel')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setCancelling(false)
    }
  }

  const submitNewBooking = async () => {
    if (!nbPatientName || !nbService || !nbAddress) {
      Alert.alert('Required', 'Patient name, service, and address are required')
      return
    }
    setSubmittingBooking(true)
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: nbPatientName,
          patientPhone: nbPhone,
          service: nbService,
          address: nbAddress,
          notes: nbNotes,
          source: 'phone'
        })
      })
      const data = await res.json()
      if (data.success) {
        setNewBookingModal(false)
        setNbPatientName('')
        setNbPhone('')
        setNbAddress('')
        setNbService('')
        setNbNotes('')
        setShowServiceList(false)
        fetchAll()
        setActiveTab('queue')
      } else {
        Alert.alert('Error', data.message || 'Could not create booking')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSubmittingBooking(false)
    }
  }

 const openPatientList = async (bookingId, patientName, patientEmail = '') => {
    setPatientListBookingId(bookingId)
    setPatientListName(patientName)
    setPatientListEmail(patientEmail)
    setPatientListModal(true)
    setLoadingPatients(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/patients`, { headers })
      const data = await res.json()
      if (data.success) setPatients(data.patients)
    } catch (err) {
      console.error('Failed to load patients', err)
    } finally {
      setLoadingPatients(false)
    }
  }

  const openAddPatient = (bookingId) => {
    setAddPatientBookingId(bookingId)
    setApName('')
    setApPhone('')
    setApDob('')
    setPatientListModal(false)
    setAddPatientModal(true)
  }

const openSendIntake = (bookingId, patientName, patientEmail = '') => {
  setIntakeBookingId(bookingId)
  setIntakePatientName(patientName)
  setIntakePatientEmail(patientEmail)
  setPatientListModal(false)
  setSendIntakeModal(true)
}

const submitSendIntake = async () => {
  if (!intakePatientEmail.trim()) {
    Alert.alert('Required', 'Please enter the patient email')
    return
  }
  setSendingIntake(true)
  try {
    const res = await fetch(`${API_URL}/intake/send-form`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: intakeBookingId,
        patientEmail: intakePatientEmail,
        patientName: intakePatientName
      })
    })
    const data = await res.json()
    if (data.success) {
      setSendIntakeModal(false)
      Alert.alert('✅ Sent!', `Intake form sent to ${intakePatientEmail}`)
      fetchAll()
    } else {
      Alert.alert('Error', data.message || 'Could not send intake form')
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setSendingIntake(false)
  }
}

  const submitAddPatient = async () => {
    if (!apName.trim()) {
      Alert.alert('Required', 'Patient name is required')
      return
    }
    setAddingPatient(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${addPatientBookingId}/add-patient`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: apName,
          patientPhone: apPhone,
          patientDob: apDob || undefined
        })
      })
      const data = await res.json()
      if (data.success) {
        setAddPatientModal(false)
        Alert.alert('Added!', `${apName} has been added to the call.`)
        fetchAll()
      } else {
        Alert.alert('Error', data.message || 'Could not add patient')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setAddingPatient(false)
    }
  }

  const availableTechs = techs.filter(t => t.status === 'available' || t.status === 'clear')

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
  <View style={styles.headerRow}>
    <View style={{ flex: 1 }}>
      <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
      <Text style={styles.headerTitle}>Dispatch Console</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statItem}>📋 {stats.pending} pending</Text>
        <Text style={styles.statItem}>🚗 {stats.active} active</Text>
        <Text style={styles.statItem}>✅ {stats.completed_today} done</Text>
        <Text style={styles.statItem}>❌ {stats.cancelled_today} cancelled</Text>
      </View>
    </View>
    <View style={{ alignItems: 'flex-end', gap: 8 }}>
      <TouchableOpacity
  style={[styles.newBookingBtn, { backgroundColor: primaryColor }]}
  onPress={() => setNewBookingModal(true)}
>
  <Text style={[styles.newBookingBtnText, { color: secondaryColor }]}>+ New</Text>
</TouchableOpacity>
<TouchableOpacity
  onPress={() => setProfileModal(true)}
>
  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>👤 Profile</Text>
</TouchableOpacity>
<TouchableOpacity
  onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
>
  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Log out</Text>
</TouchableOpacity>
</View>
</View>
</View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['queue', 'active', 'team'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: primaryColor }]}>
              {tab === 'queue' ? `Queue ${queue.length > 0 ? `(${queue.length})` : ''}` :
               tab === 'active' ? `Active ${active.length > 0 ? `(${active.length})` : ''}` :
               `Team (${techs.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
        >
          {queue.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>Queue is clear</Text>
              <Text style={styles.emptySub}>No pending bookings</Text>
            </View>
          ) : (
            queue.map(booking => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{booking.service}</Text>
                  <View style={[styles.newBadge, { backgroundColor: booking.source === 'phone' ? '#2196F3' : primaryColor }]}>
                    <Text style={styles.newBadgeText}>
                      {booking.source === 'phone' ? 'PHONE' : 'APP'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardPatient}>👤 {booking.patient_name}</Text>
                <Text style={styles.cardAddress}>📍 {booking.address}</Text>
                {booking.patient_phone && <Text style={styles.cardPhone}>📞 {booking.patient_phone}</Text>}
                {booking.notes && <Text style={styles.cardNotes}>📝 {booking.notes}</Text>}
                <Text style={styles.cardTime}>
                  🕐 {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={styles.cardActions}>
  <TouchableOpacity
    style={[styles.assignButton, { backgroundColor: primaryColor }]}
    onPress={() => openAssignModal(booking, false)}
  >
    <Text style={[styles.assignButtonText, { color: secondaryColor }]}>Assign →</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.viewPatientsButton, { borderColor: primaryColor }]}
    onPress={() => openPatientList(booking.id, booking.patient_name, booking.patient_email || '')}
  >
    <Text style={[styles.viewPatientsText, { color: primaryColor }]}>👥 Patients</Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={styles.cancelCardButton}
    onPress={() => openCancelModal(booking.id, 'pending')}
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

      {/* Active Tab */}
      {activeTab === 'active' && (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
        >
          {active.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyText}>No active calls</Text>
              <Text style={styles.emptySub}>Assign techs from the Queue tab</Text>
            </View>
          ) : (
            active.map(call => (
              <View key={call.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{call.service}</Text>
                  <View style={[styles.statusBadge, { borderColor: BOOKING_STATUS_COLORS[call.status] || '#aaa' }]}>
                    <Text style={[styles.statusBadgeText, { color: BOOKING_STATUS_COLORS[call.status] || '#aaa' }]}>
                      {call.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardPatient}>👤 {call.patient_name}</Text>
                <Text style={styles.cardAddress}>📍 {call.address}</Text>
                {call.tech_first && (
                  <Text style={styles.cardTech}>🧑‍⚕️ {call.tech_first} {call.tech_last}</Text>
                )}
                {call.patient_count > 1 && (
                  <Text style={[styles.cardPatientCount, { color: primaryColor }]}>
                    👥 {call.patient_count} patients on this call
                  </Text>
                )}
                <Text style={styles.cardTimer}>
                  ⏱ {formatTime(call.seconds_in_status)} in current status
                  {call.seconds_in_status > 3600 && ' ⚠️'}
                </Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.viewPatientsButton, { borderColor: primaryColor }]}
                    onPress={() => openPatientList(call.id, call.patient_name, call.patient_email || '')}
                  >
                    <Text style={[styles.viewPatientsText, { color: primaryColor }]}>👥 Patients</Text>
                  </TouchableOpacity>
                  {call.status !== 'on_scene' && (
                    <TouchableOpacity
                      style={styles.reassignButton}
                      onPress={() => openAssignModal(call, true)}
                    >
                      <Text style={styles.reassignButtonText}>Reassign</Text>
                    </TouchableOpacity>
                  )}
                  {call.status !== 'on_scene' && (
                    <TouchableOpacity
                      style={styles.cancelCardButton}
                      onPress={() => openCancelModal(call.id, call.status)}
                    >
                      <Text style={styles.cancelCardText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <ScrollView
          style={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
        >
          {techs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>👥</Text>
              <Text style={styles.emptyText}>No techs found</Text>
              <Text style={styles.emptySub}>Add techs from the admin panel</Text>
            </View>
          ) : (
            techs.map(tech => (
              <View key={tech.id} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: STATUS_COLORS[tech.status] || '#aaa' }]}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{tech.first_name} {tech.last_name}</Text>
                  <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[tech.status] || '#aaa' }]}>
                    <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[tech.status] || '#aaa' }]}>
                      {STATUS_LABELS[tech.status] || tech.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                {tech.phone && <Text style={styles.cardPhone}>📞 {tech.phone}</Text>}
                <Text style={styles.cardTimer}>⏱ {formatTime(tech.seconds_in_status)} in status</Text>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Assign / Reassign Tech Modal */}
      <Modal visible={assignModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{isReassign ? 'Reassign Tech' : 'Assign a Tech'}</Text>
            {selectedBooking && (
              <Text style={styles.modalSub}>
                {selectedBooking.service} · {selectedBooking.patient_name}
                {isReassign && selectedBooking.tech_first ? ` · Currently: ${selectedBooking.tech_first} ${selectedBooking.tech_last}` : ''}
              </Text>
            )}
            {availableTechs.length === 0 ? (
              <Text style={styles.noTechs}>No available techs right now</Text>
            ) : (
              availableTechs.map(tech => (
                <TouchableOpacity
                  key={tech.id}
                  style={[styles.techRow, { borderColor: primaryColor }]}
                  onPress={() => assignTech(tech.id)}
                >
                  <View>
                    <Text style={styles.techName}>{tech.first_name} {tech.last_name}</Text>
                    <Text style={styles.techStatus}>{STATUS_LABELS[tech.status]} · {formatTime(tech.seconds_in_status)} in status</Text>
                  </View>
                  <Text style={[styles.assignArrow, { color: primaryColor }]}>→</Text>
                </TouchableOpacity>
              ))
            )}
            <TouchableOpacity style={styles.cancelModal} onPress={() => { setAssignModal(false); setIsReassign(false) }}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal visible={cancelModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSub}>
              {cancelStatus === 'en_route' ? '⚠️ Tech is en route. Cancellation fee may apply.' :
               cancelStatus === 'confirmed' ? 'A tech has been assigned to this booking.' :
               'This booking has not been assigned yet.'}
            </Text>
            <Text style={styles.reasonLabel}>Reason for cancellation</Text>
            <TextInput
              style={[styles.reasonInput, { height: 80, textAlignVertical: 'top' }]}
              placeholder="e.g. Patient going to ER, called to reschedule..."
              placeholderTextColor="#666"
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <TouchableOpacity
              style={[styles.confirmCancelBtn, cancelling && { opacity: 0.6 }]}
              onPress={confirmCancel}
              disabled={cancelling}
            >
              {cancelling ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmCancelText}>Confirm Cancellation</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModal} onPress={() => setCancelModal(false)}>
              <Text style={styles.cancelModalText}>Keep booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Booking Modal */}
      <Modal visible={newBookingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>New Phone Booking</Text>
              <Text style={styles.modalSub}>Create a booking for a patient who called in</Text>
              <Text style={styles.reasonLabel}>Patient name *</Text>
              <TextInput style={styles.reasonInput} placeholder="Full name" placeholderTextColor="#666" value={nbPatientName} onChangeText={setNbPatientName} />
              <Text style={styles.reasonLabel}>Phone number</Text>
              <TextInput style={styles.reasonInput} placeholder="(602) 555-0100" placeholderTextColor="#666" value={nbPhone} onChangeText={setNbPhone} keyboardType="phone-pad" />
              <Text style={styles.reasonLabel}>Service *</Text>
              <TouchableOpacity style={[styles.reasonInput, styles.serviceSelector]} onPress={() => setShowServiceList(!showServiceList)}>
                <Text style={{ color: nbService ? '#fff' : '#666' }}>{nbService || 'Tap to select a service...'}</Text>
              </TouchableOpacity>
              {showServiceList && (
                <View style={styles.serviceList}>
                  {SERVICES.map(service => (
                    <TouchableOpacity
                      key={service}
                      style={[styles.serviceItem, nbService === service && { backgroundColor: 'rgba(201,168,76,0.1)' }]}
                      onPress={() => { setNbService(service); setShowServiceList(false) }}
                    >
                      <Text style={[styles.serviceItemText, nbService === service && { color: primaryColor }]}>{service}</Text>
                      {nbService === service && <Text style={{ color: primaryColor }}>✓</Text>}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={styles.reasonLabel}>Address *</Text>
              <TextInput style={styles.reasonInput} placeholder="Full address" placeholderTextColor="#666" value={nbAddress} onChangeText={setNbAddress} />
              <Text style={styles.reasonLabel}>Notes</Text>
              <TextInput style={[styles.reasonInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Any special instructions..." placeholderTextColor="#666" value={nbNotes} onChangeText={setNbNotes} multiline />
              <TouchableOpacity
                style={[styles.confirmCancelBtn, { backgroundColor: primaryColor }, submittingBooking && { opacity: 0.6 }]}
                onPress={submitNewBooking}
                disabled={submittingBooking}
              >
                {submittingBooking ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.confirmCancelText, { color: secondaryColor }]}>Add to Queue</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelModal} onPress={() => { setNewBookingModal(false); setShowServiceList(false); setNbService('') }}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Patient List Modal */}
      <Modal visible={patientListModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Patients on Call</Text>
            <Text style={styles.modalSub}>Primary: {patientListName}</Text>
            <TouchableOpacity
  style={[styles.confirmCancelBtn, { backgroundColor: primaryColor, marginTop: 0, marginBottom: 12 }]}
  onPress={() => openSendIntake(patientListBookingId, patientListName, patientListEmail)}
>
  <Text style={[styles.confirmCancelText, { color: secondaryColor }]}>📧 Send Intake to Primary Patient</Text>
</TouchableOpacity>
            {loadingPatients ? (
              <ActivityIndicator color={primaryColor} style={{ marginVertical: 20 }} />
            ) : patients.length === 0 ? (
              <Text style={styles.noTechs}>No additional patients added yet</Text>
            ) : (
              patients.map(p => (
  <View key={p.id} style={styles.patientRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.techName}>{p.patient_name}</Text>
      <Text style={styles.techStatus}>
        {p.patient_phone || 'No phone'} · 
        Intake: {p.intake_completed ? '✅' : p.intake_sent ? '📤 Sent' : '⏳ Pending'} · 
        Chart: {p.chart_completed ? '✅' : '⏳'}
      </Text>
    </View>
    <TouchableOpacity
      style={[styles.reassignButton, { borderColor: primaryColor, paddingHorizontal: 8 }]}
      onPress={() => openSendIntake(patientListBookingId, p.patient_name, p.patient_email || '')}
    >
      <Text style={[styles.reassignButtonText, { color: primaryColor, fontSize: 11 }]}>📧 Intake</Text>
    </TouchableOpacity>
  </View>
))
            )}
            <TouchableOpacity
              style={[styles.confirmCancelBtn, { backgroundColor: primaryColor, marginTop: 16 }]}
              onPress={() => openAddPatient(patientListBookingId)}
            >
              <Text style={[styles.confirmCancelText, { color: secondaryColor }]}>+ Add Patient</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModal} onPress={() => setPatientListModal(false)}>
              <Text style={styles.cancelModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Patient Modal */}
      <Modal visible={addPatientModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Patient to Call</Text>
            <Text style={styles.modalSub}>Each patient gets their own intake and chart</Text>
            <Text style={styles.reasonLabel}>Patient name *</Text>
            <TextInput style={styles.reasonInput} placeholder="Full name" placeholderTextColor="#666" value={apName} onChangeText={setApName} />
            <Text style={styles.reasonLabel}>Phone number</Text>
            <TextInput style={styles.reasonInput} placeholder="(602) 555-0100" placeholderTextColor="#666" value={apPhone} onChangeText={setApPhone} keyboardType="phone-pad" />
            <Text style={styles.reasonLabel}>Date of birth</Text>
            <TextInput style={styles.reasonInput} placeholder="MM/DD/YYYY" placeholderTextColor="#666" value={apDob} onChangeText={setApDob} keyboardType="numeric" />
            <TouchableOpacity
              style={[styles.confirmCancelBtn, { backgroundColor: primaryColor }, addingPatient && { opacity: 0.6 }]}
              onPress={submitAddPatient}
              disabled={addingPatient}
            >
              {addingPatient ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.confirmCancelText, { color: secondaryColor }]}>Add to Call</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModal} onPress={() => setAddPatientModal(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Send Intake Modal */}
<Modal visible={sendIntakeModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Send Intake Form</Text>
      <Text style={styles.modalSub}>Patient: {intakePatientName}</Text>
      <Text style={styles.reasonLabel}>Patient email *</Text>
      <TextInput
        style={styles.reasonInput}
        placeholder="patient@email.com"
        placeholderTextColor="#666"
        value={intakePatientEmail}
        onChangeText={setIntakePatientEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={[styles.confirmCancelBtn, { backgroundColor: primaryColor }, sendingIntake && { opacity: 0.6 }]}
        onPress={submitSendIntake}
        disabled={sendingIntake}
      >
        {sendingIntake
          ? <ActivityIndicator color={secondaryColor} />
          : <Text style={[styles.confirmCancelText, { color: secondaryColor }]}>📧 Send Intake Form</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelModal} onPress={() => setSendIntakeModal(false)}>
        <Text style={styles.cancelModalText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Profile Modal */}
<Modal visible={profileModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.modalSub}>{user?.email}</Text>
      <View style={styles.patientRow}>
        <Text style={styles.techName}>Role</Text>
        <Text style={styles.techStatus}>{user?.role?.toUpperCase()}</Text>
      </View>
      <View style={styles.patientRow}>
        <Text style={styles.techName}>Company</Text>
        <Text style={styles.techStatus}>{company?.name}</Text>
      </View>
      <TouchableOpacity
        style={[styles.confirmCancelBtn, { backgroundColor: '#f09090', marginTop: 24 }]}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
      >
        <Text style={styles.confirmCancelText}>Log out</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelModal} onPress={() => setProfileModal(false)}>
        <Text style={styles.cancelModalText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </View>
  )
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  centered: { flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  companyName: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 6 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  statItem: { fontSize: 11, color: 'rgba(255,255,255,0.5)' },
  newBookingBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginLeft: 12 },
  newBookingBtnText: { fontSize: 14, fontWeight: '700' },
  tabs: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  scroll: { flex: 1, padding: 16 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardService: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  cardPatient: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  cardAddress: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  cardPhone: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  cardNotes: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 4, fontStyle: 'italic' },
  cardTime: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  cardTech: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  cardTimer: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  cardPatientCount: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  assignButton: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  assignButtonText: { fontSize: 14, fontWeight: '700' },
  viewPatientsButton: { flex: 1, borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center' },
  viewPatientsText: { fontSize: 13, fontWeight: '600' },
  reassignButton: { flex: 1, borderWidth: 1, borderColor: '#2196F3', borderRadius: 10, padding: 12, alignItems: 'center' },
  reassignButtonText: { color: '#2196F3', fontSize: 13, fontWeight: '600' },
  cancelCardButton: { flex: 1, borderWidth: 1, borderColor: '#f09090', borderRadius: 10, padding: 12, alignItems: 'center' },
  cancelCardText: { color: '#f09090', fontSize: 13, fontWeight: '600' },
  newBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#162260', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  modalSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  reasonLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.7)', letterSpacing: 0.5, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  reasonInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff' },
  serviceSelector: { justifyContent: 'center' },
  serviceList: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginTop: 4, overflow: 'hidden' },
  serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  serviceItemText: { color: '#fff', fontSize: 14 },
  confirmCancelBtn: { backgroundColor: '#f09090', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
  confirmCancelText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  noTechs: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  techRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 10 },
  patientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 10 },
  techName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  techStatus: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  assignArrow: { fontSize: 20, fontWeight: '700' },
  cancelModal: { marginTop: 8, padding: 16, alignItems: 'center' },
  cancelModalText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 }
})