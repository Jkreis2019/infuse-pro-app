import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'

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
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Assign modal
const [assignModal, setAssignModal] = useState(false)
const [selectedBooking, setSelectedBooking] = useState(null)
const [isReassign, setIsReassign] = useState(false)
const [selectedTechs, setSelectedTechs] = useState([])
const [callDetailModal, setCallDetailModal] = useState(false)
const [selectedCall, setSelectedCall] = useState(null)
const [callTechs, setCallTechs] = useState([])

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)
  const [cancelStatus, setCancelStatus] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

// Merge modal
const [mergeModal, setMergeModal] = useState(false)
const [mergeSourceId, setMergeSourceId] = useState(null)
const [mergingId, setMergingId] = useState(null)

// Booking detail modal
const [detailModal, setDetailModal] = useState(false)
const [detailBooking, setDetailBooking] = useState(null)

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
    const [qRes, aRes, tRes, sRes, lRes] = await Promise.all([
  fetch(`${API_URL}/dispatch/queue`, { headers }),
  fetch(`${API_URL}/dispatch/active`, { headers }),
  fetch(`${API_URL}/dispatch/techs`, { headers }),
  fetch(`${API_URL}/dispatch/stats`, { headers }),
  fetch(`${API_URL}/dispatch/log`, { headers })
])
const [qData, aData, tData, sData, lData] = await Promise.all([
  qRes.json(), aRes.json(), tRes.json(), sRes.json(), lRes.json()
])
if (qData.queue) setQueue(qData.queue)
if (aData.active) setActive(aData.active)
if (tData.techs) setTechs(tData.techs)
if (sData.stats) setStats(sData.stats)
if (lData.log) setLog(lData.log)
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

 const toggleTechSelection = (techId) => {
    if (isReassign) {
      assignTechs(techId)
      return
    }
    setSelectedTechs(prev =>
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    )
  }

  const assignTechs = async (singleTechId = null) => {
    const techIds = singleTechId ? [singleTechId] : selectedTechs
    if (techIds.length === 0) return Alert.alert('Select at least one tech')
    try {
      if (isReassign) {
        const res = await fetch(`${API_URL}/bookings/${selectedBooking.id}/reassign`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ techId: techIds[0] })
        })
        const data = await res.json()
        if (!data.success) return Alert.alert('Error', data.message || 'Could not reassign tech')
      } else if (selectedBooking.isActiveCall) {
        for (const techId of techIds) {
          const res = await fetch(`${API_URL}/calls/${selectedBooking.callId}/techs`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ tech_id: techId })
          })
          const data = await res.json()
          if (!data.success) return Alert.alert('Error', data.message || 'Could not add tech')
        }
      } else {
        const res = await fetch(`${API_URL}/dispatch/assign`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId: selectedBooking.id, techId: techIds[0] })
        })
        const data = await res.json()
        if (!data.success) return Alert.alert('Error', data.message || 'Could not assign tech')

        if (techIds.length > 1) {
          const callRes = await fetch(`${API_URL}/dispatch/queue`, { headers })
          const callData = await callRes.json()
          const call = callData.active?.find(c => c.booking_id === selectedBooking.id)
          if (call) {
            for (const techId of techIds.slice(1)) {
              await fetch(`${API_URL}/calls/${call.id}/techs`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ tech_id: techId })
              })
            }
          }
        }
      }

      setAssignModal(false)
      setSelectedBooking(null)
      setIsReassign(false)
      setSelectedTechs([])
      fetchAll()
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

  const openCallDetail = async (call) => {
    setSelectedCall(call)
    setCallTechs([])
    setCallDetailModal(true)
    try {
      const res = await fetch(`${API_URL}/calls/${call.call_id}/techs`, { headers })
      const data = await res.json()
      setCallTechs(data.techs || [])
    } catch (err) {
      setCallTechs([])
    }
  }

  const removeTechFromCall = async (callId, techId, techName) => {
    Alert.alert(
      'Remove Tech',
      `Remove ${techName} from this call?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
         text: 'Remove', style: 'destructive', onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/calls/${callId}/techs/${techId}`, {
                method: 'DELETE',
                headers
              })
              const data = await res.json()
              if (data.success) {
                const techRes = await fetch(`${API_URL}/calls/${callId}/techs`, { headers })
                const techData = await techRes.json()
                setCallTechs(techData.techs || [])
                fetchAll()
              } else {
                Alert.alert('Error', data.message || 'Could not remove tech')
              }
            } catch (err) {
              Alert.alert('Error', 'Network error')
            }
          }
        }
      ]
    )
  }

const openDetailModal = (booking) => {
  setDetailBooking(booking)
  setDetailModal(true)
}

  const openMergeModal = (bookingId) => {
  setMergeSourceId(bookingId)
  setMergeModal(true)
}

const submitMerge = async (targetId) => {
  setMergingId(targetId)
  try {
    const res = await fetch(`${API_URL}/bookings/merge`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ primaryBookingId: targetId, secondaryBookingId: mergeSourceId })
    })
    const data = await res.json()
    if (data.success) {
      setMergeModal(false)
      Alert.alert('✅ Merged!', data.message)
      fetchAll()
    } else {
      Alert.alert('Error', data.error || 'Could not merge bookings')
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setMergingId(null)
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

  const availableTechs = techs.filter(t => t.status === 'available' || t.status === 'clear' || t.status === 'assigned')

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
        {['queue', 'active', 'team', 'log'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: primaryColor }]}>
              {tab === 'queue' ? `Queue ${queue.length > 0 ? `(${queue.length})` : ''}` :
 tab === 'active' ? `Active ${active.length > 0 ? `(${active.length})` : ''}` :
 tab === 'team' ? `Team (${techs.length})` :
 `Log (${log.length})`}
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
              <TouchableOpacity key={booking.id} style={styles.card} onPress={() => openDetailModal(booking)} activeOpacity={0.8}>
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
                {!booking.has_valid_intake && (
                  <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No intake on file</Text>
                )}
                {booking.patient_count > 1 && (
                  <Text style={[styles.cardPatient, { color: primaryColor }]}>👥 Group booking · {booking.patient_count} IVs</Text>
                )}
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
  style={[styles.reassignButton, { borderColor: primaryColor }]}
  onPress={() => openMergeModal(booking.id)}
>
  <Text style={[styles.reassignButtonText, { color: primaryColor }]}>⊕ Merge</Text>
</TouchableOpacity>
  <TouchableOpacity
    style={styles.cancelCardButton}
    onPress={() => openCancelModal(booking.id, 'pending')}
  >
    <Text style={styles.cancelCardText}>Cancel</Text>
  </TouchableOpacity>
</View>
              </TouchableOpacity>
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
              <TouchableOpacity key={call.id} style={styles.card} onPress={() => openCallDetail(call)}>
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
                {!call.has_valid_intake && (
                  <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No intake on file</Text>
                )}
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
              </TouchableOpacity>
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

      {/* Log Tab */}
{activeTab === 'log' && (
  <ScrollView
    style={styles.scroll}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
  >
    {log.length === 0 ? (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>No calls logged today</Text>
        <Text style={styles.emptySub}>Completed and cancelled calls will appear here</Text>
      </View>
    ) : (
     log.map((entry, index) => (
        <View key={`${entry.id}-${index}`} style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardService}>{entry.service}</Text>
            <View style={[styles.statusBadge, { 
              borderColor: entry.status === 'completed' ? '#4CAF50' : '#f09090' 
            }]}>
              <Text style={[styles.statusBadgeText, { 
                color: entry.status === 'completed' ? '#4CAF50' : '#f09090' 
              }]}>
                {entry.status.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={styles.cardPatient}>👤 {entry.patient_name}</Text>
          <Text style={styles.cardAddress}>📍 {entry.address}</Text>
          {entry.tech_first && (
            <Text style={styles.cardTech}>🧑‍⚕️ {entry.tech_first} {entry.tech_last}</Text>
          )}
          {entry.seconds_on_scene && (
            <Text style={styles.cardTimer}>⏱ {formatTime(entry.seconds_on_scene)} on scene</Text>
          )}
          <Text style={styles.cardTimer}>
            🕐 {new Date(entry.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            {entry.source === 'phone' ? ' · Phone booking' : ' · App booking'}
          </Text>
          <Text style={styles.cardTimer}>
            Intake: {entry.intake_submitted ? '✅ Complete' : '⏳ Not submitted'}
          </Text>
        </View>
      ))
    )}
    <View style={{ height: 40 }} />
  </ScrollView>
)}

{/* Call Detail Modal */}
      <Modal visible={callDetailModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <ScrollView>
              <Text style={styles.modalTitle}>{selectedCall?.service}</Text>
              {selectedCall && (
                <>
                  <Text style={styles.modalSub}>👤 {selectedCall.patient_name}</Text>
                  <Text style={styles.modalSub}>📍 {selectedCall.address}</Text>
                  <Text style={styles.modalSub}>⏱ {formatTime(selectedCall.seconds_in_status)} in current status</Text>
                  <Text style={styles.modalSub}>📋 Status: {selectedCall.status?.replace('_', ' ').toUpperCase()}</Text>

                  <Text style={[styles.modalTitle, { fontSize: 16, marginTop: 16 }]}>Techs on this Call</Text>
                  {callTechs.length === 0 ? (
                    <Text style={styles.modalSub}>No techs assigned via call_techs yet</Text>
                  ) : (
                    callTechs.map(tech => (
                      <View key={tech.tech_id} style={[styles.techRow, { borderColor: '#ddd', marginBottom: 8 }]}>
                        <View>
                          <Text style={styles.techName}>{tech.first_name} {tech.last_name}</Text>
                          <Text style={styles.techStatus}>{tech.status} · {tech.cleared_at ? 'Cleared' : 'Active'}</Text>
                        </View>
                        <TouchableOpacity onPress={() => removeTechFromCall(selectedCall.call_id, tech.tech_id, `${tech.first_name} ${tech.last_name}`)}>
                          <Text style={{ color: '#e53e3e', fontSize: 13, fontWeight: '600' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}

                  <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: primaryColor, marginTop: 16, marginBottom: 8, paddingVertical: 16, borderRadius: 12 }]}
                    onPress={() => {
                      const bookingForAssign = { ...selectedCall, isActiveCall: true, callId: selectedCall.call_id }
                      setCallDetailModal(false)
                      setSelectedBooking(bookingForAssign)
                      setSelectedTechs([])
                      setIsReassign(false)
                      setAssignModal(true)
                    }}
                  >
                    <Text style={[styles.submitBtnText, { color: secondaryColor }]}>+ Add Another Tech</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
            <TouchableOpacity style={styles.cancelModal} onPress={() => setCallDetailModal(false)}>
              <Text style={styles.cancelModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              availableTechs.map(tech => {
                const isSelected = selectedTechs.includes(tech.id)
                return (
                  <TouchableOpacity
                    key={tech.id}
                    style={[styles.techRow, { borderColor: isSelected ? primaryColor : '#ddd', backgroundColor: isSelected ? primaryColor + '15' : 'transparent' }]}
                    onPress={() => toggleTechSelection(tech.id)}
                  >
                    <View>
                      <Text style={styles.techName}>{tech.first_name} {tech.last_name}</Text>
                      <Text style={styles.techStatus}>{STATUS_LABELS[tech.status]} · {formatTime(tech.seconds_in_status)} in status</Text>
                    </View>
                    <Text style={[styles.assignArrow, { color: primaryColor }]}>{isSelected ? '✓' : '→'}</Text>
                  </TouchableOpacity>
                )
              })
            )}
            {!isReassign && selectedTechs.length > 0 && (
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: primaryColor, marginBottom: 10, paddingVertical: 16, borderRadius: 12 }]}
                onPress={() => assignTechs()}
              >
                <Text style={[styles.submitBtnText, { color: secondaryColor }]}>
                  Assign {selectedTechs.length} Tech{selectedTechs.length > 1 ? 's' : ''} →
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.cancelModal} onPress={() => { setAssignModal(false); setIsReassign(false); setSelectedTechs([]) }}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal visible={cancelModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => Keyboard.dismiss()}>
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
        </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Booking Modal */}

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
  <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
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
  </KeyboardAvoidingView>
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

{/* Booking Detail Modal */}
<Modal visible={detailModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={[styles.modalCard, { maxHeight: '80%' }]}>
      <ScrollView>
        <Text style={styles.modalTitle}>{detailBooking?.service}</Text>
        <View style={[styles.statusBadge, { 
          borderColor: detailBooking?.source === 'phone' ? '#a0c0f0' : '#C9A84C',
          alignSelf: 'flex-start', marginBottom: 12
        }]}>
          <Text style={[styles.statusBadgeText, { 
            color: detailBooking?.source === 'phone' ? '#a0c0f0' : '#C9A84C' 
          }]}>
            {detailBooking?.source === 'phone' ? 'PHONE' : 'APP'}
          </Text>
        </View>
        <Text style={styles.reasonLabel}>📍 Address</Text>
        <Text style={styles.techName}>{detailBooking?.address}</Text>
        {detailBooking?.address_note && (
          <Text style={styles.techStatus}>{detailBooking.address_note}</Text>
        )}
        <Text style={[styles.reasonLabel, { marginTop: 12 }]}>👤 Primary Patient</Text>
        <Text style={styles.techName}>{detailBooking?.patient_name}</Text>
        {detailBooking?.patient_phone && (
          <Text style={styles.techStatus}>📞 {detailBooking.patient_phone}</Text>
        )}
        {detailBooking?.patient_dob && (
          <Text style={styles.techStatus}>🎂 {new Date(detailBooking.patient_dob).toLocaleDateString()}</Text>
        )}
        {detailBooking?.requested_time && (
          <>
            <Text style={[styles.reasonLabel, { marginTop: 12 }]}>🕐 Scheduled For</Text>
            <Text style={styles.techName}>
              {new Date(detailBooking.requested_time).toLocaleDateString('en-US', { 
                month: 'short', day: 'numeric', year: 'numeric' 
              })} at {new Date(detailBooking.requested_time).toLocaleTimeString([], { 
                hour: '2-digit', minute: '2-digit' 
              })}
            </Text>
          </>
        )}
        {detailBooking?.notes && (
          <>
            <Text style={[styles.reasonLabel, { marginTop: 12 }]}>📝 Notes</Text>
            <Text style={styles.techName}>{detailBooking.notes}</Text>
          </>
        )}
        {detailBooking?.patient_count > 1 && (
          <>
            <Text style={[styles.reasonLabel, { marginTop: 12 }]}>👥 Group Booking</Text>
            <Text style={styles.techStatus}>{detailBooking.patient_count} patients on this call</Text>
            <TouchableOpacity
              style={[styles.confirmCancelBtn, { backgroundColor: primaryColor, marginTop: 8 }]}
              onPress={() => {
                setDetailModal(false)
                openPatientList(detailBooking.id, detailBooking.patient_name, detailBooking.patient_email || '')
              }}
            >
              <Text style={[styles.confirmCancelText, { color: secondaryColor }]}>👥 View All Patients</Text>
            </TouchableOpacity>
          </>
        )}
        <Text style={[styles.reasonLabel, { marginTop: 12 }]}>📋 Intake Status</Text>
        <Text style={styles.techStatus}>
          {detailBooking?.intake_submitted ? '✅ Completed' : '⏳ Not submitted'}
        </Text>
        <Text style={[styles.reasonLabel, { marginTop: 12 }]}>🕐 Received</Text>
        <Text style={styles.techStatus}>
          {detailBooking?.created_at && new Date(detailBooking.created_at).toLocaleTimeString([], { 
            hour: '2-digit', minute: '2-digit' 
          })}
        </Text>
      </ScrollView>
      <TouchableOpacity 
        style={styles.cancelModal} 
        onPress={() => setDetailModal(false)}
      >
        <Text style={styles.cancelModalText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

{/* Merge Modal */}

{/* Merge Modal */}
<Modal visible={mergeModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <View style={styles.modalCard}>
      <Text style={styles.modalTitle}>Merge Booking</Text>
      <Text style={styles.modalSub}>Select which booking to merge this into:</Text>
      {queue.filter(b => b.id !== mergeSourceId).length === 0 ? (
        <Text style={styles.noTechs}>No other pending bookings to merge with</Text>
      ) : (
        queue.filter(b => b.id !== mergeSourceId).map(b => (
          <TouchableOpacity
            key={b.id}
            style={[styles.techRow, mergingId === b.id && { opacity: 0.6 }]}
            onPress={() => submitMerge(b.id)}
            disabled={!!mergingId}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.techName}>{b.patient_name}</Text>
              <Text style={styles.techStatus}>{b.service} · {b.address}</Text>
            </View>
            {mergingId === b.id 
              ? <ActivityIndicator color={primaryColor} />
              : <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>Merge →</Text>
            }
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity style={styles.cancelModal} onPress={() => setMergeModal(false)}>
        <Text style={styles.cancelModalText}>Cancel</Text>
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