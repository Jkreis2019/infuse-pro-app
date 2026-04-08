import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, RefreshControl } from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function ClinicTechScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#1D9E75'
  const secondaryColor = company?.secondaryColor || '#0a2420'
  const headers = { Authorization: `Bearer ${token}` }

  const [activeTab, setActiveTab] = useState('myPatients')
  const [myPatients, setMyPatients] = useState([])
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientModal, setPatientModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      const [myRes, qRes] = await Promise.all([
        fetch(`${API_URL}/clinic/my-patients`, { headers }),
        fetch(`${API_URL}/clinic/queue`, { headers })
      ])
      const [myData, qData] = await Promise.all([
        myRes.json(), qRes.json()
      ])
      if (myData.patients) setMyPatients(myData.patients)
      if (qData.queue) setQueue(qData.queue)
    } catch (err) {
      console.error('Clinic tech fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  React.useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const onRefresh = () => { setRefreshing(true); fetchAll() }

  const selfAssign = async (bookingId, patientName) => {
    Alert.alert('Assign Patient', `Take ${patientName}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, assign me', onPress: async () => {
        try {
          const res = await fetch(`${API_URL}/clinic/self-assign`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ bookingId })
          })
          const data = await res.json()
          if (data.success) {
            fetchAll()
            setActiveTab('myPatients')
          } else {
            Alert.alert('Error', data.error || 'Could not assign patient')
          }
        } catch (err) {
          Alert.alert('Error', 'Network error')
        }
      }}
    ])
  }

  const updateStatus = async (bookingId, status) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`${API_URL}/clinic/patient-status`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status })
      })
      const data = await res.json()
      if (data.success) {
        fetchAll()
        setPatientModal(false)
        setSelectedPatient(null)
      } else {
        Alert.alert('Error', data.error || 'Could not update status')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getAge = (dob) => {
    if (!dob) return null
    const today = new Date()
    const birth = new Date(dob)
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const openPatient = (patient) => {
    setSelectedPatient(patient)
    setPatientModal(true)
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
            <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
            <Text style={styles.headerTitle}>My Patients</Text>
            <Text style={styles.headerSub}>{user?.firstName} · CLINIC TECH</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={{ flexDirection: 'row', backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        {[
          { key: 'myPatients', label: `My Patients (${myPatients.length})` },
          { key: 'queue', label: `Queue (${queue.length})` }
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

      {/* My Patients Tab */}
      {activeTab === 'myPatients' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {myPatients.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🩺</Text>
              <Text style={styles.emptyText}>No active patients</Text>
              <Text style={styles.emptySub}>Grab a patient from the Queue tab</Text>
            </View>
          ) : (
            myPatients.map(patient => (
              <TouchableOpacity key={patient.id} style={styles.card} onPress={() => openPatient(patient)}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{patient.service}</Text>
                  <View style={[styles.statusBadge, { borderColor: patient.status === 'on_scene' ? '#4CAF50' : primaryColor }]}>
                    <Text style={[styles.statusBadgeText, { color: patient.status === 'on_scene' ? '#4CAF50' : primaryColor }]}>
                      {patient.status === 'on_scene' ? 'IN TREATMENT' : 'CONFIRMED'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardPatient}>👤 {patient.patient_name}</Text>
                {patient.patient_dob && <Text style={styles.cardSub}>Age {getAge(patient.patient_dob)}</Text>}
                {!patient.has_intake && <Text style={styles.noIntake}>⚠️ No intake on file</Text>}
                <Text style={styles.cardSub}>Tap to view details →</Text>
              </TouchableOpacity>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {queue.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✅</Text>
              <Text style={styles.emptyText}>Queue is empty</Text>
              <Text style={styles.emptySub}>No patients waiting</Text>
            </View>
          ) : (
            queue.map(booking => (
              <View key={booking.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardService}>{booking.service}</Text>
                  <View style={[styles.statusBadge, { borderColor: '#aaa' }]}>
                    <Text style={[styles.statusBadgeText, { color: '#aaa' }]}>WAITING</Text>
                  </View>
                </View>
                <Text style={styles.cardPatient}>👤 {booking.patient_name}</Text>
                {!booking.has_valid_intake && <Text style={styles.noIntake}>⚠️ No intake on file</Text>}
                {booking.notes && <Text style={styles.cardSub}>📝 {booking.notes}</Text>}
                <Text style={styles.cardSub}>🕐 {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <TouchableOpacity
                  style={[styles.assignBtn, { backgroundColor: primaryColor }]}
                  onPress={() => selfAssign(booking.id, booking.patient_name)}
                >
                  <Text style={[styles.assignBtnText, { color: secondaryColor }]}>+ Take this patient</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <Modal visible={patientModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}>
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>{selectedPatient.patient_name}</Text>
                <Text style={styles.modalService}>{selectedPatient.service}</Text>

                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>DOB</Text>
                  <Text style={styles.infoValue}>{selectedPatient.patient_dob ? new Date(selectedPatient.patient_dob).toLocaleDateString() : 'Not on file'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Age</Text>
                  <Text style={styles.infoValue}>{selectedPatient.patient_dob ? getAge(selectedPatient.patient_dob) : 'Unknown'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{selectedPatient.patient_phone || 'Not on file'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{selectedPatient.address || 'Not on file'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Intake</Text>
                  <Text style={[styles.infoValue, { color: selectedPatient.has_intake ? '#4CAF50' : '#e53e3e' }]}>
                    {selectedPatient.has_intake ? '✅ On file' : '⚠️ Not on file'}
                  </Text>
                </View>
                {selectedPatient.notes && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Notes</Text>
                    <Text style={styles.infoValue}>{selectedPatient.notes}</Text>
                  </View>
                )}

                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 }} />

                {selectedPatient.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#4CAF50' }, updatingStatus && { opacity: 0.6 }]}
                    onPress={() => Alert.alert('Start Treatment', `Start IV for ${selectedPatient.patient_name}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Start', onPress: () => updateStatus(selectedPatient.id, 'on_scene') }
                    ])}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.actionBtnText}>💉 Start Treatment</Text>}
                  </TouchableOpacity>
                )}

                {selectedPatient.status === 'on_scene' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: primaryColor }, updatingStatus && { opacity: 0.6 }]}
                    onPress={() => Alert.alert('Complete Treatment', `Mark ${selectedPatient.patient_name} as complete?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Complete', onPress: () => updateStatus(selectedPatient.id, 'completed') }
                    ])}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.actionBtnText, { color: secondaryColor }]}>✅ Complete Treatment</Text>}
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.cancelModal} onPress={() => { setPatientModal(false); setSelectedPatient(null) }}>
                  <Text style={styles.cancelModalText}>Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a2420' },
  centered: { flex: 1, backgroundColor: '#0a2420', alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  companyName: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  scroll: { flex: 1 },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  card: { marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardService: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cardPatient: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  cardSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 },
  noIntake: { fontSize: 12, color: '#e53e3e', fontWeight: '600', marginBottom: 4 },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  assignBtn: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 8 },
  assignBtnText: { fontSize: 13, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0a2420', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalService: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 20 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  infoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#fff', flex: 1, textAlign: 'right' },
  actionBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cancelModal: { alignItems: 'center', padding: 12 },
  cancelModalText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
})
