import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Vibration
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

const STATUS_COLORS = {
  confirmed: '#C9A84C',
  assigned: '#C9A84C',
  en_route: '#2196F3',
  on_scene: '#4CAF50',
  cleared: '#aaa',
  completed: '#aaa'
}

const STATUS_LABELS = {
  confirmed: 'Confirmed — Waiting to depart',
  assigned: 'Confirmed — Waiting to depart',
  en_route: 'En Route',
  on_scene: 'On Scene',
  cleared: 'Cleared',
  completed: 'Completed'
}

export default function TechHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'

  const [call, setCall] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [onSceneSeconds, setOnSceneSeconds] = useState(0)
  const [upcoming, setUpcoming] = useState([])
  const timerRef = useRef(null)

  const headers = { Authorization: `Bearer ${token}` }

  const fetchCall = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tech/my-call`, { headers })
      const data = await res.json()
      if (data.success) {
        setCall(data.call)
        setPatients(data.patients || [])
        setUpcoming(data.upcoming || [])

        // Start 60 min timer if on scene
       if (data.call?.tech_status === 'on_scene' && data.call?.tech_onscene_at) {
  const secondsOnScene = Math.floor(
    (Date.now() - new Date(data.call.tech_onscene_at).getTime()) / 1000
  )
  setOnSceneSeconds(secondsOnScene)
}
      }
    } catch (err) {
      console.error('Fetch call error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchCall()
    const interval = setInterval(fetchCall, 15000)
    return () => clearInterval(interval)
  }, [fetchCall])

  // 60 minute on-scene timer
  useEffect(() => {
    if (call?.tech_status === 'on_scene') {
      timerRef.current = setInterval(() => {
        setOnSceneSeconds(prev => {
          const next = prev + 1
          // Vibrate alert at 55 and 60 minutes
          if (next === 3300 || next === 3600) {
            Vibration.vibrate([500, 500, 500])
          }
          return next
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setOnSceneSeconds(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [call?.status])

  const onRefresh = () => {
    setRefreshing(true)
    fetchCall()
  }

  const updateStatus = async (newStatus) => {
    if (!call) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`${API_URL}/tech/status`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, bookingId: call.id })
      })
      const data = await res.json()
      if (data.success) {
        fetchCall()
      } else {
        Alert.alert('Error', data.message || 'Could not update status')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleStatusChange = (newStatus) => {
    const messages = {
      en_route: 'Mark yourself as En Route to this call?',
      on_scene: 'Mark yourself as On Scene?',
      clear: 'Mark this call as Complete and go Clear?'
    }
    Alert.alert('Update Status', messages[newStatus], [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(newStatus) }
    ])
  }

  const handleEmergency = () => {
    Alert.alert(
      '🚨 Emergency',
      'This will immediately alert your dispatcher and company admin. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND EMERGENCY ALERT',
          style: 'destructive',
          onPress: () => {
            Vibration.vibrate([200, 100, 200, 100, 200])
            Alert.alert('Emergency Sent', 'Your dispatcher has been notified. Stay safe.')
          }
        }
      ]
    )
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const timerWarning = onSceneSeconds >= 3300 // 55 min
  const timerDanger = onSceneSeconds >= 3600 // 60 min

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={primaryColor} size="large" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
    >
      {/* Header */}
     <View style={[styles.header, { backgroundColor: secondaryColor }]}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
    <View>
      <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
      <Text style={styles.headerTitle}>My Call</Text>
      <Text style={styles.headerSub}>{user?.firstName} · {user?.role?.toUpperCase()}</Text>
    </View>
    <TouchableOpacity
      onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
    >
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
    </TouchableOpacity>
  </View>
</View>

      {/* Emergency Button — only show when on scene */}
      {call?.tech_status === 'on_scene' && (
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
          <Text style={styles.emergencyText}>🚨 EMERGENCY</Text>
        </TouchableOpacity>
      )}

      {/* No Call */}
      {!call ? (
        <View style={styles.noCall}>
          <Text style={styles.noCallIcon}>📵</Text>
          <Text style={styles.noCallText}>No active call</Text>
          <Text style={styles.noCallSub}>You'll be notified when a call is assigned</Text>
        </View>
      ) : (
        <>
          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[call.tech_status || call.status] + '33', borderColor: STATUS_COLORS[call.tech_status || call.status] }]}>
            <Text style={[styles.statusBannerText, { color: STATUS_COLORS[call.tech_status || call.status] }]}>
              {STATUS_LABELS[call.tech_status || call.status] || call.tech_status || call.status}
            </Text>
          </View>

          {/* Call Details */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Call Details</Text>
            <Text style={styles.service}>{call.service}</Text>
            <Text style={styles.label}>📍 Address</Text>
            <Text style={styles.value}>{call.address}</Text>
            {call.address_note && <Text style={styles.valueNote}>{call.address_note}</Text>}
            {call.notes && (
              <>
                <Text style={styles.label}>📝 Notes</Text>
                <Text style={styles.value}>{call.notes}</Text>
              </>
            )}
            <Text style={styles.label}>🕐 Dispatched</Text>
            <Text style={styles.value}>
              {new Date(call.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>

          {/* Patient Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Primary Patient {call.patient_count > 1 ? `(+${call.patient_count - 1} more)` : ''}
            </Text>
            <Text style={styles.service}>{call.patient_name}</Text>
            {!call.has_valid_intake && (
              <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginTop: 4 }}>⚠️ No intake on file</Text>
            )}
            {call.patient_phone && <Text style={styles.value}>📞 {call.patient_phone}</Text>}
            {call.patient_dob && (
              <Text style={styles.value}>
                🎂 {new Date(call.patient_dob).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Additional Patients */}
          {patients.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Additional Patients</Text>
              {patients.map(p => (
                <View key={p.id} style={styles.patientRow}>
                  <Text style={styles.patientName}>{p.patient_name}</Text>
                  <Text style={styles.patientDetail}>
                    {p.patient_phone || 'No phone'} · 
                    Chart: {p.chart_completed ? '✅' : '⏳'}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* 60 Min Timer */}
          {call.tech_status === 'on_scene' && (
            <View style={[styles.timerCard, timerDanger && styles.timerDanger, timerWarning && !timerDanger && styles.timerWarning]}>
              <Text style={styles.timerLabel}>⏱ Time On Scene</Text>
              <Text style={[styles.timerValue, timerDanger && { color: '#f09090' }, timerWarning && !timerDanger && { color: '#E2C97E' }]}>
                {formatTimer(onSceneSeconds)}
              </Text>
              {timerWarning && (
                <Text style={styles.timerAlert}>
                  {timerDanger ? '⚠️ 60 minutes reached — contact dispatch!' : '⚠️ Approaching 60 minutes'}
                </Text>
              )}
            </View>
          )}

          {/* Status Controls */}
          {call.status !== 'completed' && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Update Status</Text>
              {(call.tech_status === 'assigned' || call.tech_status === null) && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#2196F3' }]}
                  onPress={() => handleStatusChange('en_route')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.statusButtonText}>🚗 I'm En Route</Text>}
                </TouchableOpacity>
              )}
              {call.tech_status === 'en_route' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: '#4CAF50' }]}
                  onPress={() => handleStatusChange('on_scene')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.statusButtonText}>📍 I'm On Scene</Text>}
                </TouchableOpacity>
              )}
              {call.tech_status === 'on_scene' && (
                <TouchableOpacity
                  style={[styles.statusButton, { backgroundColor: primaryColor }]}
                  onPress={() => handleStatusChange('clear')}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.statusButtonText, { color: secondaryColor }]}>✅ Call Complete — Go Clear</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}

{/* Up Next */}
{upcoming.length > 0 && (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>Up Next — {upcoming.length} more call{upcoming.length > 1 ? 's' : ''}</Text>
    {upcoming.map((u, index) => (
      <View key={u.id} style={[styles.patientRow, index > 0 && { marginTop: 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.patientName}>{u.service}</Text>
          <Text style={styles.patientDetail}>📍 {u.address}</Text>
          <Text style={styles.patientDetail}>👤 {u.patient_name}</Text>
          {u.requested_time && (
            <Text style={styles.patientDetail}>
              🕐 {new Date(u.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
    ))}
  </View>
)}

          {/* Completed */}
          {call.status === 'completed' && (
            <View style={styles.completedCard}>
              <Text style={styles.completedIcon}>⭐</Text>
              <Text style={styles.completedText}>Call Complete!</Text>
              <Text style={styles.completedSub}>Great work. Waiting for your next call.</Text>
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  content: { paddingBottom: 48 },
  centered: { flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, marginBottom: 16 },
  companyName: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  emergencyButton: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#f09090', borderRadius: 12, padding: 16, alignItems: 'center' },
  emergencyText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  noCall: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  noCallIcon: { fontSize: 64, marginBottom: 16 },
  noCallText: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  noCallSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  statusBanner: { marginHorizontal: 16, marginBottom: 16, borderWidth: 2, borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
statusBannerText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  card: { marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.8)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  service: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 },
  label: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 4 },
  value: { fontSize: 15, color: '#fff' },
  valueNote: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', marginTop: 2 },
  patientRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 8 },
  patientName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  patientDetail: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  timerCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  timerWarning: { borderColor: '#E2C97E', backgroundColor: 'rgba(226,201,126,0.1)' },
  timerDanger: { borderColor: '#f09090', backgroundColor: 'rgba(240,144,144,0.1)' },
  timerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 },
  timerValue: { fontSize: 48, fontWeight: '700', color: '#fff', fontVariant: ['tabular-nums'] },
  timerAlert: { fontSize: 13, color: '#E2C97E', marginTop: 8, textAlign: 'center' },
  statusButton: { borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 },
  statusButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  completedCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 14, padding: 32, alignItems: 'center' },
  completedIcon: { fontSize: 48, marginBottom: 12 },
  completedText: { fontSize: 22, fontWeight: '700', color: '#4CAF50', marginBottom: 8 },
  completedSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
})