import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
  Modal, KeyboardAvoidingView, Platform, Image, Vibration
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'

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
  { key: 'benadryl_im_1', label: 'Benadryl 25mg/0.5ml IM' },
  { key: 'benadryl_im_2', label: 'Benadryl 25mg/0.5ml IM (2nd Dose)' },
  { key: 'glutathione_im', label: 'Glutathione 200mg/ml IM (max 600mg/3ml)' },
  { key: 'b12_im', label: 'Methylcobalamin B12 5000mg/ml 1ml IM' },
]
const IV_SITES = ['L AC', 'R AC', 'L Hand', 'R Hand', 'L Forearm', 'R Forearm', 'L Wrist', 'R Wrist', 'Does Not Apply']
const CATHETER_SIZES = ['18g', '20g', '22g', '24g', 'Does Not Apply']
const IV_FLUIDS = ['Normal Saline 250mls', 'Normal Saline 500mls', 'Normal Saline 1000mls', 'Lactated Ringers 500mls', 'Lactated Ringers 1000mls']

// ── Shared sub-components ──────────────────────────────────────────────────
const MedRow = ({ item, medSet, setMedSet, showDose, primaryColor, secondaryColor, locked }) => {
  const checked = !!medSet[item.key]
  const toggle = () => { if (locked) return; setMedSet(prev => ({ ...prev, [item.key]: prev[item.key] ? null : { time: '', dose: '' } })) }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
      <TouchableOpacity style={[cSt.checkbox, checked && { backgroundColor: primaryColor, borderColor: primaryColor }]} onPress={toggle}>
        {checked && <Text style={{ color: secondaryColor, fontSize: 12 }}>✓</Text>}
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={{ color: locked ? 'rgba(255,255,255,0.4)' : '#fff', fontSize: 13 }}>{item.label}</Text>
        {checked && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
            <TextInput style={[cSt.input, { flex: 1 }]} placeholder="Time" placeholderTextColor="#666" value={medSet[item.key]?.time || ''} onChangeText={t => setMedSet(prev => ({ ...prev, [item.key]: { ...prev[item.key], time: t } }))} editable={!locked} />
            {showDose && <TextInput style={[cSt.input, { flex: 1 }]} placeholder="Dose" placeholderTextColor="#666" value={medSet[item.key]?.dose || ''} onChangeText={d => setMedSet(prev => ({ ...prev, [item.key]: { ...prev[item.key], dose: d } }))} editable={!locked} />}
          </View>
        )}
      </View>
    </View>
  )
}

const SelectRow = ({ label, options, value, onSelect, primaryColor, secondaryColor, locked }) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={cSt.fieldLabel}>{label}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(opt => (
        <TouchableOpacity key={opt} style={[cSt.optionBtn, value === opt && { backgroundColor: primaryColor, borderColor: primaryColor }]} onPress={() => { if (!locked) onSelect(opt) }}>
          <Text style={[cSt.optionText, value === opt && { color: secondaryColor }]}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
)

const cSt = StyleSheet.create({
  checkbox: { width: 22, height: 22, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 4, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 12, fontSize: 14, color: '#fff', marginBottom: 10 },
  fieldLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  optionBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 8 },
  optionText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },
  section: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, marginBottom: 12, padding: 16 },
})

// ── Chart Modal ────────────────────────────────────────────────────────────
function SoloChartModal({ visible, onClose, call, token, company, patientName, patientDob, gfeRequired }) {
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
    if (visible && call?.call_id) {
      fetch(`${API_URL}/charts/call/${call.call_id}?patientName=${encodeURIComponent(patientName)}`, { headers })
        .then(r => r.json())
        .then(data => {
          if (data.chart) {
            const c = data.chart
            setChartId(c.id); setChiefComplaint(c.chief_complaint || '')
            setMedicalHistoryChanges(c.medical_history_changes || ''); setAllergiesDetail(c.allergies_detail || '')
            setBp(c.blood_pressure || ''); setHr(c.heart_rate?.toString() || '')
            setO2(c.oxygen_sat?.toString() || ''); setTemp(c.temperature?.toString() || '')
            setPainScale(c.pain_scale?.toString() || ''); setIvSite(c.iv_insertion_site || '')
            setCatheterSize(c.iv_catheter_size || ''); setIvSitePhoto(c.iv_site_photo || null)
            setIvAttempts(c.iv_attempts?.toString() || '1'); setIvTimeInitiated(c.iv_time_initiated || '')
            setIvFluids(c.iv_fluids_used || []); setIvMeds(c.prn_iv_medications || {})
            setBagAddons(c.prn_bag_addons || {}); setImInjections(c.prn_im_injections || {})
            setPostBp(c.vitals_post?.bp || ''); setPostHr(c.vitals_post?.hr || '')
            setPostO2(c.vitals_post?.o2 || ''); setPostTime(c.vitals_post?.time || '')
            setComplications(c.complications || 'No'); setComplicationsDetail(c.complications_detail || '')
            setCatheterStatus(c.iv_catheter_status || 'Normal and Intact')
            setIvTimeDiscontinued(c.iv_time_discontinued || ''); setTechNotes(c.tech_notes || '')
            setSavedStatus(c.status || '')
          } else {
            setChartId(null); setSavedStatus(''); setChiefComplaint(''); setMedicalHistoryChanges('')
            setAllergiesDetail(''); setBp(''); setHr(''); setO2(''); setTemp(''); setPainScale('')
            setVitalTime(''); setIvSite(''); setCatheterSize(''); setIvAttempts('1')
            setIvTimeInitiated(''); setIvFluids([]); setIvMeds({}); setBagAddons({}); setImInjections({})
            setPostBp(''); setPostHr(''); setPostO2(''); setPostTime('')
            setComplications('No'); setComplicationsDetail(''); setCatheterStatus('Normal and Intact')
            setIvTimeDiscontinued(''); setTechNotes('')
          }
        }).catch(() => {})
      fetch(`${API_URL}/tech/services`, { headers }).then(r => r.json()).then(d => setCompanyServices(d.services || [])).catch(() => {})
    }
  }, [visible, call?.call_id])

  const toggleFluid = (fluid) => { if (isLocked) return; setIvFluids(prev => prev.includes(fluid) ? prev.filter(f => f !== fluid) : [...prev, fluid]) }

  const takeIvSitePhoto = async () => {
    if (!chartId) { Alert.alert('Save Chart First', 'Please tap Save Draft before adding a photo'); return }
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) { const lib = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!lib.granted) { Alert.alert('Permission needed', 'Please allow camera or photo library access'); return } }
    Alert.alert('IV Site Photo', 'Choose source', [
      { text: '📷 Camera', onPress: async () => { const r = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true }); if (!r.canceled && r.assets[0].base64) await uploadIvPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`) } },
      { text: '🖼 Library', onPress: async () => { const r = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true }); if (!r.canceled && r.assets[0].base64) await uploadIvPhoto(`data:image/jpeg;base64,${r.assets[0].base64}`) } },
      { text: 'Cancel', style: 'cancel' }
    ])
  }

  const uploadIvPhoto = async (base64Photo) => {
    setUploadingIvPhoto(true)
    try {
      const res = await fetch(`${API_URL}/charts/${chartId}/photo`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ photo: base64Photo }) })
      const data = await res.json()
      if (data.success) { setIvSitePhoto(data.photoUrl); Alert.alert('✅ Photo Saved', 'IV site photo added to chart') }
      else Alert.alert('Error', data.error || 'Could not upload photo')
    } catch { Alert.alert('Error', 'Could not upload photo') }
    finally { setUploadingIvPhoto(false) }
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
        ivTimeInitiated: ivTimeInitiated || null, ivFluidsUsed: ivFluids,
        prnIvMedications: ivMeds, prnBagAddons: bagAddons, prnImInjections: imInjections,
        vitalsPost: { bp: postBp, hr: postHr, o2: postO2, time: postTime },
        complications, complicationsDetail, ivCatheterStatus: catheterStatus,
        ivTimeDiscontinued: ivTimeDiscontinued || null, techNotes, status: submit ? 'submitted' : 'open'
      }
      let res
      if (chartId) res = await fetch(`${API_URL}/charts/${chartId}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      else res = await fetch(`${API_URL}/charts`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const resp = await res.json()
      if (resp.success) {
        const savedId = chartId || resp.chart?.id
        if (!chartId && resp.chart?.id) setChartId(resp.chart.id)
        if (savedId && selectedServices.length > 0) {
          await fetch(`${API_URL}/charts/${savedId}/services`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ services: selectedServices }) }).catch(() => {})
        }
        if (submit) { setSavedStatus('submitted'); Alert.alert('✅ Chart Submitted', 'Chart has been saved.'); onClose() }
      } else Alert.alert('Error', resp.message || 'Could not save chart')
    } catch { Alert.alert('Error', 'Network error') }
    finally { setSaving(false) }
  }

  const submitAmendment = async () => {
    if (!amendmentText.trim()) { Alert.alert('Required', 'Please enter amendment notes'); return }
    try {
      const res = await fetch(`${API_URL}/charts/${chartId}/amend`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ amendmentNotes: amendmentText }) })
      const data = await res.json()
      if (data.success) { Alert.alert('✅ Amendment Saved'); setAmendmentText(''); setSavedStatus('amended') }
      else Alert.alert('Error', data.error || 'Could not save amendment')
    } catch { Alert.alert('Error', 'Network error') }
  }

  if (!visible) return null
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a1a' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ paddingTop: Platform.OS === 'ios' ? 56 : 16, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
          <TouchableOpacity onPress={() => { if (!isLocked) saveChart(false); onClose() }}>
            <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>{isLocked ? '← Back' : '← Save & Back'}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Chart</Text>
            {isLocked && <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700' }}>🔒 SUBMITTED</Text>}
          </View>
          {!isLocked ? <TouchableOpacity onPress={() => saveChart(false)}><Text style={{ color: primaryColor, fontSize: 14 }}>{saving ? '...' : 'Save'}</Text></TouchableOpacity> : <View style={{ width: 40 }} />}
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{patientName || call?.patient_name}</Text>
          {isLocked && (
            <View style={{ backgroundColor: 'rgba(255,152,0,0.1)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 12, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: '#FF9800', fontSize: 13, fontWeight: '700' }}>🔒 Chart submitted and locked.</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Use amendment section below to add notes.</Text>
            </View>
          )}
          <View style={cSt.section}>
            <Text style={[cSt.sectionTitle, { color: primaryColor }]}>NURSING ASSESSMENT</Text>
            <Text style={cSt.fieldLabel}>Chief Complaint *</Text>
            <TextInput style={[cSt.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Chief complaint..." placeholderTextColor="#666" value={chiefComplaint} onChangeText={setChiefComplaint} multiline editable={!isLocked} />
            <Text style={cSt.fieldLabel}>Changes to Medical History / Medications</Text>
            <TextInput style={cSt.input} placeholder="Any changes..." placeholderTextColor="#666" value={medicalHistoryChanges} onChangeText={setMedicalHistoryChanges} editable={!isLocked} />
            <Text style={cSt.fieldLabel}>Allergies & Reactions</Text>
            <TextInput style={cSt.input} placeholder="Allergies..." placeholderTextColor="#666" value={allergiesDetail} onChangeText={setAllergiesDetail} editable={!isLocked} />
          </View>
          <View style={cSt.section}>
            <Text style={[cSt.sectionTitle, { color: primaryColor }]}>INITIAL VITALS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>BP (mmHg)</Text><TextInput style={cSt.input} placeholder="120/80" placeholderTextColor="#666" value={bp} onChangeText={setBp} editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>Pulse (BPM)</Text><TextInput style={cSt.input} placeholder="72" placeholderTextColor="#666" value={hr} onChangeText={setHr} keyboardType="numeric" editable={!isLocked} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>O2 Sat (%)</Text><TextInput style={cSt.input} placeholder="98" placeholderTextColor="#666" value={o2} onChangeText={setO2} keyboardType="numeric" editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>Temp (°C)</Text><TextInput style={cSt.input} placeholder="36.8" placeholderTextColor="#666" value={temp} onChangeText={setTemp} keyboardType="decimal-pad" editable={!isLocked} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>Pain Scale (1-10)</Text><TextInput style={cSt.input} placeholder="0" placeholderTextColor="#666" value={painScale} onChangeText={setPainScale} keyboardType="numeric" editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>Time</Text><TextInput style={cSt.input} placeholder="2:30 PM" placeholderTextColor="#666" value={vitalTime} onChangeText={setVitalTime} editable={!isLocked} /></View>
            </View>
          </View>
          <View style={cSt.section}>
            <Text style={[cSt.sectionTitle, { color: primaryColor }]}>IV INSERTION</Text>
            <SelectRow label="IV Site" options={IV_SITES} value={ivSite} onSelect={setIvSite} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            <SelectRow label="Catheter Size" options={CATHETER_SIZES} value={catheterSize} onSelect={setCatheterSize} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            <View style={{ marginVertical: 8 }}>
              <Text style={cSt.fieldLabel}>IV SITE PHOTO</Text>
              {ivSitePhoto ? (
                <View>
                  <Image source={{ uri: ivSitePhoto }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />
                  {!isLocked && <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={takeIvSitePhoto}><Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>📷 Retake Photo</Text></TouchableOpacity>}
                </View>
              ) : !isLocked && (
                <TouchableOpacity style={{ borderWidth: 2, borderColor: primaryColor, borderStyle: 'dashed', borderRadius: 10, padding: 20, alignItems: 'center' }} onPress={takeIvSitePhoto} disabled={uploadingIvPhoto}>
                  {uploadingIvPhoto ? <ActivityIndicator color={primaryColor} /> : <><Text style={{ fontSize: 28, marginBottom: 6 }}>📷</Text><Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>Add IV Site Photo</Text></>}
                </TouchableOpacity>
              )}
            </View>
            <SelectRow label="Attempts" options={['1', '2', '3']} value={ivAttempts} onSelect={setIvAttempts} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            <Text style={cSt.fieldLabel}>Time IV Initiated</Text>
            <TextInput style={cSt.input} placeholder="2:35 PM" placeholderTextColor="#666" value={ivTimeInitiated} onChangeText={setIvTimeInitiated} editable={!isLocked} />
            <Text style={cSt.fieldLabel}>Fluids Used</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {IV_FLUIDS.map(fluid => (
                <TouchableOpacity key={fluid} style={[cSt.optionBtn, ivFluids.includes(fluid) && { backgroundColor: primaryColor, borderColor: primaryColor }]} onPress={() => toggleFluid(fluid)}>
                  <Text style={[cSt.optionText, ivFluids.includes(fluid) && { color: secondaryColor }]}>{fluid}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={cSt.section}>
            <Text style={[cSt.sectionTitle, { color: primaryColor }]}>SERVICES ADMINISTERED</Text>
            {selectedServices.map((svc, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{svc.name}</Text>{svc.price && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>${svc.price}</Text>}</View>
                {!isLocked && <TouchableOpacity onPress={() => setSelectedServices(prev => prev.filter((_, idx) => idx !== i))}><Text style={{ color: '#f09090', fontSize: 20, paddingHorizontal: 8 }}>×</Text></TouchableOpacity>}
              </View>
            ))}
            {!isLocked && <TouchableOpacity style={{ borderWidth: 1, borderColor: primaryColor, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 }} onPress={() => setShowServicePicker(true)}><Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>+ Add Service</Text></TouchableOpacity>}
          </View>
          <Modal visible={showServicePicker} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#0D1B4B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Select Service</Text>
                <ScrollView>
                  {companyServices.map(svc => {
                    const isSelected = selectedServices.some(s => s.id === svc.id)
                    return (
                      <TouchableOpacity key={svc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }} onPress={() => { if (isSelected) setSelectedServices(prev => prev.filter(s => s.id !== svc.id)); else setSelectedServices(prev => [...prev, { id: svc.id, name: svc.name, price: svc.price }]) }}>
                        <View style={{ flex: 1 }}><Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{svc.name}</Text>{svc.price && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>${svc.price}</Text>}</View>
                        <Text style={{ color: isSelected ? primaryColor : 'rgba(255,255,255,0.2)', fontSize: 22 }}>{isSelected ? '✓' : '+'}</Text>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>
                <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 }} onPress={() => setShowServicePicker(false)}><Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Done</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>
          <View style={cSt.section}><Text style={[cSt.sectionTitle, { color: primaryColor }]}>PRN IV MEDICATIONS</Text>{IV_MEDICATIONS.map(item => <MedRow key={item.key} item={item} medSet={ivMeds} setMedSet={setIvMeds} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />)}</View>
          <View style={cSt.section}><Text style={[cSt.sectionTitle, { color: primaryColor }]}>PRN BAG ADD-ONS</Text>{BAG_ADDONS.map(item => <MedRow key={item.key} item={item} medSet={bagAddons} setMedSet={setBagAddons} showDose primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />)}</View>
          <View style={cSt.section}><Text style={[cSt.sectionTitle, { color: primaryColor }]}>IM INJECTIONS</Text>{IM_INJECTIONS.map(item => <MedRow key={item.key} item={item} medSet={imInjections} setMedSet={setImInjections} showDose primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />)}</View>
          <View style={cSt.section}>
            <Text style={[cSt.sectionTitle, { color: primaryColor }]}>POST INFUSION VITALS</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>BP</Text><TextInput style={cSt.input} placeholder="120/80" placeholderTextColor="#666" value={postBp} onChangeText={setPostBp} editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>Pulse</Text><TextInput style={cSt.input} placeholder="72" placeholderTextColor="#666" value={postHr} onChangeText={setPostHr} keyboardType="numeric" editable={!isLocked} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>O2 Sat</Text><TextInput style={cSt.input} placeholder="98" placeholderTextColor="#666" value={postO2} onChangeText={setPostO2} keyboardType="numeric" editable={!isLocked} /></View>
              <View style={{ flex: 1 }}><Text style={cSt.fieldLabel}>Time</Text><TextInput style={cSt.input} placeholder="3:30 PM" placeholderTextColor="#666" value={postTime} onChangeText={setPostTime} editable={!isLocked} /></View>
            </View>
          </View>
          <View style={cSt.section}>
            <Text style={[cSt.sectionTitle, { color: primaryColor }]}>POST INFUSION ASSESSMENT</Text>
            <SelectRow label="Complications?" options={['No', 'Yes']} value={complications} onSelect={setComplications} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            {complications === 'Yes' && (<><Text style={cSt.fieldLabel}>Please explain</Text><TextInput style={[cSt.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Describe..." placeholderTextColor="#666" value={complicationsDetail} onChangeText={setComplicationsDetail} multiline editable={!isLocked} /></>)}
            <SelectRow label="Catheter Status on Removal" options={['Normal and Intact', 'Broken, Severed']} value={catheterStatus} onSelect={setCatheterStatus} primaryColor={primaryColor} secondaryColor={secondaryColor} locked={isLocked} />
            <Text style={cSt.fieldLabel}>Time IV Discontinued</Text>
            <TextInput style={cSt.input} placeholder="3:30 PM" placeholderTextColor="#666" value={ivTimeDiscontinued} onChangeText={setIvTimeDiscontinued} editable={!isLocked} />
            <Text style={cSt.fieldLabel}>Tech Notes</Text>
            <TextInput style={[cSt.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Any additional notes..." placeholderTextColor="#666" value={techNotes} onChangeText={setTechNotes} multiline editable={!isLocked} />
          </View>
          {gfeRequired && !isLocked && (
            <TouchableOpacity style={{ borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 10, borderWidth: 1, borderColor: primaryColor }} onPress={async () => {
              if (!chartId) { Alert.alert('Save First', 'Please save the chart before requesting a GFE'); return }
              try {
                const res = await fetch(`${API_URL}/gfe/request`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ callId: call?.call_id, chartId }) })
                const data = await res.json()
                if (data.success) Alert.alert('✅ GFE Requested', 'Your NP has been notified')
                else Alert.alert('Error', data.message || 'Could not request GFE')
              } catch { Alert.alert('Error', 'Network error') }
            }}>
              <Text style={{ color: primaryColor, fontSize: 15, fontWeight: '700' }}>🩺 Request GFE from NP</Text>
            </TouchableOpacity>
          )}
          {!isLocked && (
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 16, backgroundColor: primaryColor }, saving && { opacity: 0.6 }]} onPress={() => Alert.alert('Submit Chart', 'Submit this chart? It will be locked after submission.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Submit', onPress: () => saveChart(true) }])} disabled={saving}>
              {saving ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ fontSize: 16, fontWeight: '700', color: secondaryColor }}>Submit Chart</Text>}
            </TouchableOpacity>
          )}
          {isLocked && (
            <View style={{ backgroundColor: 'rgba(255,152,0,0.08)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={[cSt.sectionTitle, { color: '#FF9800' }]}>📝 ADD AMENDMENT</Text>
              <TextInput style={[cSt.input, { height: 120, textAlignVertical: 'top' }]} placeholder="Describe what you are correcting or adding..." placeholderTextColor="#666" value={amendmentText} onChangeText={setAmendmentText} multiline />
              <TouchableOpacity style={{ backgroundColor: '#FF9800', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 }} onPress={submitAmendment}>
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

// ── Main Solo Screen ───────────────────────────────────────────────────────
export default function SoloHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [activeSection, setActiveSection] = useState('dispatch') // 'dispatch' | 'tech' | 'admin'
  const [refreshing, setRefreshing] = useState(false)

  // ── Dispatch state ──
  const [dispatchTab, setDispatchTab] = useState('queue')
  const [queue, setQueue] = useState([])
  const [scheduled, setScheduled] = useState([])
  const [log, setLog] = useState([])
  const [dispatchLoading, setDispatchLoading] = useState(true)
  const [newBookingModal, setNewBookingModal] = useState(false)
  const [nbService, setNbService] = useState('')
  const [nbAddress, setNbAddress] = useState('')
  const [nbPatientName, setNbPatientName] = useState('')
  const [nbPatientPhone, setNbPatientPhone] = useState('')
  const [nbNotes, setNbNotes] = useState('')
  const [nbTime, setNbTime] = useState('')
  const [creatingBooking, setCreatingBooking] = useState(false)
  const [services, setServices] = useState([])

  // ── Tech state ──
  const [call, setCall] = useState(null)
  const [techLoading, setTechLoading] = useState(true)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [onSceneSeconds, setOnSceneSeconds] = useState(0)
  const [showChart, setShowChart] = useState(false)
  const [chartPatient, setChartPatient] = useState(null)
  const [npOrders, setNpOrders] = useState(null)
  const [showNpOrders, setShowNpOrders] = useState(false)
  const [patientPerks, setPatientPerks] = useState(null)
  const [redeemingPerk, setRedeemingPerk] = useState(false)
  const timerRef = useRef(null)

  // ── Admin state ──
  const [adminTab, setAdminTab] = useState('patients')
  const [psQuery, setPsQuery] = useState('')
  const [psResults, setPsResults] = useState([])
  const [psSearching, setPsSearching] = useState(false)
  const [psSelectedPatient, setPsSelectedPatient] = useState(null)
  const [psProfileModal, setPsProfileModal] = useState(false)
  const [psProfileData, setPsProfileData] = useState(null)
  const [psLoadingProfile, setPsLoadingProfile] = useState(false)
  const [psActiveTab, setPsActiveTab] = useState('overview')
  const [announcements, setAnnouncements] = useState([])
  const [announcementModal, setAnnouncementModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [anTitle, setAnTitle] = useState('')
  const [anBody, setAnBody] = useState('')
  const [anEmoji, setAnEmoji] = useState('📢')
  const [anCtaLabel, setAnCtaLabel] = useState('')
  const [anCtaUrl, setAnCtaUrl] = useState('')
  const [anBgColor, setAnBgColor] = useState('')
  const [anActive, setAnActive] = useState(true)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [auditLogs, setAuditLogs] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [adminServices, setAdminServices] = useState([])
  const [gfeRequired, setGfeRequired] = useState(company?.gfeRequired || false)
  const [savingGfe, setSavingGfe] = useState(false)
  const [newServiceModal, setNewServiceModal] = useState(false)
  const [svcName, setSvcName] = useState('')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcDuration, setSvcDuration] = useState('')
  const [savingService, setSavingService] = useState(false)

  // ── Fetch dispatch data ──
  const fetchDispatch = useCallback(async () => {
    try {
      const [qRes, sRes] = await Promise.all([
        fetch(`${API_URL}/dispatch/queue`, { headers }),
        fetch(`${API_URL}/admin/services`, { headers })
      ])
      const [qData, sData] = await Promise.all([qRes.json(), sRes.json()])
      if (qData.queue) {
        setQueue(qData.queue.filter(b => b.status === 'pending'))
        setScheduled(qData.queue.filter(b => ['confirmed', 'assigned', 'en_route', 'on_scene'].includes(b.status)))
      }
      if (sData.services) { setServices(sData.services); setAdminServices(sData.services) }
    } catch (err) { console.error('Dispatch fetch error:', err) }
    finally { setDispatchLoading(false); setRefreshing(false) }
  }, [token])

  const fetchLog = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dispatch/log`, { headers })
      const data = await res.json()
      if (data.log) setLog(data.log)
    } catch (err) { console.error('Log fetch error:', err) }
  }, [token])

  // ── Fetch tech/call data ──
  const fetchCall = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tech/my-call`, { headers })
      const data = await res.json()
      if (data.success) {
        setCall(data.call)
        if (data.call?.user_id) {
          fetch(`${API_URL}/gfe/patient-orders/${data.call.user_id}`, { headers }).then(r => r.json()).then(d => { if (d.hasActiveGFE) setNpOrders(d.orders); else setNpOrders(null) }).catch(() => {})
          fetch(`${API_URL}/perks/patient/${data.call.user_id}`, { headers }).then(r => r.json()).then(d => { if (d.hasPerks) setPatientPerks(d); else setPatientPerks(null) }).catch(() => {})
        }
        if (data.call?.tech_status === 'on_scene' && data.call?.tech_onscene_at) {
          setOnSceneSeconds(Math.floor((Date.now() - new Date(data.call.tech_onscene_at).getTime()) / 1000))
        }
      }
    } catch (err) { console.error('Call fetch error:', err) }
    finally { setTechLoading(false); setRefreshing(false) }
  }, [token])

  // ── Fetch admin data ──
  const fetchAnnouncements = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/admin/announcements`, { headers })
      const data = await res.json()
      if (data.announcements) setAnnouncements(data.announcements.filter(a => a.target === 'patient'))
    } catch (err) { console.error('Announcements fetch error:', err) }
  }, [token])

  const fetchAuditLog = useCallback(async () => {
    setAuditLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/audit-log?limit=50&excludeStatus=true`, { headers })
      const data = await res.json()
      if (data.logs) setAuditLogs(data.logs)
    } catch (err) { console.error('Audit log error:', err) }
    finally { setAuditLoading(false) }
  }, [token])

  useEffect(() => { fetchDispatch(); fetchCall() }, [])
  useEffect(() => { if (dispatchTab === 'log') fetchLog() }, [dispatchTab])
  useEffect(() => { if (activeSection === 'admin' && adminTab === 'announcements') fetchAnnouncements() }, [activeSection, adminTab])
  useEffect(() => { if (activeSection === 'admin' && adminTab === 'audit') fetchAuditLog() }, [activeSection, adminTab])

  useEffect(() => {
    const interval = setInterval(() => { fetchDispatch(); fetchCall() }, 15000)
    return () => clearInterval(interval)
  }, [])

  // ── On scene timer ──
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

  const onRefresh = () => { setRefreshing(true); fetchDispatch(); fetchCall() }

  const formatTimer = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  const updateStatus = async (newStatus) => {
    if (!call) return
    setUpdatingStatus(true)
    try {
      const res = await fetch(`${API_URL}/tech/status`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, bookingId: call.id }) })
      const data = await res.json()
      if (data.success) fetchCall()
      else Alert.alert('Error', data.message || 'Could not update status')
    } catch { Alert.alert('Error', 'Network error') }
    finally { setUpdatingStatus(false) }
  }

  const handleStatusChange = (newStatus) => {
    const messages = { en_route: 'Mark yourself as En Route?', on_scene: 'Mark yourself as On Scene?', clear: 'Mark this call as Complete?' }
    Alert.alert('Update Status', messages[newStatus], [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => updateStatus(newStatus) }])
  }

  const createBooking = async () => {
    if (!nbPatientName || !nbAddress || !nbService) { Alert.alert('Required', 'Patient name, address, and service are required'); return }
    setCreatingBooking(true)
    try {
      const res = await fetch(`${API_URL}/dispatch/bookings`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientName: nbPatientName, patientPhone: nbPatientPhone, address: nbAddress, service: nbService, notes: nbNotes, requestedTime: nbTime || null, source: 'phone' })
      })
      const data = await res.json()
      if (data.success) {
        setNewBookingModal(false)
        setNbPatientName(''); setNbPatientPhone(''); setNbAddress(''); setNbService(''); setNbNotes(''); setNbTime('')
        fetchDispatch()
        Alert.alert('✅ Booking Created', 'The booking has been added to your queue.')
      } else Alert.alert('Error', data.message || 'Could not create booking')
    } catch { Alert.alert('Error', 'Network error') }
    finally { setCreatingBooking(false) }
  }

  const confirmBooking = async (bookingId) => {
    try {
      const res = await fetch(`${API_URL}/dispatch/bookings/${bookingId}/confirm`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedTechId: user?.id }) })
      const data = await res.json()
      if (data.success) { fetchDispatch(); fetchCall(); Alert.alert('✅ Confirmed', 'Booking confirmed and assigned to you.') }
      else Alert.alert('Error', data.message || 'Could not confirm booking')
    } catch { Alert.alert('Error', 'Network error') }
  }

  const searchPatients = async (q) => {
    setPsQuery(q)
    if (q.length < 2) { setPsResults([]); return }
    setPsSearching(true)
    try {
      const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(q)}`, { headers })
      const data = await res.json()
      if (data.patients) setPsResults(data.patients)
    } catch { console.error('Patient search error') }
    finally { setPsSearching(false) }
  }

  const openPatientProfile = async (patient) => {
    setPsSelectedPatient(patient); setPsProfileModal(true); setPsLoadingProfile(true); setPsActiveTab('overview')
    try {
      const res = await fetch(`${API_URL}/patients/${patient.id}/profile`, { headers })
      const data = await res.json()
      if (data.success) setPsProfileData(data)
      else Alert.alert('Error', 'Could not load patient profile')
    } catch { Alert.alert('Error', 'Network error') }
    finally { setPsLoadingProfile(false) }
  }

  const sendIntake = async (patientId) => {
    try {
      const res = await fetch(`${API_URL}/dispatch/create-patient`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ patientId }) })
      const data = await res.json()
      if (data.success) Alert.alert('✅ Sent', 'Intake form sent to patient.')
      else Alert.alert('Error', data.message || 'Could not send intake')
    } catch { Alert.alert('Error', 'Network error') }
  }

  const toggleGfeRequired = async () => {
    setSavingGfe(true)
    try {
      const res = await fetch(`${API_URL}/admin/settings`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ gfeRequired: !gfeRequired }) })
      const data = await res.json()
      if (data.success) setGfeRequired(!gfeRequired)
      else Alert.alert('Error', data.message || 'Could not update setting')
    } catch { Alert.alert('Error', 'Network error') }
    finally { setSavingGfe(false) }
  }

  const saveAnnouncement = async () => {
    if (!anTitle.trim()) { Alert.alert('Required', 'Title is required'); return }
    const patientAnnouncements = announcements.filter(a => a.target === 'patient' || !a.target)
    if (!editingAnnouncement && patientAnnouncements.length >= 1) { Alert.alert('Limit Reached', 'Solo plan allows 1 patient announcement. Delete the existing one first.'); return }
    setSavingAnnouncement(true)
    try {
      const payload = { title: anTitle, body: anBody, emoji: anEmoji, ctaLabel: anCtaLabel, ctaUrl: anCtaUrl, bgStyle: 'solid', bgColor: anBgColor, active: anActive, sortOrder: 0, target: 'patient' }
      if (editingAnnouncement) await fetch(`${API_URL}/admin/announcements/${editingAnnouncement.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      else await fetch(`${API_URL}/admin/announcements`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      setAnnouncementModal(false); fetchAnnouncements()
    } catch { Alert.alert('Error', 'Could not save announcement') }
    finally { setSavingAnnouncement(false) }
  }

  const createService = async () => {
    if (!svcName || !svcPrice) { Alert.alert('Required', 'Service name and price are required'); return }
    setSavingService(true)
    try {
      const res = await fetch(`${API_URL}/admin/services`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: svcName, price: svcPrice, duration: svcDuration }) })
      const data = await res.json()
      if (data.success) { setNewServiceModal(false); setSvcName(''); setSvcPrice(''); setSvcDuration(''); fetchDispatch(); Alert.alert('✅ Added', `${svcName} added.`) }
      else Alert.alert('Error', data.message || 'Could not add service')
    } catch { Alert.alert('Error', 'Network error') }
    finally { setSavingService(false) }
  }

  const timerWarning = onSceneSeconds >= 3300
  const timerDanger = onSceneSeconds >= 3600

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <SoloChartModal visible={showChart} onClose={() => { setShowChart(false); setChartPatient(null); fetchCall() }} call={call} token={token} company={company} patientName={chartPatient?.name} patientDob={chartPatient?.dob} gfeRequired={gfeRequired} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            {company?.logoUrl ? (
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: primaryColor + '20', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 4 }}>
                <Image source={{ uri: company.logoUrl }} style={{ width: 36, height: 36, resizeMode: 'contain' }} />
              </View>
            ) : <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600', marginBottom: 2 }}>{company?.name}</Text>}
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>
              {activeSection === 'dispatch' ? '📋 My Bookings' : activeSection === 'tech' ? '📞 My Call' : '⚙️ My Practice'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{user?.firstName} · Solo Operator</Text>
          </View>
          {call && activeSection !== 'tech' && (
            <TouchableOpacity style={{ backgroundColor: STATUS_COLORS[call.tech_status || call.status] + '33', borderWidth: 1, borderColor: STATUS_COLORS[call.tech_status || call.status], borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => setActiveSection('tech')}>
              <Text style={{ color: STATUS_COLORS[call.tech_status || call.status], fontSize: 11, fontWeight: '700' }}>ACTIVE CALL ›</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })} style={{ marginLeft: 12 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── DISPATCH SECTION ── */}
      {activeSection === 'dispatch' && (
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
            {['queue', 'scheduled', 'log'].map(tab => (
              <TouchableOpacity key={tab} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: dispatchTab === tab ? primaryColor : 'transparent' }} onPress={() => setDispatchTab(tab)}>
                <Text style={{ color: dispatchTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600' }}>
                  {tab === 'queue' ? `📥 Queue${queue.length > 0 ? ` (${queue.length})` : ''}` : tab === 'scheduled' ? '📅 Scheduled' : '📋 Log'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {dispatchTab === 'queue' && (
            <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
              <TouchableOpacity style={{ margin: 16, backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }} onPress={() => setNewBookingModal(true)}>
                <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>+ New Booking</Text>
              </TouchableOpacity>
              {queue.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📭</Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No pending bookings</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>New bookings will appear here</Text>
                </View>
              ) : queue.map(b => (
                <View key={b.id} style={styles.card}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }}>{b.patient_name}</Text>
                    <View style={{ backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ color: primaryColor, fontSize: 10, fontWeight: '700' }}>PENDING</Text>
                    </View>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 }}>{b.service}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>📍 {b.address}</Text>
                  {b.requested_time && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 12 }}>🕐 {new Date(b.requested_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>}
                  <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center' }} onPress={() => Alert.alert('Confirm Booking', `Confirm and assign this booking to yourself?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => confirmBooking(b.id) }])}>
                    <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>✅ Confirm & Assign to Me</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {dispatchTab === 'scheduled' && (
            <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
              <View style={{ padding: 16 }}>
                {scheduled.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingTop: 60 }}>
                    <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No scheduled calls</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Confirmed bookings appear here</Text>
                  </View>
                ) : scheduled.map(b => (
                  <View key={b.id} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: STATUS_COLORS[b.status] || primaryColor }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{b.patient_name}</Text>
                      <Text style={{ color: STATUS_COLORS[b.status] || primaryColor, fontSize: 11, fontWeight: '700' }}>{b.status?.toUpperCase()}</Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 }}>{b.service}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>📍 {b.address}</Text>
                    {b.requested_time && <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>🕐 {new Date(b.requested_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>}
                  </View>
                ))}
              </View>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {dispatchTab === 'log' && (
            <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchLog} tintColor={primaryColor} />}>
              {log.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}>
                  <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No completed calls today</Text>
                </View>
              ) : log.map(entry => (
                <View key={entry.id} style={[styles.card, { borderLeftWidth: 3, borderLeftColor: entry.status === 'completed' ? '#4CAF50' : '#f09090' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{entry.patient_name}</Text>
                    <Text style={{ color: entry.status === 'completed' ? '#4CAF50' : '#f09090', fontSize: 11, fontWeight: '700' }}>{entry.status?.toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>{entry.service}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 4 }}>📍 {entry.address}</Text>
                  {entry.seconds_on_scene && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>⏱ {formatTimer(entry.seconds_on_scene)} on scene</Text>}
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>🕐 {new Date(entry.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  {(entry.status === 'cancelled' || entry.status === 'no_show') && entry.cancellation_disposition && (
                    <View style={{ backgroundColor: 'rgba(240,144,144,0.08)', borderRadius: 8, padding: 8, marginTop: 8, borderLeftWidth: 3, borderLeftColor: '#f09090' }}>
                      <Text style={{ color: '#f09090', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 }}>CANCEL REASON</Text>
                      <Text style={{ color: '#fff', fontSize: 12 }}>{entry.cancellation_disposition}{entry.cancellation_reason ? ` — ${entry.cancellation_reason}` : ''}</Text>
                    </View>
                  )}
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* ── TECH SECTION ── */}
      {activeSection === 'tech' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          {call?.tech_status === 'on_scene' && (
            <TouchableOpacity style={styles.emergencyButton} onPress={() => Alert.alert('🚨 Emergency', 'Send emergency alert?', [{ text: 'Cancel', style: 'cancel' }, { text: 'SEND', style: 'destructive', onPress: () => { Vibration.vibrate([200, 100, 200, 100, 200]); Alert.alert('Alert Sent', 'Stay safe.') } }])}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 }}>🚨 EMERGENCY</Text>
            </TouchableOpacity>
          )}
          {techLoading ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}><ActivityIndicator color={primaryColor} size="large" /></View>
          ) : !call ? (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 64, marginBottom: 16 }}>📵</Text>
              <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 }}>No active call</Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', paddingHorizontal: 32 }}>Confirm a booking in Dispatch to start a call</Text>
              <TouchableOpacity style={{ marginTop: 24, backgroundColor: primaryColor, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 }} onPress={() => setActiveSection('dispatch')}>
                <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 15 }}>Go to Dispatch →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ marginHorizontal: 16, marginTop: 16, marginBottom: 16, borderWidth: 2, borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: STATUS_COLORS[call.tech_status || call.status] + '22', borderColor: STATUS_COLORS[call.tech_status || call.status] }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: STATUS_COLORS[call.tech_status || call.status] }}>{STATUS_LABELS[call.tech_status || call.status] || call.tech_status}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Call Details</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12 }}>{call.service}</Text>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 4 }}>📍 ADDRESS</Text>
                <Text style={{ fontSize: 15, color: '#fff' }}>{call.address}</Text>
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }} onPress={() => { const { Linking } = require('react-native'); const encoded = encodeURIComponent(call.address); const url = Platform.OS === 'ios' ? `maps://app?daddr=${encoded}` : `google.navigation:q=${encoded}`; Linking.canOpenURL(url).then(s => Linking.openURL(s ? url : `https://www.google.com/maps/dir/?api=1&destination=${encoded}`)) }}>
                  <Text style={{ fontSize: 18 }}>🗺</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Guide Me</Text>
                </TouchableOpacity>
                {call.notes && <><Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, marginBottom: 4 }}>📝 NOTES</Text><Text style={{ fontSize: 15, color: '#fff' }}>{call.notes}</Text></>}
              </View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Patient</Text>
                <Text style={{ fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8 }}>{call.patient_name}</Text>
                {!call.has_valid_intake && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>⚠️ No intake on file</Text>}
                {call.patient_phone && <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>📞 {call.patient_phone}</Text>}
              </View>
              {call.tech_status === 'on_scene' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Actions</Text>
                  <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 }} onPress={() => { setChartPatient({ name: call.patient_name, dob: call.patient_dob }); setShowChart(true) }}>
                    <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>📋 Open Chart</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: primaryColor, borderRadius: 10, padding: 14, alignItems: 'center' }} onPress={() => navigation.navigate('BookingChat', { token, userId: user?.id || user?.userId, company, bookingId: call.id, patientName: call.patient_name })}>
                    <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>💬 Message Patient</Text>
                  </TouchableOpacity>
                </View>
              )}
              {npOrders && (
                <TouchableOpacity style={[styles.card, { borderWidth: 1, borderColor: npOrders.notACandidate ? '#e53e3e' : '#4CAF50' }]} onPress={() => setShowNpOrders(true)}>
                  <Text style={[styles.cardTitle, { color: npOrders.notACandidate ? '#e53e3e' : '#4CAF50' }]}>{npOrders.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ NP ORDERS ON FILE'}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Tap to view orders</Text>
                </TouchableOpacity>
              )}
              <Modal visible={showNpOrders} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: '#0D1B4B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '80%' }}>
                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20 }}>NP Orders</Text>
                    <ScrollView>
                      {npOrders?.approvedServices?.length > 0 && <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 16, marginBottom: 12 }}><Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>✅ APPROVED SERVICES</Text>{npOrders.approvedServices.map((s, i) => <Text key={i} style={{ color: '#fff', fontSize: 14, marginBottom: 4 }}>• {s}</Text>)}</View>}
                      {npOrders?.restrictions && <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 10, padding: 16, marginBottom: 12 }}><Text style={{ color: '#e53e3e', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>❌ RESTRICTIONS</Text><Text style={{ color: '#fff', fontSize: 14 }}>{npOrders.restrictions}</Text></View>}
                      {npOrders?.npOrders && <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, marginBottom: 12 }}><Text style={{ color: primaryColor, fontWeight: '700', fontSize: 13, marginBottom: 8 }}>📝 NP ORDERS</Text><Text style={{ color: '#fff', fontSize: 14, lineHeight: 22 }}>{npOrders.npOrders}</Text></View>}
                    </ScrollView>
                    <TouchableOpacity style={{ marginTop: 16, alignItems: 'center', padding: 12 }} onPress={() => setShowNpOrders(false)}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Close</Text></TouchableOpacity>
                  </View>
                </View>
              </Modal>
              {call.tech_status === 'on_scene' && patientPerks && (
                <View style={{ backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: '#C9A84C', borderRadius: 14, padding: 16, marginHorizontal: 16, marginBottom: 16 }}>
                  <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>⭐ PATIENT HAS ACTIVE PERKS</Text>
                  {patientPerks.referralPerks?.map(perk => (
                    <View key={perk.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{perk.perk_type === 'fixed' ? `$${perk.perk_amount} off` : `${perk.perk_amount}% off`}</Text>
                      <TouchableOpacity style={{ backgroundColor: '#C9A84C', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }} onPress={async () => { setRedeemingPerk(true); try { const res = await fetch(`${API_URL}/perks/redeem`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'referral', id: perk.id }) }); const data = await res.json(); if (data.success) { setPatientPerks(null); Alert.alert('✅ Redeemed!') } } catch {} finally { setRedeemingPerk(false) } }} disabled={redeemingPerk}>
                        <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 13 }}>Redeem</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
              {call.tech_status === 'on_scene' && (
                <View style={[{ marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1 }, timerDanger ? { borderColor: '#f09090', backgroundColor: 'rgba(240,144,144,0.1)' } : timerWarning ? { borderColor: '#E2C97E', backgroundColor: 'rgba(226,201,126,0.1)' } : { borderColor: 'rgba(255,255,255,0.1)' }]}>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>⏱ Time On Scene</Text>
                  <Text style={{ fontSize: 48, fontWeight: '700', color: timerDanger ? '#f09090' : timerWarning ? '#E2C97E' : '#fff', fontVariant: ['tabular-nums'] }}>{formatTimer(onSceneSeconds)}</Text>
                  {timerWarning && <Text style={{ fontSize: 13, color: timerDanger ? '#f09090' : '#E2C97E', marginTop: 8 }}>{timerDanger ? '⚠️ 60 min reached!' : '⚠️ Approaching 60 minutes'}</Text>}
                </View>
              )}
              {call.status !== 'completed' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Update Status</Text>
                  {(call.tech_status === 'assigned' || !call.tech_status) && <TouchableOpacity style={{ backgroundColor: '#2196F3', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 }} onPress={() => handleStatusChange('en_route')} disabled={updatingStatus}>{updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>🚗 I'm En Route</Text>}</TouchableOpacity>}
                  {call.tech_status === 'en_route' && <TouchableOpacity style={{ backgroundColor: '#4CAF50', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 }} onPress={() => handleStatusChange('on_scene')} disabled={updatingStatus}>{updatingStatus ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>📍 I'm On Scene</Text>}</TouchableOpacity>}
                  {call.tech_status === 'on_scene' && <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 8 }} onPress={() => handleStatusChange('clear')} disabled={updatingStatus}>{updatingStatus ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ fontSize: 16, fontWeight: '700', color: secondaryColor }}>✅ Call Complete — Go Clear</Text>}</TouchableOpacity>}
                </View>
              )}
              {call.status === 'completed' && (
                <View style={{ marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 14, padding: 32, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, marginBottom: 12 }}>⭐</Text>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#4CAF50', marginBottom: 8 }}>Call Complete!</Text>
                  <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>Great work.</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── ADMIN SECTION ── */}
      {activeSection === 'admin' && (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', flexGrow: 0 }}>
            <View style={{ flexDirection: 'row' }}>
              {['patients', 'services', 'announcements', 'audit', 'settings'].map(tab => (
                <TouchableOpacity key={tab} style={{ paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: adminTab === tab ? primaryColor : 'transparent' }} onPress={() => setAdminTab(tab)}>
                  <Text style={{ color: adminTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>
                    {tab === 'patients' ? '👤 Patients' : tab === 'services' ? '💉 Services' : tab === 'announcements' ? '📢 Announcements' : tab === 'audit' ? '📋 Audit' : '⚙️ Settings'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Patients */}
          {adminTab === 'patients' && (
            <View style={{ flex: 1 }}>
              <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 16, paddingVertical: 12 }}>
                <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, fontSize: 15, color: '#fff' }} placeholder="Search by name, email or phone..." placeholderTextColor="#666" value={psQuery} onChangeText={searchPatients} />
              </View>
              <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                {psSearching && <ActivityIndicator color={primaryColor} style={{ marginTop: 20 }} />}
                {!psSearching && psQuery.length >= 2 && psResults.length === 0 && <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No patients found</Text>}
                {psResults.map(patient => (
                  <TouchableOpacity key={patient.id} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }} onPress={() => openPatientProfile(patient)}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{patient.first_name} {patient.last_name}</Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{patient.phone || 'No phone'} · {patient.email}</Text>
                      <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{patient.total_bookings || 0} visits</Text>
                    </View>
                    <Text style={{ color: primaryColor, fontSize: 18 }}>›</Text>
                  </TouchableOpacity>
                ))}
                {!psSearching && psQuery.length < 2 && <View style={{ alignItems: 'center', paddingTop: 60 }}><Text style={{ fontSize: 40, marginBottom: 16 }}>🔍</Text><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>Search by name, email or phone</Text></View>}
                <View style={{ height: 40 }} />
              </ScrollView>
              {/* Patient profile modal */}
              <Modal visible={psProfileModal} animationType="slide" presentationStyle="fullScreen">
                <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
                  <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
                    <TouchableOpacity onPress={() => { setPsProfileModal(false); setPsProfileData(null) }}><Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text></TouchableOpacity>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Patient Profile</Text>
                    <View style={{ width: 60 }} />
                  </View>
                  {psLoadingProfile ? <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={primaryColor} size="large" /></View> : (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: primaryColor + '30', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: primaryColor, fontSize: 22, fontWeight: '700' }}>{psSelectedPatient?.first_name?.[0]}{psSelectedPatient?.last_name?.[0]}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>{psSelectedPatient?.first_name} {psSelectedPatient?.last_name}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{psSelectedPatient?.email}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center' }} onPress={() => sendIntake(psSelectedPatient.id)}>
                          <Text style={{ color: secondaryColor, fontSize: 13, fontWeight: '700' }}>📋 Send Intake</Text>
                        </TouchableOpacity>
                        {psProfileData?.patient?.phone && <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, alignItems: 'center' }} onPress={() => { const { Linking } = require('react-native'); Linking.openURL(`tel:${psProfileData.patient.phone}`) }}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>📞 Call</Text>
                        </TouchableOpacity>}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                        {[{ label: 'COMPLETED', value: psProfileData?.completedBookings || 0, color: primaryColor }, { label: 'CHARTS', value: psProfileData?.charts?.length || 0, color: '#4CAF50' }, { label: 'INTAKE', value: psProfileData?.intake ? '✓' : '✗', color: psProfileData?.intake ? '#4CAF50' : '#f09090' }].map(s => (
                          <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                            <Text style={{ color: s.color, fontSize: 20, fontWeight: '800' }}>{s.value}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600' }}>{s.label}</Text>
                          </View>
                        ))}
                      </View>
                      {psProfileData?.charts?.length > 0 && (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>RECENT CHARTS</Text>
                          {psProfileData.charts.slice(0, 3).map((ch, i) => (
                            <View key={i} style={{ paddingVertical: 8, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{ch.chief_complaint || 'Chart'}</Text>
                                <Text style={{ color: ch.status === 'submitted' ? '#4CAF50' : '#FF9800', fontSize: 11, fontWeight: '700' }}>{ch.status?.toUpperCase()}</Text>
                              </View>
                              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{new Date(ch.created_at).toLocaleDateString()}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {psProfileData?.intake && (
                        <View style={{ backgroundColor: 'rgba(76,175,80,0.08)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#4CAF50' }}>
                          <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: '700', marginBottom: 8 }}>✅ Intake on file</Text>
                          {psProfileData.intake.allergies_detail?.length > 0 && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600' }}>⚠️ Allergies: {Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail.join(', ') : psProfileData.intake.allergies_detail}</Text>}
                        </View>
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
              <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 }} onPress={() => setNewServiceModal(true)}>
                <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>+ Add Service</Text>
              </TouchableOpacity>
              {adminServices.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 40 }}><Text style={{ fontSize: 40, marginBottom: 12 }}>💉</Text><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No services yet</Text></View>
              ) : adminServices.map(svc => (
                <View key={svc.id} style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{svc.name}</Text>
                    {svc.duration && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{svc.duration}</Text>}
                  </View>
                  <Text style={{ color: primaryColor, fontSize: 18, fontWeight: '700' }}>${svc.price}</Text>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* Announcements */}
          {adminTab === 'announcements' && (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>👤 Patient Announcement</Text>
                  <Text style={{ color: announcements.length >= 1 ? '#f09090' : 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{announcements.length}/1 used</Text>
                </View>
                <TouchableOpacity style={{ backgroundColor: announcements.length >= 1 ? 'rgba(255,255,255,0.06)' : primaryColor, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, opacity: announcements.length >= 1 ? 0.5 : 1 }} disabled={announcements.length >= 1} onPress={() => { setEditingAnnouncement(null); setAnTitle(''); setAnBody(''); setAnEmoji('📢'); setAnCtaLabel(''); setAnCtaUrl(''); setAnBgColor(''); setAnActive(true); setAnnouncementModal(true) }}>
                  <Text style={{ color: announcements.length >= 1 ? 'rgba(255,255,255,0.3)' : secondaryColor, fontSize: 13, fontWeight: '700' }}>+ New</Text>
                </TouchableOpacity>
              </View>
              {announcements.length === 0 ? (
                <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No announcement yet</Text>
                </View>
              ) : announcements.map(an => (
                <View key={an.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: an.active ? primaryColor : '#aaa' }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>{an.emoji}</Text>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{an.title}</Text>
                      {an.body && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>{an.body}</Text>}
                    </View>
                    <View style={{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: an.active ? '#4CAF50' : '#aaa' }}>
                      <Text style={{ color: an.active ? '#4CAF50' : '#aaa', fontSize: 10, fontWeight: '700' }}>{an.active ? 'ACTIVE' : 'INACTIVE'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => { setEditingAnnouncement(an); setAnTitle(an.title); setAnBody(an.body || ''); setAnEmoji(an.emoji || '📢'); setAnCtaLabel(an.cta_label || ''); setAnCtaUrl(an.cta_url || ''); setAnBgColor(an.bg_color || ''); setAnActive(an.active); setAnnouncementModal(true) }}>
                      <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: '#f09090', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => Alert.alert('Delete', 'Delete this announcement?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await fetch(`${API_URL}/admin/announcements/${an.id}`, { method: 'DELETE', headers }); fetchAnnouncements() } }])}>
                      <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* Audit Log */}
          {adminTab === 'audit' && (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              {auditLoading ? <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} /> : auditLogs.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 60 }}><Text style={{ fontSize: 40, marginBottom: 12 }}>📋</Text><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No audit logs yet</Text></View>
              ) : auditLogs.map((log, i) => {
                const actionColor = log.action.includes('create') ? '#4CAF50' : log.action.includes('update') || log.action.includes('status') ? '#2196F3' : log.action.includes('view') ? primaryColor : log.action.includes('delete') ? '#f09090' : '#aaa'
                return (
                  <View key={i} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: actionColor }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: actionColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{log.action}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{new Date(log.created_at).toLocaleString()}</Text>
                    </View>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{log.first_name} {log.last_name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{log.resource} {log.resource_id ? `#${log.resource_id}` : ''}</Text>
                    {log.details && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{log.details}</Text>}
                  </View>
                )
              })}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* Settings */}
          {adminTab === 'settings' && (
            <ScrollView style={{ flex: 1, padding: 16 }}>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 16 }}>GFE SETTINGS</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Require GFE</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Enable if you work with an NP for patient approvals</Text>
                  </View>
                  <TouchableOpacity style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: gfeRequired ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={toggleGfeRequired} disabled={savingGfe}>
                    {savingGfe ? <ActivityIndicator color="#fff" size="small" /> : <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: gfeRequired ? 'flex-end' : 'flex-start' }} />}
                  </TouchableOpacity>
                </View>
                {gfeRequired && <Text style={{ color: '#4CAF50', fontSize: 12, marginTop: 12 }}>✅ GFE request button will appear in Tech during calls</Text>}
              </View>
              <TouchableOpacity style={{ backgroundColor: 'rgba(220,80,80,0.15)', borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 }} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
                <Text style={{ color: '#f09090', fontSize: 15, fontWeight: '500' }}>Log out</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      )}

      {/* ── BOTTOM TAB BAR ── */}
      <View style={[styles.bottomBar, { backgroundColor: secondaryColor }]}>
        {[
          { key: 'dispatch', icon: '📋', label: 'Dispatch', badge: queue.length },
          { key: 'tech', icon: '📞', label: 'My Call', badge: call && !['completed', 'cleared'].includes(call.status) ? 1 : 0 },
          { key: 'admin', icon: '⚙️', label: 'Admin' },
        ].map(tab => (
          <TouchableOpacity key={tab.key} style={{ flex: 1, alignItems: 'center', paddingVertical: 10 }} onPress={() => setActiveSection(tab.key)}>
            <View style={{ position: 'relative' }}>
              <Text style={{ fontSize: 22 }}>{tab.icon}</Text>
              {tab.badge > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -8, backgroundColor: '#e53e3e', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>{tab.badge}</Text>
                </View>
              )}
            </View>
            <Text style={{ color: activeSection === tab.key ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600', marginTop: 4 }}>{tab.label}</Text>
            {activeSection === tab.key && <View style={{ position: 'absolute', bottom: 0, width: 24, height: 2, backgroundColor: primaryColor, borderRadius: 1 }} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── NEW BOOKING MODAL ── */}
      <Modal visible={newBookingModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => setNewBookingModal(false)}><Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>New Booking</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Patient Name *</Text>
            <TextInput style={styles.input} value={nbPatientName} onChangeText={setNbPatientName} placeholder="Full name" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Patient Phone</Text>
            <TextInput style={styles.input} value={nbPatientPhone} onChangeText={setNbPatientPhone} placeholder="(602) 555-0100" placeholderTextColor="#444" keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Service *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {services.map(svc => (
                <TouchableOpacity key={svc.id} style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderColor: nbService === svc.name ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: nbService === svc.name ? primaryColor + '20' : 'transparent' }} onPress={() => setNbService(svc.name)}>
                  <Text style={{ color: nbService === svc.name ? primaryColor : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 13 }}>{svc.name}</Text>
                </TouchableOpacity>
              ))}
              {services.length === 0 && <TextInput style={[styles.input, { flex: 1 }]} value={nbService} onChangeText={setNbService} placeholder="e.g. Myers Cocktail" placeholderTextColor="#444" />}
            </View>
            <Text style={styles.fieldLabel}>Address *</Text>
            <TextInput style={styles.input} value={nbAddress} onChangeText={setNbAddress} placeholder="123 Main St, Phoenix AZ" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Requested Time (optional)</Text>
            <TextInput style={styles.input} value={nbTime} onChangeText={setNbTime} placeholder="e.g. 2:00 PM today" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={nbNotes} onChangeText={setNbNotes} placeholder="Gate code, apartment number, special requests..." placeholderTextColor="#444" multiline />
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor, marginTop: 8 }, creatingBooking && { opacity: 0.6 }]} onPress={createBooking} disabled={creatingBooking}>
              {creatingBooking ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Create Booking</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── ANNOUNCEMENT MODAL ── */}
      <Modal visible={announcementModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
            <TouchableOpacity onPress={() => setAnnouncementModal(false)}><Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput style={styles.input} value={anTitle} onChangeText={setAnTitle} placeholder="e.g. Summer Special!" placeholderTextColor="#666" />
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={anBody} onChangeText={setAnBody} placeholder="Tell your patients something..." placeholderTextColor="#666" multiline />
            <Text style={styles.fieldLabel}>CTA Button Label (optional)</Text>
            <TextInput style={styles.input} value={anCtaLabel} onChangeText={setAnCtaLabel} placeholder="Learn More" placeholderTextColor="#666" />
            <Text style={styles.fieldLabel}>CTA URL (optional)</Text>
            <TextInput style={styles.input} value={anCtaUrl} onChangeText={setAnCtaUrl} placeholder="https://..." placeholderTextColor="#666" autoCapitalize="none" keyboardType="url" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Active</Text>
              <TouchableOpacity style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: anActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={() => setAnActive(!anActive)}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: anActive ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor }, savingAnnouncement && { opacity: 0.6 }]} onPress={saveAnnouncement} disabled={savingAnnouncement}>
              {savingAnnouncement ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Save Announcement</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── NEW SERVICE MODAL ── */}
      <Modal visible={newServiceModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => setNewServiceModal(false)}><Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text></TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Add Service</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Service Name *</Text>
            <TextInput style={styles.input} value={svcName} onChangeText={setSvcName} placeholder="e.g. Myers Cocktail" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Price *</Text>
            <TextInput style={styles.input} value={svcPrice} onChangeText={setSvcPrice} placeholder="149" placeholderTextColor="#444" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Duration</Text>
            <TextInput style={styles.input} value={svcDuration} onChangeText={setSvcDuration} placeholder="60-75 min" placeholderTextColor="#444" />
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor, marginTop: 8 }, savingService && { opacity: 0.6 }]} onPress={createService} disabled={savingService}>
              {savingService ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Add Service</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  header: { paddingTop: Platform.OS === 'web' ? 16 : 56, paddingBottom: 16, paddingHorizontal: 20 },
  card: { marginHorizontal: 16, marginBottom: 12, marginTop: 4, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16 },
  cardTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.8)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12 },
  bottomBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingBottom: Platform.OS === 'ios' ? 20 : 8 },
  emergencyButton: { marginHorizontal: 16, marginTop: 16, marginBottom: 8, backgroundColor: '#f09090', borderRadius: 12, padding: 16, alignItems: 'center' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 8 },
})