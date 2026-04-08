import React, { useState, useCallback } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native'

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

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, aRes, lRes] = await Promise.all([
        fetch(`${API_URL}/dispatch/queue`, { headers }),
        fetch(`${API_URL}/dispatch/active`, { headers }),
        fetch(`${API_URL}/dispatch/log`, { headers })
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

  React.useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const onRefresh = () => { setRefreshing(true); fetchAll() }

  const submitWalkin = async () => {
    if (!wName.trim() || !wService) return Alert.alert('Please enter patient name and select a service')
    setSubmittingWalkin(true)
    try {
      const res = await fetch(`${API_URL}/clinic/walkin`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: wName, phone: wPhone, service: wService, notes: wNotes })
      })
      const data = await res.json()
      if (data.success) {
        setWalkinModal(false)
        setWName(''); setWPhone(''); setWService(''); setWNotes('')
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
            <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
            <Text style={styles.headerTitle}>Clinic Console</Text>
            <Text style={styles.headerSub}>{user?.firstName} · FRONT DESK</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={[styles.walkinBtn, { backgroundColor: primaryColor }]}
              onPress={() => setWalkinModal(true)}
            >
              <Text style={[styles.walkinBtnText, { color: secondaryColor }]}>+ Walk-In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
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
                {!booking.has_valid_intake && (
                  <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No intake on file</Text>
                )}
                {booking.notes && <Text style={styles.cardNotes}>📝 {booking.notes}</Text>}
                <Text style={styles.cardTime}>🕐 {new Date(booking.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.assignButton, { backgroundColor: primaryColor }]}
                    onPress={() => Alert.alert('Assign Tech', 'Coming soon — assign a clinic tech to this patient')}
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
                <Text style={[styles.cardTime, { color: entry.status === 'cancelled' ? '#e53e3e' : '#aaa' }]}>
                  {entry.status === 'cancelled' ? '❌ Cancelled' : '✅ Completed'}
                </Text>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Walk-In Modal */}
      <Modal visible={walkinModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Walk-In Patient</Text>
            <TextInput
              style={styles.input}
              placeholder="Patient name *"
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
                {SERVICES.map(s => (
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
            <TouchableOpacity style={styles.cancelModal} onPress={() => setWalkinModal(false)}>
              <Text style={styles.cancelModalText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff', marginBottom: 10 },
  submitBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '700' },
  cancelModal: { alignItems: 'center', padding: 12 },
  cancelModalText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
})