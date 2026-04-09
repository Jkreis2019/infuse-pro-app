import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Vibration, Modal, KeyboardAvoidingView, Platform, TextInput, Image
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import { Calendar } from 'react-native-calendars'

const API_URL = 'https://api.infusepro.app'

const STATUS_COLORS = {
  confirmed: '#C9A84C', assigned: '#C9A84C', en_route: '#2196F3',
  on_scene: '#4CAF50', cleared: '#aaa', completed: '#aaa'
}

const STATUS_LABELS = {
  confirmed: 'Confirmed — Waiting to depart', assigned: 'Confirmed — Waiting to depart',
  en_route: 'En Route', on_scene: 'On Scene', cleared: 'Cleared', completed: 'Completed'
}

const IV_MEDICATIONS = [
  { key: 'second_liter', label: '2nd Liter 1000ml (NS/LR)' },
  { key: 'second_half_liter', label: '2nd Half-Liter 500ml (NS/LR)' },
  { key: 'zofran_1', label: 'Zofran 4mg/2ml' },
  { key: 'zofran_2', label: 'Zofran 4mg/2ml (2nd Dose)' },
  { key: 'toradol_1', label: 'Toradol 15mg/0.5ml' },
  { key: 'toradol_2', label: 'Toradol 15mg/0.5ml (2nd Dose)' },
  { key: 'famotidine_1', label: 'Famotidine 20mg/2ml' },
  { key: 'famotidine_2', label: 'Famotidine 20mg/2ml (2nd Dose)' },
  { key: 'glutathione', label: 'Glutathione 200mg/ml (max 1200mg)' },
  { key: 'benadryl_1', label: 'Benadryl 25mg/0.5ml' },
  { key: 'benadryl_2', label: 'Benadryl 25mg/0.5ml (2nd Dose)' },
  { key: 'decadron_1', label: 'Decadron 4mg/0.4ml' },
  { key: 'decadron_2', label: 'Decadron 4mg/0.4ml (2nd Dose)' },
]

const BAG_ADDONS = [
  { key: 'vitamin_c', label: 'Vitamin C 500mg/ml (500mg-5000mg)' },
  { key: 'b_complex', label: 'B-Complex 1ml-3ml' },
  { key: 'b6', label: 'B6 100mg (max 100mg)' },
  { key: 'biotin', label: 'Biotin 1ml (max 3ml)' },
  { key: 'zinc', label: 'Zinc 10mg (max 20mg)' },
  { key: 'magnesium', label: 'Magnesium 200mg (max 800mg)' },
  { key: 'l_carnitine', label: 'L-Carnitine 500mg (max 500mg)' },
  { key: 'taurine', label: 'Taurine 50mg (max 100mg)' },
  { key: 'b12', label: 'Methylcobalamin B12 1ml (max 2ml)' },
  { key: 'tri_amino', label: 'Tri-Amino Blend 1ml (max 1ml)' },
]

const IM_INJECTIONS = [
  { key: 'promethazine_1', label: 'Promethazine 12.5mg/0.5ml IM' },
  { key: 'promethazine_2', label: 'Promethazine 12.5mg/0.5ml IM (2nd Dose)' },
  { key: 'toradol_im_1', label: 'Toradol 15mg/0.5ml IM' },
  { key: 'toradol_im_2', label: 'Toradol 15mg/0.5ml IM (2nd Dose)' },
  { key: 'famotidine_im_1', label: 'Famotidine 20mg/2ml IM' },
  { key: 'famotidine_im_2', label: 'Famotidine 20mg/2ml IM (2nd Dose)' },
  { key: 'benadryl_im_1', label: 'Benadryl 25mg/0.5ml IM' },
  { key: 'benadryl_im_2', label: 'Benadryl 25mg/0.5ml IM (2nd Dose)' },
  { key: 'glutathione_im', label: 'Glutathione 200mg/ml IM (max 600mg/3ml)' },
  { key: 'biotin_im', label: 'Biotin 2ml IM (Gluteal)' },
  { key: 'b12_im', label: 'Methylcobalamin B12 5000mg/ml 1ml IM' },
]

const IV_SITES = ['L AC', 'R AC', 'L Hand', 'R Hand', 'L Forearm', 'R Forearm', 'L Wrist', 'R Wrist', 'Does Not Apply']
const CATHETER_SIZES = ['18g', '20g', '22g', '24g', 'Does Not Apply']
const IV_FLUIDS = ['Normal Saline 250mls', 'Normal Saline 500mls', 'Normal Saline 1000mls', 'Lactated Ringers 500mls', 'Lactated Ringers 1000mls']

// ── MedRow defined at MODULE level to prevent remount on parent re-render ──
const MedRow = ({ item, medSet, setMedSet, showDose, primaryColor, secondaryColor }) => {
  const checked = !!medSet[item.key]
  const toggle = () => setMedSet(prev => ({ ...prev, [item.key]: prev[item.key] ? null : { time: '', dose: '' } }))
  const setTime = (t) => setMedSet(prev => ({ ...prev, [item.key]: { ...prev[item.key], time: t } }))
  const setDose = (d) => setMedSet(prev => ({ ...prev, [item.key]: { ...prev[item.key], dose: d } }))

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <TouchableOpacity
        style={[cStyles.checkbox, checked && { backgroundColor: primaryColor, borderColor: primaryColor }]}
        onPress={toggle}
      >
        {checked && <Text style={{ color: secondaryColor, fontSize: 12 }}>✓</Text>}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 13 }}>{item.label}</Text>
        {checked && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <TextInput
              style={[cStyles.input, { flex: 1 }]}
              placeholder="Time"
              placeholderTextColor="#666"
              value={medSet[item.key]?.time || ''}
              onChangeText={setTime}
            />
            {showDose && (
              <TextInput
                style={[cStyles.input, { flex: 1 }]}
                placeholder="Dose/Location"
                placeholderTextColor="#666"
                value={medSet[item.key]?.dose || ''}
                onChangeText={setDose}
              />
            )}
          </View>
        )}
      </View>
    </View>
  )
}

// ── SelectRow also at module level ──
const SelectRow = ({ label, options, value, onSelect, primaryColor, secondaryColor }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={cStyles.fieldLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[cStyles.optionBtn, value === opt && { backgroundColor: primaryColor, borderColor: primaryColor }]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[cStyles.optionText, value === opt && { color: secondaryColor }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)

const cStyles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  section: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 12, padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff', marginBottom: 10 },
  optionBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  optionText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
})

function ChartModal({ visible, onClose, call, token, company }) {
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [saving, setSaving] = useState(false)
  const [chartId, setChartId] = useState(null)
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [medicalHistoryChanges, setMedicalHistoryChanges] = useState('')
  const [allergiesDetail, setAllergiesDetail] = useState('')
  const [bp, setBp] = useState('')
  const [hr, setHr] = useState('')
  const [o2, setO2] = useState('')
  const [temp, setTemp] = useState('')
  const [painScale, setPainScale] = useState('')
  const [vitalTime, setVitalTime] = useState('')
  const [ivSite, setIvSite] = useState('')
  const [catheterSize, setCatheterSize] = useState('')
  const [ivAttempts, setIvAttempts] = useState('1')
  const [ivTimeInitiated, setIvTimeInitiated] = useState('')
  const [ivFluids, setIvFluids] = useState([])
  const [ivMeds, setIvMeds] = useState({})
  const [bagAddons, setBagAddons] = useState({})
  const [imInjections, setImInjections] = useState({})
  const [postBp, setPostBp] = useState('')
  const [postHr, setPostHr] = useState('')
  const [postO2, setPostO2] = useState('')
  const [postTime, setPostTime] = useState('')
  const [complications, setComplications] = useState('No')
  const [complicationsDetail, setComplicationsDetail] = useState('')
  const [catheterStatus, setCatheterStatus] = useState('Normal and Intact')
  const [ivTimeDiscontinued, setIvTimeDiscontinued] = useState('')
  const [techNotes, setTechNotes] = useState('')

// Load existing chart when modal opens
  useEffect(() => {
    if (visible && call?.call_id) {
      fetch(`${API_URL}/charts/call/${call.call_id}`, { headers })
        .then(r => r.json())
        .then(data => {
          if (data.chart) {
            const c = data.chart
            setChartId(c.id)
            setChiefComplaint(c.chief_complaint || '')
            setMedicalHistoryChanges(c.medical_history_changes || '')
            setAllergiesDetail(c.allergies_detail || '')
            setBp(c.blood_pressure || '')
            setHr(c.heart_rate?.toString() || '')
            setO2(c.oxygen_sat?.toString() || '')
            setTemp(c.temperature?.toString() || '')
            setPainScale(c.pain_scale?.toString() || '')
            setIvSite(c.iv_insertion_site || '')
            setCatheterSize(c.iv_catheter_size || '')
            setIvAttempts(c.iv_attempts?.toString() || '1')
            setIvTimeInitiated(c.iv_time_initiated || '')
            setIvFluids(c.iv_fluids_used || [])
            setIvMeds(c.prn_iv_medications || {})
            setBagAddons(c.prn_bag_addons || {})
            setImInjections(c.prn_im_injections || {})
            setPostBp(c.vitals_post?.bp || '')
            setPostHr(c.vitals_post?.hr || '')
            setPostO2(c.vitals_post?.o2 || '')
            setPostTime(c.vitals_post?.time || '')
            setComplications(c.complications || 'No')
            setComplicationsDetail(c.complications_detail || '')
            setCatheterStatus(c.iv_catheter_status || 'Normal and Intact')
            setIvTimeDiscontinued(c.iv_time_discontinued || '')
            setTechNotes(c.tech_notes || '')
          }
        })
        .catch(err => console.error('Load chart error:', err))
    }
  }, [visible, call?.call_id])

  const toggleFluid = (fluid) => {
    setIvFluids(prev => prev.includes(fluid) ? prev.filter(f => f !== fluid) : [...prev, fluid])
  }

  const saveChart = async (submit = false) => {
    setSaving(true)
    try {
      const data = {
        callId: call?.call_id, bookingId: call?.id,
        patientName: call?.patient_name, patientDob: call?.patient_dob,
        chiefComplaint, medicalHistoryChanges, allergiesDetail,
        bloodPressure: bp, heartRate: hr ? parseInt(hr) : null,
        oxygenSat: o2 ? parseInt(o2) : null, temperature: temp || null,
        painScale: painScale ? parseInt(painScale) : null,
        vitalsSets: [{ bp, hr, o2, temp, painScale, time: vitalTime }],
        ivInsertionSite: ivSite, ivCatheterSize: catheterSize,
        ivAttempts: ivAttempts ? parseInt(ivAttempts) : null,
        ivTimeInitiated: ivTimeInitiated || null,
        ivFluidsUsed: ivFluids,
        prnIvMedications: ivMeds, prnBagAddons: bagAddons, prnImInjections: imInjections,
        vitalsPost: { bp: postBp, hr: postHr, o2: postO2, time: postTime },
        complications, complicationsDetail,
        ivCatheterStatus: catheterStatus,
        ivTimeDiscontinued: ivTimeDiscontinued || null,
        techNotes, status: submit ? 'submitted' : 'open'
      }

      let res
      if (chartId) {
        res = await fetch(`${API_URL}/charts/${chartId}`, {
          method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        })
      } else {
        res = await fetch(`${API_URL}/charts`, {
          method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        })
      }

      const responseData = await res.json()
      console.log('Chart save response:', JSON.stringify(responseData))
      if (responseData.success) {
        if (!chartId && responseData.chart?.id) setChartId(responseData.chart.id)
        if (submit) { Alert.alert('✅ Chart Submitted', 'Chart has been saved.'); onClose() }
      } else {
        Alert.alert('Error', responseData.message || 'Could not save chart')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a1a' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[cStyles.header, { backgroundColor: secondaryColor }]}>
          <TouchableOpacity onPress={() => { saveChart(false); onClose() }}>
            <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Save & Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Chart</Text>
          <TouchableOpacity onPress={() => saveChart(false)}>
            <Text style={{ color: primaryColor, fontSize: 14 }}>{saving ? '...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{call?.patient_name}</Text>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>NURSING ASSESSMENT</Text>
            <Text style={cStyles.fieldLabel}>Chief Complaint *</Text>
            <TextInput style={[cStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Chief complaint..." placeholderTextColor="#666" value={chiefComplaint} onChangeText={setChiefComplaint} multiline />
            <Text style={cStyles.fieldLabel}>Changes to Medical History, Allergies or Medications?</Text>
            <TextInput style={cStyles.input} placeholder="Any changes..." placeholderTextColor="#666" value={medicalHistoryChanges} onChangeText={setMedicalHistoryChanges} />
            <Text style={cStyles.fieldLabel}>Allergies & Reactions</Text>
            <TextInput style={cStyles.input} placeholder="Allergies..." placeholderTextColor="#666" value={allergiesDetail} onChangeText={setAllergiesDetail} />
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>INITIAL VITALS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>BP (mmHg)</Text><TextInput style={cStyles.input} placeholder="120/80" placeholderTextColor="#666" value={bp} onChangeText={setBp} /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Pulse (BPM)</Text><TextInput style={cStyles.input} placeholder="72" placeholderTextColor="#666" value={hr} onChangeText={setHr} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>O2 Sat (%)</Text><TextInput style={cStyles.input} placeholder="98" placeholderTextColor="#666" value={o2} onChangeText={setO2} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Temp (°C)</Text><TextInput style={cStyles.input} placeholder="36.8" placeholderTextColor="#666" value={temp} onChangeText={setTemp} keyboardType="decimal-pad" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Pain Scale (1-10)</Text><TextInput style={cStyles.input} placeholder="0" placeholderTextColor="#666" value={painScale} onChangeText={setPainScale} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Time</Text><TextInput style={cStyles.input} placeholder="2:30 PM" placeholderTextColor="#666" value={vitalTime} onChangeText={setVitalTime} /></View>
            </View>
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>IV INSERTION</Text>
            <SelectRow label="IV Site" options={IV_SITES} value={ivSite} onSelect={setIvSite} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            <SelectRow label="Catheter Size" options={CATHETER_SIZES} value={catheterSize} onSelect={setCatheterSize} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            <SelectRow label="Attempts" options={['1', '2', '3']} value={ivAttempts} onSelect={setIvAttempts} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            <Text style={cStyles.fieldLabel}>Time IV Initiated</Text>
            <TextInput style={cStyles.input} placeholder="2:35 PM" placeholderTextColor="#666" value={ivTimeInitiated} onChangeText={setIvTimeInitiated} />
            <Text style={cStyles.fieldLabel}>Fluids Used</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {IV_FLUIDS.map(fluid => (
                <TouchableOpacity key={fluid} style={[cStyles.optionBtn, ivFluids.includes(fluid) && { backgroundColor: primaryColor, borderColor: primaryColor }]} onPress={() => toggleFluid(fluid)}>
                  <Text style={[cStyles.optionText, ivFluids.includes(fluid) && { color: secondaryColor }]}>{fluid}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>PRN IV MEDICATIONS</Text>
            {IV_MEDICATIONS.map(item => <MedRow key={item.key} item={item} medSet={ivMeds} setMedSet={setIvMeds} primaryColor={primaryColor} secondaryColor={secondaryColor} />)}
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>PRN BAG ADD-ONS</Text>
            {BAG_ADDONS.map(item => <MedRow key={item.key} item={item} medSet={bagAddons} setMedSet={setBagAddons} showDose primaryColor={primaryColor} secondaryColor={secondaryColor} />)}
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>IM INJECTIONS</Text>
            {IM_INJECTIONS.map(item => <MedRow key={item.key} item={item} medSet={imInjections} setMedSet={setImInjections} showDose primaryColor={primaryColor} secondaryColor={secondaryColor} />)}
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>POST INFUSION VITALS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>BP (mmHg)</Text><TextInput style={cStyles.input} placeholder="120/80" placeholderTextColor="#666" value={postBp} onChangeText={setPostBp} /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Pulse (BPM)</Text><TextInput style={cStyles.input} placeholder="72" placeholderTextColor="#666" value={postHr} onChangeText={setPostHr} keyboardType="numeric" /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>O2 Sat (%)</Text><TextInput style={cStyles.input} placeholder="98" placeholderTextColor="#666" value={postO2} onChangeText={setPostO2} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Time</Text><TextInput style={cStyles.input} placeholder="3:30 PM" placeholderTextColor="#666" value={postTime} onChangeText={setPostTime} /></View>
            </View>
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>POST INFUSION ASSESSMENT</Text>
            <SelectRow label="Complications?" options={['No', 'Yes']} value={complications} onSelect={setComplications} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            {complications === 'Yes' && (
              <>
                <Text style={cStyles.fieldLabel}>Please explain</Text>
                <TextInput style={[cStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Describe..." placeholderTextColor="#666" value={complicationsDetail} onChangeText={setComplicationsDetail} multiline />
              </>
            )}
            <SelectRow label="Catheter Status on Removal" options={['Normal and Intact', 'Broken, Severed']} value={catheterStatus} onSelect={setCatheterStatus} primaryColor={primaryColor} secondaryColor={secondaryColor} />
            <Text style={cStyles.fieldLabel}>Time IV Discontinued</Text>
            <TextInput style={cStyles.input} placeholder="3:30 PM" placeholderTextColor="#666" value={ivTimeDiscontinued} onChangeText={setIvTimeDiscontinued} />
            <Text style={cStyles.fieldLabel}>Tech Notes</Text>
            <TextInput style={[cStyles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Any additional notes..." placeholderTextColor="#666" value={techNotes} onChangeText={setTechNotes} multiline />
          </View>
<TouchableOpacity
            style={{ borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: primaryColor }}
            onPress={async () => {
              if (!chartId) {
                Alert.alert('Save First', 'Please save the chart before requesting a GFE')
                return
              }
              try {
                const res = await fetch(`${API_URL}/gfe/request`, {
                  method: 'POST',
                  headers: { ...headers, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ callId: call?.call_id, chartId })
                })
                const data = await res.json()
                if (data.success) {
                  Alert.alert('✅ GFE Requested', 'The NP has been notified')
                } else {
                  Alert.alert('Error', data.message || 'Could not request GFE')
                }
              } catch (err) {
                Alert.alert('Error', 'Network error')
              }
            }}
          >
            <Text style={{ color: primaryColor, fontSize: 15, fontWeight: '700' }}>🩺 Request GFE from NP</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[{ borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16, backgroundColor: primaryColor }, saving && { opacity: 0.6 }]}
            onPress={() => Alert.alert('Submit Chart', 'Submit this chart?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Submit', onPress: () => saveChart(true) }
            ])}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ fontSize: 16, fontWeight: '700', color: secondaryColor }}>Submit Chart</Text>}
          </TouchableOpacity>
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default function TechHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'

  const [activeTab, setActiveTab] = useState('call')
  const [call, setCall] = useState(null)
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [onSceneSeconds, setOnSceneSeconds] = useState(0)
  const [upcoming, setUpcoming] = useState([])
  const [mySchedule, setMySchedule] = useState([])
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null)
  const [showChart, setShowChart] = useState(false)
  const [showNpOrders, setShowNpOrders] = useState(false)
  const [npOrders, setNpOrders] = useState(null)
  const [techProfile, setTechProfile] = useState(null)
const [uploadingPhoto, setUploadingPhoto] = useState(false)
const [techChangePasswordModal, setTechChangePasswordModal] = useState(false)
const [techCurrentPassword, setTechCurrentPassword] = useState('')
const [techNewPassword, setTechNewPassword] = useState('')
const [techConfirmPassword, setTechConfirmPassword] = useState('')
const [techChangingPassword, setTechChangingPassword] = useState(false)
  const timerRef = useRef(null)

  const headers = { Authorization: `Bearer ${token}` }

const startLocationTracking = useCallback(async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') return

    const interval = setInterval(async () => {
      if (call?.tech_status !== 'en_route') {
        clearInterval(interval)
        return
      }
      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        await fetch(`${API_URL}/tech/location`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: location.coords.latitude,
            lng: location.coords.longitude
          })
        })
      } catch (err) {
        console.error('Location update error:', err)
      }
    }, 30000) // every 30 seconds

    return () => clearInterval(interval)
  } catch (err) {
    console.error('Location permission error:', err)
  }
}, [call?.tech_status, token])

useEffect(() => {
  if (call?.tech_status === 'en_route') {
    const cleanup = startLocationTracking()
    return () => { if (cleanup) cleanup.then(fn => fn && fn()) }
  }
}, [call?.tech_status])

const fetchTechProfile = useCallback(async () => {
  try {
    const res = await fetch(`${API_URL}/auth/me`, { headers })
    const data = await res.json()
    if (data.success) setTechProfile(data.user)
  } catch (err) {
    console.error('Fetch tech profile error:', err)
  }
}, [token])

useEffect(() => {
  fetchTechProfile()
}, [fetchTechProfile])

const pickAndUploadPhoto = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.2,
      base64: true,
      exif: false
    })
    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true)
      const base64 = result.assets[0].base64
      console.log('Base64 size (chars):', base64?.length, 'bytes approx:', Math.round(base64?.length * 0.75 / 1024), 'KB')
      const res = await fetch(`${API_URL}/auth/upload-photo`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: `data:image/jpeg;base64,${base64}` })
      })
      const text = await res.text()
      console.log('Upload response:', text.substring(0, 200))
      const data = JSON.parse(text)
      if (data.success) {
        fetchTechProfile()
        Alert.alert('✅ Photo Updated', 'Your profile photo has been saved.')
      } else {
        Alert.alert('Error', data.message || 'Could not upload photo')
      }
    }
  } catch (err) {
    console.error('Photo picker error:', err)
    Alert.alert('Error', err.message || 'Could not open photo library')
  } finally {
    setUploadingPhoto(false)
  }
}

const techChangePassword = async () => {
  if (!techCurrentPassword || !techNewPassword || !techConfirmPassword) {
    Alert.alert('Required', 'Please fill in all fields')
    return
  }
  if (techNewPassword !== techConfirmPassword) {
    Alert.alert('Error', 'New passwords do not match')
    return
  }
  if (techNewPassword.length < 8) {
    Alert.alert('Error', 'New password must be at least 8 characters')
    return
  }
  setTechChangingPassword(true)
  try {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: techCurrentPassword, newPassword: techNewPassword })
    })
    const data = await res.json()
    if (data.success) {
      Alert.alert('✅ Password Changed', 'Your password has been updated.')
      setTechChangePasswordModal(false)
      setTechCurrentPassword(''); setTechNewPassword(''); setTechConfirmPassword('')
    } else {
      Alert.alert('Error', data.message || 'Could not change password')
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setTechChangingPassword(false)
  }
}

  const fetchCall = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tech/my-call`, { headers })
      const data = await res.json()
      if (data.success) {
        setCall(data.call)
        if (data.call?.user_id) {
          fetch(`${API_URL}/gfe/patient-orders/${data.call.user_id}`, { headers })
            .then(r => r.json())
            .then(ordersData => {
              if (ordersData.hasActiveGFE) setNpOrders(ordersData.orders)
              else setNpOrders(null)
            })
            .catch(() => setNpOrders(null))
        }
        setPatients(data.patients || [])
        setUpcoming(data.upcoming || [])
        setMySchedule(data.mySchedule || [])
        if (data.call?.tech_status === 'on_scene' && data.call?.tech_onscene_at) {
          const secondsOnScene = Math.floor((Date.now() - new Date(data.call.tech_onscene_at).getTime()) / 1000)
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

  useEffect(() => {
    if (call?.tech_status === 'on_scene') {
      timerRef.current = setInterval(() => {
        setOnSceneSeconds(prev => {
          const next = prev + 1
          if (next === 3300 || next === 3600) Vibration.vibrate([500, 500, 500])
          return next
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setOnSceneSeconds(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [call?.status])

  const onRefresh = () => { setRefreshing(true); fetchCall() }

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
      if (data.success) fetchCall()
      else Alert.alert('Error', data.message || 'Could not update status')
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
    Alert.alert('🚨 Emergency', 'This will immediately alert your dispatcher. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'SEND EMERGENCY ALERT', style: 'destructive',
        onPress: () => {
          Vibration.vibrate([200, 100, 200, 100, 200])
          Alert.alert('Emergency Sent', 'Your dispatcher has been notified. Stay safe.')
        }
      }
    ])
  }

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const timerWarning = onSceneSeconds >= 3300
  const timerDanger = onSceneSeconds >= 3600

  const markedDates = mySchedule.reduce((acc, booking) => {
    const date = new Date(booking.requested_time).toISOString().split('T')[0]
    acc[date] = { marked: true, dotColor: primaryColor }
    return acc
  }, {})
  if (selectedScheduleDate) {
    markedDates[selectedScheduleDate] = { ...markedDates[selectedScheduleDate], selected: true, selectedColor: primaryColor }
  }

  const selectedDayBookings = selectedScheduleDate
    ? mySchedule.filter(b => new Date(b.requested_time).toISOString().split('T')[0] === selectedScheduleDate)
    : []

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={primaryColor} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      <ChartModal visible={showChart} onClose={() => setShowChart(false)} call={call} token={token} company={company} />

      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
            <Text style={styles.headerTitle}>My Call</Text>
            <Text style={styles.headerSub}>{user?.firstName} · {user?.role?.toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'call' ? primaryColor : 'transparent' }} onPress={() => setActiveTab('call')}>
          <Text style={{ color: activeTab === 'call' ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>📞 My Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'schedule' ? primaryColor : 'transparent' }} onPress={() => setActiveTab('schedule')}>
          <Text style={{ color: activeTab === 'schedule' ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>📅 Schedule{mySchedule.length > 0 ? ` (${mySchedule.length})` : ''}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === 'profile' ? primaryColor : 'transparent' }} onPress={() => setActiveTab('profile')}>
          <Text style={{ color: activeTab === 'profile' ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>👤 Profile</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'call' && (
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {call?.tech_status === 'on_scene' && (
            <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergency}>
              <Text style={styles.emergencyText}>🚨 EMERGENCY</Text>
            </TouchableOpacity>
          )}

          {!call ? (
            <View style={styles.noCall}>
              <Text style={styles.noCallIcon}>📵</Text>
              <Text style={styles.noCallText}>No active call</Text>
              <Text style={styles.noCallSub}>You'll be notified when a call is assigned</Text>
            </View>
          ) : (
            <>
              <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[call.tech_status || call.status] + '33', borderColor: STATUS_COLORS[call.tech_status || call.status] }]}>
                <Text style={[styles.statusBannerText, { color: STATUS_COLORS[call.tech_status || call.status] }]}>
                  {STATUS_LABELS[call.tech_status || call.status] || call.tech_status || call.status}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Call Details</Text>
                <Text style={styles.service}>{call.service}</Text>
                <Text style={styles.label}>📍 Address</Text>
                <Text style={styles.value}>{call.address}</Text>
                {call.address_note && <Text style={styles.valueNote}>{call.address_note}</Text>}
                {call.notes && (<><Text style={styles.label}>📝 Notes</Text><Text style={styles.value}>{call.notes}</Text></>)}
                <Text style={styles.label}>🕐 Dispatched</Text>
                <Text style={styles.value}>{new Date(call.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                {call.requested_time && (
                  <>
                    <Text style={styles.label}>📅 Confirmed For</Text>
                    <Text style={[styles.value, { color: primaryColor, fontWeight: '600' }]}>
                      {new Date(call.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Primary Patient {call.patient_count > 1 ? `(+${call.patient_count - 1} more)` : ''}</Text>
                <Text style={styles.service}>{call.patient_name}</Text>
                {!call.has_valid_intake && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginTop: 4 }}>⚠️ No intake on file</Text>}
                {call.patient_phone && <Text style={styles.value}>📞 {call.patient_phone}</Text>}
                {call.patient_dob && <Text style={styles.value}>🎂 {new Date(call.patient_dob).toLocaleDateString()}</Text>}
              </View>

              {patients.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Additional Patients</Text>
                  {patients.map(p => (
                    <View key={p.id} style={styles.patientRow}>
                      <Text style={styles.patientName}>{p.patient_name}</Text>
                      <Text style={styles.patientDetail}>{p.patient_phone || 'No phone'} · Chart: {p.chart_completed ? '✅' : '⏳'}</Text>
                    </View>
                  ))}
                </View>
              )}

{npOrders && (
                <TouchableOpacity
                  style={[styles.card, { borderWidth: 1, borderColor: npOrders.notACandidate ? '#e53e3e' : '#4CAF50' }]}
                  onPress={() => setShowNpOrders(true)}
                >
                  <Text style={[styles.cardTitle, { color: npOrders.notACandidate ? '#e53e3e' : '#4CAF50' }]}>
                    {npOrders.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ NP ORDERS ON FILE'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Signed by {npOrders.npName} · Tap to view orders
                  </Text>
                </TouchableOpacity>
              )}

              {/* NP Orders Modal */}
              <Modal visible={showNpOrders} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: '#0D1B4B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '80%' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 }}>NP Orders</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                      Signed by {npOrders?.npName} · Valid until {npOrders ? new Date(npOrders.validUntil).toLocaleDateString() : ''}
                    </Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {npOrders?.notACandidate ? (
                        <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                          <Text style={{ color: '#e53e3e', fontWeight: '700', fontSize: 15, marginBottom: 8 }}>🚫 Not a Candidate</Text>
                          <Text style={{ color: '#fff', fontSize: 14 }}>{npOrders.notACandidateReason}</Text>
                        </View>
                      ) : (
                        <>
                          {npOrders?.approvedServices && npOrders.approvedServices.length > 0 && (
                            <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                              <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>✅ APPROVED SERVICES</Text>
                              {npOrders.approvedServices.map((s, i) => (
                                <Text key={i} style={{ color: '#fff', fontSize: 14, marginBottom: 4 }}>• {s}</Text>
                              ))}
                            </View>
                          )}
                          {npOrders?.restrictions && (
                            <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                              <Text style={{ color: '#e53e3e', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>❌ RESTRICTIONS</Text>
                              <Text style={{ color: '#fff', fontSize: 14 }}>{npOrders.restrictions}</Text>
                            </View>
                          )}
                          {npOrders?.npOrders && (
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                              <Text style={{ color: primaryColor, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>📝 NP ORDERS & NOTES</Text>
                              <Text style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{npOrders.npOrders}</Text>
                            </View>
                          )}
                        </>
                      )}
                    </ScrollView>
                    <TouchableOpacity
                      style={{ marginTop: 16, alignItems: 'center', padding: 12 }}
                      onPress={() => setShowNpOrders(false)}
                    >
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {call.tech_status === 'on_scene' && (
                <TouchableOpacity style={[styles.chartButton, { backgroundColor: primaryColor }]} onPress={() => setShowChart(true)}>
                  <Text style={[styles.chartButtonText, { color: secondaryColor }]}>📋 Start Chart — {call.patient_name}</Text>
                </TouchableOpacity>
              )}

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

              {call.status !== 'completed' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Update Status</Text>
                  {(call.tech_status === 'assigned' || call.tech_status === null) && (
                    <TouchableOpacity style={[styles.statusButton, { backgroundColor: '#2196F3' }]} onPress={() => handleStatusChange('en_route')} disabled={updatingStatus}>
                      {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.statusButtonText}>🚗 I'm En Route</Text>}
                    </TouchableOpacity>
                  )}
                  {call.tech_status === 'en_route' && (
                    <TouchableOpacity style={[styles.statusButton, { backgroundColor: '#4CAF50' }]} onPress={() => handleStatusChange('on_scene')} disabled={updatingStatus}>
                      {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={styles.statusButtonText}>📍 I'm On Scene</Text>}
                    </TouchableOpacity>
                  )}
                  {call.tech_status === 'on_scene' && (
                    <TouchableOpacity style={[styles.statusButton, { backgroundColor: primaryColor }]} onPress={() => handleStatusChange('clear')} disabled={updatingStatus}>
                      {updatingStatus ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.statusButtonText, { color: secondaryColor }]}>✅ Call Complete — Go Clear</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {upcoming.length > 0 && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Up Next — {upcoming.length} more call{upcoming.length > 1 ? 's' : ''}</Text>
                  {upcoming.map((u, index) => (
                    <View key={u.id} style={[styles.patientRow, index > 0 && { marginTop: 8 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{u.service}</Text>
                        <Text style={styles.patientDetail}>📍 {u.address}</Text>
                        <Text style={styles.patientDetail}>👤 {u.patient_name}</Text>
                        {u.requested_time && <Text style={styles.patientDetail}>🕐 {new Date(u.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              )}

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
      )}

      {activeTab === 'profile' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          {/* Change Password Modal */}
          <Modal visible={techChangePasswordModal} animationType="slide" presentationStyle="fullScreen">
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                <TouchableOpacity onPress={() => { setTechChangePasswordModal(false); setTechCurrentPassword(''); setTechNewPassword(''); setTechConfirmPassword('') }}>
                  <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Change Password</Text>
                <View style={{ width: 60 }} />
              </View>
              <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>Enter your current password before setting a new one.</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Current Password</Text>
                <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 20 }} placeholder="Current password" placeholderTextColor="#444" value={techCurrentPassword} onChangeText={setTechCurrentPassword} secureTextEntry />
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>New Password</Text>
                <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 20 }} placeholder="At least 8 characters" placeholderTextColor="#444" value={techNewPassword} onChangeText={setTechNewPassword} secureTextEntry />
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Confirm New Password</Text>
                <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 20 }} placeholder="Re-enter new password" placeholderTextColor="#444" value={techConfirmPassword} onChangeText={setTechConfirmPassword} secureTextEntry />
                {techConfirmPassword.length > 0 && techNewPassword !== techConfirmPassword && <Text style={{ color: '#f09090', fontSize: 13, marginBottom: 12 }}>⚠️ Passwords do not match</Text>}
                {techConfirmPassword.length > 0 && techNewPassword === techConfirmPassword && <Text style={{ color: '#4CAF50', fontSize: 13, marginBottom: 12 }}>✅ Passwords match</Text>}
                <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8, backgroundColor: primaryColor }, techChangingPassword && { opacity: 0.6 }]} onPress={techChangePassword} disabled={techChangingPassword}>
                  {techChangingPassword ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Update Password</Text>}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>

          {/* Photo */}
          <TouchableOpacity onPress={pickAndUploadPhoto} disabled={uploadingPhoto} style={{ marginBottom: 16 }}>
            {techProfile?.profilePhoto ? (
              <Image source={{ uri: techProfile.profilePhoto }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: primaryColor }} />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: primaryColor, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                {uploadingPhoto ? <ActivityIndicator color={primaryColor} /> : <Text style={{ color: primaryColor, fontSize: 36, fontWeight: '600' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>}
              </View>
            )}
            <Text style={{ color: primaryColor, fontSize: 12, textAlign: 'center', marginTop: 8 }}>
              {uploadingPhoto ? 'Uploading...' : 'Tap to change photo'}
            </Text>
          </TouchableOpacity>

          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{user?.firstName} {user?.lastName}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 8 }}>{user?.email}</Text>
          <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600', marginBottom: 32 }}>{company?.name} · TECH</Text>

          <TouchableOpacity
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
            onPress={() => setTechChangePasswordModal(true)}
          >
            <Text style={{ color: '#fff', fontSize: 15 }}>Change Password</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ width: '100%', marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', backgroundColor: 'rgba(220,80,80,0.08)' }}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
          >
            <Text style={{ color: '#f09090', fontSize: 15, fontWeight: '500' }}>Log out</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {activeTab === 'schedule' && (
        <ScrollView style={{ flex: 1 }}>
          <Calendar
            onDayPress={(day) => setSelectedScheduleDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: 'transparent', calendarBackground: 'transparent',
              textSectionTitleColor: 'rgba(255,255,255,0.5)',
              selectedDayBackgroundColor: primaryColor, selectedDayTextColor: secondaryColor,
              todayTextColor: primaryColor, dayTextColor: '#fff',
              textDisabledColor: 'rgba(255,255,255,0.2)', monthTextColor: '#fff',
              arrowColor: primaryColor, dotColor: primaryColor,
            }}
            style={{ marginBottom: 8 }}
          />
          {selectedScheduleDate && (
            <View style={[styles.card, { marginHorizontal: 16 }]}>
              <Text style={styles.cardTitle}>
                {new Date(selectedScheduleDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              {selectedDayBookings.length === 0 ? (
                <Text style={styles.patientDetail}>No appointments on this day</Text>
              ) : (
                selectedDayBookings.map(b => (
                  <View key={b.id} style={[styles.patientRow, { marginBottom: 8 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.patientName}>{b.service}</Text>
                      <Text style={styles.patientDetail}>👤 {b.patient_name}</Text>
                      <Text style={styles.patientDetail}>📍 {b.address}</Text>
                      <Text style={[styles.patientDetail, { color: primaryColor, fontWeight: '600' }]}>
                        🕐 {new Date(b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                      </Text>
                      {b.patient_count > 1 && <Text style={styles.patientDetail}>👥 {b.patient_count} patients</Text>}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
          {mySchedule.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No upcoming assignments</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  content: { paddingBottom: 48 },
  centered: { flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  companyName: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  emergencyButton: { marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: '#f09090', borderRadius: 12, padding: 16, alignItems: 'center' },
  emergencyText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  noCall: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  noCallIcon: { fontSize: 64, marginBottom: 16 },
  noCallText: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  noCallSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  statusBanner: { marginHorizontal: 16, marginTop: 16, marginBottom: 16, borderWidth: 2, borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)' },
  statusBannerText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  card: { marginHorizontal: 16, marginBottom: 16, marginTop: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 },
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
  chartButton: { borderRadius: 12, padding: 16, alignItems: 'center', marginHorizontal: 16, marginBottom: 10 },
  chartButtonText: { fontSize: 15, fontWeight: '700' },
})