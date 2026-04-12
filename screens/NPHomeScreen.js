import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Image,
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

const APPROVED_SERVICES = [
  'Hangover Rescue', 'Myers Cocktail', 'Immunity Boost',
  'NAD+ Therapy', 'Migraine Relief', 'Energy Boost'
]

function GFEReviewModal({ visible, onClose, gfe, token, company, onSubmitted }) {
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [decision, setDecision] = useState('approved')
  const [approvedServices, setApprovedServices] = useState([])
  const [restrictions, setRestrictions] = useState('')
  const [npOrders, setNpOrders] = useState('')
  const [notACandidate, setNotACandidate] = useState(false)
  const [notACandidateReason, setNotACandidateReason] = useState('')
  const [declineReason, setDeclineReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('intake')

  const toggleService = (service) => {
    setApprovedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    )
  }

  const handleDecisionChange = (d) => {
    setDecision(d)
    setNotACandidate(d === 'not_a_candidate')
  }

  const submitSignoff = async () => {
    if (decision === 'not_a_candidate' && !notACandidateReason) {
      Alert.alert('Required', 'Please provide a reason for not a candidate')
      return
    }
    if (decision === 'declined' && !declineReason) {
      Alert.alert('Required', 'Please provide a decline reason')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/gfe/signoff`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gfeId: gfe.id,
          decision,
          approvedServices: decision === 'approved' ? approvedServices : null,
          restrictions: restrictions || null,
          npOrders: npOrders || null,
          notACandidate: decision === 'not_a_candidate',
          notACandidateReason: notACandidateReason || null,
          declineReason: declineReason || null,
          npNotes: npOrders || null
        })
      })
      const data = await res.json()
      if (data.success) {
        Alert.alert('✅ Signed Off', `GFE ${decision} successfully`)
        onSubmitted()
        onClose()
      } else {
        Alert.alert('Error', data.message || 'Could not submit sign-off')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!gfe) return null

  const intake = gfe.intake

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a1a' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[rStyles.header, { backgroundColor: secondaryColor }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{gfe.patientName}</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Tab Bar */}
        <View style={{ flexDirection: 'row', backgroundColor: secondaryColor }}>
          {['intake', 'orders'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? primaryColor : 'transparent' }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{ color: activeTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>
                {tab === 'intake' ? '📋 Intake' : '✍️ Orders'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>

          {/* Intake Tab */}
          {activeTab === 'intake' && (
            <>
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>PATIENT INFO</Text>
                <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>Name</Text><Text style={rStyles.infoValue}>{gfe.patientName}</Text></View>
                {gfe.patientDob && <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>DOB</Text><Text style={rStyles.infoValue}>{new Date(gfe.patientDob).toLocaleDateString()}</Text></View>}
                <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>Tech</Text><Text style={rStyles.infoValue}>{gfe.techName}</Text></View>
                <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>Service</Text><Text style={rStyles.infoValue}>{gfe.chiefComplaint || 'Not specified'}</Text></View>
              </View>

              {/* Vitals */}
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>VITALS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {gfe.vitals?.bloodPressure && <View style={rStyles.vitalChip}><Text style={rStyles.vitalLabel}>BP</Text><Text style={rStyles.vitalValue}>{gfe.vitals.bloodPressure}</Text></View>}
                  {gfe.vitals?.heartRate && <View style={rStyles.vitalChip}><Text style={rStyles.vitalLabel}>HR</Text><Text style={rStyles.vitalValue}>{gfe.vitals.heartRate}</Text></View>}
                  {gfe.vitals?.oxygenSat && <View style={rStyles.vitalChip}><Text style={rStyles.vitalLabel}>O2</Text><Text style={rStyles.vitalValue}>{gfe.vitals.oxygenSat}%</Text></View>}
                </View>
              </View>

              {/* Intake Form Data */}
              {intake && (
                <>
                  {intake.medications && (
                    <View style={rStyles.section}>
                      <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>MEDICATIONS</Text>
                      <Text style={rStyles.infoValue}>{intake.medications}</Text>
                    </View>
                  )}
                  {intake.supplements && (
                    <View style={rStyles.section}>
                      <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>SUPPLEMENTS</Text>
                      <Text style={rStyles.infoValue}>{intake.supplements}</Text>
                    </View>
                  )}
                  {intake.allergies_detail && intake.allergies_detail.length > 0 && (
                    <View style={rStyles.section}>
                      <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>ALLERGIES</Text>
                      {intake.allergies_detail.map((a, i) => <Text key={i} style={rStyles.infoValue}>• {a}</Text>)}
                    </View>
                  )}
                  {intake.medical_history_cardiovascular && intake.medical_history_cardiovascular.length > 0 && (
                    <View style={rStyles.section}>
                      <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>CARDIOVASCULAR</Text>
                      {intake.medical_history_cardiovascular.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}
                    </View>
                  )}
                  {intake.medical_history_respiratory && intake.medical_history_respiratory.length > 0 && (
                    <View style={rStyles.section}>
                      <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>RESPIRATORY</Text>
                      {intake.medical_history_respiratory.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}
                    </View>
                  )}
                  {intake.medical_history_renal && intake.medical_history_renal.length > 0 && (
                    <View style={rStyles.section}>
                      <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>RENAL</Text>
                      {intake.medical_history_renal.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}
                    </View>
                  )}
                  {intake.important_history && intake.important_history.length > 0 && (
                    <View style={rStyles.section}>
                      <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>IMPORTANT HISTORY</Text>
                      {intake.important_history.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}
                    </View>
                  )}
                </>
              )}
              {!intake && (
                <View style={rStyles.section}>
                  <Text style={{ color: '#e53e3e', fontWeight: '600' }}>⚠️ No intake form on file for this patient</Text>
                </View>
              )}
            </>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {/* Decision */}
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>DECISION</Text>
                {[
                  { key: 'approved', label: '✅ Approved for Treatment' },
                  { key: 'hold', label: '⏸ Hold — Needs Follow Up' },
                  { key: 'declined', label: '❌ Declined' },
                  { key: 'not_a_candidate', label: '🚫 Not a Candidate' },
                ].map(opt => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[rStyles.decisionBtn, decision === opt.key && { borderColor: primaryColor, backgroundColor: primaryColor + '22' }]}
                    onPress={() => handleDecisionChange(opt.key)}
                  >
                    <Text style={[rStyles.decisionText, decision === opt.key && { color: primaryColor }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Not a candidate reason */}
              {decision === 'not_a_candidate' && (
                <View style={rStyles.section}>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>REASON NOT A CANDIDATE *</Text>
                  <TextInput
                    style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Explain why patient is not a candidate..."
                    placeholderTextColor="#666"
                    value={notACandidateReason}
                    onChangeText={setNotACandidateReason}
                    multiline
                  />
                </View>
              )}

              {/* Decline reason */}
              {decision === 'declined' && (
                <View style={rStyles.section}>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>DECLINE REASON *</Text>
                  <TextInput
                    style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="Reason for declining..."
                    placeholderTextColor="#666"
                    value={declineReason}
                    onChangeText={setDeclineReason}
                    multiline
                  />
                </View>
              )}

              {/* Approved services */}
              {decision === 'approved' && (
                <View style={rStyles.section}>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>APPROVED SERVICES</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Select all services this patient is approved for</Text>
                  {APPROVED_SERVICES.map(service => (
                    <TouchableOpacity
                      key={service}
                      style={[rStyles.serviceBtn, approvedServices.includes(service) && { borderColor: primaryColor, backgroundColor: primaryColor + '22' }]}
                      onPress={() => toggleService(service)}
                    >
                      <Text style={[rStyles.serviceText, approvedServices.includes(service) && { color: primaryColor }]}>
                        {approvedServices.includes(service) ? '✅ ' : '○ '}{service}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Restrictions */}
              {decision === 'approved' && (
                <View style={rStyles.section}>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>RESTRICTIONS</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>e.g. No Toradol, No Benadryl, limit fluids to 500ml</Text>
                  <TextInput
                    style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]}
                    placeholder="List any restrictions..."
                    placeholderTextColor="#666"
                    value={restrictions}
                    onChangeText={setRestrictions}
                    multiline
                  />
                </View>
              )}

              {/* NP Orders / Notes */}
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>NP ORDERS & NOTES</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>These notes will be visible to the tech on every call for 12 months</Text>
                <TextInput
                  style={[rStyles.input, { height: 120, textAlignVertical: 'top' }]}
                  placeholder="Write your clinical orders and notes here..."
                  placeholderTextColor="#666"
                  value={npOrders}
                  onChangeText={setNpOrders}
                  multiline
                />
              </View>

              {/* Video call placeholder */}
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>VIDEO GFE</Text>
                <TouchableOpacity style={[rStyles.videoBtn, { borderColor: primaryColor }]}>
                  <Text style={{ color: primaryColor, fontSize: 15, fontWeight: '700' }}>📹 Start Video Call</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Daily.co integration coming soon</Text>
                </TouchableOpacity>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[rStyles.submitBtn, { backgroundColor: primaryColor }, submitting && { opacity: 0.6 }]}
                onPress={submitSignoff}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color={secondaryColor} /> : <Text style={[rStyles.submitBtnText, { color: secondaryColor }]}>Submit Sign-Off</Text>}
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const rStyles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 12, padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  infoLabel: { fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  infoValue: { fontSize: 13, color: '#fff', flex: 1, textAlign: 'right' },
  vitalChip: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 },
  vitalLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600' },
  vitalValue: { fontSize: 16, color: '#fff', fontWeight: '700' },
  decisionBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, marginBottom: 8 },
  decisionText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  serviceBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: 12, marginBottom: 8 },
  serviceText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff' },
  videoBtn: { borderWidth: 2, borderRadius: 12, padding: 20, alignItems: 'center', borderStyle: 'dashed' },
  submitBtn: { borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16 },
  submitBtnText: { fontSize: 16, fontWeight: '700' },
})

export default function NPHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedGFE, setSelectedGFE] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [loadingGFE, setLoadingGFE] = useState(false)

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/gfe/queue`, { headers })
      const data = await res.json()
      if (data.queue) setQueue(data.queue)
    } catch (err) {
      console.error('NP queue error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  React.useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 15000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  const onRefresh = () => { setRefreshing(true); fetchQueue() }

  const openGFE = async (gfe) => {
    setLoadingGFE(true)
    try {
      // Join the GFE session
      await fetch(`${API_URL}/gfe/room`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ gfeId: gfe.id })
      })

      // Fetch intake form for this patient
      const intakeRes = await fetch(`${API_URL}/intake/patient/${gfe.call_id}`, { headers })
      const intakeData = await intakeRes.json()

      setSelectedGFE({
        ...gfe,
        intake: intakeData.intake || null
      })
      setReviewModal(true)
    } catch (err) {
      Alert.alert('Error', 'Could not load patient data')
    } finally {
      setLoadingGFE(false)
    }
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
      <GFEReviewModal
        visible={reviewModal}
        onClose={() => { setReviewModal(false); setSelectedGFE(null) }}
        gfe={selectedGFE}
        token={token}
        company={company}
        onSubmitted={fetchQueue}
      />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            {company?.logoUrl ? (
  <Image source={{ uri: company.logoUrl }} style={{ height: 36, width: 140, resizeMode: 'contain', marginBottom: 4 }} />
) : (
  <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
)}
            <Text style={styles.headerTitle}>GFE Queue</Text>
            <Text style={styles.headerSub}>{user?.firstName} · NP</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
      >
        {queue.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🩺</Text>
            <Text style={styles.emptyText}>No pending GFE requests</Text>
            <Text style={styles.emptySub}>Pull down to refresh</Text>
          </View>
        ) : (
          queue.map(gfe => (
            <View key={gfe.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.patientName}>{gfe.patientName}</Text>
                <View style={[styles.badge, { borderColor: primaryColor }]}>
                  <Text style={[styles.badgeText, { color: primaryColor }]}>PENDING</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>🧑‍⚕️ Tech: {gfe.techName}</Text>
              {gfe.chiefComplaint && <Text style={styles.cardSub}>📋 {gfe.chiefComplaint}</Text>}
              {gfe.vitals?.bloodPressure && (
                <Text style={styles.cardSub}>
                  💉 BP: {gfe.vitals.bloodPressure} · HR: {gfe.vitals.heartRate} · O2: {gfe.vitals.oxygenSat}%
                </Text>
              )}
              <Text style={styles.cardTime}>
                🕐 {new Date(gfe.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <TouchableOpacity
                style={[styles.reviewBtn, { backgroundColor: primaryColor }, loadingGFE && { opacity: 0.6 }]}
                onPress={() => openGFE(gfe)}
                disabled={loadingGFE}
              >
                {loadingGFE ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.reviewBtnText, { color: secondaryColor }]}>Review & Sign Off →</Text>}
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  centered: { flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  companyName: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  card: { marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  patientName: { fontSize: 18, fontWeight: '700', color: '#fff' },
  badge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  cardTime: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 },
  reviewBtn: { borderRadius: 10, padding: 14, alignItems: 'center' },
  reviewBtnText: { fontSize: 14, fontWeight: '700' },
})