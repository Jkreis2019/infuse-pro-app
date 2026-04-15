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
        <View style={[rStyles.header, { backgroundColor: secondaryColor }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{gfe.patientName}</Text>
          <View style={{ width: 60 }} />
        </View>

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
                  {intake.medications && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>MEDICATIONS</Text><Text style={rStyles.infoValue}>{intake.medications}</Text></View>}
                  {intake.supplements && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>SUPPLEMENTS</Text><Text style={rStyles.infoValue}>{intake.supplements}</Text></View>}
                  {intake.allergies_detail?.length > 0 && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>ALLERGIES</Text>{intake.allergies_detail.map((a, i) => <Text key={i} style={rStyles.infoValue}>• {a}</Text>)}</View>}
                  {intake.medical_history_cardiovascular?.length > 0 && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>CARDIOVASCULAR</Text>{intake.medical_history_cardiovascular.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}</View>}
                  {intake.medical_history_respiratory?.length > 0 && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>RESPIRATORY</Text>{intake.medical_history_respiratory.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}</View>}
                  {intake.medical_history_renal?.length > 0 && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>RENAL</Text>{intake.medical_history_renal.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}</View>}
                  {intake.important_history?.length > 0 && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>IMPORTANT HISTORY</Text>{intake.important_history.map((h, i) => <Text key={i} style={rStyles.infoValue}>• {h}</Text>)}</View>}
                </>
              )}
              {!intake && <View style={rStyles.section}><Text style={{ color: '#e53e3e', fontWeight: '600' }}>⚠️ No intake form on file for this patient</Text></View>}
            </>
          )}

          {activeTab === 'chart' && (
            <View style={rStyles.section}>
              <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>TECH CHART</Text>
              {chartLoading ? <ActivityIndicator color={primaryColor} /> : !chartData ? (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No chart submitted yet</Text>
              ) : (
                <>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>Status</Text><Text style={[rStyles.infoValue, { color: chartData.status === 'submitted' ? '#4CAF50' : '#FF9800' }]}>{chartData.status?.toUpperCase()}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>BP</Text><Text style={rStyles.infoValue}>{chartData.blood_pressure || '—'}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>HR</Text><Text style={rStyles.infoValue}>{chartData.heart_rate || '—'}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>O2</Text><Text style={rStyles.infoValue}>{chartData.oxygen_sat ? `${chartData.oxygen_sat}%` : '—'}</Text></View>
                  <View style={rStyles.infoRow}><Text style={rStyles.infoLabel}>Pain Scale</Text><Text style={rStyles.infoValue}>{chartData.pain_scale || '—'}</Text></View>
                  {chartData.chief_complaint && <View style={{ marginTop: 10 }}><Text style={rStyles.infoLabel}>CHIEF COMPLAINT</Text><Text style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>{chartData.chief_complaint}</Text></View>}
                  {chartData.tech_notes && <View style={{ marginTop: 10 }}><Text style={rStyles.infoLabel}>TECH NOTES</Text><Text style={{ color: '#fff', fontSize: 13, marginTop: 4 }}>{chartData.tech_notes}</Text></View>}
                  {chartData.complications === 'Yes' && <View style={{ marginTop: 10, backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 8, padding: 10 }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>⚠️ COMPLICATIONS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{chartData.complications_detail}</Text></View>}
                  {chartData.amendment_notes && <View style={{ marginTop: 10, backgroundColor: 'rgba(255,152,0,0.08)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 8, padding: 10 }}><Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>📝 AMENDMENT</Text><Text style={{ color: '#fff', fontSize: 13 }}>{chartData.amendment_notes}</Text></View>}
                  {chartData.iv_site_photo && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>📷 IV SITE PHOTO</Text>
                      <Image source={{ uri: chartData.iv_site_photo }} style={{ width: '100%', height: 200, borderRadius: 10 }} resizeMode="cover" />
                    </View>
                  )}
                </>
              )}
            </View>
          )}

          {activeTab === 'orders' && (
            <>
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>REASON FOR TREATMENT *</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Primary reason patient is seeking IV therapy today</Text>
                <TextInput style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="e.g. Dehydration, hangover recovery..." placeholderTextColor="#666" value={reasonForTreatment} onChangeText={setReasonForTreatment} multiline />
              </View>
              <View style={rStyles.section}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }} onPress={() => setMedicationsReviewed(!medicationsReviewed)}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: medicationsReviewed ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: medicationsReviewed ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {medicationsReviewed && <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor, marginBottom: 0 }]}>MEDICATIONS REVIEWED</Text>
                </TouchableOpacity>
                <TextInput style={[rStyles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Notes on medications reviewed..." placeholderTextColor="#666" value={medicationsNotes} onChangeText={setMedicationsNotes} multiline />
              </View>
              <View style={rStyles.section}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }} onPress={() => setMedicalHxReviewed(!medicalHxReviewed)}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: medicalHxReviewed ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: medicalHxReviewed ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {medicalHxReviewed && <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor, marginBottom: 0 }]}>MEDICAL HISTORY REVIEWED</Text>
                </TouchableOpacity>
                <TextInput style={[rStyles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Notes on medical history reviewed..." placeholderTextColor="#666" value={medicalHxNotes} onChangeText={setMedicalHxNotes} multiline />
              </View>
              <View style={rStyles.section}>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 }} onPress={() => setAllergiesReviewed(!allergiesReviewed)}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: allergiesReviewed ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: allergiesReviewed ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                    {allergiesReviewed && <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                  </View>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor, marginBottom: 0 }]}>ALLERGIES REVIEWED</Text>
                </TouchableOpacity>
                <TextInput style={[rStyles.input, { height: 60, textAlignVertical: 'top' }]} placeholder="Notes on allergies reviewed..." placeholderTextColor="#666" value={allergiesNotes} onChangeText={setAllergiesNotes} multiline />
              </View>
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>DECISION</Text>
                {[
                  { key: 'approved', label: '✅ Approved for Treatment' },
                  { key: 'hold', label: '⏸ Hold — Needs Follow Up' },
                  { key: 'declined', label: '❌ Declined' },
                  { key: 'not_a_candidate', label: '🚫 Not a Candidate' },
                ].map(opt => (
                  <TouchableOpacity key={opt.key} style={[rStyles.decisionBtn, decision === opt.key && { borderColor: primaryColor, backgroundColor: primaryColor + '22' }]} onPress={() => handleDecisionChange(opt.key)}>
                    <Text style={[rStyles.decisionText, decision === opt.key && { color: primaryColor }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {decision === 'not_a_candidate' && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>REASON NOT A CANDIDATE *</Text><TextInput style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Explain why..." placeholderTextColor="#666" value={notACandidateReason} onChangeText={setNotACandidateReason} multiline /></View>}
              {decision === 'declined' && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>DECLINE REASON *</Text><TextInput style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Reason for declining..." placeholderTextColor="#666" value={declineReason} onChangeText={setDeclineReason} multiline /></View>}
              {decision === 'approved' && (
                <View style={rStyles.section}>
                  <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>APPROVED SERVICES</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Select all services this patient is approved for</Text>
                  {companyServices.map(service => (
                    <TouchableOpacity key={service} style={[rStyles.serviceBtn, approvedServices.includes(service) && { borderColor: primaryColor, backgroundColor: primaryColor + '22' }]} onPress={() => toggleService(service)}>
                      <Text style={[rStyles.serviceText, approvedServices.includes(service) && { color: primaryColor }]}>{approvedServices.includes(service) ? '✅ ' : '○ '}{service}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {decision === 'approved' && <View style={rStyles.section}><Text style={[rStyles.sectionTitle, { color: primaryColor }]}>RESTRICTIONS</Text><TextInput style={[rStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="e.g. No Toradol, No Benadryl..." placeholderTextColor="#666" value={restrictions} onChangeText={setRestrictions} multiline /></View>}
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>NP ORDERS & NOTES</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>Visible to tech on every call for 12 months</Text>
                <TextInput style={[rStyles.input, { height: 120, textAlignVertical: 'top' }]} placeholder="Write your clinical orders and notes here..." placeholderTextColor="#666" value={npOrders} onChangeText={setNpOrders} multiline />
              </View>
              <View style={rStyles.section}>
                <Text style={[rStyles.sectionTitle, { color: primaryColor }]}>VIDEO GFE</Text>
                <TouchableOpacity style={[rStyles.videoBtn, { borderColor: primaryColor }]}>
                  <Text style={{ color: primaryColor, fontSize: 15, fontWeight: '700' }}>📹 Start Video Call</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Daily.co integration coming soon</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[rStyles.submitBtn, { backgroundColor: primaryColor }, submitting && { opacity: 0.6 }]} onPress={submitSignoff} disabled={submitting}>
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
  const [log, setLog] = useState([])
  const [logSearch, setLogSearch] = useState('')
  const [logLoading, setLogLoading] = useState(false)
  const [expandedLog, setExpandedLog] = useState(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientResults, setPatientResults] = useState([])
  const [patientSearching, setPatientSearching] = useState(false)
  const [selectedPatientProfile, setSelectedPatientProfile] = useState(null)
  const [npPatientActiveTab, setNpPatientActiveTab] = useState('overview')

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

  const searchPatients = async (query) => {
    if (!query || query.length < 2) { setPatientResults([]); return }
    setPatientSearching(true)
    try {
      const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(query)}`, { headers })
      const data = await res.json()
      if (data.patients) setPatientResults(data.patients)
    } catch (err) {
      console.error('Patient search error:', err)
    } finally {
      setPatientSearching(false)
    }
  }

  const fetchPatientProfile = async (patientId) => {
    try {
      const res = await fetch(`${API_URL}/patients/${patientId}/profile`, { headers })
      const data = await res.json()
      if (data.success) {
        setSelectedPatientProfile(data)
        setNpPatientActiveTab('overview')
      }
    } catch (err) {
      console.error('Patient profile error:', err)
    }
  }

  const fetchLog = async (search = '') => {
    setLogLoading(true)
    try {
      const url = search ? `${API_URL}/gfe/log?search=${encodeURIComponent(search)}` : `${API_URL}/gfe/log`
      const res = await fetch(url, { headers })
      const data = await res.json()
      if (data.success) setLog(data.log)
    } catch (err) {
      console.error('GFE log error:', err)
    } finally {
      setLogLoading(false)
    }
  }

  React.useEffect(() => {
    if (activeTab === 'log') fetchLog()
  }, [activeTab])

  const openGFE = async (gfe) => {
    setLoadingGFE(true)
    try {
      await fetch(`${API_URL}/gfe/room`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ gfeId: gfe.id }) })
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
    return <View style={styles.centered}><ActivityIndicator color={primaryColor} size="large" /></View>
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
            <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => setProfileModal(true)}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>👤 Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', flexGrow: 0 }}>
        <View style={{ flexDirection: 'row' }}>
          {[
            { key: 'queue', label: `🩺 GFE${queue.length > 0 ? ` (${queue.length})` : ''}` },
            { key: 'log', label: '📋 Log' },
            { key: 'messages', label: '💬 Messages' },
            { key: 'search', label: '🔍 Patients' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: activeTab === tab.key ? primaryColor : 'transparent' }}
              onPress={() => {
              if (tab.key === 'messages') {
                navigation.navigate('DispatcherMessaging', { token, user, company })
              } else {
                setActiveTab(tab.key)
              }
            }}
            >
              <Text style={{ color: activeTab === tab.key ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Queue Tab */}
      {activeTab === 'queue' && (
        <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {queue.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🩺</Text>
              <Text style={styles.emptyText}>No pending GFE requests</Text>
              <Text style={styles.emptySub}>Pull down to refresh</Text>
            </View>
          ) : queue.map(gfe => (
            <View key={gfe.id} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.patientName}>{gfe.patientName}</Text>
                <View style={[styles.badge, { borderColor: primaryColor }]}>
                  <Text style={[styles.badgeText, { color: primaryColor }]}>PENDING</Text>
                </View>
              </View>
              <Text style={styles.cardSub}>🧑‍⚕️ Tech: {gfe.techName}</Text>
              {gfe.chiefComplaint && <Text style={styles.cardSub}>📋 {gfe.chiefComplaint}</Text>}
              {gfe.vitals?.bloodPressure && <Text style={styles.cardSub}>💉 BP: {gfe.vitals.bloodPressure} · HR: {gfe.vitals.heartRate} · O2: {gfe.vitals.oxygenSat}%</Text>}
              <Text style={styles.cardTime}>🕐 {new Date(gfe.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <TouchableOpacity style={[styles.reviewBtn, { backgroundColor: primaryColor }, loadingGFE && { opacity: 0.6 }]} onPress={() => openGFE(gfe)} disabled={loadingGFE}>
                {loadingGFE ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.reviewBtnText, { color: secondaryColor }]}>Review & Sign Off →</Text>}
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Log Tab */}
      {activeTab === 'log' && (
        <View style={{ flex: 1 }}>
          <View style={{ padding: 16, backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TextInput
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 14 }}
              placeholder="Search patient name..."
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={logSearch}
              onChangeText={text => { setLogSearch(text); fetchLog(text) }}
            />
          </View>
          {logLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={primaryColor} /></View>
          ) : log.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32, marginBottom: 12 }}>📋</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{logSearch ? 'No patients found' : 'No GFEs completed today'}</Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              {log.map(item => {
                const isExpanded = expandedLog === item.id
                const isApproved = item.decision === 'approved'
                const isDenied = item.decision === 'declined' || item.decision === 'not_a_candidate'
                const decisionColor = isApproved ? '#4CAF50' : isDenied ? '#e53e3e' : '#FF9800'
                const decisionLabel = item.decision === 'approved' ? '✅ Approved' : item.decision === 'declined' ? '❌ Declined' : item.decision === 'not_a_candidate' ? '🚫 Not a Candidate' : '⏸ Hold'
                return (
                  <TouchableOpacity key={item.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: decisionColor }} onPress={() => setExpandedLog(isExpanded ? null : item.id)}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }}>{item.patientName}</Text>
                      <Text style={{ color: decisionColor, fontSize: 13, fontWeight: '700' }}>{decisionLabel}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{item.service}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    {isExpanded && (
                      <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 14 }}>
                        {item.reasonForTreatment && <View style={{ marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>REASON FOR TREATMENT</Text><Text style={{ color: '#fff', fontSize: 13 }}>{item.reasonForTreatment}</Text></View>}
                        {item.npOrders && <View style={{ marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>NP ORDERS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{item.npOrders}</Text></View>}
                        {item.restrictions && <View style={{ marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>RESTRICTIONS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{item.restrictions}</Text></View>}
                        {item.declineReason && <View style={{ marginBottom: 10 }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>DECLINE REASON</Text><Text style={{ color: '#fff', fontSize: 13 }}>{item.declineReason}</Text></View>}
                        {item.notACandidateReason && <View style={{ marginBottom: 10 }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>NOT A CANDIDATE REASON</Text><Text style={{ color: '#fff', fontSize: 13 }}>{item.notACandidateReason}</Text></View>}
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
                          <Text style={{ color: item.medicationsReviewed ? '#4CAF50' : 'rgba(255,255,255,0.3)', fontSize: 12 }}>{item.medicationsReviewed ? '✓' : '○'} Medications</Text>
                          <Text style={{ color: item.medicalHxReviewed ? '#4CAF50' : 'rgba(255,255,255,0.3)', fontSize: 12 }}>{item.medicalHxReviewed ? '✓' : '○'} Medical Hx</Text>
                          <Text style={{ color: item.allergiesReviewed ? '#4CAF50' : 'rgba(255,255,255,0.3)', fontSize: 12 }}>{item.allergiesReviewed ? '✓' : '○'} Allergies</Text>
                        </View>
                      </View>
                    )}
                    <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 8, textAlign: 'right' }}>{isExpanded ? '▲ collapse' : '▼ details'}</Text>
                  </TouchableOpacity>
                )
              })}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* Patient Search Tab */}
      {activeTab === 'search' && (
        <View style={{ flex: 1 }}>
          {selectedPatientProfile ? (
            <View style={{ flex: 1 }}>
              <View style={{ paddingTop: 16, paddingBottom: 0, paddingHorizontal: 16, backgroundColor: secondaryColor }}>
                <TouchableOpacity onPress={() => setSelectedPatientProfile(null)} style={{ marginBottom: 12 }}>
                  <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>← Back to Search</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>{selectedPatientProfile.patient?.first_name} {selectedPatientProfile.patient?.last_name}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 2, marginBottom: 12 }}>{selectedPatientProfile.patient?.email}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }}>
                  <View style={{ flexDirection: 'row', paddingHorizontal: 16 }}>
                    {['overview', 'appointments', 'charts', 'intake', 'gfe'].map(t => (
                      <TouchableOpacity key={t} style={{ marginRight: 4, paddingVertical: 10, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: npPatientActiveTab === t ? primaryColor : 'transparent' }} onPress={() => setNpPatientActiveTab(t)}>
                        <Text style={{ color: npPatientActiveTab === t ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>
                          {t === 'overview' ? '📊 Overview' : t === 'appointments' ? '📅 Appts' : t === 'charts' ? '📋 Charts' : t === 'intake' ? '📝 Intake' : '🩺 GFE'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <ScrollView style={{ flex: 1, padding: 16 }}>
                {/* OVERVIEW */}
                {npPatientActiveTab === 'overview' && (
                  <>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                      <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>PATIENT INFO</Text>
                      {selectedPatientProfile.patient?.phone && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Phone</Text><Text style={{ color: '#fff', fontSize: 13 }}>{selectedPatientProfile.patient.phone}</Text></View>}
                      {selectedPatientProfile.patient?.dob && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>DOB</Text><Text style={{ color: '#fff', fontSize: 13 }}>{new Date(selectedPatientProfile.patient.dob).toLocaleDateString()}</Text></View>}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Total Bookings</Text><Text style={{ color: '#fff', fontSize: 13 }}>{selectedPatientProfile.totalBookings}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Completed</Text><Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: '600' }}>{selectedPatientProfile.completedBookings}</Text></View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No Shows</Text><Text style={{ color: selectedPatientProfile.noShows > 0 ? '#e53e3e' : '#fff', fontSize: 13 }}>{selectedPatientProfile.noShows}</Text></View>
                    </View>
                    {selectedPatientProfile.gfe ? (
                      <View style={{ backgroundColor: selectedPatientProfile.gfe.notACandidate ? 'rgba(229,62,62,0.1)' : 'rgba(76,175,80,0.1)', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: selectedPatientProfile.gfe.notACandidate ? '#e53e3e' : '#4CAF50' }}>
                        <Text style={{ color: selectedPatientProfile.gfe.notACandidate ? '#e53e3e' : '#4CAF50', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>{selectedPatientProfile.gfe.notACandidate ? '🚫 Not a GFE Candidate' : '✅ GFE Approved'}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Signed by {selectedPatientProfile.gfe.npName}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Valid until {selectedPatientProfile.gfe.validUntil ? new Date(selectedPatientProfile.gfe.validUntil).toLocaleDateString() : '—'}</Text>
                        {selectedPatientProfile.gfe.restrictions && <Text style={{ color: '#e53e3e', fontSize: 12, marginTop: 6 }}>⚠️ {selectedPatientProfile.gfe.restrictions}</Text>}
                      </View>
                    ) : (
                      <View style={{ backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FF9800' }}>
                        <Text style={{ color: '#FF9800', fontSize: 13, fontWeight: '700' }}>⚠️ No GFE on file</Text>
                      </View>
                    )}
                  </>
                )}

                {/* APPOINTMENTS */}
                {npPatientActiveTab === 'appointments' && (
                  <>
                    {!selectedPatientProfile.bookings?.length ? (
                      <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No appointments on file</Text>
                    ) : selectedPatientProfile.bookings.map((b, i) => (
                      <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{b.service}</Text>
                          <Text style={{ color: b.status === 'completed' ? '#4CAF50' : b.status === 'cancelled' ? '#e53e3e' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' }}>{b.status?.toUpperCase()}</Text>
                        </View>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>📍 {b.address}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>{new Date(b.created_at).toLocaleDateString()}</Text>
                        {b.tech_name && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>🧑‍⚕️ {b.tech_name}</Text>}
                      </View>
                    ))}
                  </>
                )}

                {/* CHARTS */}
                {npPatientActiveTab === 'charts' && (
                  <>
                    {!selectedPatientProfile.charts?.length ? (
                      <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No charts on file</Text>
                    ) : selectedPatientProfile.charts.map((ch, i) => (
                      <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{ch.chief_complaint || 'Chart'}</Text>
                          <Text style={{ color: ch.status === 'submitted' ? '#4CAF50' : '#FF9800', fontSize: 11, fontWeight: '700' }}>{ch.status?.toUpperCase()}</Text>
                        </View>
                        {ch.blood_pressure && <View style={{ flexDirection: 'row', gap: 12, marginBottom: 6 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>BP: <Text style={{ color: '#fff' }}>{ch.blood_pressure}</Text></Text>
                          {ch.heart_rate && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>HR: <Text style={{ color: '#fff' }}>{ch.heart_rate}</Text></Text>}
                          {ch.oxygen_sat && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>O2: <Text style={{ color: '#fff' }}>{ch.oxygen_sat}%</Text></Text>}
                        </View>}
                        {ch.tech_notes && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} numberOfLines={2}>{ch.tech_notes}</Text>}
                        {ch.complications === 'Yes' && <Text style={{ color: '#e53e3e', fontSize: 12, marginTop: 4 }}>⚠️ {ch.complications_detail}</Text>}
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 6 }}>🧑‍⚕️ {ch.tech_name} · {new Date(ch.created_at).toLocaleDateString()}</Text>
                        {ch.iv_site_photo && (
                          <Image source={{ uri: ch.iv_site_photo }} style={{ width: '100%', height: 160, borderRadius: 8, marginTop: 8 }} resizeMode="cover" />
                        )}
                      </View>
                    ))}
                  </>
                )}

                {/* INTAKE */}
                {npPatientActiveTab === 'intake' && (
                  <>
                    {!selectedPatientProfile.intake ? (
                      <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No intake form on file</Text>
                    ) : (() => {
                      const intake = selectedPatientProfile.intake
                      const parseArr = (val) => { try { return typeof val === 'string' ? JSON.parse(val) : (Array.isArray(val) ? val : []) } catch(e) { return [] } }
                      const allergies = parseArr(intake.allergies_detail)
                      const cardio = parseArr(intake.medical_history_cardiovascular)
                      const respiratory = parseArr(intake.medical_history_respiratory)
                      const renal = parseArr(intake.medical_history_renal)
                      const history = parseArr(intake.important_history)
                      return (
                        <>
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                            <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>SUBMITTED</Text>
                            <Text style={{ color: '#fff', fontSize: 13 }}>{new Date(intake.submitted_at).toLocaleDateString()}</Text>
                          </View>
                          {intake.medications ? <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>MEDICATIONS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{intake.medications}</Text></View> : null}
                          {intake.supplements ? <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>SUPPLEMENTS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{intake.supplements}</Text></View> : null}
                          {allergies.length > 0 ? <View style={{ backgroundColor: 'rgba(229,62,62,0.08)', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(229,62,62,0.3)' }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>ALLERGIES</Text>{allergies.map((a, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {a}</Text>)}</View> : null}
                          {cardio.length > 0 ? <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>CARDIOVASCULAR</Text>{cardio.map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}</View> : null}
                          {respiratory.length > 0 ? <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>RESPIRATORY</Text>{respiratory.map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}</View> : null}
                          {renal.length > 0 ? <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>RENAL</Text>{renal.map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}</View> : null}
                          {history.length > 0 ? <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>IMPORTANT HISTORY</Text>{history.map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}</View> : null}
                        </>
                      )
                    })()}
                  </>
                )}

                {/* GFE */}
                {npPatientActiveTab === 'gfe' && (
                  <>
                    {!selectedPatientProfile.gfe ? (
                      <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No GFE on file</Text>
                    ) : (
                      <>
                        <View style={{ backgroundColor: selectedPatientProfile.gfe.notACandidate ? 'rgba(229,62,62,0.1)' : 'rgba(76,175,80,0.1)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: selectedPatientProfile.gfe.notACandidate ? '#e53e3e' : '#4CAF50' }}>
                          <Text style={{ color: selectedPatientProfile.gfe.notACandidate ? '#e53e3e' : '#4CAF50', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>{selectedPatientProfile.gfe.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ APPROVED'}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Signed by {selectedPatientProfile.gfe.npName}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Completed: {selectedPatientProfile.gfe.completedAt ? new Date(selectedPatientProfile.gfe.completedAt).toLocaleDateString() : '—'}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Valid until: {selectedPatientProfile.gfe.validUntil ? new Date(selectedPatientProfile.gfe.validUntil).toLocaleDateString() : '—'}</Text>
                        </View>
                        {selectedPatientProfile.gfe.reasonForTreatment && <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>🎯 REASON FOR TREATMENT</Text><Text style={{ color: '#fff', fontSize: 13 }}>{selectedPatientProfile.gfe.reasonForTreatment}</Text></View>}
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>📋 REVIEW CHECKLIST</Text>
                          <Text style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>{selectedPatientProfile.gfe.medicationsReviewed ? '✅' : '⬜'} Medications Reviewed</Text>
                          {selectedPatientProfile.gfe.medicationsNotes && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, marginLeft: 24 }}>{selectedPatientProfile.gfe.medicationsNotes}</Text>}
                          <Text style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>{selectedPatientProfile.gfe.medicalHxReviewed ? '✅' : '⬜'} Medical History Reviewed</Text>
                          {selectedPatientProfile.gfe.medicalHxNotes && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8, marginLeft: 24 }}>{selectedPatientProfile.gfe.medicalHxNotes}</Text>}
                          <Text style={{ color: '#fff', fontSize: 13 }}>{selectedPatientProfile.gfe.allergiesReviewed ? '✅' : '⬜'} Allergies Reviewed</Text>
                          {selectedPatientProfile.gfe.allergiesNotes && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4, marginLeft: 24 }}>{selectedPatientProfile.gfe.allergiesNotes}</Text>}
                        </View>
                        {selectedPatientProfile.gfe.approvedServices?.length > 0 && <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>✅ APPROVED SERVICES</Text>{selectedPatientProfile.gfe.approvedServices.map((s, i) => <Text key={i} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>• {s}</Text>)}</View>}
                        {selectedPatientProfile.gfe.restrictions && <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e53e3e' }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>❌ RESTRICTIONS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{selectedPatientProfile.gfe.restrictions}</Text></View>}
                        {selectedPatientProfile.gfe.npOrders && <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 8 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>📝 NP ORDERS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{selectedPatientProfile.gfe.npOrders}</Text></View>}
                        {selectedPatientProfile.gfe.notACandidateReason && <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e53e3e' }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>🚫 REASON NOT A CANDIDATE</Text><Text style={{ color: '#fff', fontSize: 13 }}>{selectedPatientProfile.gfe.notACandidateReason}</Text></View>}
                      </>
                    )}
                  </>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ padding: 16, backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                <TextInput
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 14 }}
                  placeholder="Search patients by name, email, or phone..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={patientSearch}
                  onChangeText={text => { setPatientSearch(text); searchPatients(text) }}
                />
              </View>
              {patientSearching ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={primaryColor} /></View>
              ) : patientResults.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 32, marginBottom: 12 }}>🔍</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{patientSearch.length > 0 ? 'No patients found' : 'Search by name, email or phone'}</Text>
                </View>
              ) : (
                <ScrollView style={{ flex: 1 }}>
                  {patientResults.map((p, i) => (
                    <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }} onPress={() => fetchPatientProfile(p.id)}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: primaryColor + '22', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>{p.first_name?.[0]}{p.last_name?.[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{p.first_name} {p.last_name}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{p.email}</Text>
                        {p.phone && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{p.phone}</Text>}
                      </View>
                      <Text style={{ color: p.has_valid_intake ? '#4CAF50' : 'rgba(255,255,255,0.2)', fontSize: 11, fontWeight: '700' }}>{p.has_valid_intake ? '📋 Intake' : 'No intake'}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
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
            <TouchableOpacity style={{ backgroundColor: 'rgba(220,80,80,0.15)', borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 }} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
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