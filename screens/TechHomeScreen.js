import BugReportModal from '../components/BugReportModal'
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
    if (visible && call?.call_id) {
      fetch(`${API_URL}/charts/call/${call.call_id}?patientName=${encodeURIComponent(patientName)}`, { headers })
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

          {/* Submit button — only show if NOT locked */}
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

          {/* Amendment section — only show if submitted or amended */}
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

export default function TechHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'

  const [activeTab, setActiveTab] = useState('call')
  const [techDocs, setTechDocs] = useState([])
  const [techDocCategory, setTechDocCategory] = useState('All')
  const [techDocLoading, setTechDocLoading] = useState(false)
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
  const [bugReportModal, setBugReportModal] = useState(false)
  const [chartPatient, setChartPatient] = useState(null)
const [primaryChartCompleted, setPrimaryChartCompleted] = useState(false)
  const [showNpOrders, setShowNpOrders] = useState(false)
  const [npOrders, setNpOrders] = useState(null)
  const [patientPerks, setPatientPerks] = useState(null)
  const [patientMembership, setPatientMembership] = useState(null)
  const [redeemMembershipModal, setRedeemMembershipModal] = useState(false)
  const [redeemQty, setRedeemQty] = useState(1)
  const [redeemingMembership, setRedeemingMembership] = useState(false)
  const [redeemingPerk, setRedeemingPerk] = useState(false)
  const [techProfile, setTechProfile] = useState(null)
  const [staffAnnouncements, setStaffAnnouncements] = useState([])
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
        if (call?.tech_status !== 'en_route') { clearInterval(interval); return }
        try {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
          await fetch(`${API_URL}/tech/location`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ lat: location.coords.latitude, lng: location.coords.longitude }) })
        } catch (err) { console.error('Location update error:', err) }
      }, 30000)
      return () => clearInterval(interval)
    } catch (err) { console.error('Location permission error:', err) }
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
    } catch (err) { console.error('Fetch tech profile error:', err) }
  }, [token])

  useEffect(() => { fetchTechProfile() }, [fetchTechProfile])

  const pickAndUploadPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) { Alert.alert('Permission needed', 'Please allow access to your photo library'); return }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.2, base64: true, exif: false })
      if (!result.canceled && result.assets[0]) {
        setUploadingPhoto(true)
        const base64 = result.assets[0].base64
        const res = await fetch(`${API_URL}/auth/upload-photo`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ photo: `data:image/jpeg;base64,${base64}` }) })
        const text = await res.text()
        const data = JSON.parse(text)
        if (data.success) { fetchTechProfile(); Alert.alert('✅ Photo Updated', 'Your profile photo has been saved.') }
        else Alert.alert('Error', data.message || 'Could not upload photo')
      }
    } catch (err) { console.error('Photo picker error:', err); Alert.alert('Error', err.message || 'Could not open photo library') }
    finally { setUploadingPhoto(false) }
  }

  const toggleInService = async () => {
    const newValue = !techProfile?.inService
    try {
      const res = await fetch(`${API_URL}/tech/in-service`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ inService: newValue }) })
      const data = await res.json()
      if (data.success) setTechProfile(prev => ({ ...prev, inService: newValue }))
      else Alert.alert('Error', data.message || 'Could not update status')
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  const techChangePassword = async () => {
    if (!techCurrentPassword || !techNewPassword || !techConfirmPassword) { Alert.alert('Required', 'Please fill in all fields'); return }
    if (techNewPassword !== techConfirmPassword) { Alert.alert('Error', 'New passwords do not match'); return }
    if (techNewPassword.length < 8) { Alert.alert('Error', 'New password must be at least 8 characters'); return }
    setTechChangingPassword(true)
    try {
      const res = await fetch(`${API_URL}/auth/change-password`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: techCurrentPassword, newPassword: techNewPassword }) })
      const data = await res.json()
      if (data.success) {
        Alert.alert('✅ Password Changed', 'Your password has been updated.')
        setTechChangePasswordModal(false)
        setTechCurrentPassword(''); setTechNewPassword(''); setTechConfirmPassword('')
      } else Alert.alert('Error', data.message || 'Could not change password')
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setTechChangingPassword(false) }
  }

  const fetchTechDocs = useCallback(async () => {
    setTechDocLoading(true)
    try {
      const res = await fetch(`${API_URL}/documents`, { headers })
      const data = await res.json()
      if (data.success) setTechDocs(data.documents)
    } catch (err) { console.error('Fetch docs error:', err) }
    finally { setTechDocLoading(false) }
  }, [token])

  useEffect(() => { if (activeTab === 'docs') fetchTechDocs() }, [activeTab])

  useEffect(() => {
    if (activeTab === 'profile') {
      fetch(`${API_URL}/staff/announcements`, { headers })
        .then(r => r.json())
        .then(d => { if (d.announcements) setStaffAnnouncements(d.announcements) })
        .catch(() => {})
    }
  }, [activeTab])

  const fetchCall = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/tech/my-call`, { headers })
      const data = await res.json()
      if (data.success) {
        setCall(data.call)
        if (data.call?.user_id) {
          fetch(`${API_URL}/gfe/patient-orders/${data.call.user_id}`, { headers }).then(r => r.json()).then(d => { if (d.hasActiveGFE) setNpOrders(d.orders); else setNpOrders(null) }).catch(() => setNpOrders(null))
          fetch(`${API_URL}/perks/patient/${data.call.user_id}`, { headers }).then(r => r.json()).then(d => { if (d.hasPerks) setPatientPerks(d); else setPatientPerks(null) }).catch(() => setPatientPerks(null))
          fetch(`${API_URL}/memberships/patient/${data.call.user_id}`, { headers }).then(r => r.json()).then(d => { if (d.membership) setPatientMembership(d.membership); else setPatientMembership(null) }).catch(() => setPatientMembership(null))
        }
        setPatients(data.patients || [])
        // Check if primary patient has a submitted chart
if (data.call?.call_id) {
  fetch(`${API_URL}/charts/call/${data.call.call_id}?patientName=${encodeURIComponent(data.call.patient_name)}`, { headers })
    .then(r => r.json())
    .then(d => setPrimaryChartCompleted(d.chart?.status === 'submitted' || d.chart?.status === 'amended'))
    .catch(() => setPrimaryChartCompleted(false))
}
        setUpcoming(data.upcoming || [])
        setMySchedule(data.mySchedule || [])
        if (data.call?.tech_status === 'on_scene' && data.call?.tech_onscene_at) {
          const secondsOnScene = Math.floor((Date.now() - new Date(data.call.tech_onscene_at).getTime()) / 1000)
          setOnSceneSeconds(secondsOnScene)
        }
      }
    } catch (err) { console.error('Fetch call error:', err) }
    finally { setLoading(false); setRefreshing(false) }
  }, [token])

  useEffect(() => {
    fetchCall()
    const interval = setInterval(fetchCall, 15000)
    // Send heartbeat every 5 minutes to keep in-service status alive
    const sendHeartbeat = () => {
      fetch(`${API_URL}/tech/heartbeat`, { method: 'POST', headers })
        .catch(() => {})
    }
    sendHeartbeat()
    const heartbeatInterval = setInterval(sendHeartbeat, 5 * 60 * 1000)
    return () => { clearInterval(interval); clearInterval(heartbeatInterval) }
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
      const res = await fetch(`${API_URL}/tech/status`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus, bookingId: call.id }) })
      const data = await res.json()
      if (data.success) fetchCall()
      else Alert.alert('Error', data.message || 'Could not update status')
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setUpdatingStatus(false) }
  }

  const handleStatusChange = (newStatus) => {
    const messages = { en_route: 'Mark yourself as En Route to this call?', on_scene: 'Mark yourself as On Scene?', clear: 'Mark this call as Complete and go Clear?' }
    Alert.alert('Update Status', messages[newStatus], [{ text: 'Cancel', style: 'cancel' }, { text: 'Confirm', onPress: () => updateStatus(newStatus) }])
  }

  const handleEmergency = () => {
    Alert.alert('🚨 Emergency', 'This will immediately alert your dispatcher. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'SEND EMERGENCY ALERT', style: 'destructive', onPress: () => { Vibration.vibrate([200, 100, 200, 100, 200]); Alert.alert('Emergency Sent', 'Your dispatcher has been notified. Stay safe.') } }
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
    const dateToUse = booking.confirmed_time || booking.requested_time
    if (!dateToUse) return acc
    const date = new Date(dateToUse).toLocaleDateString('en-CA', { timeZone: company?.timezone || 'America/Phoenix' })
    acc[date] = { marked: true, dotColor: primaryColor }
    return acc
  }, {})
  if (selectedScheduleDate) markedDates[selectedScheduleDate] = { ...markedDates[selectedScheduleDate], selected: true, selectedColor: primaryColor }

  const selectedDayBookings = selectedScheduleDate ? mySchedule.filter(b => {
    const dateToCheck = b.confirmed_time || b.requested_time
    return dateToCheck && new Date(dateToCheck).toLocaleDateString('en-CA', { timeZone: company?.timezone || 'America/Phoenix' }) === selectedScheduleDate
  }) : []

  if (loading) return <View style={styles.centered}><ActivityIndicator color={primaryColor} size="large" /></View>

  return (
    <View style={styles.container}>
      <ChartModal key={chartPatient?.name || 'chart'} visible={showChart} onClose={() => { setShowChart(false); setChartPatient(null); fetchCall() }} call={call} token={token} company={company} patientName={chartPatient?.name} patientDob={chartPatient?.dob} />

      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            {company?.logoUrl ? (
              <View style={{ alignItems: 'center', width: '100%', marginBottom: 8 }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: primaryColor + '20', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 8 }}>
                  <Image source={{ uri: company.logoUrl }} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
                </View>
                <Text style={[styles.companyName, { color: primaryColor, textAlign: 'center' }]}>{company?.name}</Text>
              </View>
            ) : (
              <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
            )}
            <Text style={styles.headerTitle}>My Call</Text>
            <Text style={styles.headerSub}>{user?.firstName} · {user?.role?.toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={() => setBugReportModal(true)} style={{ marginTop: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Report a Problem</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
          </TouchableOpacity>
          <BugReportModal visible={bugReportModal} onClose={() => setBugReportModal(false)} token={token} screen="TechHomeScreen" />
        </View>
      </View>

      <View style={{ flexDirection: 'row', backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        {['call', 'schedule', 'docs', 'profile'].map(tab => (
          <TouchableOpacity key={tab} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: activeTab === tab ? primaryColor : 'transparent' }} onPress={() => setActiveTab(tab)}>
            <Text style={{ color: activeTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>
              {tab === 'call' ? '📞 My Call' : tab === 'schedule' ? `📅 Schedule${mySchedule.length > 0 ? ` (${mySchedule.length})` : ''}` : tab === 'docs' ? '📄 Docs' : '👤 Profile'}
            </Text>
          </TouchableOpacity>
        ))}
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
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12 }}
                  onPress={() => {
                    const { Linking, Platform } = require('react-native')
                    const encoded = encodeURIComponent(call.address)
                    const url = Platform.OS === 'ios'
                      ? `maps://app?daddr=${encoded}`
                      : `google.navigation:q=${encoded}`
                    Linking.canOpenURL(url).then(supported => {
                      if (supported) {
                        Linking.openURL(url)
                      } else {
                        Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`)
                      }
                    })
                  }}
                >
                  <Text style={{ fontSize: 18 }}>🗺</Text>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Guide Me</Text>
                </TouchableOpacity>
                {call.notes && (<><Text style={styles.label}>📝 Notes</Text><Text style={styles.value}>{call.notes}</Text></>)}
                <Text style={styles.label}>🕐 Dispatched</Text>
                <Text style={styles.value}>{call.dispatched_at ? new Date(call.dispatched_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</Text>
                {call.confirmed_time && (
                  <>
                    <Text style={[styles.label, { marginTop: 8 }]}>✅ Confirmed for</Text>
                    <Text style={styles.value}>{new Date(call.confirmed_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })} · {new Date(call.confirmed_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: company?.timezone || 'America/Phoenix' })}</Text>
                  </>
                )}
                {call.requested_time && !call.confirmed_time && (
                  <>
                    <Text style={[styles.label, { marginTop: 8 }]}>📅 Scheduled for</Text>
                    <Text style={styles.value}>{new Date(call.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })} · {new Date(call.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: company?.timezone || 'America/Phoenix' })}</Text>
                  </>
                )}
                {call.requested_time && (
                  <>
                    <Text style={styles.label}>📅 Confirmed For</Text>
                    <Text style={[styles.value, { color: primaryColor, fontWeight: '600' }]}>
                      {new Date(call.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Primary Patient {call.patient_count > 1 ? `(+${call.patient_count - 1} more)` : ''}</Text>
                <Text style={styles.service}>{call.patient_name}</Text>
                {!call.has_valid_intake && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginTop: 4 }}>⚠️ No intake on file</Text>}
                {call.patient_phone && <Text style={styles.value}>📞 {call.patient_phone}</Text>}
                {call.patient_dob && <Text style={styles.value}>🎂 {(() => { const d = new Date(call.patient_dob); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString() })()}</Text>}
              </View>

              {call.tech_status === 'on_scene' && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>Patients on this Call</Text>
                  {[
                    { name: call.patient_name, dob: call.patient_dob, phone: call.patient_phone, isPrimary: true, chartCompleted: primaryChartCompleted },
                    ...patients.map(p => ({ name: p.patient_name, dob: p.patient_dob, phone: p.patient_phone, isPrimary: false, chartCompleted: p.chart_completed }))
                  ].map((p, index) => (
                    <View key={index} style={[styles.patientRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.patientName}>{p.name}{p.isPrimary ? ' (Primary)' : ''}</Text>
                        {p.phone ? <Text style={styles.patientDetail}>📞 {p.phone}</Text> : null}
                      </View>
                      <TouchableOpacity
                        style={[{ borderRadius: 8, padding: 10, marginLeft: 8, alignItems: 'center', minWidth: 90 },
                          p.chartCompleted ? { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' } : { backgroundColor: primaryColor }
                        ]}
                        onPress={() => { setChartPatient({ name: p.name, dob: p.dob }); setShowChart(true) }}
                      >
                        <Text style={[{ fontSize: 12, fontWeight: '700' }, p.chartCompleted ? { color: 'rgba(255,255,255,0.4)' } : { color: secondaryColor }]}>
                          {p.chartCompleted ? '🔒 View' : '📋 Chart'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {npOrders && (
                <TouchableOpacity style={[styles.card, { borderWidth: 1, borderColor: npOrders.notACandidate ? '#e53e3e' : '#4CAF50' }]} onPress={() => setShowNpOrders(true)}>
                  <Text style={[styles.cardTitle, { color: npOrders.notACandidate ? '#e53e3e' : '#4CAF50' }]}>
                    {npOrders.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ NP ORDERS ON FILE'}
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Signed by {npOrders.npName} · Tap to view orders</Text>
                </TouchableOpacity>
              )}

              <Modal visible={showNpOrders} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
                  <View style={{ backgroundColor: '#0D1B4B', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, maxHeight: '80%' }}>
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 }}>NP Orders</Text>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>Signed by {npOrders?.npName} · Valid until {npOrders ? new Date(npOrders.validUntil).toLocaleDateString() : ''}</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                      {npOrders?.notACandidate ? (
                        <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                          <Text style={{ color: '#e53e3e', fontWeight: '700', fontSize: 15, marginBottom: 8 }}>🚫 Not a Candidate</Text>
                          <Text style={{ color: '#fff', fontSize: 14 }}>{npOrders.notACandidateReason}</Text>
                        </View>
                      ) : (
                        <>
                          {npOrders?.approvedServices?.length > 0 && (
                            <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 16, marginBottom: 12 }}>
                              <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 13, marginBottom: 8 }}>✅ APPROVED SERVICES</Text>
                              {npOrders.approvedServices.map((s, i) => <Text key={i} style={{ color: '#fff', fontSize: 14, marginBottom: 4 }}>• {s}</Text>)}
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
                    <TouchableOpacity style={{ marginTop: 16, alignItems: 'center', padding: 12 }} onPress={() => setShowNpOrders(false)}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Redeem Membership Modal */}
              <Modal visible={redeemMembershipModal} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                  <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)', overflow: 'hidden' }}>
                    <View style={{ backgroundColor: 'rgba(201,168,76,0.1)', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.2)' }}>
                      <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>REDEEM VISIT</Text>
                      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{patientMembership?.plan_name}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{patientMembership ? patientMembership.max_redemptions_per_cycle - patientMembership.redemptions_this_cycle : 0} visits remaining</Text>
                    </View>
                    <View style={{ padding: 20 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>NUMBER OF VISITS TO REDEEM</Text>
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                        {patientMembership && Array.from({ length: Math.min(patientMembership.max_redemptions_per_cycle - patientMembership.redemptions_this_cycle, 4) }, (_, i) => i + 1).map(n => (
                          <TouchableOpacity key={n} style={{ flex: 1, minWidth: 60, borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center', borderColor: redeemQty === n ? '#C9A84C' : 'rgba(255,255,255,0.15)', backgroundColor: redeemQty === n ? 'rgba(201,168,76,0.2)' : 'transparent' }} onPress={() => setRedeemQty(n)}>
                            <Text style={{ color: redeemQty === n ? '#C9A84C' : 'rgba(255,255,255,0.4)', fontSize: 18, fontWeight: '700' }}>{n}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setRedeemMembershipModal(false)}>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ flex: 2, backgroundColor: '#C9A84C', borderRadius: 12, padding: 14, alignItems: 'center', opacity: redeemingMembership ? 0.6 : 1 }}
                          disabled={redeemingMembership}
                          onPress={async () => {
                            setRedeemingMembership(true)
                            try {
                              for (let i = 0; i < redeemQty; i++) {
                                await fetch(`${API_URL}/memberships/${patientMembership.id}/redeem`, {
                                  method: 'POST',
                                  headers: { ...headers, 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ bookingId: call?.id })
                                })
                              }
                              setPatientMembership(prev => ({ ...prev, redemptions_this_cycle: prev.redemptions_this_cycle + redeemQty }))
                              setRedeemMembershipModal(false)
                              Alert.alert('Redeemed', `${redeemQty} visit${redeemQty > 1 ? 's' : ''} redeemed successfully.`)
                            } catch (e) { Alert.alert('Error', 'Failed to redeem') } finally { setRedeemingMembership(false) }
                          }}
                        >
                          {redeemingMembership ? <ActivityIndicator color="#0D1B4B" /> : <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 15 }}>Redeem {redeemQty} Visit{redeemQty > 1 ? 's' : ''}</Text>}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>

              {call.tech_status === 'on_scene' && call.is_minor && (
                <View style={{ backgroundColor: 'rgba(229,62,62,0.15)', borderWidth: 1, borderColor: 'rgba(229,62,62,0.4)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>⚠️ MINOR PATIENT</Text>
                  <Text style={{ color: '#fff', fontSize: 14 }}>Guardian must be present before treatment</Text>
                  {call.guardian_name && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Guardian: {call.guardian_name}</Text>}
                </View>
              )}

              {call.tech_status === 'on_scene' && patientMembership && (
                <View style={{ backgroundColor: 'rgba(201,168,76,0.08)', borderWidth: 1, borderColor: 'rgba(201,168,76,0.4)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>🏅 ACTIVE MEMBER</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{patientMembership.plan_name}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4, marginBottom: 12 }}>
                    {patientMembership.redemptions_this_cycle} of {patientMembership.max_redemptions_per_cycle === 999 ? 'unlimited' : patientMembership.max_redemptions_per_cycle} visits used this month
                    {patientMembership.max_redemptions_per_cycle !== 999 && ` · ${patientMembership.max_redemptions_per_cycle - patientMembership.redemptions_this_cycle} remaining`}
                  </Text>
                  {patientMembership.max_redemptions_per_cycle === 999 || patientMembership.redemptions_this_cycle < patientMembership.max_redemptions_per_cycle ? (
                    <TouchableOpacity
                      style={{ backgroundColor: 'rgba(201,168,76,0.2)', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#C9A84C' }}
                      onPress={() => { setRedeemQty(1); setRedeemMembershipModal(true) }}
                    >
                      <Text style={{ color: '#C9A84C', fontWeight: '700', fontSize: 14 }}>Redeem Visit</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ backgroundColor: 'rgba(240,144,144,0.1)', borderRadius: 10, padding: 12, alignItems: 'center' }}>
                      <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>No visits remaining this month</Text>
                    </View>
                  )}
                </View>
              )}

              {call.tech_status === 'on_scene' && patientPerks && (
                <View style={{ backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: '#C9A84C', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>⭐ PATIENT HAS ACTIVE PERKS</Text>
                  {patientPerks.referralPerks?.map(perk => (
                    <View key={perk.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{perk.perk_type === 'fixed' ? `$${perk.perk_amount} off` : `${perk.perk_amount}% off`}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Referral perk</Text>
                      </View>
                      <TouchableOpacity style={{ backgroundColor: '#C9A84C', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }} disabled={redeemingPerk} onPress={async () => {
                        setRedeemingPerk(true)
                        try { const res = await fetch(`${API_URL}/perks/redeem`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'referral', id: perk.id }) }); const data = await res.json(); if (data.success) { setPatientPerks(null); Alert.alert('✅ Redeemed!', 'Perk has been marked as used.') } } catch (e) {} finally { setRedeemingPerk(false) }
                      }}>
                        <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 13 }}>Redeem</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {patientPerks.loyaltyRewards?.map(reward => (
                    <View key={reward.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View>
                        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{reward.reward_type === 'free' ? '🎁 FREE IV' : reward.reward_type === 'fixed' ? `$${reward.reward_amount} off` : `${reward.reward_percent}% off`}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Loyalty reward</Text>
                      </View>
                      <TouchableOpacity style={{ backgroundColor: '#4CAF50', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 }} disabled={redeemingPerk} onPress={async () => {
                        setRedeemingPerk(true)
                        try { const res = await fetch(`${API_URL}/perks/redeem`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'loyalty', id: reward.id }) }); const data = await res.json(); if (data.success) { setPatientPerks(null); Alert.alert('✅ Redeemed!', 'Loyalty reward has been marked as used.') } } catch (e) {} finally { setRedeemingPerk(false) }
                      }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Redeem</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {call.tech_status === 'on_scene' && (
                <View style={[styles.timerCard, timerDanger && styles.timerDanger, timerWarning && !timerDanger && styles.timerWarning]}>
                  <Text style={styles.timerLabel}>⏱ Time On Scene</Text>
                  <Text style={[styles.timerValue, timerDanger && { color: '#f09090' }, timerWarning && !timerDanger && { color: '#E2C97E' }]}>{formatTimer(onSceneSeconds)}</Text>
                  {timerWarning && <Text style={styles.timerAlert}>{timerDanger ? '⚠️ 60 minutes reached — contact dispatch!' : '⚠️ Approaching 60 minutes'}</Text>}
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
                    <TouchableOpacity style={[styles.statusButton, { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: primaryColor, marginBottom: 4 }]} onPress={() => navigation.navigate('BookingChat', { token, userId: user?.id || user?.userId, company, bookingId: call.id, patientName: call.patient_name })}>
                      <Text style={[styles.statusButtonText, { color: primaryColor }]}>Message Patient</Text>
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

      {activeTab === 'docs' && (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52, backgroundColor: secondaryColor, paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10 }}>
              {['All', 'Protocol', 'Standing Order', 'IV Recipe', 'Other'].map(cat => (
                <TouchableOpacity key={cat} style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: techDocCategory === cat ? primaryColor : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: techDocCategory === cat ? primaryColor : 'rgba(255,255,255,0.15)' }} onPress={() => setTechDocCategory(cat)}>
                  <Text style={{ color: techDocCategory === cat ? secondaryColor : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTechDocs} tintColor={primaryColor} />}>
            {techDocLoading ? (
              <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
            ) : techDocs.filter(d => techDocCategory === 'All' || d.category === techDocCategory).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📄</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No documents yet</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Your admin hasn't uploaded any documents</Text>
              </View>
            ) : techDocs.filter(d => techDocCategory === 'All' || d.category === techDocCategory).map(doc => (
              <View key={doc.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: doc.category === 'Protocol' ? primaryColor : doc.category === 'Standing Order' ? '#2196F3' : doc.category === 'IV Recipe' ? '#4CAF50' : '#9C27B0' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>📄 {doc.title}</Text>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>{doc.category.toUpperCase()}</Text>
                {doc.description && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 8 }}>{doc.description}</Text>}
                <TouchableOpacity style={{ borderWidth: 1, borderColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 }} onPress={async () => {
                  try { const res = await fetch(`${API_URL}/documents/${doc.id}/url`, { headers }); const data = await res.json(); if (data.url) { const { Linking } = require('react-native'); Linking.openURL(data.url) } } catch (err) { Alert.alert('Error', 'Could not open document') }
                }}>
                  <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>View Document</Text>
                </TouchableOpacity>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {activeTab === 'profile' && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
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

          <TouchableOpacity style={{ width: '100%', backgroundColor: techProfile?.inService ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.06)', borderWidth: 2, borderColor: techProfile?.inService ? '#4CAF50' : 'rgba(255,255,255,0.15)', borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }} onPress={toggleInService}>
            <View>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{techProfile?.inService ? 'In Service' : 'Out of Service'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{techProfile?.inService ? 'You are visible to dispatch' : 'Tap to go in service'}</Text>
            </View>
            <View style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: techProfile?.inService ? '#4CAF50' : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: techProfile?.inService ? 'flex-end' : 'flex-start' }} />
            </View>
          </TouchableOpacity>

          {staffAnnouncements.length > 0 && (
            <View style={{ width: '100%', marginBottom: 24 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>📢 ANNOUNCEMENTS</Text>
              {staffAnnouncements.map(an => (
                <View key={an.id} style={{ backgroundColor: an.bg_color ? an.bg_color : 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: primaryColor, borderWidth: 1, borderColor: primaryColor + '30' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontSize: 20 }}>{an.emoji || '📢'}</Text>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 }}>{an.title}</Text>
                  </View>
                  {an.body ? <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 20 }}>{an.body}</Text> : null}
                  {an.cta_label && an.cta_url ? (
                    <TouchableOpacity
                      style={{ backgroundColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 10 }}
                      onPress={() => { const { Linking } = require('react-native'); Linking.openURL(an.cta_url) }}
                    >
                      <Text style={{ color: secondaryColor, fontSize: 13, fontWeight: '700' }}>{an.cta_label} →</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={pickAndUploadPhoto} disabled={uploadingPhoto} style={{ marginBottom: 16 }}>
            {techProfile?.profilePhoto ? (
              <Image source={{ uri: techProfile.profilePhoto }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: primaryColor }} />
            ) : (
              <View style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: primaryColor, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' }}>
                {uploadingPhoto ? <ActivityIndicator color={primaryColor} /> : <Text style={{ color: primaryColor, fontSize: 36, fontWeight: '600' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>}
              </View>
            )}
            <Text style={{ color: primaryColor, fontSize: 12, textAlign: 'center', marginTop: 8 }}>{uploadingPhoto ? 'Uploading...' : 'Tap to change photo'}</Text>
          </TouchableOpacity>

          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{user?.firstName} {user?.lastName}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 8 }}>{user?.email}</Text>
          <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600', marginBottom: 32 }}>{company?.name} · TECH</Text>

          <TouchableOpacity style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }} onPress={() => navigation.navigate('TechMessaging', { token, user, company })}>
            <View>
              <Text style={{ color: '#fff', fontSize: 15 }}>Messages</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Chat with dispatch and team</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }} onPress={() => setTechChangePasswordModal(true)}>
            <Text style={{ color: '#fff', fontSize: 15 }}>Change Password</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ width: '100%', marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', backgroundColor: 'rgba(220,80,80,0.08)' }} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
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
            theme={{ backgroundColor: 'transparent', calendarBackground: 'transparent', textSectionTitleColor: 'rgba(255,255,255,0.5)', selectedDayBackgroundColor: primaryColor, selectedDayTextColor: secondaryColor, todayTextColor: primaryColor, dayTextColor: '#fff', textDisabledColor: 'rgba(255,255,255,0.2)', monthTextColor: '#fff', arrowColor: primaryColor, dotColor: primaryColor }}
            style={{ marginBottom: 8 }}
          />
          {selectedScheduleDate && (
            <View style={[styles.card, { marginHorizontal: 16 }]}>
              <Text style={styles.cardTitle}>{new Date(selectedScheduleDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              {selectedDayBookings.length === 0 ? (
                <Text style={styles.patientDetail}>No appointments on this day</Text>
              ) : selectedDayBookings.map(b => (
                <View key={b.id} style={[styles.patientRow, { marginBottom: 8 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.patientName}>{b.service}</Text>
                    <Text style={styles.patientDetail}>👤 {b.patient_name}</Text>
                    <Text style={styles.patientDetail}>📍 {b.address}</Text>
                    <Text style={[styles.patientDetail, { color: primaryColor, fontWeight: '600' }]}>🕐 {new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}{b.confirmed_time && b.requested_time && b.confirmed_time !== b.requested_time ? ' (confirmed)' : ''}</Text>
                    {b.patient_count > 1 && <Text style={styles.patientDetail}>👥 {b.patient_count} patients</Text>}
                  </View>
                </View>
              ))}
            </View>
          )}
          {mySchedule.length === 0 && <View style={{ alignItems: 'center', marginTop: 40 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No upcoming assignments</Text></View>}
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
  header: { paddingTop: Platform.OS === 'web' ? 16 : 56, paddingBottom: 20, paddingHorizontal: 24 },
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