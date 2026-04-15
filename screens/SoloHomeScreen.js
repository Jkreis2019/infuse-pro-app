import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
  Modal, KeyboardAvoidingView, Platform, Vibration, Image
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'

const API_URL = 'https://api.infusepro.app'

const STATUS_COLORS = {
  confirmed: '#C9A84C', assigned: '#C9A84C', en_route: '#2196F3',
  on_scene: '#4CAF50', cleared: '#aaa', completed: '#aaa', cancelled: '#f09090'
}

const STATUS_LABELS = {
  confirmed: 'Confirmed', assigned: 'Confirmed', en_route: 'En Route',
  on_scene: 'On Scene', cleared: 'Cleared', completed: 'Completed'
}

const DISPOSITIONS = [
  'Too long of a wait', 'Patient went to the ER', 'No techs available',
  'Price too high', 'Not in our service area',
  'Unable to service due to medical condition', 'Other'
]

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

const MedRow = ({ item, medSet, setMedSet, showDose, primaryColor, secondaryColor, locked }) => {
  const checked = !!medSet[item.key]
  const toggle = () => { if (locked) return; setMedSet(prev => ({ ...prev, [item.key]: prev[item.key] ? null : { time: '', dose: '' } })) }
  const setTime = (t) => setMedSet(prev => ({ ...prev, [item.key]: { ...prev[item.key], time: t } }))
  const setDose = (d) => setMedSet(prev => ({ ...prev, [item.key]: { ...prev[item.key], dose: d } }))
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <TouchableOpacity style={[cStyles.checkbox, checked && { backgroundColor: primaryColor, borderColor: primaryColor }]} onPress={toggle}>
        {checked && <Text style={{ color: secondaryColor, fontSize: 12 }}>✓</Text>}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ color: locked ? 'rgba(255,255,255,0.4)' : '#fff', fontSize: 13 }}>{item.label}</Text>
        {checked && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <TextInput style={[cStyles.input, { flex: 1 }]} placeholder="Time" placeholderTextColor="#666" value={medSet[item.key]?.time || ''} onChangeText={setTime} editable={!locked} />
            {showDose && <TextInput style={[cStyles.input, { flex: 1 }]} placeholder="Dose/Location" placeholderTextColor="#666" value={medSet[item.key]?.dose || ''} onChangeText={setDose} editable={!locked} />}
          </View>
        )}
      </View>
    </View>
  )
}

const SelectRow = ({ label, options, value, onSelect, primaryColor, secondaryColor, locked }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={cStyles.fieldLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity key={opt} style={[cStyles.optionBtn, value === opt && { backgroundColor: primaryColor, borderColor: primaryColor }]} onPress={() => { if (!locked) onSelect(opt) }}>
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

function ChartModal({ visible, onClose, call, token, company, patientName, patientDob }) {
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [saving, setSaving] = useState(false)
  const [chartId, setChartId] = useState(null)
  const [savedStatus, setSavedStatus] = useState('')
  const [amendmentText, setAmendmentText] = useState('')
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
  const [ivSitePhoto, setIvSitePhoto] = useState(null)
  const [uploadingIvPhoto, setUploadingIvPhoto] = useState(false)
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

  const [companyServices, setCompanyServices] = useState([])
  const [selectedServices, setSelectedServices] = useState([])
  const [showServicePicker, setShowServicePicker] = useState(false)
  const isLocked = savedStatus === 'submitted' || savedStatus === 'amended'

  useEffect(() => {
  console.log('visible:', visible, 'call_id:', call?.call_id, 'patientName:', patientName)
  if (visible && call?.call_id) {
      fetch(`${API_URL}/charts/call/${call.call_id}?patientName=${encodeURIComponent(patientName)}`, { headers })
  .then(r => r.json())
  .then(data => {
    console.log('Chart fetch response:', JSON.stringify(data))
    if (data.chart) {
            const c = data.chart
            setChartId(c.id)
console.log('Set chartId to:', c.id)

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
            setIvSitePhoto(c.iv_site_photo || null)
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
setSavedStatus(c.status || '')
console.log('Chart status from DB:', c.status)
          } else {
            // No chart yet — reset all fields for new chart
            setChartId(null)
            setSavedStatus('')
            setChiefComplaint(''); setMedicalHistoryChanges(''); setAllergiesDetail('')
            setBp(''); setHr(''); setO2(''); setTemp(''); setPainScale(''); setVitalTime('')
            setIvSite(''); setCatheterSize(''); setIvAttempts('1'); setIvTimeInitiated('')
            setIvFluids([]); setIvMeds({}); setBagAddons({}); setImInjections({})
            setPostBp(''); setPostHr(''); setPostO2(''); setPostTime('')
            setComplications('No'); setComplicationsDetail(''); setCatheterStatus('Normal and Intact')
            setIvTimeDiscontinued(''); setTechNotes('')
          }
        })
        .catch(err => console.error('Load chart error:', err))
    }
    fetch(`${API_URL}/tech/services`, { headers })
      .then(r => r.json())
      .then(d => setCompanyServices(d.services || []))
      .catch(() => {})
  }, [visible, call?.call_id])

  const toggleFluid = (fluid) => {
    if (isLocked) return
    setIvFluids(prev => prev.includes(fluid) ? prev.filter(f => f !== fluid) : [...prev, fluid])
  }

  const submitAmendment = async () => {
    if (!amendmentText.trim()) { Alert.alert('Required', 'Please enter amendment notes'); return }
    try {
      const res = await fetch(`${API_URL}/charts/${chartId}/amend`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amendmentNotes: amendmentText })
      })
      const data = await res.json()
      if (data.success) {
        Alert.alert('✅ Amendment Saved', 'Your amendment has been recorded.')
        setAmendmentText('')
        setSavedStatus('amended')
      } else {
        Alert.alert('Error', data.error || 'Could not save amendment')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    }
  }

  const takeIvSitePhoto = async () => {
    try {
      if (!chartId) {
        Alert.alert('Save Chart First', 'Please tap Save Draft before adding a photo', [{ text: 'OK' }])
        return
      }
      const permission = await ImagePicker.requestCameraPermissionsAsync()
      if (!permission.granted) {
        const libPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!libPermission.granted) { Alert.alert('Permission needed', 'Please allow camera or photo library access'); return }
      }
      Alert.alert('IV Site Photo', 'Choose source', [
        {
          text: '📷 Camera', onPress: async () => {
            const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true })
            if (!result.canceled && result.assets[0].base64) {
              await uploadIvPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`, chartId)
            }
          }
        },
        {
          text: '🖼 Library', onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true })
            if (!result.canceled && result.assets[0].base64) {
              await uploadIvPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`, chartId)
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ])
    } catch (err) {
      Alert.alert('Error', 'Could not open camera')
    }
  }

  const uploadIvPhoto = async (base64Photo, overrideChartId) => {
    const idToUse = overrideChartId || chartId
    if (!idToUse) { Alert.alert('Save First', 'Please save the chart before adding a photo'); return }
    setUploadingIvPhoto(true)
    try {
      const res = await fetch(`${API_URL}/charts/${idToUse}/photo`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: base64Photo })
      })
      const data = await res.json()
      if (data.success) {
        setIvSitePhoto(data.photoUrl)
        Alert.alert('✅ Photo Saved', 'IV site photo has been added to the chart')
      } else {
        Alert.alert('Error', data.error || 'Could not upload photo')
      }
    } catch (err) {
      Alert.alert('Error', 'Could not upload photo')
    } finally {
      setUploadingIvPhoto(false)
    }
  }

  const saveChart = async (submit = false) => {
    if (isLocked) return
    setSaving(true)
    try {
      const data = {
        callId: call?.call_id, bookingId: call?.id,
        patientName: patientName || call?.patient_name, patientDob: patientDob || call?.patient_dob,
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
        res = await fetch(`${API_URL}/charts/${chartId}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      } else {
        res = await fetch(`${API_URL}/charts`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      }
      const responseData = await res.json()
console.log('Save chart response:', JSON.stringify(responseData))
console.log('Status sent:', submit ? 'submitted' : 'open')
      if (responseData.success) {
        const savedChartId = chartId || responseData.chart?.id
        if (!chartId && responseData.chart?.id) setChartId(responseData.chart.id)
        if (savedChartId) {
          await fetch(`${API_URL}/charts/${savedChartId}/services`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ services: selectedServices })
          }).catch(() => {})
        }
        if (submit) { setSavedStatus('submitted'); Alert.alert('✅ Chart Submitted', 'Chart has been saved.'); onClose() }
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
          <TouchableOpacity onPress={() => { if (!isLocked) saveChart(false); onClose() }}>
            <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>{isLocked ? '← Back' : '← Save & Back'}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Chart</Text>
            {isLocked && <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700' }}>🔒 SUBMITTED</Text>}
          </View>
          {!isLocked ? (
            <TouchableOpacity onPress={() => saveChart(false)}>
              <Text style={{ color: primaryColor, fontSize: 14 }}>{saving ? '...' : 'Save'}</Text>
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{call?.patient_name}</Text>

          {/* Locked banner */}
          {isLocked && (
            <View style={{ backgroundColor: 'rgba(255,152,0,0.1)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: '#FF9800', fontSize: 13, fontWeight: '700' }}>🔒 This chart has been submitted and is locked.</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Use the amendment section below to add notes.</Text>
            </View>
          )}

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>NURSING ASSESSMENT</Text>
            <Text style={cStyles.fieldLabel}>Chief Complaint *</Text>
            <TextInput style={[cStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Chief complaint..." placeholderTextColor="#666" value={chiefComplaint} onChangeText={setChiefComplaint} multiline editable={!isLocked} />
            <Text style={cStyles.fieldLabel}>Changes to Medical History, Allergies or Medications?</Text>
            <TextInput style={cStyles.input} placeholder="Any changes..." placeholderTextColor="#666" value={medicalHistoryChanges} onChangeText={setMedicalHistoryChanges} editable={!isLocked} />
            <Text style={cStyles.fieldLabel}>Allergies & Reactions</Text>
            <TextInput style={cStyles.input} placeholder="Allergies..." placeholderTextColor="#666" value={allergiesDetail} onChangeText={setAllergiesDetail} editable={!isLocked} />
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>INITIAL VITALS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>BP (mmHg)</Text><TextInput style={cStyles.input} placeholder="120/80" placeholderTextColor="#666" value={bp} onChangeText={setBp} editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Pulse (BPM)</Text><TextInput style={cStyles.input} placeholder="72" placeholderTextColor="#666" value={hr} onChangeText={setHr} keyboardType="numeric" editable={!isLocked} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>O2 Sat (%)</Text><TextInput style={cStyles.input} placeholder="98" placeholderTextColor="#666" value={o2} onChangeText={setO2} keyboardType="numeric" editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Temp (°C)</Text><TextInput style={cStyles.input} placeholder="36.8" placeholderTextColor="#666" value={temp} onChangeText={setTemp} keyboardType="decimal-pad" editable={!isLocked} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Pain Scale (1-10)</Text><TextInput style={cStyles.input} placeholder="0" placeholderTextColor="#666" value={painScale} onChangeText={setPainScale} keyboardType="numeric" editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Time</Text><TextInput style={cStyles.input} placeholder="2:30 PM" placeholderTextColor="#666" value={vitalTime} onChangeText={setVitalTime} editable={!isLocked} /></View>
            </View>
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>IV INSERTION</Text>
            <SelectRow label="IV Site" options={IV_SITES} value={ivSite} onSelect={setIvSite} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            <SelectRow label="Catheter Size" options={CATHETER_SIZES} value={catheterSize} onSelect={setCatheterSize} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            {/* IV Site Photo */}
            <View style={{ marginVertical: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>IV SITE PHOTO</Text>
              {ivSitePhoto ? (
                <View>
                  <Image source={{ uri: ivSitePhoto }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />
                  {!isLocked && (
                    <TouchableOpacity
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center' }}
                      onPress={takeIvSitePhoto}
                    >
                      <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>📷 Retake Photo</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                !isLocked && (
                  <TouchableOpacity
                    style={{ borderWidth: 2, borderColor: primaryColor, borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center' }}
                    onPress={takeIvSitePhoto}
                    disabled={uploadingIvPhoto}
                  >
                    {uploadingIvPhoto ? (
                      <ActivityIndicator color={primaryColor} />
                    ) : (
                      <>
                        <Text style={{ fontSize: 28, marginBottom: 6 }}>📷</Text>
                        <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>Add IV Site Photo</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 4 }}>Camera or photo library</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )
              )}
            </View>
            <SelectRow label="Attempts" options={['1', '2', '3']} value={ivAttempts} onSelect={setIvAttempts} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            <Text style={cStyles.fieldLabel}>Time IV Initiated</Text>
            <TextInput style={cStyles.input} placeholder="2:35 PM" placeholderTextColor="#666" value={ivTimeInitiated} onChangeText={setIvTimeInitiated} editable={!isLocked} />
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
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>SERVICES ADMINISTERED</Text>
            {selectedServices.length > 0 && selectedServices.map((svc, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{svc.name}</Text>
                  {svc.price && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>${svc.price}</Text>}
                </View>
                {!isLocked && (
                  <TouchableOpacity onPress={() => setSelectedServices(prev => prev.filter((_, idx) => idx !== i))}>
                    <Text style={{ color: '#f09090', fontSize: 20, paddingHorizontal: 8 }}>×</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {!isLocked && (
              <TouchableOpacity
                style={{ borderWidth: 1, borderColor: primaryColor, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 }}
                onPress={() => setShowServicePicker(true)}
              >
                <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>+ Add Service</Text>
              </TouchableOpacity>
            )}
          </View>

          <Modal visible={showServicePicker} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#0D1B4B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Select Service</Text>
                <ScrollView>
                  {companyServices.length === 0 ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 20 }}>No services found. Add services in the admin panel.</Text>
                  ) : companyServices.map(svc => {
                    const isSelected = selectedServices.some(s => s.id === svc.id)
                    return (
                      <TouchableOpacity
                        key={svc.id}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedServices(prev => prev.filter(s => s.id !== svc.id))
                          } else {
                            setSelectedServices(prev => [...prev, { id: svc.id, name: svc.name, price: svc.price }])
                          }
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{svc.name}</Text>
                          {svc.price && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>${svc.price}</Text>}
                        </View>
                        <Text style={{ color: isSelected ? primaryColor : 'rgba(255,255,255,0.2)', fontSize: 22 }}>{isSelected ? '✓' : '+'}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
                <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 }} onPress={() => setShowServicePicker(false)}>
                  <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>PRN IV MEDICATIONS</Text>
            {IV_MEDICATIONS.map(item => <MedRow key={item.key} item={item} medSet={ivMeds} setMedSet={setIvMeds} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />)}
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>PRN BAG ADD-ONS</Text>
            {BAG_ADDONS.map(item => <MedRow key={item.key} item={item} medSet={bagAddons} setMedSet={setBagAddons} showDose primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />)}
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>IM INJECTIONS</Text>
            {IM_INJECTIONS.map(item => <MedRow key={item.key} item={item} medSet={imInjections} setMedSet={setImInjections} showDose primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />)}
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>POST INFUSION VITALS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>BP (mmHg)</Text><TextInput style={cStyles.input} placeholder="120/80" placeholderTextColor="#666" value={postBp} onChangeText={setPostBp} editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Pulse (BPM)</Text><TextInput style={cStyles.input} placeholder="72" placeholderTextColor="#666" value={postHr} onChangeText={setPostHr} keyboardType="numeric" editable={!isLocked} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>O2 Sat (%)</Text><TextInput style={cStyles.input} placeholder="98" placeholderTextColor="#666" value={postO2} onChangeText={setPostO2} keyboardType="numeric" editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cStyles.fieldLabel}>Time</Text><TextInput style={cStyles.input} placeholder="3:30 PM" placeholderTextColor="#666" value={postTime} onChangeText={setPostTime} editable={!isLocked} /></View>
            </View>
          </View>

          <View style={cStyles.section}>
            <Text style={[cStyles.sectionTitle, { color: primaryColor }]}>POST INFUSION ASSESSMENT</Text>
            <SelectRow label="Complications?" options={['No', 'Yes']} value={complications} onSelect={setComplications} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            {complications === 'Yes' && (
              <>
                <Text style={cStyles.fieldLabel}>Please explain</Text>
                <TextInput style={[cStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Describe..." placeholderTextColor="#666" value={complicationsDetail} onChangeText={setComplicationsDetail} multiline editable={!isLocked} />
              </>
            )}
            <SelectRow label="Catheter Status on Removal" options={['Normal and Intact', 'Broken, Severed']} value={catheterStatus} onSelect={setCatheterStatus} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            <Text style={cStyles.fieldLabel}>Time IV Discontinued</Text>
            <TextInput style={cStyles.input} placeholder="3:30 PM" placeholderTextColor="#666" value={ivTimeDiscontinued} onChangeText={setIvTimeDiscontinued} editable={!isLocked} />
            <Text style={cStyles.fieldLabel}>Tech Notes</Text>
            <TextInput style={[cStyles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Any additional notes..." placeholderTextColor="#666" value={techNotes} onChangeText={setTechNotes} multiline editable={!isLocked} />
          </View>

          {/* GFE Request */}
          {!isLocked && (
            <TouchableOpacity
              style={{ borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: primaryColor }}
              onPress={async () => {
                if (!chartId) { Alert.alert('Save First', 'Please save the chart before requesting a GFE'); return }
                try {
                  const res = await fetch(`${API_URL}/gfe/request`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ callId: call?.call_id, chartId }) })
                  const data = await res.json()
                  if (data.success) Alert.alert('✅ GFE Requested', 'The NP has been notified')
                  else Alert.alert('Error', data.message || 'Could not request GFE')
                } catch (err) { Alert.alert('Error', 'Network error') }
              }}
            >
              <Text style={{ color: primaryColor, fontSize: 15, fontWeight: '700' }}>🩺 Request GFE from NP</Text>
            </TouchableOpacity>
          )}

          {/* Submit button */}
          {!isLocked && (
            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16, backgroundColor: primaryColor }, saving && { opacity: 0.6 }]}
              onPress={() => Alert.alert('Submit Chart', 'Submit this chart? It will be locked after submission.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', onPress: () => saveChart(true) }
              ])}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ fontSize: 16, fontWeight: '700', color: secondaryColor }}>Submit Chart</Text>}
            </TouchableOpacity>
          )}

          {/* Amendment section */}
          {isLocked && (
            <View style={{ backgroundColor: 'rgba(255,152,0,0.08)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={[cStyles.sectionTitle, { color: '#FF9800' }]}>📝 ADD AMENDMENT</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
                Chart is locked. Describe what you are correcting or adding. This will be appended to the original chart with your name and timestamp.
              </Text>
              <TextInput
                style={[cStyles.input, { height: 120, textAlignVertical: 'top' }]}
                placeholder="e.g. Forgot to document that patient received a second dose of Zofran at 2:45 PM..."
                placeholderTextColor="#666"
                value={amendmentText}
                onChangeText={setAmendmentText}
                multiline
              />
              <TouchableOpacity
                style={{ backgroundColor: '#FF9800', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 }}
                onPress={submitAmendment}
              >
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>Save Amendment</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function formatTimer(seconds) {
  const m = Math.floor(seconds / 60)
  const h = Math.floor(m / 60)
  if (h > 0) return `${h}h ${m % 60}m`
  return `${m}m`
}

function formatOnScene(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ─── DISPATCH SECTION ─────────────────────────────────────────────────────────

function DispatchSection({ token, primaryColor, secondaryColor, navigation, user, company }) {
  const headers = { Authorization: `Bearer ${token}` }
  const [dispatchTab, setDispatchTab] = useState('queue')
  const [queue, setQueue] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [log, setLog] = useState([])
  const [needsAttention, setNeedsAttention] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // New booking modal
  const [newBookingModal, setNewBookingModal] = useState(false)
  const [nbPatientName, setNbPatientName] = useState('')
  const [nbPhone, setNbPhone] = useState('')
  const [nbAddress, setNbAddress] = useState('')
  const [nbService, setNbService] = useState('')
  const [nbNotes, setNbNotes] = useState('')
  const [nbScheduledDate, setNbScheduledDate] = useState('')
  const [nbScheduledTime, setNbScheduledTime] = useState('')
  const [nbSearchQuery, setNbSearchQuery] = useState('')
  const [nbSearchResults, setNbSearchResults] = useState([])
  const [nbSelectedPatient, setNbSelectedPatient] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showServiceList, setShowServiceList] = useState(false)

  const [companyServices, setCompanyServices] = useState([])

  // Cancel modal
  const [cancelModal, setCancelModal] = useState(false)
  const [cancelBookingId, setCancelBookingId] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelDisposition, setCancelDisposition] = useState('')
  const [showDispositionDropdown, setShowDispositionDropdown] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // Confirm time modal
  const [confirmTimeModal, setConfirmTimeModal] = useState(false)
  const [confirmTime, setConfirmTime] = useState(new Date())
  const [pendingBookingId, setPendingBookingId] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, sRes, lRes, stRes, naRes, svcRes] = await Promise.all([
        fetch(`${API_URL}/dispatch/queue`, { headers }),
        fetch(`${API_URL}/dispatch/scheduled`, { headers }),
        fetch(`${API_URL}/dispatch/log`, { headers }),
        fetch(`${API_URL}/dispatch/stats`, { headers }),
        fetch(`${API_URL}/dispatch/needs-attention`, { headers }),
        fetch(`${API_URL}/admin/services`, { headers })
      ])
      const [qData, sData, lData, stData, naData, svcData] = await Promise.all([
        qRes.json(), sRes.json(), lRes.json(), stRes.json(), naRes.json(), svcRes.json()
      ])
      if (qData.queue) setQueue(qData.queue)
      if (sData.scheduled) setScheduled(sData.scheduled)
      if (lData.log) setLog(lData.log)
      if (stData.stats) setStats(stData.stats)
      if (naData.bookings) setNeedsAttention(naData.bookings)
      if (svcData.services) setCompanyServices(svcData.services)
    } catch (err) {
      console.error('Solo dispatch fetch error:', err)
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

  const searchPatients = async (q) => {
    setNbSearchQuery(q)
    if (q.length < 2) { setNbSearchResults([]); return }
    try {
      const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(q)}`, { headers })
      const data = await res.json()
      setNbSearchResults(data.patients || [])
    } catch (e) {}
  }

  const selectPatient = (p) => {
    setNbSelectedPatient(p)
    setNbPatientName(`${p.first_name} ${p.last_name}`)
    setNbPhone(p.phone || '')
    setNbAddress(p.last_address || '')
    setNbSearchQuery('')
    setNbSearchResults([])
  }

  const submitBooking = async () => {
    if (!nbPatientName || !nbService || !nbAddress) {
      Alert.alert('Required', 'Patient name, service, and address are required')
      return
    }
    setSubmitting(true)
    try {
      let requestedTime = null
      if (nbScheduledDate && nbScheduledTime) {
        requestedTime = new Date(`${nbScheduledDate}T${nbScheduledTime}`).toISOString()
      }
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: nbPatientName, patientPhone: nbPhone,
          service: nbService, address: nbAddress, notes: nbNotes,
          source: 'phone', requestedTime
        })
      })
      const data = await res.json()
      if (data.success) {
        setNewBookingModal(false)
        setNbPatientName(''); setNbPhone(''); setNbAddress('')
        setNbService(''); setNbNotes(''); setNbScheduledDate(''); setNbScheduledTime('')
        setNbSelectedPatient(null); setNbSearchQuery(''); setNbSearchResults([])
        fetchAll()
      } else {
        Alert.alert('Error', data.message || 'Could not create booking')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmCancel = async () => {
    if (!cancelReason.trim()) { Alert.alert('Required', 'Please enter a reason'); return }
    setCancelling(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${cancelBookingId}/cancel`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason, disposition: cancelDisposition })
      })
      const data = await res.json()
      if (data.success) {
        setCancelModal(false); setCancelReason(''); setCancelDisposition('')
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

  const confirmBooking = async (bookingId, time) => {
    try {
      const res = await fetch(`${API_URL}/dispatch/bookings/${bookingId}/confirm`, {
  method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedTime: time.toISOString() })
      })
      const data = await res.json()
      if (data.success) { setConfirmTimeModal(false); fetchAll() }
      else Alert.alert('Error', data.message || 'Could not confirm')
    } catch (err) {
      Alert.alert('Error', 'Network error')
    }
  }

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
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={primaryColor} size="large" /></View>

  return (
    <View style={{ flex: 1 }}>
      {/* Stats bar */}
      <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 16, paddingBottom: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
          {[
            { label: 'Pending', value: stats.pending || 0, color: primaryColor },
            { label: 'Active', value: stats.active || 0, color: '#2196F3' },
            { label: 'Done', value: stats.completed_today || 0, color: '#4CAF50' },
            { label: 'Cancelled', value: stats.cancelled_today || 0, color: '#f09090' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center', borderTopWidth: 2, borderTopColor: s.color }}>
              <Text style={{ color: s.color, fontSize: 20, fontWeight: '800' }}>{s.value}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center' }}
          onPress={() => setNewBookingModal(true)}
        >
          <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>+ New Booking</Text>
        </TouchableOpacity>
      </View>

      {/* Sub-tabs */}
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        {[
          { key: 'queue', label: `Queue${queue.length > 0 ? ` (${queue.length})` : ''}` },
          { key: 'scheduled', label: `Scheduled${scheduled.length > 0 ? ` (${scheduled.length})` : ''}` },
          { key: 'messages', label: 'Messages' },
          { key: 'log', label: `Log${needsAttention.length > 0 ? ` · ${needsAttention.length}` : ''}` },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: dispatchTab === t.key ? primaryColor : 'transparent' }}
            onPress={() => {
              if (t.key === 'messages') {
                navigation.navigate('DispatcherMessaging', { token, user, company, soloMode: true })
              } else {
                setDispatchTab(t.key)
              }
            }}
          >
            <Text style={{ color: dispatchTab === t.key ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Queue */}
      {dispatchTab === 'queue' && (
        <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll() }} tintColor={primaryColor} />}>
          {queue.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>✅</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Queue is clear</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>No pending bookings</Text>
            </View>
          ) : queue.map(b => (
            <View key={b.id} style={[sStyles.card, b.region_color && { borderLeftWidth: 4, borderLeftColor: b.region_color }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }}>{b.service}</Text>
                <View style={{ backgroundColor: b.source === 'phone' ? '#2196F3' : primaryColor, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{b.source === 'phone' ? 'PHONE' : 'APP'}</Text>
                </View>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>👤 {b.patient_name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>📍 {b.address}</Text>
              {!b.has_valid_intake && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No intake on file</Text>}
              {b.patient_phone && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>📞 {b.patient_phone}</Text>}
              {b.notes && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4, fontStyle: 'italic' }}>📝 {b.notes}</Text>}
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
                {(b.confirmed_time || b.requested_time)
                  ? `📅 ${b.confirmed_time ? 'Confirmed' : 'Scheduled'}: ${new Date(b.confirmed_time || b.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Phoenix' })} at ${new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}`
                  : `🕐 Received ${new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                }
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center' }}
                  onPress={() => {
                    setPendingBookingId(b.id)
                    setConfirmTime(b.requested_time ? new Date(b.requested_time) : new Date())
                    setConfirmTimeModal(true)
                  }}
                >
                  <Text style={{ color: secondaryColor, fontSize: 13, fontWeight: '700' }}>✓ Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, borderWidth: 1, borderColor: '#f09090', borderRadius: 10, padding: 12, alignItems: 'center' }}
                  onPress={() => { setCancelBookingId(b.id); setCancelReason(''); setCancelDisposition(''); setCancelModal(true) }}
                >
                  <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Scheduled */}
      {dispatchTab === 'scheduled' && (
        <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll() }} tintColor={primaryColor} />}>
          {scheduled.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>No scheduled appointments</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>Future bookings will appear here</Text>
            </View>
          ) : (
            Object.entries(
              scheduled.reduce((groups, b) => {
                const date = new Date(b.confirmed_time || b.requested_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Phoenix' })
                if (!groups[date]) groups[date] = []
                groups[date].push(b)
                return groups
              }, {})
            ).map(([date, bookings]) => (
              <View key={date}>
                <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginTop: 16, marginBottom: 8 }}>📅 {date}</Text>
                {bookings.map(b => (
                  <View key={b.id} style={sStyles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 }}>{b.service}</Text>
                      <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>
                        {new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                        {b.confirmed_time && <Text style={{ color: '#4CAF50' }}> ✓</Text>}
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>👤 {b.patient_name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>📍 {b.address}</Text>
                    {!b.has_valid_intake && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>⚠️ No intake on file</Text>}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{ flex: 1, borderWidth: 1, borderColor: '#f09090', borderRadius: 10, padding: 10, alignItems: 'center' }}
                        onPress={() => { setCancelBookingId(b.id); setCancelReason(''); setCancelDisposition(''); setCancelModal(true) }}
                      >
                        <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
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

      {/* Log */}
      {dispatchTab === 'log' && (
        <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll() }} tintColor={primaryColor} />}>
          {needsAttention.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Needs Attention ({needsAttention.length})</Text>
              {needsAttention.map(b => (
                <View key={b.id} style={[sStyles.card, { borderLeftWidth: 3, borderLeftColor: '#e53e3e' }]}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, marginBottom: 4 }}>{b.service}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>{b.patient_name}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => { setNbPatientName(b.patient_name); setNbService(b.service); setNbAddress(b.address || ''); setNewBookingModal(true) }}>
                      <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 13 }}>Reschedule</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => markNoShow(b.id)}>
                      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>No Show</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(240,144,144,0.1)', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => { setCancelBookingId(b.id); setCancelReason(''); setCancelModal(true) }}>
                      <Text style={{ color: '#f09090', fontWeight: '700', fontSize: 13 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
            </View>
          )}
          {log.length === 0 && needsAttention.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>No calls logged today</Text>
            </View>
          ) : log.map((entry, i) => (
            <View key={`${entry.id}-${i}`} style={sStyles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 }}>{entry.service}</Text>
                <View style={{ borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderColor: entry.status === 'completed' ? '#4CAF50' : '#f09090' }}>
                  <Text style={{ color: entry.status === 'completed' ? '#4CAF50' : '#f09090', fontSize: 10, fontWeight: '700' }}>{entry.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>👤 {entry.patient_name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>📍 {entry.address}</Text>
              {entry.seconds_on_scene && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 2 }}>⏱ {formatTimer(entry.seconds_on_scene)} on scene</Text>}
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>🕐 {new Date(entry.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              {entry.cancellation_disposition && (
                <View style={{ backgroundColor: 'rgba(240,144,144,0.08)', borderRadius: 8, padding: 8, marginTop: 6, borderLeftWidth: 3, borderLeftColor: '#f09090' }}>
                  <Text style={{ color: '#f09090', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 }}>CANCEL REASON</Text>
                  <Text style={{ color: '#fff', fontSize: 12 }}>{entry.cancellation_disposition}{entry.cancellation_reason ? ` — ${entry.cancellation_reason}` : ''}</Text>
                </View>
              )}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* New Booking Modal */}
      <Modal visible={newBookingModal} transparent animationType="slide">
        <View style={sStyles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
              <View style={sStyles.modalCard}>
                <Text style={sStyles.modalTitle}>New Booking</Text>
                <Text style={sStyles.modalSub}>Create a new appointment</Text>
                <Text style={sStyles.fieldLabel}>Search Patient</Text>
                <TextInput style={sStyles.input} placeholder="Search by name or phone..." placeholderTextColor="#666" value={nbSearchQuery} onChangeText={searchPatients} />
                {nbSearchResults.length > 0 && (
                  <View style={{ backgroundColor: '#1a1a2e', borderRadius: 8, marginBottom: 8 }}>
                    {nbSearchResults.slice(0, 5).map(p => (
                      <TouchableOpacity key={p.id} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' }} onPress={() => selectPatient(p)}>
                        <Text style={{ color: '#fff', fontWeight: '600' }}>{p.first_name} {p.last_name}</Text>
                        <Text style={{ color: '#aaa', fontSize: 12 }}>{p.phone || 'No phone'} · {p.last_address || 'No address'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text style={sStyles.fieldLabel}>Patient Name *</Text>
                <TextInput style={sStyles.input} placeholder="Full name" placeholderTextColor="#666" value={nbPatientName} onChangeText={setNbPatientName} />
                <Text style={sStyles.fieldLabel}>Phone</Text>
                <TextInput style={sStyles.input} placeholder="(602) 555-0100" placeholderTextColor="#666" value={nbPhone} onChangeText={setNbPhone} keyboardType="phone-pad" />
                <Text style={sStyles.fieldLabel}>Service *</Text>
                <TouchableOpacity style={[sStyles.input, { justifyContent: 'center' }]} onPress={() => setShowServiceList(!showServiceList)}>
                  <Text style={{ color: nbService ? '#fff' : '#666' }}>{nbService || 'Select a service...'}</Text>
                </TouchableOpacity>
                {showServiceList && (
                  <View style={{ backgroundColor: '#1a1a2e', borderRadius: 8, marginBottom: 8 }}>
                    {companyServices.map(svc => (
                      <TouchableOpacity key={svc.id} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#333', flexDirection: 'row', justifyContent: 'space-between' }} onPress={() => { setNbService(svc.name); setShowServiceList(false) }}>
                        <Text style={{ color: '#fff' }}>{svc.name}</Text>
                        {nbService === svc.name && <Text style={{ color: primaryColor }}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text style={sStyles.fieldLabel}>Address *</Text>
                <TextInput style={sStyles.input} placeholder="Full address" placeholderTextColor="#666" value={nbAddress} onChangeText={setNbAddress} />
                <Text style={sStyles.fieldLabel}>Scheduled Date (optional)</Text>
                <TextInput style={sStyles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#666" value={nbScheduledDate} onChangeText={setNbScheduledDate} />
                <Text style={sStyles.fieldLabel}>Scheduled Time (optional)</Text>
                <TextInput style={sStyles.input} placeholder="HH:MM (24hr)" placeholderTextColor="#666" value={nbScheduledTime} onChangeText={setNbScheduledTime} />
                <Text style={sStyles.fieldLabel}>Notes</Text>
                <TextInput style={[sStyles.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Any special instructions..." placeholderTextColor="#666" value={nbNotes} onChangeText={setNbNotes} multiline />
                <TouchableOpacity style={[sStyles.primaryBtn, { opacity: submitting ? 0.6 : 1 }]} onPress={submitBooking} disabled={submitting}>
                  {submitting ? <ActivityIndicator color={secondaryColor} /> : <Text style={[sStyles.primaryBtnText, { color: secondaryColor }]}>Add to Queue</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={sStyles.cancelBtn} onPress={() => setNewBookingModal(false)}>
                  <Text style={sStyles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal visible={cancelModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={sStyles.modalOverlay}>
            <View style={sStyles.modalCard}>
              <Text style={sStyles.modalTitle}>Cancel Booking</Text>
              <Text style={sStyles.fieldLabel}>Disposition</Text>
              <TouchableOpacity style={[sStyles.input, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 48 }]} onPress={() => setShowDispositionDropdown(!showDispositionDropdown)}>
                <Text style={{ color: cancelDisposition ? '#fff' : '#666', fontSize: 14 }}>{cancelDisposition || 'Select...'}</Text>
                <Text style={{ color: '#666' }}>{showDispositionDropdown ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {showDispositionDropdown && (
                <View style={{ backgroundColor: '#1a2a5e', borderRadius: 8, marginBottom: 10 }}>
                  {DISPOSITIONS.map(opt => (
                    <TouchableOpacity key={opt} style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }} onPress={() => { setCancelDisposition(opt); setShowDispositionDropdown(false) }}>
                      <Text style={{ color: cancelDisposition === opt ? primaryColor : '#fff', fontSize: 14 }}>{cancelDisposition === opt ? '✓ ' : ''}{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={sStyles.fieldLabel}>Reason *</Text>
              <TextInput style={[sStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Reason for cancellation..." placeholderTextColor="#666" value={cancelReason} onChangeText={setCancelReason} multiline />
              <TouchableOpacity style={[sStyles.primaryBtn, { backgroundColor: '#f09090', opacity: cancelling ? 0.6 : 1 }]} onPress={confirmCancel} disabled={cancelling}>
                {cancelling ? <ActivityIndicator color="#fff" /> : <Text style={sStyles.primaryBtnText}>Confirm Cancellation</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={sStyles.cancelBtn} onPress={() => setCancelModal(false)}>
                <Text style={sStyles.cancelBtnText}>Keep booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Confirm Time Modal */}
      <Modal visible={confirmTimeModal} transparent animationType="slide">
        <View style={sStyles.modalOverlay}>
          <View style={sStyles.modalCard}>
            <Text style={sStyles.modalTitle}>Confirm Time</Text>
            <Text style={sStyles.modalSub}>Select the confirmed time for this appointment</Text>
            {Platform.OS === 'web' ? (
              <select
                value={`${confirmTime.getHours()}:${String(confirmTime.getMinutes()).padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':')
                  const t = new Date(confirmTime)
                  t.setHours(parseInt(h)); t.setMinutes(parseInt(m))
                  setConfirmTime(new Date(t))
                }}
                style={{ background: '#162260', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 10, padding: 14, fontSize: 18, color: '#fff', width: '100%', cursor: 'pointer', marginBottom: 16 }}
              >
                {Array.from({ length: 24 }, (_, h) => [0, 15, 30, 45].map(m => {
                  const label = `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
                  const value = `${h}:${String(m).padStart(2, '0')}`
                  return <option key={value} value={value}>{label}</option>
                })).flat()}
              </select>
            ) : (
              <DateTimePicker value={confirmTime} mode="time" display="spinner" onChange={(e, d) => { if (d) setConfirmTime(d) }} style={{ marginVertical: 16 }} />
            )}
            <TouchableOpacity style={[sStyles.primaryBtn, { backgroundColor: primaryColor }]} onPress={() => confirmBooking(pendingBookingId, confirmTime)}>
              <Text style={[sStyles.primaryBtnText, { color: secondaryColor }]}>Confirm {confirmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sStyles.cancelBtn} onPress={() => setConfirmTimeModal(false)}>
              <Text style={sStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

// ─── TECH SECTION ─────────────────────────────────────────────────────────────

function TechSection({ token, primaryColor, secondaryColor, navigation, user, company }) {
  const headers = { Authorization: `Bearer ${token}` }
  const [techTab, setTechTab] = useState('call')
  const [call, setCall] = useState(null)
  const [mySchedule, setMySchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [onSceneSeconds, setOnSceneSeconds] = useState(0)
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(null)
  const [inService, setInService] = useState(false)
  const timerRef = useRef(null)
  const [showChart, setShowChart] = useState(false)
  const [chartPatient, setChartPatient] = useState(null)
  const [primaryChartCompleted, setPrimaryChartCompleted] = useState(false)

  const fetchCall = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tech/my-call`, { headers })
      const data = await res.json()
      if (data.success) {
        setCall(data.call)
        setMySchedule(data.mySchedule || [])
        if (data.call?.call_id) {
          fetch(`${API_URL}/charts/call/${data.call.call_id}?patientName=${encodeURIComponent(data.call.patient_name)}`, { headers })
            .then(r => r.json())
            .then(d => setPrimaryChartCompleted(d.chart?.status === 'submitted' || d.chart?.status === 'amended'))
            .catch(() => setPrimaryChartCompleted(false))
        }
        if (data.call?.tech_status === 'on_scene' && data.call?.tech_onscene_at) {
          setOnSceneSeconds(Math.floor((Date.now() - new Date(data.call.tech_onscene_at).getTime()) / 1000))
        }
      }
    } catch (err) {
      console.error('Tech fetch error:', err)
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
  }, [call?.tech_status])

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
      en_route: 'Mark yourself as En Route?',
      on_scene: 'Mark yourself as On Scene?',
      clear: 'Mark this call as Complete?'
    }
    Alert.alert('Update Status', messages[newStatus], [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => updateStatus(newStatus) }
    ])
  }

  const toggleInService = async () => {
    try {
      const res = await fetch(`${API_URL}/tech/in-service`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ inService: !inService })
      })
      const data = await res.json()
      if (data.success) setInService(!inService)
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  const timerWarning = onSceneSeconds >= 3300
  const timerDanger = onSceneSeconds >= 3600

  const markedDates = mySchedule.reduce((acc, b) => {
    const dateToUse = b.confirmed_time || b.requested_time
    if (!dateToUse) return acc
    const date = new Date(dateToUse).toISOString().split('T')[0]
    acc[date] = { marked: true, dotColor: primaryColor }
    return acc
  }, {})
  if (selectedScheduleDate) markedDates[selectedScheduleDate] = { ...markedDates[selectedScheduleDate], selected: true, selectedColor: primaryColor }

  const selectedDayBookings = selectedScheduleDate
    ? mySchedule.filter(b => {
        const d = b.confirmed_time || b.requested_time
        return d && new Date(d).toISOString().split('T')[0] === selectedScheduleDate
      })
    : []

  if (loading) return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={primaryColor} size="large" /></View>

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tabs */}
      <ChartModal key={showChart ? (chartPatient?.name || 'chart') : 'closed'} visible={showChart} onClose={() => { setShowChart(false); setChartPatient(null); fetchCall() }} call={call} token={token} company={company} patientName={chartPatient?.name} patientDob={chartPatient?.dob} />
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        {[
          { key: 'call', label: '📞 My Call' },
          { key: 'schedule', label: `📅 Schedule${mySchedule.length > 0 ? ` (${mySchedule.length})` : ''}` }
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={{ flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: techTab === t.key ? primaryColor : 'transparent' }}
            onPress={() => setTechTab(t.key)}
          >
            <Text style={{ color: techTab === t.key ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Call */}
      {techTab === 'call' && (
        <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCall() }} tintColor={primaryColor} />}>

          {!call ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 56, marginBottom: 16 }}>📵</Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 8 }}>No active call</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>You'll be notified when a call is assigned</Text>
            </View>
          ) : (
            <>
              <View style={{ backgroundColor: (STATUS_COLORS[call.tech_status || call.status] || '#aaa') + '33', borderWidth: 2, borderColor: STATUS_COLORS[call.tech_status || call.status] || '#aaa', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: STATUS_COLORS[call.tech_status || call.status] || '#aaa' }}>
                  {STATUS_LABELS[call.tech_status || call.status] || call.tech_status || call.status}
                </Text>
              </View>

              <View style={sStyles.card}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>CALL DETAILS</Text>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 10 }}>{call.service}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>ADDRESS</Text>
                <Text style={{ color: '#fff', fontSize: 15, marginBottom: 8 }}>{call.address}</Text>
                {call.address_note && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontStyle: 'italic', marginBottom: 8 }}>{call.address_note}</Text>}
                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}
                  onPress={() => {
                    const { Linking } = require('react-native')
                    const encoded = encodeURIComponent(call.address)
                    const url = Platform.OS === 'ios' ? `maps://app?daddr=${encoded}` : `google.navigation:q=${encoded}`
                    Linking.canOpenURL(url).then(s => s ? Linking.openURL(url) : Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`))
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🗺</Text>
                </TouchableOpacity>
                <TouchableOpacity
  style={[{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }, primaryChartCompleted && { opacity: 0.4 }]}
  onPress={() => { setChartPatient({ name: call.patient_name, dob: call.patient_dob }); setShowChart(true) }}
>
  <Text style={{ fontSize: 18 }}>📋</Text>
  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{primaryChartCompleted ? '🔒 View Chart' : 'Chart Patient'}</Text>
</TouchableOpacity>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>PATIENT</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>{call.patient_name}</Text>
                {call.patient_phone && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>📞 {call.patient_phone}</Text>}
                
                {(call.confirmed_time || call.requested_time) && (
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                    🕐 {call.confirmed_time ? 'Confirmed' : 'Scheduled'}: {new Date(call.confirmed_time || call.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                  </Text>
                  
                )}
              </View>

              {call.tech_status === 'on_scene' && (
                <View style={[{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1 }, timerDanger ? { borderColor: '#f09090', backgroundColor: 'rgba(240,144,144,0.1)' } : timerWarning ? { borderColor: '#E2C97E', backgroundColor: 'rgba(226,201,126,0.1)' } : { borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 8 }}>⏱ TIME ON SCENE</Text>
                  <Text style={{ fontSize: 48, fontWeight: '700', fontVariant: ['tabular-nums'], color: timerDanger ? '#f09090' : timerWarning ? '#E2C97E' : '#fff' }}>{formatOnScene(onSceneSeconds)}</Text>
                  {timerWarning && <Text style={{ fontSize: 13, color: timerDanger ? '#f09090' : '#E2C97E', marginTop: 8 }}>{timerDanger ? '⚠️ 60 minutes reached — wrap up!' : '⚠️ Approaching 60 minutes'}</Text>}
                </View>
              )}

              {call.status !== 'completed' && (
                <View style={sStyles.card}>
                  <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>UPDATE STATUS</Text>
                  {(call.tech_status === 'assigned' || call.tech_status === null || call.tech_status === 'confirmed') && (
                    <TouchableOpacity style={{ backgroundColor: '#2196F3', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 }} onPress={() => handleStatusChange('en_route')} disabled={updatingStatus}>
                      {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>🚗 I'm En Route</Text>}
                    </TouchableOpacity>
                  )}
                  {call.tech_status === 'en_route' && (
                    <>
                      <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: primaryColor, borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 }} onPress={() => navigation.navigate('BookingChat', { token, userId: user?.id, company, bookingId: call.id, patientName: call.patient_name })}>
                        <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>Message Patient</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ backgroundColor: '#4CAF50', borderRadius: 12, padding: 16, alignItems: 'center' }} onPress={() => handleStatusChange('on_scene')} disabled={updatingStatus}>
                        {updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>📍 I'm On Scene</Text>}
                      </TouchableOpacity>
                    </>
                  )}
                  {call.tech_status === 'on_scene' && (
                    <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }} onPress={() => handleStatusChange('clear')} disabled={updatingStatus}>
                      {updatingStatus ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>✅ Call Complete — Go Clear</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {call.status === 'completed' && (
                <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 14, padding: 32, alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#4CAF50', marginBottom: 8 }}>Call Complete!</Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Great work. Waiting for your next call.</Text>
                </View>
              )}
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Schedule */}
      {techTab === 'schedule' && (
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
              arrowColor: primaryColor, dotColor: primaryColor
            }}
            style={{ marginBottom: 8 }}
          />
          {selectedScheduleDate && (
            <View style={[sStyles.card, { marginHorizontal: 16 }]}>
              <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
                {new Date(selectedScheduleDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
              </Text>
              {selectedDayBookings.length === 0 ? (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No appointments on this day</Text>
              ) : selectedDayBookings.map(b => (
                <View key={b.id} style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', paddingTop: 12, marginTop: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 4 }}>{b.service}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 2 }}>👤 {b.patient_name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 2 }}>📍 {b.address}</Text>
                  <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>
                    🕐 {new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'America/Phoenix' })}
                    {b.confirmed_time && b.requested_time && b.confirmed_time !== b.requested_time ? ' (confirmed)' : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
          {mySchedule.length === 0 && (
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No upcoming appointments</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  )
}

// ─── ADMIN SECTION ────────────────────────────────────────────────────────────

function AdminSection({ token, primaryColor, secondaryColor, company }) {
  const headers = { Authorization: `Bearer ${token}` }
  const [adminTab, setAdminTab] = useState('patients')
  const [loading, setLoading] = useState(false)

  // Patient search
  const [psQuery, setPsQuery] = useState('')
  const [psResults, setPsResults] = useState([])
  const [psSearching, setPsSearching] = useState(false)
  const [psSelectedPatient, setPsSelectedPatient] = useState(null)
  const [psProfileModal, setPsProfileModal] = useState(false)
  const [psProfileData, setPsProfileData] = useState(null)
  const [psLoadingProfile, setPsLoadingProfile] = useState(false)
  const [psActiveTab, setPsActiveTab] = useState('overview')
  const [psEditing, setPsEditing] = useState(false)
  const [psEditPhone, setPsEditPhone] = useState('')
  const [psEditAddress, setPsEditAddress] = useState('')
  const [psEditCity, setPsEditCity] = useState('')
  const [psEditState, setPsEditState] = useState('')
  const [psEditZip, setPsEditZip] = useState('')
  const [psSavingProfile, setPsSavingProfile] = useState(false)

  // Services
  const [services, setServices] = useState([])
  const [newServiceModal, setNewServiceModal] = useState(false)
  const [svcName, setSvcName] = useState('')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcDuration, setSvcDuration] = useState('')
  const [svcDescription, setSvcDescription] = useState('')
  const [savingService, setSavingService] = useState(false)

  // Announcements (max 1)
  const [announcement, setAnnouncement] = useState(null)
  const [anModal, setAnModal] = useState(false)
  const [anTitle, setAnTitle] = useState('')
  const [anBody, setAnBody] = useState('')
  const [anEmoji, setAnEmoji] = useState('📢')
  const [anActive, setAnActive] = useState(true)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  // Audit log
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditFilter, setAuditFilter] = useState('all')

  // Settings
  const [requireGFE, setRequireGFE] = useState(false)
  const [companyName, setCompanyName] = useState(company?.name || '')
  const [savingSettings, setSavingSettings] = useState(false)

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/services`, { headers })
      const data = await res.json()
      if (data.services) setServices(data.services)
    } catch (err) {}
  }, [token])

  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, { headers })
      const data = await res.json()
      if (data.announcements?.length > 0) setAnnouncement(data.announcements[0])
      else setAnnouncement(null)
    } catch (err) {}
  }, [token])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/settings`, { headers })
      const data = await res.json()
      if (data.settings) setRequireGFE(data.settings.require_gfe || false)
    } catch (err) {}
  }, [token])

  const fetchAuditLogs = useCallback(async () => {
    setAuditLoading(true)
    try {
      const url = auditFilter === 'all'
        ? `${API_URL}/admin/audit-log?limit=100&excludeStatus=true`
        : `${API_URL}/admin/audit-log?resource=${auditFilter}&limit=100`
      const res = await fetch(url, { headers })
      const data = await res.json()
      if (data.logs) setAuditLogs(data.logs)
    } catch (err) {} finally { setAuditLoading(false) }
  }, [token, auditFilter])

  useEffect(() => {
    if (adminTab === 'services') fetchServices()
    if (adminTab === 'announcements') fetchAnnouncements()
    if (adminTab === 'audit') fetchAuditLogs()
    if (adminTab === 'settings') fetchSettings()
  }, [adminTab, auditFilter])

  const searchPatients = async (q) => {
    setPsQuery(q)
    if (q.length < 2) { setPsResults([]); return }
    setPsSearching(true)
    try {
      const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(q)}`, { headers })
      const data = await res.json()
      setPsResults(data.patients || [])
    } catch (err) {} finally { setPsSearching(false) }
  }

  const openProfile = async (patient) => {
    setPsSelectedPatient(patient)
    setPsProfileModal(true)
    setPsLoadingProfile(true)
    setPsActiveTab('overview')
    setPsEditing(false)
    try {
      const res = await fetch(`${API_URL}/patients/${patient.id}/profile`, { headers })
      const data = await res.json()
      if (data.success) {
        setPsProfileData(data)
        setPsEditPhone(data.patient?.phone || '')
        setPsEditAddress(data.patient?.home_address || '')
        setPsEditCity(data.patient?.city || '')
        setPsEditState(data.patient?.state || '')
        setPsEditZip(data.patient?.zip || '')
      }
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setPsLoadingProfile(false) }
  }

  const saveProfile = async () => {
    setPsSavingProfile(true)
    try {
      const res = await fetch(`${API_URL}/patients/${psSelectedPatient.id}/update`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: psEditPhone, homeAddress: psEditAddress, city: psEditCity, state: psEditState, zip: psEditZip })
      })
      const data = await res.json()
      if (data.success) { setPsEditing(false); openProfile(psSelectedPatient); Alert.alert('✅ Saved', 'Patient profile updated') }
      else Alert.alert('Error', data.message)
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setPsSavingProfile(false) }
  }

  const createService = async () => {
    if (!svcName || !svcPrice) { Alert.alert('Required', 'Name and price required'); return }
    setSavingService(true)
    try {
      const res = await fetch(`${API_URL}/admin/services`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: svcName, price: svcPrice, duration: svcDuration, description: svcDescription })
      })
      const data = await res.json()
      if (data.success) {
        setNewServiceModal(false)
        setSvcName(''); setSvcPrice(''); setSvcDuration(''); setSvcDescription('')
        fetchServices()
      } else Alert.alert('Error', data.message || 'Could not create service')
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setSavingService(false) }
  }

  const saveAnnouncement = async () => {
    if (!anTitle.trim()) { Alert.alert('Required', 'Title is required'); return }
    setSavingAnnouncement(true)
    try {
      const payload = { title: anTitle, body: anBody, emoji: anEmoji, active: anActive, target: 'patient', sortOrder: 0 }
      if (announcement) {
        await fetch(`${API_URL}/admin/announcements/${announcement.id}`, {
          method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
      } else {
        await fetch(`${API_URL}/admin/announcements`, {
          method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        })
      }
      setAnModal(false)
      fetchAnnouncements()
    } catch (err) { Alert.alert('Error', 'Could not save announcement') }
    finally { setSavingAnnouncement(false) }
  }

  const deleteAnnouncement = async () => {
    if (!announcement) return
    Alert.alert('Delete', 'Delete this announcement?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        await fetch(`${API_URL}/admin/announcements/${announcement.id}`, { method: 'DELETE', headers })
        setAnnouncement(null)
      }}
    ])
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, requireGFE })
      })
      const data = await res.json()
      if (data.success) Alert.alert('✅ Saved', 'Settings updated')
      else Alert.alert('Error', data.message || 'Could not save')
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setSavingSettings(false) }
  }

  const actionColor = (action) => {
    if (action?.includes('create')) return '#4CAF50'
    if (action?.includes('update') || action?.includes('status')) return '#2196F3'
    if (action?.includes('view')) return '#C9A84C'
    if (action?.includes('delete')) return '#f09090'
    return '#aaa'
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Sub-tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 48, backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <View style={{ flexDirection: 'row' }}>
          {[
            { key: 'patients', label: '🔍 Patients' },
            { key: 'services', label: '💊 Services' },
            { key: 'announcements', label: '📢 Announcement' },
            { key: 'audit', label: '📋 Audit Log' },
            { key: 'settings', label: '⚙️ Settings' },
          ].map(t => (
            <TouchableOpacity
              key={t.key}
              style={{ paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: adminTab === t.key ? primaryColor : 'transparent' }}
              onPress={() => setAdminTab(t.key)}
            >
              <Text style={{ color: adminTab === t.key ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Patients */}
      {adminTab === 'patients' && (
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 16, paddingVertical: 12 }}>
            <TextInput
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, fontSize: 15, color: '#fff' }}
              placeholder="Search by name, email or phone..."
              placeholderTextColor="#666"
              value={psQuery}
              onChangeText={searchPatients}
            />
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {psSearching && <View style={{ alignItems: 'center', padding: 20 }}><ActivityIndicator color={primaryColor} /></View>}
            {!psSearching && psQuery.length >= 2 && psResults.length === 0 && (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No patients found for "{psQuery}"</Text>
              </View>
            )}
            {psResults.map(p => (
              <TouchableOpacity
                key={p.id}
                style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}
                onPress={() => openProfile(p)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{p.first_name} {p.last_name}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{p.phone || 'No phone'} · {p.email}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{p.total_bookings || 0} visits</Text>
                </View>
                <Text style={{ color: primaryColor, fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            ))}
            {!psSearching && psQuery.length < 2 && (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Search by name, email or phone</Text>
              </View>
            )}
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Patient Profile Modal */}
          <Modal visible={psProfileModal} animationType="slide" presentationStyle="fullScreen">
            <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
              <View style={{ paddingTop: 56, paddingBottom: 0, backgroundColor: secondaryColor }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
                  <TouchableOpacity onPress={() => { setPsProfileModal(false); setPsProfileData(null) }}>
                    <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
                  </TouchableOpacity>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Patient Profile</Text>
                  <View style={{ width: 60 }} />
                </View>
                <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                    <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: primaryColor + '30', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: primaryColor, fontSize: 20, fontWeight: '700' }}>{psSelectedPatient?.first_name?.[0]}{psSelectedPatient?.last_name?.[0]}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 }}>{psSelectedPatient?.first_name} {psSelectedPatient?.last_name}</Text>
                      {psProfileData?.patient?.dob && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>DOB: {new Date(psProfileData.patient.dob).toLocaleDateString()}</Text>}
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    {[
                      { label: 'COMPLETED', value: psProfileData?.completedBookings || 0, color: primaryColor },
                      { label: 'CANCELLED', value: psProfileData?.cancelledBookings || 0, color: '#f09090' },
                      { label: 'INTAKE', value: psProfileData?.intake ? '✓' : '✗', color: psProfileData?.intake ? '#4CAF50' : '#f09090' },
                    ].map(s => (
                      <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                        <Text style={{ color: s.color, fontSize: 20, fontWeight: '800' }}>{s.value}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600' }}>{s.label}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                  {['overview', 'appointments', 'intake'].map(tab => (
                    <TouchableOpacity key={tab} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: psActiveTab === tab ? primaryColor : 'transparent' }} onPress={() => { setPsActiveTab(tab); setPsEditing(false) }}>
                      <Text style={{ color: psActiveTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' }}>{tab.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {psLoadingProfile ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={primaryColor} size="large" /></View>
              ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                  {psActiveTab === 'overview' && (
                    <>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>CONTACT INFORMATION</Text>
                          <TouchableOpacity onPress={() => setPsEditing(!psEditing)}>
                            <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>{psEditing ? 'Cancel' : '✏️ Edit'}</Text>
                          </TouchableOpacity>
                        </View>
                        {[
                          { label: 'PHONE', val: psEditPhone, setter: setPsEditPhone, placeholder: 'Phone number', keyboard: 'phone-pad' },
                        ].map(f => (
                          <View key={f.label} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>{f.label}</Text>
                            {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={f.val} onChangeText={f.setter} placeholder={f.placeholder} placeholderTextColor="#666" keyboardType={f.keyboard || 'default'} /> : <Text style={{ color: f.val ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{f.val || 'Not on file'}</Text>}
                          </View>
                        ))}
                        {psSelectedPatient?.email && (
                          <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>EMAIL</Text>
                            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedPatient.email}</Text>
                          </View>
                        )}
                        <View style={{ paddingVertical: 8 }}>
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
                            <Text style={{ color: psEditAddress ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditAddress ? `${psEditAddress}${psEditCity ? `, ${psEditCity}` : ''}${psEditState ? `, ${psEditState}` : ''}${psEditZip ? ` ${psEditZip}` : ''}` : 'Not on file'}</Text>
                          )}
                        </View>
                      </View>
                      {psEditing && (
                        <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, opacity: psSavingProfile ? 0.6 : 1 }} onPress={saveProfile} disabled={psSavingProfile}>
                          {psSavingProfile ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Save Changes</Text>}
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                  {psActiveTab === 'appointments' && (
                    <>
                      {!psProfileData?.bookings?.length ? (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No appointments on record</Text>
                      ) : psProfileData.bookings.map(b => (
                        <View key={b.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: b.status === 'completed' ? '#4CAF50' : b.status === 'cancelled' ? '#f09090' : primaryColor }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 }}>{b.service}</Text>
                            <Text style={{ color: b.status === 'completed' ? '#4CAF50' : b.status === 'cancelled' ? '#f09090' : primaryColor, fontSize: 11, fontWeight: '700' }}>{b.status?.toUpperCase()}</Text>
                          </View>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📅 {new Date(b.requested_time || b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                          {b.address && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>📍 {b.address}</Text>}
                        </View>
                      ))}
                    </>
                  )}
                  {psActiveTab === 'intake' && (
                    <>
                      {!psProfileData?.intake ? (
                        <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No intake form on file</Text>
                      ) : (
                        <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                          <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 13 }}>✅ Intake submitted {new Date(psProfileData.intake.submitted_at).toLocaleDateString()}</Text>
                          {psProfileData.intake.medications && (
                            <View style={{ marginTop: 12 }}>
                              <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>💊 MEDICATIONS</Text>
                              <Text style={{ color: '#fff', fontSize: 13 }}>{psProfileData.intake.medications}</Text>
                            </View>
                          )}
                          {psProfileData.intake.allergies_detail?.length > 0 && (
                            <View style={{ marginTop: 12, backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 8, padding: 10 }}>
                              <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>⚠️ ALLERGIES</Text>
                              {(Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail : []).map((a, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {a}</Text>)}
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  )}
                  <View style={{ height: 40 }} />
                </ScrollView>
              )}
            </View>
          </Modal>
        </View>
      )}

      {/* Services */}
      {adminTab === 'services' && (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 }} onPress={() => setNewServiceModal(true)}>
            <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>+ Add Service</Text>
          </TouchableOpacity>
          {services.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>💊</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No services yet</Text>
            </View>
          ) : services.map(svc => (
            <View key={svc.id} style={sStyles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{svc.name}</Text>
                <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>${svc.price}</Text>
              </View>
              {svc.duration && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{svc.duration}</Text>}
              {svc.description && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{svc.description}</Text>}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
                <View>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Show to patients</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>Appears in booking menu</Text>
                </View>
                <TouchableOpacity
                  style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: svc.show_to_patients !== false ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }}
                  onPress={async () => {
                    try {
                      await fetch(`${API_URL}/admin/services/${svc.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ showToPatients: !svc.show_to_patients }) })
                      fetchServices()
                    } catch (err) { Alert.alert('Error', 'Could not update service') }
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: svc.show_to_patients !== false ? 'flex-end' : 'flex-start' }} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />

          <Modal visible={newServiceModal} animationType="slide" presentationStyle="fullScreen">
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                <TouchableOpacity onPress={() => setNewServiceModal(false)}>
                  <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Add Service</Text>
                <View style={{ width: 60 }} />
              </View>
              <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
                <Text style={sStyles.fieldLabel}>Service Name *</Text>
                <TextInput style={sStyles.input} value={svcName} onChangeText={setSvcName} placeholder="e.g. Myers Cocktail" placeholderTextColor="#444" />
                <Text style={sStyles.fieldLabel}>Price *</Text>
                <TextInput style={sStyles.input} value={svcPrice} onChangeText={setSvcPrice} placeholder="149" placeholderTextColor="#444" keyboardType="numeric" />
                <Text style={sStyles.fieldLabel}>Duration</Text>
                <TextInput style={sStyles.input} value={svcDuration} onChangeText={setSvcDuration} placeholder="60-75 min" placeholderTextColor="#444" />
                <Text style={sStyles.fieldLabel}>Description</Text>
                <TextInput style={[sStyles.input, { height: 80, textAlignVertical: 'top' }]} value={svcDescription} onChangeText={setSvcDescription} placeholder="Brief description..." placeholderTextColor="#444" multiline />
                <TouchableOpacity style={[sStyles.primaryBtn, { backgroundColor: primaryColor, opacity: savingService ? 0.6 : 1 }]} onPress={createService} disabled={savingService}>
                  {savingService ? <ActivityIndicator color={secondaryColor} /> : <Text style={[sStyles.primaryBtnText, { color: secondaryColor }]}>Add Service</Text>}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>
        </ScrollView>
      )}

      {/* Announcements (max 1) */}
      {adminTab === 'announcements' && (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 }}>
              You can have <Text style={{ color: primaryColor, fontWeight: '700' }}>one active announcement</Text> shown to patients when they log in. Create or edit it below.
            </Text>
          </View>
          {!announcement ? (
            <View style={{ alignItems: 'center', paddingTop: 20, marginBottom: 20 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📢</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 20 }}>No announcement set</Text>
              <TouchableOpacity
                style={{ backgroundColor: primaryColor, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 }}
                onPress={() => { setAnTitle(''); setAnBody(''); setAnEmoji('📢'); setAnActive(true); setAnModal(true) }}
              >
                <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>+ Create Announcement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[sStyles.card, { borderLeftWidth: 4, borderLeftColor: announcement.active ? primaryColor : '#aaa' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <Text style={{ fontSize: 24 }}>{announcement.emoji || '📢'}</Text>
                <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: announcement.active ? '#4CAF50' : '#aaa' }}>
                  <Text style={{ color: announcement.active ? '#4CAF50' : '#aaa', fontSize: 10, fontWeight: '700' }}>{announcement.active ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
              </View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 6 }}>{announcement.title}</Text>
              {announcement.body && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12 }}>{announcement.body}</Text>}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, borderWidth: 1, borderColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center' }}
                  onPress={() => { setAnTitle(announcement.title); setAnBody(announcement.body || ''); setAnEmoji(announcement.emoji || '📢'); setAnActive(announcement.active); setAnModal(true) }}
                >
                  <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, borderWidth: 1, borderColor: announcement.active ? '#aaa' : '#4CAF50', borderRadius: 8, padding: 10, alignItems: 'center' }}
                  onPress={async () => {
                    await fetch(`${API_URL}/admin/announcements/${announcement.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...announcement, active: !announcement.active, ctaLabel: announcement.cta_label, ctaUrl: announcement.cta_url, sortOrder: announcement.sort_order }) })
                    fetchAnnouncements()
                  }}
                >
                  <Text style={{ color: announcement.active ? '#aaa' : '#4CAF50', fontSize: 13, fontWeight: '600' }}>{announcement.active ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: '#f09090', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={deleteAnnouncement}>
                  <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <Modal visible={anModal} animationType="slide" presentationStyle="fullScreen">
            <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
                <TouchableOpacity onPress={() => setAnModal(false)}>
                  <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{announcement ? 'Edit Announcement' : 'New Announcement'}</Text>
                <View style={{ width: 60 }} />
              </View>
              <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
                <Text style={sStyles.fieldLabel}>Title *</Text>
                <TextInput style={sStyles.input} value={anTitle} onChangeText={setAnTitle} placeholder="Spring Special!" placeholderTextColor="#666" />
                <Text style={sStyles.fieldLabel}>Emoji</Text>
                <TextInput style={[sStyles.input, { fontSize: 24, textAlign: 'center' }]} value={anEmoji} onChangeText={setAnEmoji} placeholder="📢" placeholderTextColor="#666" maxLength={2} />
                <Text style={sStyles.fieldLabel}>Message</Text>
                <TextInput style={[sStyles.input, { height: 100, textAlignVertical: 'top' }]} value={anBody} onChangeText={setAnBody} placeholder="Tell your patients something..." placeholderTextColor="#666" multiline />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 24 }}>
                  <Text style={{ color: '#fff', fontSize: 15 }}>Active</Text>
                  <TouchableOpacity style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: anActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={() => setAnActive(!anActive)}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: anActive ? 'flex-end' : 'flex-start' }} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[sStyles.primaryBtn, { backgroundColor: primaryColor, opacity: savingAnnouncement ? 0.6 : 1 }]} onPress={saveAnnouncement} disabled={savingAnnouncement}>
                  {savingAnnouncement ? <ActivityIndicator color={secondaryColor} /> : <Text style={[sStyles.primaryBtnText, { color: secondaryColor }]}>Save Announcement</Text>}
                </TouchableOpacity>
              </ScrollView>
            </KeyboardAvoidingView>
          </Modal>
        </ScrollView>
      )}

      {/* Audit Log */}
      {adminTab === 'audit' && (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52, backgroundColor: secondaryColor, paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10 }}>
              {['all', 'chart', 'bookings', 'gfe', 'intake'].map(f => (
                <TouchableOpacity
                  key={f}
                  style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: auditFilter === f ? primaryColor : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: auditFilter === f ? primaryColor : 'rgba(255,255,255,0.15)' }}
                  onPress={() => setAuditFilter(f)}
                >
                  <Text style={{ color: auditFilter === f ? secondaryColor : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView style={{ flex: 1, padding: 16 }}>
            {auditLoading ? (
              <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
            ) : auditLogs.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>No logs yet</Text>
              </View>
            ) : auditLogs.map((log, i) => (
              <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: actionColor(log.action) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ color: actionColor(log.action), fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{log.action}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{new Date(log.created_at).toLocaleString()}</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', marginBottom: 2 }}>{log.first_name} {log.last_name} · {log.user_role?.toUpperCase()}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{log.resource} {log.resource_id ? `#${log.resource_id}` : ''}</Text>
                {log.details && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{log.details}</Text>}
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* Settings */}
      {adminTab === 'settings' && (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Company</Text>
          <View style={sStyles.card}>
            <Text style={sStyles.fieldLabel}>Company Name</Text>
            <TextInput style={sStyles.input} value={companyName} onChangeText={setCompanyName} placeholder="Company name" placeholderTextColor="#444" />
          </View>

          <Text style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 20 }}>Clinical Settings</Text>
          <View style={sStyles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>Require GFE</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 }}>
                  {requireGFE
                    ? 'Patients must have an active GFE on file before tech can begin treatment.'
                    : 'GFE is not required. Techs can treat patients without a GFE on file.'}
                </Text>
              </View>
              <TouchableOpacity
                style={{ width: 56, height: 32, borderRadius: 16, backgroundColor: requireGFE ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3, marginLeft: 16 }}
                onPress={() => setRequireGFE(!requireGFE)}
              >
                <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignSelf: requireGFE ? 'flex-end' : 'flex-start', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, elevation: 3 }} />
              </TouchableOpacity>
            </View>
            <View style={{ marginTop: 16, backgroundColor: requireGFE ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
              <Text style={{ color: requireGFE ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>
                {requireGFE ? '✅ GFE Required — Patients must have an active NP-signed GFE on file' : '⬜ GFE Optional — Techs can proceed without a GFE on file'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[sStyles.primaryBtn, { backgroundColor: primaryColor, marginTop: 24, opacity: savingSettings ? 0.6 : 1 }]}
            onPress={saveSettings}
            disabled={savingSettings}
          >
            {savingSettings ? <ActivityIndicator color={secondaryColor} /> : <Text style={[sStyles.primaryBtnText, { color: secondaryColor }]}>Save Settings</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  )
}

// ─── MAIN SOLO SCREEN ─────────────────────────────────────────────────────────

export default function SoloHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const [activeTab, setActiveTab] = useState('dispatch')

  const TABS = [
    { key: 'dispatch', label: 'Dispatch', icon: '📋' },
    { key: 'tech', label: 'My Calls', icon: '🚗' },
    { key: 'admin', label: 'Admin', icon: '⚙️' },
  ]

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            {company?.logoUrl ? (
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: primaryColor + '20', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 }}>
                <Image source={{ uri: company.logoUrl }} style={{ width: 38, height: 38, resizeMode: 'contain' }} />
              </View>
            ) : (
              <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 }}>{company?.name}</Text>
            )}
            <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700' }}>
              {activeTab === 'dispatch' ? 'Dispatch' : activeTab === 'tech' ? 'My Calls' : 'Admin'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user?.firstName} {user?.lastName} · SOLO</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dispatch' && (
          <DispatchSection token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} navigation={navigation} user={user} company={company} />
        )}
        {activeTab === 'tech' && (
          <TechSection token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} navigation={navigation} user={user} company={company} />
        )}
        {activeTab === 'admin' && (
          <AdminSection token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} company={company} />
        )}
      </View>

      {/* Bottom Tab Bar */}
      <View style={[styles.bottomBar, { backgroundColor: secondaryColor }]}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.bottomTab, activeTab === tab.key && { borderTopWidth: 2, borderTopColor: primaryColor }]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={{ fontSize: 20, marginBottom: 3 }}>{tab.icon}</Text>
            <Text style={[styles.bottomTabText, { color: activeTab === tab.key ? primaryColor : 'rgba(255,255,255,0.4)' }]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────

const sStyles = StyleSheet.create({
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 8 },
  primaryBtn: { borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancelBtn: { padding: 16, alignItems: 'center', marginTop: 4 },
  cancelBtnText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#162260', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 6 },
  modalSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16 },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: { paddingTop: Platform.OS === 'web' ? 16 : 56, paddingBottom: 16, paddingHorizontal: 20 },
  bottomBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
  },
  bottomTab: {
    flex: 1,
    paddingTop: 12,
    paddingBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  bottomTabText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
})