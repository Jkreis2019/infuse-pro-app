import React, { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, ActivityIndicator, RefreshControl, Alert, KeyboardAvoidingView, Platform, Keyboard } from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

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
  const [scheduled, setScheduled] = useState([])
  const [upcoming, setUpcoming] = useState([])
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
const [confirmTimeModal, setConfirmTimeModal] = useState(false)
const [confirmedTime, setConfirmedTime] = useState(new Date())
const [pendingTechIds, setPendingTechIds] = useState([])

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)
  const [cancelStatus, setCancelStatus] = useState(null)
const [cancelReason, setCancelReason] = useState('')
const [cancelDisposition, setCancelDisposition] = useState('')
const [showDispositionDropdown, setShowDispositionDropdown] = useState(false)
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
const [nbSearchQuery, setNbSearchQuery] = useState('')
const [nbSearchResults, setNbSearchResults] = useState([])
const [nbSelectedPatient, setNbSelectedPatient] = useState(null)
const [showCreatePatient, setShowCreatePatient] = useState(false)
const [nbSearchNoResults, setNbSearchNoResults] = useState(false)
const [patientSearchModal, setPatientSearchModal] = useState(false)
const [psQuery, setPsQuery] = useState('')
const [psResults, setPsResults] = useState([])
const [psSearching, setPsSearching] = useState(false)
const [psSelectedPatient, setPsSelectedPatient] = useState(null)
const [psProfileData, setPsProfileData] = useState(null)
const [psLoadingProfile, setPsLoadingProfile] = useState(false)
const [psEditing, setPsEditing] = useState(false)
const [psEditPhone, setPsEditPhone] = useState('')
const [psEditAddress, setPsEditAddress] = useState('')
const [psEditCity, setPsEditCity] = useState('')
const [psEditState, setPsEditState] = useState('')
const [psEditZip, setPsEditZip] = useState('')
const [psEditEmergencyContact, setPsEditEmergencyContact] = useState('')
const [psEditEmergencyPhone, setPsEditEmergencyPhone] = useState('')
const [psEditEmergencyRelationship, setPsEditEmergencyRelationship] = useState('')
const [psSavingProfile, setPsSavingProfile] = useState(false)
const [psEditInsuranceProvider, setPsEditInsuranceProvider] = useState('')
const [psEditInsuranceMemberId, setPsEditInsuranceMemberId] = useState('')
const [psEditInsuranceGroupNumber, setPsEditInsuranceGroupNumber] = useState('')
const [psEditInsurancePhone, setPsEditInsurancePhone] = useState('')
const [psActiveTab, setPsActiveTab] = useState('bookings')
const [psProfileModal, setPsProfileModal] = useState(false)
const [cpFirstName, setCpFirstName] = useState('')
const [cpLastName, setCpLastName] = useState('')
const [cpEmail, setCpEmail] = useState('')
const [cpPhone, setCpPhone] = useState('')
const [cpDob, setCpDob] = useState('')
const [creatingPatient, setCreatingPatient] = useState(false)

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
const [needsAttention, setNeedsAttention] = useState([])

  const headers = { Authorization: `Bearer ${token}` }

  const fetchAll = useCallback(async () => {
    try {
    const [qRes, aRes, tRes, sRes, lRes, schRes, upRes, naRes] = await Promise.all([
      fetch(`${API_URL}/dispatch/queue`, { headers }),
      fetch(`${API_URL}/dispatch/active`, { headers }),
      fetch(`${API_URL}/dispatch/techs`, { headers }),
      fetch(`${API_URL}/dispatch/stats`, { headers }),
      fetch(`${API_URL}/dispatch/log`, { headers }),
      fetch(`${API_URL}/dispatch/scheduled`, { headers }),
      fetch(`${API_URL}/dispatch/upcoming`, { headers }),
      fetch(`${API_URL}/dispatch/needs-attention`, { headers })
    ])
    const [qData, aData, tData, sData, lData, schData, upData, naData] = await Promise.all([
      qRes.json(), aRes.json(), tRes.json(), sRes.json(), lRes.json(), schRes.json(), upRes.json(), naRes.json()
    ])
    if (qData.queue) setQueue(qData.queue)
    if (aData.active) setActive(aData.active)
    if (tData.techs) setTechs(tData.techs)
    if (sData.stats) setStats(sData.stats)
    if (lData.log) setLog(lData.log)
    if (schData.scheduled) setScheduled(schData.scheduled)
    if (upData.upcoming) setUpcoming(upData.upcoming)
        if (naData.bookings) setNeedsAttention(naData.bookings)
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

const markNoShow = async (bookingId) => {
  try {
    const res = await fetch(`${API_URL}/dispatch/no-show`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, reason: 'No show' })
    })
    const data = await res.json()
    if (data.success) fetchAll()
    else Alert.alert('Error', data.message)
  } catch (err) {
    Alert.alert('Error', 'Network error')
  }
}

const cancelAttentionBooking = async (bookingId) => {
  try {
    const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (data.success) fetchAll()
    else Alert.alert('Error', data.message)
  } catch (err) {
    Alert.alert('Error', 'Network error')
  }
}

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

    // If reassign or active call, skip time picker
    if (isReassign || selectedBooking?.isActiveCall) {
      await executeAssign(techIds)
      return
    }

    // If booking already has a scheduled time, skip time picker
    if (selectedBooking?.requested_time) {
      await executeAssign(techIds)
      return
    }

    // Show time confirmation for Now bookings
    setPendingTechIds(techIds)
    setConfirmedTime(new Date())
    setAssignModal(false)
    setConfirmTimeModal(true)
  }

  const executeAssign = async (techIds, overrideTime = null) => {
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
          body: JSON.stringify({ 
            bookingId: selectedBooking.id, 
            techId: techIds[0],
            confirmedTime: overrideTime ? overrideTime.toISOString() : null
          })
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

      setConfirmTimeModal(false)
      setAssignModal(false)
      setSelectedBooking(null)
      setIsReassign(false)
      setSelectedTechs([])
      setPendingTechIds([])
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
        body: JSON.stringify({ reason: cancelReason, disposition: cancelDisposition })
      })
      const data = await res.json()
      if (data.success) {
        setCancelModal(false)
        setCancelDisposition('')
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

const searchPatients = async (query) => {
  setNbSearchQuery(query)
  setNbSearchNoResults(false)
  if (query.length < 2) { setNbSearchResults([]); return }
  try {
    const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(query)}`, { headers })
    const data = await res.json()
    setNbSearchResults(data.patients || [])
    setNbSearchNoResults(data.patients?.length === 0)
  } catch (e) {
    setNbSearchResults([])
  }
}

const searchPsPatients = useCallback(async (q) => {
  setPsQuery(q)
  if (q.length < 2) { setPsResults([]); return }
  setPsSearching(true)
  try {
    const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(q)}`, { headers })
    const data = await res.json()
    setPsResults(data.patients || [])
  } catch (err) {
    console.error('PS Search error:', err)
  } finally {
    setPsSearching(false)
  }
}, [token])

const savePsProfile = async () => {
  setPsSavingProfile(true)
  try {
    const res = await fetch(`${API_URL}/patients/${psSelectedPatient.id}/update`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone: psEditPhone,
        homeAddress: psEditAddress,
        city: psEditCity,
        state: psEditState,
        zip: psEditZip,
        emergencyContact: psEditEmergencyContact,
        emergencyContactPhone: psEditEmergencyPhone,
        emergencyContactRelationship: psEditEmergencyRelationship,
        insuranceProvider: psEditInsuranceProvider,
        insuranceMemberId: psEditInsuranceMemberId,
        insuranceGroupNumber: psEditInsuranceGroupNumber,
        insurancePhone: psEditInsurancePhone
      })
    })
    const data = await res.json()
    if (data.success) {
      setPsEditing(false)
      openPsProfile(psSelectedPatient)
      Alert.alert('✅ Saved', 'Patient profile updated')
    } else {
      Alert.alert('Error', data.message)
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setPsSavingProfile(false)
  }
}

const openPsProfile = async (patient) => {
  setPsSelectedPatient(patient)
  setPsProfileModal(true)
  setPsLoadingProfile(true)
  setPsActiveTab('bookings')
  try {
    const res = await fetch(`${API_URL}/patients/${patient.id}/profile`, { headers })
    const data = await res.json()
    if (data.success) {
    setPsProfileData(data)
    setPsEditPhone(data.patient?.phone || psSelectedPatient?.phone || '')
    setPsEditAddress(data.patient?.home_address || '')
    setPsEditCity(data.patient?.city || '')
    setPsEditState(data.patient?.state || '')
    setPsEditZip(data.patient?.zip || '')
    setPsEditEmergencyContact(data.intake?.emergency_contact || '')
    setPsEditEmergencyPhone(data.intake?.emergency_contact_phone || '')
    setPsEditEmergencyRelationship(data.intake?.emergency_contact_relationship || '')
    setPsEditInsuranceProvider(data.patient?.insurance_provider || '')
    setPsEditInsuranceMemberId(data.patient?.insurance_member_id || '')
    setPsEditInsuranceGroupNumber(data.patient?.insurance_group_number || '')
    setPsEditInsurancePhone(data.patient?.insurance_phone || '')
  }
    else Alert.alert('Error', 'Could not load patient profile')
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setPsLoadingProfile(false)
  }
}

const createNewPatient = async () => {
  if (!cpFirstName || !cpLastName || !cpEmail) {
    Alert.alert('Required', 'First name, last name and email are required')
    return
  }
  setCreatingPatient(true)
  try {
    const res = await fetch(`${API_URL}/dispatch/create-patient`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: cpFirstName,
        lastName: cpLastName,
        email: cpEmail.toLowerCase(),
        phone: cpPhone || null,
        dob: cpDob || null
      })
    })
    const data = await res.json()
    if (data.success) {
      selectPatient({
        id: data.user.id,
        first_name: cpFirstName,
        last_name: cpLastName,
        phone: cpPhone || '',
        last_address: '',
        email: cpEmail.toLowerCase(),
        isNew: data.user.isNew
      })
      setShowCreatePatient(false)
      setNewBookingModal(true)
      setCpFirstName(''); setCpLastName(''); setCpEmail('')
      setCpPhone(''); setCpDob('')
      Alert.alert(
        '✅ Patient Added',
        data.user.isNew
          ? `${cpFirstName} ${cpLastName} is new to Infuse Pro. A welcome email with intake form and password setup has been sent!`
          : `${cpFirstName} ${cpLastName} already has an Infuse Pro account. Intake form sent if not on file.`
      )
    } else {
      Alert.alert('Error', data.message || 'Could not create patient')
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setCreatingPatient(false)
  }
}

const selectPatient = (patient) => {
  const fullName = `${patient.first_name} ${patient.last_name}`
  setNbSelectedPatient(patient)
  setNbPatientName(fullName)
  setNbPhone(patient.phone || '')
  setNbAddress(patient.last_address || '')
  setNbSearchQuery('')
  setNbSearchResults([])
  setNbSearchNoResults(false)
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
        // Send welcome email if this is a newly created patient
        if (nbSelectedPatient?.isNew && nbSelectedPatient?.email) {
          try {
            await fetch(`${API_URL}/auth/forgot-password`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: nbSelectedPatient.email })
            })
          } catch (e) {}
        }
        setNewBookingModal(false)
        setNbPatientName('')
        setNbPhone('')
        setNbAddress('')
        setNbService('')
        setNbNotes('')
        setShowServiceList(false)
        setNbSelectedPatient(null)
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
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <TouchableOpacity
        onPress={() => setNewBookingModal(true)}
        style={{ backgroundColor: primaryColor, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 }}
      >
        <Text style={{ color: secondaryColor, fontSize: 12, fontWeight: '700' }}>＋ New Booking</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.navigate('DispatcherMessaging', { token, user, company })}
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>💬 Messages</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setPatientSearchModal(true)}
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>🔍 Patients</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => setProfileModal(true)}
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>👤 Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Log out</Text>
      </TouchableOpacity>
    </View>
</View>
</View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {['queue', 'scheduled', 'upcoming', 'active', 'team', 'log'].map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && { color: primaryColor }]}>
              {tab === 'queue' ? `Queue ${queue.length > 0 ? `(${queue.length})` : ''}` :
               tab === 'scheduled' ? `Scheduled ${scheduled.length > 0 ? `(${scheduled.length})` : ''}` :
               tab === 'upcoming' ? `Upcoming ${upcoming.length > 0 ? `(${upcoming.length})` : ''}` :
               tab === 'active' ? `Active ${active.length > 0 ? `(${active.length})` : ''}` :
               tab === 'team' ? `Team (${techs.length})` :
               tab === 'log' ? `Log${needsAttention.length > 0 ? ` · ${needsAttention.length} issues` : ` (${log.length})`}` :
               `Attention${needsAttention.length > 0 ? ` (${needsAttention.length})` : ''}`}
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
              <TouchableOpacity key={booking.id} style={[styles.card, booking.region_color && { borderLeftWidth: 4, borderLeftColor: booking.region_color }]} onPress={() => openDetailModal(booking)} activeOpacity={0.8}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{booking.service}</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {booking.region_name && (
                      <View style={[styles.newBadge, { backgroundColor: booking.region_color || '#aaa' }]}>
                        <Text style={styles.newBadgeText}>{booking.region_name.toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={[styles.newBadge, { backgroundColor: booking.source === 'phone' ? '#2196F3' : primaryColor }]}>
                      <Text style={styles.newBadgeText}>
                        {booking.source === 'phone' ? 'PHONE' : 'APP'}
                      </Text>
                    </View>
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
                  {booking.requested_time
                    ? `📅 Scheduled: ${new Date(booking.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Phoenix' })} at ${new Date(booking.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}`
                    : `🕐 ${new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  }
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

{/* Scheduled Tab */}
      {activeTab === 'scheduled' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {scheduled.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyText}>No scheduled appointments</Text>
              <Text style={styles.emptySub}>Future bookings will appear here</Text>
            </View>
          ) : (
            Object.entries(
              scheduled.reduce((groups, booking) => {
                const date = new Date(booking.requested_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Phoenix' })
                if (!groups[date]) groups[date] = []
                groups[date].push(booking)
                return groups
              }, {})
            ).map(([date, bookings]) => (
              <View key={date}>
                <Text style={[styles.dateGroupHeader, { color: primaryColor }]}>📅 {date}</Text>
                {bookings.map(booking => (
                  <View key={booking.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardService}>{booking.service}</Text>
                      <Text style={styles.cardTime}>
                        {new Date(booking.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                      </Text>
                    </View>
                    <Text style={styles.cardPatient}>👤 {booking.patient_name}</Text>
                    <Text style={styles.cardAddress}>📍 {booking.address}</Text>
                    {!booking.has_valid_intake && (
                      <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No intake on file</Text>
                    )}
                    {booking.patient_count > 1 && (
                      <Text style={[styles.cardPatient, { color: primaryColor }]}>👥 Group booking · {booking.patient_count} IVs</Text>
                    )}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={[styles.assignButton, { backgroundColor: primaryColor }]}
                        onPress={() => openAssignModal(booking, false)}
                      >
                        <Text style={[styles.assignButtonText, { color: secondaryColor }]}>Assign →</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelCardButton}
                        onPress={() => openCancelModal(booking.id, booking.status)}
                      >
                        <Text style={styles.cancelCardText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Upcoming Tab */}
      {activeTab === 'upcoming' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {upcoming.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗓</Text>
              <Text style={styles.emptyText}>No upcoming assignments</Text>
              <Text style={styles.emptySub}>Pre-assigned future bookings will appear here</Text>
            </View>
          ) : (
            Object.entries(
              upcoming.reduce((groups, booking) => {
                const date = new Date(booking.requested_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Phoenix' })
                if (!groups[date]) groups[date] = []
                groups[date].push(booking)
                return groups
              }, {})
            ).map(([date, bookings]) => (
              <View key={date}>
                <Text style={[styles.dateGroupHeader, { color: primaryColor }]}>📅 {date}</Text>
                {bookings.map(booking => (
                  <View key={booking.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardService}>{booking.service}</Text>
                      <Text style={styles.cardTime}>
                        {new Date(booking.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                      </Text>
                    </View>
                    <Text style={styles.cardPatient}>👤 {booking.patient_name}</Text>
                    <Text style={styles.cardAddress}>📍 {booking.address}</Text>
                    {booking.tech_first_name && (
                      <Text style={styles.cardTech}>🧑‍⚕️ {booking.tech_first_name} {booking.tech_last_name}</Text>
                    )}
                    {!booking.has_valid_intake && (
                      <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No intake on file</Text>
                    )}
                    {booking.patient_count > 1 && (
                      <Text style={[styles.cardPatient, { color: primaryColor }]}>👥 Group booking · {booking.patient_count} IVs</Text>
                    )}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.reassignButton}
                        onPress={() => openAssignModal(booking, true)}
                      >
                        <Text style={styles.reassignButtonText}>Reassign</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelCardButton}
                        onPress={() => openCancelModal(booking.id, booking.status)}
                      >
                        <Text style={styles.cancelCardText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
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
                {call.requested_time && (
                  <Text style={[styles.cardTech, { color: primaryColor }]}>
                    🕐 Confirmed for {new Date(call.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                  </Text>
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
              <Text style={styles.emptyText}>No techs in service</Text>
              <Text style={styles.emptySub}>Techs will appear here when they go in service</Text>
            </View>
          ) : (
            Object.entries(
              techs.reduce((groups, tech) => {
                const region = tech.region_name || 'Unassigned'
                if (!groups[region]) groups[region] = { color: tech.region_color || '#aaa', techs: [] }
                groups[region].techs.push(tech)
                return groups
              }, {})
            ).map(([regionName, regionData]) => (
              <View key={regionName}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: regionData.color }} />
                  <Text style={[styles.dateGroupHeader, { color: regionData.color, marginTop: 0, marginBottom: 0 }]}>{regionName}</Text>
                </View>
                {regionData.techs.map(tech => (
                  <View key={tech.id} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: regionData.color }]}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardService}>{tech.first_name} {tech.last_name}</Text>
                      <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[tech.status] || '#aaa' }]}>
                        <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[tech.status] || '#aaa' }]}>
                          {STATUS_LABELS[tech.status] || tech.status?.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                    {tech.phone && <Text style={styles.cardPhone}>{tech.phone}</Text>}
                    <Text style={styles.cardTimer}>{formatTime(tech.seconds_in_status)} in status</Text>
                  </View>
                ))}
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
    keyboardShouldPersistTaps="handled"
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
  >
    {/* Needs Attention Section */}
    {needsAttention.length > 0 && (
      <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 4 }}>
        <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Needs Attention ({needsAttention.length})</Text>
        {needsAttention.map(booking => (
          <View key={booking.id} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: '#e53e3e', marginBottom: 8 }]}>
            <View style={styles.cardTop}>
              <Text style={styles.cardService}>{booking.service}</Text>
              <View style={[styles.newBadge, { backgroundColor: booking.status === 'expired' ? '#e53e3e' : '#888' }]}>
                <Text style={styles.newBadgeText}>{booking.status === 'expired' ? 'EXPIRED' : 'NO SHOW'}</Text>
              </View>
            </View>
            <Text style={styles.cardPatient}>{booking.patient_name}</Text>
            {booking.tech_first && <Text style={styles.cardTime}>Tech: {booking.tech_first} {booking.tech_last}</Text>}
            {booking.requested_time && <Text style={styles.cardTime}>{new Date(booking.requested_time).toLocaleString()}</Text>}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center' }}
                onPress={() => { setSelectedBooking(booking); setAssignModal(true) }}
              >
                <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 13 }}>Reschedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center' }}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm(`Mark ${booking.patient_name} as no show?`)) markNoShow(booking.id)
                  } else {
                    Alert.alert('Mark as No Show', `Mark ${booking.patient_name} as no show?`, [
                      { text: 'Keep', style: 'cancel' },
                      { text: 'Confirm', onPress: () => markNoShow(booking.id) }
                    ])
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>No Show</Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center' }}
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm(`Cancel ${booking.patient_name}'s booking?`)) cancelAttentionBooking(booking.id)
                  } else {
                    Alert.alert('Cancel Booking', `Cancel ${booking.patient_name}'s booking?`, [
                      { text: 'Keep', style: 'cancel' },
                      { text: 'Cancel', style: 'destructive', onPress: () => cancelAttentionBooking(booking.id) }
                    ])
                  }
                }}
              >
                <Text style={{ color: '#e53e3e', fontWeight: '700', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
      </View>
    )}

    {log.length === 0 && needsAttention.length === 0 ? (
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

{/* Confirm Time Modal */}
      <Modal visible={confirmTimeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Appointment Time</Text>
            <Text style={styles.modalSub}>Set the confirmed time for this appointment</Text>
            <DateTimePicker
              value={confirmedTime}
              mode="time"
              display="spinner"
              onChange={(event, date) => { if (date) setConfirmedTime(date) }}
              style={{ marginVertical: 16 }}
            />
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: primaryColor, paddingVertical: 16, borderRadius: 12, marginBottom: 10 }]}
              onPress={() => executeAssign(pendingTechIds, confirmedTime)}
            >
              <Text style={[styles.submitBtnText, { color: secondaryColor }]}>
                Confirm {confirmedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelModal} onPress={() => { setConfirmTimeModal(false); setAssignModal(true) }}>
              <Text style={styles.cancelModalText}>← Back</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSub}>
              {cancelStatus === 'en_route' ? '⚠️ Tech is en route. Cancellation fee may apply.' :
               cancelStatus === 'confirmed' ? 'A tech has been assigned to this booking.' :
               'This booking has not been assigned yet.'}
            </Text>
            <Text style={styles.reasonLabel}>Disposition</Text>
            <TouchableOpacity
              style={[styles.reasonInput, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48 }]}
              onPress={() => setShowDispositionDropdown(!showDispositionDropdown)}
            >
              <Text style={{ color: cancelDisposition ? '#fff' : '#666', fontSize: 14 }}>
                {cancelDisposition || 'Select a disposition...'}
              </Text>
              <Text style={{ color: '#666' }}>{showDispositionDropdown ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {showDispositionDropdown && (
              <View style={{ backgroundColor: '#1a2a5e', borderRadius: 8, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                {[
                  'Too long of a wait',
                  'Patient went to the ER',
                  'No techs available',
                  'Price too high',
                  'Not in our service area',
                  'Unable to service due to medical condition',
                  'Other'
                ].map(option => (
                  <TouchableOpacity
                    key={option}
                    style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}
                    onPress={() => { setCancelDisposition(option); setShowDispositionDropdown(false) }}
                  >
                    <Text style={{ color: cancelDisposition === option ? primaryColor : '#fff', fontSize: 14 }}>
                      {cancelDisposition === option ? '✓ ' : ''}{option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
            <TouchableOpacity style={styles.cancelModal} onPress={() => { setCancelModal(false); setCancelDisposition('') }}>
              <Text style={styles.cancelModalText}>Keep booking</Text>
            </TouchableOpacity>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

{/* Patient Search Modal */}
<Modal visible={patientSearchModal} animationType="slide" presentationStyle="fullScreen">
  <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
    {/* Profile Modal inside Patient Search */}
    <Modal visible={psProfileModal} animationType="slide" presentationStyle="fullScreen">
      <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
        {/* Header */}
        <View style={{ paddingTop: 56, paddingBottom: 0, backgroundColor: secondaryColor }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => { setPsProfileModal(false); setPsProfileData(null) }}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ backgroundColor: primaryColor, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 }}
              onPress={() => {
                setPsProfileModal(false)
                setNewBookingModal(true)
                if (psSelectedPatient) selectPatient(psSelectedPatient)
              }}
            >
              <Text style={{ color: secondaryColor, fontSize: 12, fontWeight: '700' }}>＋ New Booking</Text>
            </TouchableOpacity>
          </View>

          {/* Patient Hero Section */}
          <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: primaryColor + '30', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: primaryColor, fontSize: 22, fontWeight: '700' }}>
                  {psSelectedPatient?.first_name?.[0]}{psSelectedPatient?.last_name?.[0]}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 }}>
                  {psSelectedPatient?.first_name} {psSelectedPatient?.last_name}
                </Text>
                {psProfileData?.patient?.date_of_birth && (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                    DOB: {new Date(psProfileData.patient.date_of_birth).toLocaleDateString()} · {Math.floor((new Date() - new Date(psProfileData.patient.date_of_birth)) / (365.25 * 24 * 60 * 60 * 1000))} yrs
                  </Text>
                )}
              </View>
            </View>

            {/* Quick Stats */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: primaryColor, fontSize: 20, fontWeight: '800' }}>{psProfileData?.completedBookings || 0}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>COMPLETED</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: '#f09090', fontSize: 20, fontWeight: '800' }}>{psProfileData?.cancelledBookings || 0}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>CANCELLED</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: '#4CAF50', fontSize: 20, fontWeight: '800' }}>{psProfileData?.loyalty?.punches || 0}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>LOYALTY PTS</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: psProfileData?.intake ? '#4CAF50' : '#f09090', fontSize: 20, fontWeight: '800' }}>
                  {psProfileData?.intake ? '✓' : '✗'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' }}>INTAKE</Text>
              </View>
            </View>

            {/* Alert Banner — allergies */}
            {psProfileData?.intake?.allergies_detail?.length > 0 && (
              <View style={{ backgroundColor: 'rgba(229,62,62,0.15)', borderWidth: 1, borderColor: '#e53e3e', borderRadius: 10, padding: 10, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '700', flex: 1 }}>
                  ALLERGIES: {Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail.join(', ') : psProfileData.intake.allergies_detail}
                </Text>
              </View>
            )}
          </View>

          {/* Tabs */}
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
            {['overview', 'appointments', 'charts', 'intake', 'gfe', 'perks'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: psActiveTab === tab ? primaryColor : 'transparent' }}
              onPress={() => { setPsActiveTab(tab); setPsEditing(false) }}
              >
                <Text style={{ color: psActiveTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' }}>
                  {tab === 'overview' ? '👤' : tab === 'appointments' ? '📅' : tab === 'charts' ? '📋' : tab === 'intake' ? '🏥' : tab === 'gfe' ? '🩺' : '🎁'}
                </Text>
                <Text style={{ color: psActiveTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600', marginTop: 2 }}>
                  {tab.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {psLoadingProfile ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator color={primaryColor} size="large" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

            {/* Overview Tab */}
            {psActiveTab === 'overview' && (
              <>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>CONTACT INFORMATION</Text>
                    <TouchableOpacity onPress={() => setPsEditing(!psEditing)}>
                      <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>{psEditing ? 'Cancel' : '✏️ Edit'}</Text>
                    </TouchableOpacity>
                  </View>
                  {/* Phone */}
                  <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>PHONE</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditPhone} onChangeText={setPsEditPhone} placeholder="Phone number" placeholderTextColor="#666" keyboardType="phone-pad" />
                    ) : (
                      <Text style={{ color: psEditPhone ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditPhone || 'Not on file'}</Text>
                    )}
                  </View>

                  {/* Email - read only */}
                  {psSelectedPatient?.email && (
                    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>EMAIL</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedPatient.email}</Text>
                    </View>
                  )}

                  {/* Address */}
                  <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>ADDRESS</Text>
                    {psEditing ? (
                      <>
                        <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4, marginBottom: 6 }} value={psEditAddress} onChangeText={setPsEditAddress} placeholder="Street address" placeholderTextColor="#666" />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4, flex: 2 }} value={psEditCity} onChangeText={setPsEditCity} placeholder="City" placeholderTextColor="#666" />
                          <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4, flex: 1 }} value={psEditState} onChangeText={setPsEditState} placeholder="ST" placeholderTextColor="#666" maxLength={2} autoCapitalize="characters" />
                          <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4, flex: 1 }} value={psEditZip} onChangeText={setPsEditZip} placeholder="ZIP" placeholderTextColor="#666" keyboardType="numeric" maxLength={5} />
                        </View>
                      </>
                    ) : (
                      <Text style={{ color: psEditAddress ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>
                        {psEditAddress ? `${psEditAddress}${psEditCity ? `, ${psEditCity}` : ''}${psEditState ? `, ${psEditState}` : ''}${psEditZip ? ` ${psEditZip}` : ''}` : 'Not on file'}
                      </Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Patient since</Text>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                      {psProfileData?.patient?.created_at ? new Date(psProfileData.patient.created_at).toLocaleDateString() : '—'}
                    </Text>
                  </View>
                  {psProfileData?.lastBooking && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Last service</Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psProfileData.lastBooking.service}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{new Date(psProfileData.lastBooking.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                  )}
                  {psProfileData?.lastBooking?.address && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Last address</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 16 }}>{psProfileData.lastBooking.address}</Text>
                    </View>
                  )}
                  {psProfileData?.noShows > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>No-shows</Text>
                      <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '700' }}>⚠️ {psProfileData.noShows}</Text>
                    </View>
                  )}
                </View>

                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>EMERGENCY CONTACT</Text>
                  <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>NAME</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditEmergencyContact} onChangeText={setPsEditEmergencyContact} placeholder="Emergency contact name" placeholderTextColor="#666" />
                    ) : (
                      <Text style={{ color: psEditEmergencyContact ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditEmergencyContact || 'Not on file'}</Text>
                    )}
                  </View>
                  <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>PHONE</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditEmergencyPhone} onChangeText={setPsEditEmergencyPhone} placeholder="Emergency contact phone" placeholderTextColor="#666" keyboardType="phone-pad" />
                    ) : (
                      <Text style={{ color: psEditEmergencyPhone ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditEmergencyPhone || 'Not on file'}</Text>
                    )}
                  </View>
                  <View style={{ paddingVertical: 6 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>RELATIONSHIP</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditEmergencyRelationship} onChangeText={setPsEditEmergencyRelationship} placeholder="e.g. Spouse, Parent" placeholderTextColor="#666" />
                    ) : (
                      <Text style={{ color: psEditEmergencyRelationship ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditEmergencyRelationship || 'Not on file'}</Text>
                    )}
                  </View>
                </View>

                {psProfileData?.intake && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>MEDICAL FLAGS</Text>
                    {psProfileData.intake.allergies_detail?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                        <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>⚠️ ALLERGIES</Text>
                        {(Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail : []).map((a, i) => (
                          <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {a}</Text>
                        ))}
                      </View>
                    )}
                    {psProfileData.intake.important_history?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 8, padding: 10 }}>
                        <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>⚡ IMPORTANT HISTORY</Text>
                        {(Array.isArray(psProfileData.intake.important_history) ? psProfileData.intake.important_history : []).map((h, i) => (
                          <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                )}

                {psProfileData?.gfe && (
                  <View style={{ backgroundColor: psProfileData.gfe.notACandidate ? 'rgba(229,62,62,0.1)' : 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: psProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <Text style={{ color: psProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
                      {psProfileData.gfe.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ GFE APPROVED'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      Signed by {psProfileData.gfe.npName} · Valid until {new Date(psProfileData.gfe.validUntil).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                  <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>INSURANCE</Text>
                  <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>PROVIDER</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsuranceProvider} onChangeText={setPsEditInsuranceProvider} placeholder="e.g. Blue Cross Blue Shield" placeholderTextColor="#666" />
                    ) : (
                      <Text style={{ color: psEditInsuranceProvider ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsuranceProvider || 'Not on file'}</Text>
                    )}
                  </View>
                  <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>MEMBER ID</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsuranceMemberId} onChangeText={setPsEditInsuranceMemberId} placeholder="Member ID" placeholderTextColor="#666" />
                    ) : (
                      <Text style={{ color: psEditInsuranceMemberId ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsuranceMemberId || 'Not on file'}</Text>
                    )}
                  </View>
                  <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>GROUP NUMBER</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsuranceGroupNumber} onChangeText={setPsEditInsuranceGroupNumber} placeholder="Group number" placeholderTextColor="#666" />
                    ) : (
                      <Text style={{ color: psEditInsuranceGroupNumber ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsuranceGroupNumber || 'Not on file'}</Text>
                    )}
                  </View>
                  <View style={{ paddingVertical: 6 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>INSURANCE PHONE</Text>
                    {psEditing ? (
                      <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsurancePhone} onChangeText={setPsEditInsurancePhone} placeholder="Insurance phone number" placeholderTextColor="#666" keyboardType="phone-pad" />
                    ) : (
                      <Text style={{ color: psEditInsurancePhone ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsurancePhone || 'Not on file'}</Text>
                    )}
                  </View>
                </View>

                {psEditing && psActiveTab === 'overview' && (
                  <TouchableOpacity
                    style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, opacity: psSavingProfile ? 0.6 : 1 }}
                    onPress={savePsProfile}
                    disabled={psSavingProfile}
                  >
                    {psSavingProfile ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Save Changes</Text>}
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Appointments Tab */}
            {psActiveTab === 'appointments' && (
              <>
                {!psProfileData?.bookings?.length ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No appointments on record</Text>
                ) : (
                  psProfileData.bookings.map(b => (
                    <View key={b.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: b.status === 'completed' ? '#4CAF50' : b.status === 'cancelled' ? '#f09090' : primaryColor }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 }}>{b.service}</Text>
                        <View style={{ backgroundColor: b.status === 'completed' ? 'rgba(76,175,80,0.2)' : b.status === 'cancelled' ? 'rgba(240,144,144,0.2)' : 'rgba(201,168,76,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: b.status === 'completed' ? '#4CAF50' : b.status === 'cancelled' ? '#f09090' : primaryColor, fontSize: 10, fontWeight: '700' }}>{b.status?.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>
                        📅 {b.requested_time ? new Date(b.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </Text>
                      {b.address && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>📍 {b.address}</Text>}
                      {b.tech_name && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>🧑‍⚕️ {b.tech_name}</Text>}
                      {b.source && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{b.source === 'phone' ? '📞 Phone booking' : '📱 App booking'}</Text>}
                      {b.notes && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6, fontStyle: 'italic' }}>📝 {b.notes}</Text>}
                    </View>
                  ))
                )}
              </>
            )}

            {/* Charts Tab */}
            {psActiveTab === 'charts' && (
              <>
                {!psProfileData?.bookings?.filter(b => b.chart_notes || b.services_administered)?.length ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No charts on record</Text>
                ) : (
                  psProfileData.bookings.filter(b => b.chart_notes || b.services_administered).map(b => (
                    <View key={b.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>{b.service}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                          {b.chart_completed_at ? new Date(b.chart_completed_at).toLocaleDateString() : ''}
                        </Text>
                      </View>
                      {b.tech_name && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>🧑‍⚕️ {b.tech_name}</Text>}
                      {b.services_administered && (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>SERVICES ADMINISTERED</Text>
                          <Text style={{ color: '#fff', fontSize: 13 }}>{b.services_administered}</Text>
                        </View>
                      )}
                      {b.chart_notes && (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 10 }}>
                          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>NOTES</Text>
                          <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{b.chart_notes}</Text>
                        </View>
                      )}
                    </View>
                  ))
                )}
              </>
            )}

            {/* Intake Tab */}
            {psActiveTab === 'intake' && (
              <>
                {!psProfileData?.intake ? (
                  <View style={{ alignItems: 'center', paddingTop: 40 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 16 }}>No intake form on file</Text>
                    <TouchableOpacity
                      style={{ backgroundColor: primaryColor, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 }}
                      onPress={() => openSendIntake(null, `${psSelectedPatient?.first_name} ${psSelectedPatient?.last_name}`, psSelectedPatient?.email || '')}
                    >
                      <Text style={{ color: secondaryColor, fontWeight: '700' }}>📧 Send Intake Form</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 13 }}>✅ Intake submitted {new Date(psProfileData.intake.submitted_at).toLocaleDateString()}</Text>
                    </View>
                    {psProfileData.intake.medications && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>💊 MEDICATIONS</Text>
                        <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{psProfileData.intake.medications}</Text>
                      </View>
                    )}
                    {psProfileData.intake.allergies_detail?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e53e3e' }}>
                        <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>⚠️ ALLERGIES</Text>
                        {(Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail : []).map((a, i) => (
                          <Text key={i} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>• {a}</Text>
                        ))}
                      </View>
                    )}
                    {psProfileData.intake.important_history?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#FF9800' }}>
                        <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>⚡ IMPORTANT HISTORY</Text>
                        {(Array.isArray(psProfileData.intake.important_history) ? psProfileData.intake.important_history : []).map((h, i) => (
                          <Text key={i} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>• {h}</Text>
                        ))}
                      </View>
                    )}
                    {psProfileData.intake.supplements && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>🌿 SUPPLEMENTS</Text>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{psProfileData.intake.supplements}</Text>
                      </View>
                    )}
                    {psProfileData.intake.current_symptoms && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>🤒 CURRENT SYMPTOMS</Text>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{psProfileData.intake.current_symptoms}</Text>
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            {/* GFE Tab */}
            {psActiveTab === 'gfe' && (
              <>
                {!psProfileData?.gfe ? (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No GFE on file</Text>
                ) : (
                  <>
                    <View style={{ backgroundColor: psProfileData.gfe.notACandidate ? 'rgba(229,62,62,0.1)' : 'rgba(76,175,80,0.1)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: psProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50' }}>
                      <Text style={{ color: psProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>
                        {psProfileData.gfe.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ APPROVED FOR TREATMENT'}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Signed by {psProfileData.gfe.npName}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Valid until {new Date(psProfileData.gfe.validUntil).toLocaleDateString()}</Text>
                    </View>
                    {psProfileData.gfe.approvedServices?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>✅ APPROVED SERVICES</Text>
                        {psProfileData.gfe.approvedServices.map((s, i) => (
                          <Text key={i} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>• {s}</Text>
                        ))}
                      </View>
                    )}
                    {psProfileData.gfe.restrictions && (
                      <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e53e3e' }}>
                        <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>❌ RESTRICTIONS</Text>
                        <Text style={{ color: '#fff', fontSize: 13 }}>{psProfileData.gfe.restrictions}</Text>
                      </View>
                    )}
                    {psProfileData.gfe.npOrders && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>📝 NP ORDERS</Text>
                        <Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{psProfileData.gfe.npOrders}</Text>
                      </View>
                    )}
                  </>
                )}
              </>
            )}

            {/* Perks Tab */}
            {psActiveTab === 'perks' && (
              <>
                {psProfileData?.loyalty && psProfileData.loyalty.threshold && (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>🏆 LOYALTY PROGRESS</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
                      {psProfileData.loyalty.punches} of {psProfileData.loyalty.threshold} IVs
                    </Text>
                    <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }}>
                      <View style={{ height: 8, backgroundColor: primaryColor, borderRadius: 4, width: `${Math.min((psProfileData.loyalty.punches / psProfileData.loyalty.threshold) * 100, 100)}%` }} />
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                      {Math.max(psProfileData.loyalty.threshold - psProfileData.loyalty.punches, 0)} more until reward
                    </Text>
                  </View>
                )}
                {psProfileData?.loyalty?.rewards?.length > 0 && psProfileData.loyalty.rewards.map(r => (
                  <View key={r.id} style={{ backgroundColor: r.status === 'active' ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: r.status === 'active' ? '#4CAF50' : 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                    <Text style={{ color: r.status === 'active' ? '#4CAF50' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
                      {r.status === 'active' ? '🎁 ACTIVE REWARD' : '✓ REDEEMED'}
                    </Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                      {r.reward_type === 'free' ? 'FREE IV' : r.reward_type === 'fixed' ? `$${r.reward_amount} off` : `${r.reward_percent}% off`}
                    </Text>
                    {r.redeemed_at && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Redeemed {new Date(r.redeemed_at).toLocaleDateString()}</Text>}
                  </View>
                ))}
                {(!psProfileData?.loyalty?.rewards?.length && !psProfileData?.loyalty?.threshold) && (
                  <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No loyalty program active</Text>
                )}
              </>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Modal>

    {/* Patient Search Header */}
    <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
      <TouchableOpacity onPress={() => { setPatientSearchModal(false); setPsQuery(''); setPsResults([]) }}>
        <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
      </TouchableOpacity>
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Patient Search</Text>
      <View style={{ width: 60 }} />
    </View>

    {/* Search Input */}
    <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 16, paddingBottom: 16 }}>
      <TextInput
        style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, fontSize: 15, color: '#fff' }}
        placeholder="Search by name or phone..."
        placeholderTextColor="#666"
        value={psQuery}
        onChangeText={searchPsPatients}
        autoFocus
      />
    </View>

    <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
      {psSearching && <View style={{ alignItems: 'center', padding: 20 }}><ActivityIndicator color={primaryColor} /></View>}
      {!psSearching && psQuery.length >= 2 && psResults.length === 0 && (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No patients found for "{psQuery}"</Text>
        </View>
      )}
      {psResults.map(patient => (
        <TouchableOpacity key={patient.id} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }} onPress={() => openPsProfile(patient)}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{patient.first_name} {patient.last_name}</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{patient.phone || 'No phone'} · {patient.email}</Text>
            {patient.last_address && <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📍 {patient.last_address}</Text>}
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{patient.total_bookings || 0} visits</Text>
          </View>
          <Text style={{ color: primaryColor, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}
      {!psSearching && psQuery.length < 2 && (
        <View style={{ alignItems: 'center', paddingTop: 60 }}>
          <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Search by name or phone</Text>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  </View>
</Modal>

{/* Create New Patient Modal */}
<Modal visible={showCreatePatient} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>New Patient</Text>
          <Text style={styles.modalSub}>Create a new patient profile</Text>

          <Text style={styles.reasonLabel}>First Name *</Text>
          <TextInput style={styles.reasonInput} placeholder="First name" placeholderTextColor="#666"
            value={cpFirstName} onChangeText={setCpFirstName} />

          <Text style={styles.reasonLabel}>Last Name *</Text>
          <TextInput style={styles.reasonInput} placeholder="Last name" placeholderTextColor="#666"
            value={cpLastName} onChangeText={setCpLastName} />

          <Text style={styles.reasonLabel}>Email *</Text>
          <TextInput style={styles.reasonInput} placeholder="email@example.com" placeholderTextColor="#666"
            value={cpEmail} onChangeText={setCpEmail} keyboardType="email-address" autoCapitalize="none" />

          <Text style={styles.reasonLabel}>Phone</Text>
          <TextInput style={styles.reasonInput} placeholder="(602) 555-0100" placeholderTextColor="#666"
            value={cpPhone} onChangeText={setCpPhone} keyboardType="phone-pad" />

          <Text style={styles.reasonLabel}>Date of Birth *</Text>
          <TextInput style={styles.reasonInput} placeholder="MM/DD/YYYY" placeholderTextColor="#666"
            value={cpDob} onChangeText={setCpDob} />

          <TouchableOpacity
            style={[styles.confirmCancelBtn, { backgroundColor: primaryColor }, creatingPatient && { opacity: 0.6 }]}
            onPress={createNewPatient}
            disabled={creatingPatient}
          >
            {creatingPatient ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.confirmCancelText, { color: secondaryColor }]}>Create Patient & Send Intake</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelModal} onPress={() => {
            setShowCreatePatient(false)
            setNewBookingModal(true)
            setCpFirstName(''); setCpLastName(''); setCpEmail('')
            setCpPhone(''); setCpDob('')
          }}>
            <Text style={styles.cancelModalText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>
</Modal>

      {/* New Booking Modal */}

      <Modal visible={newBookingModal} transparent animationType="slide">
  <View style={styles.modalOverlay}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
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
              <Text style={styles.reasonLabel}>Search existing patient</Text>
<TextInput
  style={styles.reasonInput}
  placeholder="Search by name or phone..."
  placeholderTextColor="#666"
  value={nbSearchQuery}
  onChangeText={searchPatients}
/>
{nbSearchResults.length > 0 && (
  <View style={{ backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 8 }}>
    {nbSearchResults.map(p => (
      <TouchableOpacity
        key={p.id}
        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' }}
        onPress={() => selectPatient(p)}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>{p.first_name} {p.last_name}</Text>
        <Text style={{ color: '#aaa', fontSize: 12 }}>{p.phone || 'No phone'} · {p.last_address || 'No address'}</Text>
      </TouchableOpacity>
    ))}
  </View>
)}
{nbSearchNoResults && nbSearchQuery.length >= 2 && (
  <View style={{ backgroundColor: '#1a1a1a', borderRadius: 8, marginBottom: 8, padding: 12 }}>
    <Text style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>No patients found for "{nbSearchQuery}"</Text>
    <TouchableOpacity
      style={{ backgroundColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center' }}
      onPress={() => { setNewBookingModal(false); setShowCreatePatient(true) }}
    >
      <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 13 }}>+ Create New Patient</Text>
    </TouchableOpacity>
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
              <TouchableOpacity style={styles.cancelModal} onPress={() => { setNewBookingModal(false); setShowServiceList(false); setNbService(''); setNbSearchQuery(''); setNbSearchResults([]); setNbSelectedPatient(null) }}>
                <Text style={styles.cancelModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  cancelModalText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  dateGroupHeader: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginTop: 16, marginBottom: 8, paddingHorizontal: 4 },
  dispositionOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, marginBottom: 6 },
  dispositionText: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
})