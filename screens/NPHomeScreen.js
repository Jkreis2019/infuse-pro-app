import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, Image,
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

function GFEReviewModal({ visible, onClose, gfe, token, company, onSubmitted }) {
  const primaryColor = company?.primaryColor || '#5BBFB5'
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
  const [chartData, setChartData] = useState(null)
  const [chartLoading, setChartLoading] = useState(false)
  const [reasonForTreatment, setReasonForTreatment] = useState('')
  const [medicationsReviewed, setMedicationsReviewed] = useState(false)
  const [medicationsNotes, setMedicationsNotes] = useState('')
  const [medicalHxReviewed, setMedicalHxReviewed] = useState(false)
  const [medicalHxNotes, setMedicalHxNotes] = useState('')
  const [allergiesReviewed, setAllergiesReviewed] = useState(false)
  const [allergiesNotes, setAllergiesNotes] = useState('')
  const [companyServices, setCompanyServices] = useState([
    'Hangover Rescue', 'Myers Cocktail', 'Immunity Boost',
    'NAD+ Therapy', 'Migraine Relief', 'Energy Boost'
  ])

  React.useEffect(() => {
    if (company?.id) {
      fetch(`${API_URL}/companies/${company.id}/services`)
        .then(r => r.json())
        .then(d => { if (d.services?.length > 0) setCompanyServices(d.services.map(s => s.name)) })
        .catch(() => {})
    }
  }, [company?.id])

  React.useEffect(() => {
    if (activeTab === 'chart' && gfe?.call_id && !chartData) {
      setChartLoading(true)
      fetch(`${API_URL}/charts/call/${gfe.call_id}`, { headers })
        .then(r => r.json())
        .then(data => { if (data.chart) setChartData(data.chart) })
        .catch(() => {})
        .finally(() => setChartLoading(false))
    }
  }, [activeTab])

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
          npNotes: npOrders || null,
          reasonForTreatment: reasonForTreatment || null,
          medicationsReviewed,
          medicationsNotes: medicationsNotes || null,
          medicalHxReviewed,
          medicalHxNotes: medicalHxNotes || null,
          allergiesReviewed,
          allergiesNotes: allergiesNotes || null
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
          {['intake', 'chart', 'orders'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? primaryColor : 'transparent' }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{ color: activeTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>
                {tab === 'intake' ? '📋 Intake' : tab === 'chart' ? '📊 Chart' : '✍️ Orders'}
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

              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>VITALS</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {gfe.vitals?.bloodPressure && <View style={rStyles.vitalChip}><Text style={rStyles.vitalLabel}>BP</Text><Text style={rStyles.vitalValue}>{gfe.vitals.bloodPressure}</Text></View>}
                  {gfe.vitals?.heartRate && <View style={rStyles.vitalChip}><Text style={rStyles.vitalLabel}>HR</Text><Text style={rStyles.vitalValue}>{gfe.vitals.heartRate}</Text></View>}
                  {gfe.vitals?.oxygenSat && <View style={rStyles.vitalChip}><Text style={rStyles.vitalLabel}>O2</Text><Text style={rStyles.vitalValue}>{gfe.vitals.oxygenSat}%</Text></View>}
                </View>
              </View>

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

          {/* Chart Tab */}
          {activeTab === 'chart' && (
            <View style={rStyles.section}>
              <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>TECH CHART</Text>
              {chartLoading ? (
                <ActivityIndicator color={primaryColor} />
              ) : !chartData ? (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No chart submitted yet</Text>
              ) : (
                <>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>Status</Text><Text style={[rStyles.infoValue, { color: chartData.status === 'submitted' ? '#4CAF50' : '#FF9800' }]}>{chartData.status?.toUpperCase()}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>BP</Text><Text style={rStyles.infoValue}>{chartData.blood_pressure || '—'}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>HR</Text><Text style={rStyles.infoValue}>{chartData.heart_rate || '—'}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>O2</Text><Text style={rStyles.infoValue}>{chartData.oxygen_sat ? `${chartData.oxygen_sat}%` : '—'}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>Pain Scale</Text><Text style={rStyles.infoValue}>{chartData.pain_scale || '—'}</Text></View>
                  {chartData.chief_complaint && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={rStyles.infoLabel}>CHIEF COMPLAINT</Text>
                      <Text style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>{chartData.chief_complaint}</Text>
                    </View>
                  )}
                  {chartData.tech_notes && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={rStyles.infoLabel}>TECH NOTES</Text>
                      <Text style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>{chartData.tech_notes}</Text>
                    </View>
                  )}
                  {chartData.complications === 'Yes' && (
                    <View style={{ marginTop: 10, backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 8, padding: 10 }}>
                      <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>⚠️ COMPLICATIONS</Text>
                      <Text style={{ color: '#fff', fontSize: 13 }}>{chartData.complications_detail}</Text>
                    </View>
                  )}
                  {chartData.amendment_notes && (
                    <View style={{ marginTop: 10, backgroundColor: 'rgba(255,152,0,0.08)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 8, padding: 10 }}>
                      <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>📝 AMENDMENT</Text>
                      <Text style={{ color: '#fff', fontSize: 13 }}>{chartData.amendment_notes}</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {/* Reason for Treatment */}
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>REASON FOR TREATMENT *</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Primary reason patient is seeking IV therapy today</Text>
                <TextInput
                  style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="e.g. Dehydration, hangover recovery, immune support..."
                  placeholderTextColor="#666"
                  value={reasonForTreatment}
                  onChangeText={setReasonForTreatment}
                  multiline
                />
              </View>

              {/* Medications Reviewed */}
              <View style={rStyles.section}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}
                  onPress={() => setMedicationsReviewed(!medicationsReviewed)}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: medicationsReviewed ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: medicationsReviewed ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {medicationsReviewed && <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor, marginBottom: 0 }]}>MEDICATIONS REVIEWED</Text>
                </TouchableOpacity>
                <TextInput
                  style={[rStyles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Notes on medications reviewed..."
                  placeholderTextColor="#666"
                  value={medicationsNotes}
                  onChangeText={setMedicationsNotes}
                  multiline
                />
              </View>

              {/* Medical History Reviewed */}
              <View style={rStyles.section}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}
                  onPress={() => setMedicalHxReviewed(!medicalHxReviewed)}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: medicalHxReviewed ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: medicalHxReviewed ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {medicalHxReviewed && <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor, marginBottom: 0 }]}>MEDICAL HISTORY REVIEWED</Text>
                </TouchableOpacity>
                <TextInput
                  style={[rStyles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Notes on medical history reviewed..."
                  placeholderTextColor="#666"
                  value={medicalHxNotes}
                  onChangeText={setMedicalHxNotes}
                  multiline
                />
              </View>

              {/* Allergies Reviewed */}
              <View style={rStyles.section}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }}
                  onPress={() => setAllergiesReviewed(!allergiesReviewed)}
                >
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: allergiesReviewed ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: allergiesReviewed ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {allergiesReviewed && <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor, marginBottom: 0 }]}>ALLERGIES REVIEWED</Text>
                </TouchableOpacity>
                <TextInput
                  style={[rStyles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="Notes on allergies reviewed..."
                  placeholderTextColor="#666"
                  value={allergiesNotes}
                  onChangeText={setAllergiesNotes}
                  multiline
                />
              </View>

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

              {decision === 'approved' && (
                <View style={rStyles.section}>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>APPROVED SERVICES</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Select all services this patient is approved for</Text>
                  {companyServices.map(service => (
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

              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>VIDEO GFE</Text>
                <TouchableOpacity style={[rStyles.videoBtn, { borderColor: primaryColor }]}>
                  <Text style={{ color: primaryColor, fontSize: 15, fontWeight: '700' }}>📹 Start Video Call</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Daily.co integration coming soon</Text>
                </TouchableOpacity>
              </View>

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
  const primaryColor = company?.primaryColor || '#5BBFB5'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedGFE, setSelectedGFE] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [loadingGFE, setLoadingGFE] = useState(false)
  const [profileModal, setProfileModal] = useState(false)
  const [activeTab, setActiveTab] = useState('queue')
  const [messages, setMessages] = useState([])
  const [messageInput, setMessageInput] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const messagesScrollRef = React.useRef(null)

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

  const loadMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/np-dispatch`, { headers })
      const data = await res.json()
      if (data.messages) setMessages(data.messages)
    } catch (err) {
      console.error('Load messages error:', err)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim()) return
    setSendingMessage(true)
    try {
      const res = await fetch(`${API_URL}/messages/channel`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'np-dispatch', body: messageInput.trim() })
      })
      const data = await res.json()
      if (data.success) {
        setMessageInput('')
        loadMessages()
      }
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setSendingMessage(false)
    }
  }

  const openGFE = async (gfe) => {
    setLoadingGFE(true)
    try {
      await fetch(`${API_URL}/gfe/room`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ gfeId: gfe.id })
      })
      const intakeRes = await fetch(`${API_URL}/intake/patient/${gfe.call_id}`, { headers })
      const intakeData = await intakeRes.json()
      setSelectedGFE({ ...gfe, intake: intakeData.intake || null })
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
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: primaryColor + '20', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 }}>
                <Image source={{ uri: company.logoUrl }} style={{ width: 42, height: 42, resizeMode: 'contain' }} />
              </View>
            ) : (
              <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
            )}
            <Text style={styles.headerTitle}>GFE Queue</Text>
            <Text style={styles.headerSub}>{user?.firstName} · NP</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
              onPress={() => setProfileModal(true)}
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
          { key: 'queue', label: `🩺 GFE Queue${queue.length > 0 ? ` (${queue.length})` : ''}` },
          { key: 'messages', label: '💬 Dispatch' }
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab.key ? primaryColor : 'transparent' }}
            onPress={() => { setActiveTab(tab.key); if (tab.key === 'messages') loadMessages() }}
          >
            <Text style={{ color: activeTab === tab.key ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
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
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1, padding: 16 }} ref={messagesScrollRef}>
            {messages.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 32, marginBottom: 12 }}>💬</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No messages yet</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>Dedicated channel with dispatch and admin</Text>
              </View>
            ) : (
              messages.map((msg, i) => (
                <View key={i} style={{ marginBottom: 12, alignItems: msg.sender_id === user?.id ? 'flex-end' : 'flex-start' }}>
                  <View style={{ backgroundColor: msg.sender_id === user?.id ? primaryColor : 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 10, maxWidth: '80%' }}>
                    <Text style={{ color: msg.sender_id === user?.id ? secondaryColor : '#fff', fontSize: 14 }}>{msg.body}</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, marginTop: 4 }}>
                    {msg.sender_first_name} · {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={{ flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: secondaryColor }}>
              <TextInput
                style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14 }}
                placeholder="Message dispatch..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={messageInput}
                onChangeText={setMessageInput}
                multiline
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={sendingMessage || !messageInput.trim()}
                style={{ backgroundColor: primaryColor, borderRadius: 8, padding: 10, justifyContent: 'center', opacity: sendingMessage || !messageInput.trim() ? 0.5 : 1 }}
              >
                <Text style={{ color: secondaryColor, fontWeight: '700' }}>Send</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      {/* Profile Modal */}
      <Modal visible={profileModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: secondaryColor, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 }}>{user?.firstName} {user?.lastName}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>{user?.email}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Role</Text>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>NURSE PRACTITIONER</Text>
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
            <TouchableOpacity style={{ alignItems: 'center', padding: 12 }} onPress={() => setProfileModal(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Close</Text>
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
  header: { paddingTop: Platform.OS === 'web' ? 16 : 56, paddingBottom: 20, paddingHorizontal: 24 },
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