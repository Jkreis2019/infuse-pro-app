import React, { useState, useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, RefreshControl, Image, Platform, KeyboardAvoidingView, TextInput } from 'react-native'

const API_URL = 'https://api.infusepro.app'

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

function ClinicChartModal({ visible, onClose, booking, token, company }) {
  const primaryColor = company?.primaryColor || '#1D9E75'
  const secondaryColor = company?.secondaryColor || '#0a2420'
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
    if (visible && booking?.id) {
      fetch(`${API_URL}/charts/call/${booking.call_id || booking.id}?patientName=${encodeURIComponent(booking.patient_name)}`, { headers })
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
            setSavedStatus(c.status || '')
          } else {
            setChartId(null); setSavedStatus('')
            setChiefComplaint(''); setMedicalHistoryChanges(''); setAllergiesDetail('')
            setBp(''); setHr(''); setO2(''); setTemp(''); setPainScale(''); setVitalTime('')
            setIvSite(''); setCatheterSize(''); setIvAttempts('1'); setIvTimeInitiated('')
            setIvFluids([]); setIvMeds({}); setBagAddons({}); setImInjections({})
            setPostBp(''); setPostHr(''); setPostO2(''); setPostTime('')
            setComplications('No'); setComplicationsDetail(''); setCatheterStatus('Normal and Intact')
            setIvTimeDiscontinued(''); setTechNotes('')
          }
        }).catch(err => console.error('Load chart error:', err))
    }
    fetch(`${API_URL}/tech/services`, { headers })
      .then(r => r.json())
      .then(d => setCompanyServices(d.services || []))
      .catch(() => {})
  }, [visible, booking?.id])

  const toggleFluid = (fluid) => {
    if (isLocked) return
    setIvFluids(prev => prev.includes(fluid) ? prev.filter(f => f !== fluid) : [...prev, fluid])
  }

  const submitAmendment = async () => {
    if (!amendmentText.trim()) { Alert.alert('Required', 'Please enter amendment notes'); return }
    try {
      const res = await fetch(`${API_URL}/charts/${chartId}/amend`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amendmentNotes: amendmentText })
      })
      const data = await res.json()
      if (data.success) { Alert.alert('✅ Amendment Saved', 'Your amendment has been recorded.'); setAmendmentText(''); setSavedStatus('amended') }
      else Alert.alert('Error', data.error || 'Could not save amendment')
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  const saveChart = async (submit = false) => {
    if (isLocked) return
    setSaving(true)
    try {
      const data = {
        callId: booking?.call_id || booking?.id,
        bookingId: booking?.id,
        patientName: booking?.patient_name,
        patientDob: booking?.patient_dob,
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
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ services: selectedServices })
          }).catch(() => {})
        }
        if (submit) { setSavedStatus('submitted'); Alert.alert('✅ Chart Submitted', 'Chart has been saved.'); onClose() }
      } else {
        Alert.alert('Error', responseData.message || 'Could not save chart')
      }
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setSaving(false) }
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
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{booking?.patient_name}</Text>
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
              <TouchableOpacity style={{ borderWidth: 1, borderColor: primaryColor, borderRadius: 8, padding: 12, alignItems: 'center', marginTop: 10 }} onPress={() => setShowServicePicker(true)}>
                <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>+ Add Service</Text>
              </TouchableOpacity>
            )}
          </View>
          <Modal visible={showServicePicker} transparent animationType="slide">
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: '#0a2420', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '70%' }}>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Select Service</Text>
                <ScrollView>
                  {companyServices.length === 0 ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 20 }}>No services found.</Text>
                  ) : companyServices.map(svc => {
                    const isSelected = selectedServices.some(s => s.id === svc.id)
                    return (
                      <TouchableOpacity key={svc.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}
                        onPress={() => {
                          if (isSelected) setSelectedServices(prev => prev.filter(s => s.id !== svc.id))
                          else setSelectedServices(prev => [...prev, { id: svc.id, name: svc.name, price: svc.price }])
                        }}>
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
          {isLocked && (
            <View style={{ backgroundColor: 'rgba(255,152,0,0.08)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <Text style={[cStyles.sectionTitle, { color: '#FF9800' }]}>📝 ADD AMENDMENT</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Chart is locked. Describe what you are correcting or adding.</Text>
              <TextInput style={[cStyles.input, { height: 120, textAlignVertical: 'top' }]} placeholder="e.g. Forgot to document..." placeholderTextColor="#666" value={amendmentText} onChangeText={setAmendmentText} multiline />
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

export default function ClinicTechScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#1D9E75'
  const secondaryColor = company?.secondaryColor || '#0a2420'
  const headers = { Authorization: `Bearer ${token}` }

  const [activeTab, setActiveTab] = useState('queue')
  const [myPatients, setMyPatients] = useState([])
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientModal, setPatientModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [chartBooking, setChartBooking] = useState(null)

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
      <ClinicChartModal key={showChart ? (chartBooking?.id || 'chart') : 'closed'} visible={showChart} onClose={() => { setShowChart(false); setChartBooking(null); fetchAll() }} booking={chartBooking} token={token} company={company} />
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
          { key: 'queue', label: `Queue (${queue.length})` },
          { key: 'myPatients', label: `My Patients (${myPatients.length})` },
          { key: 'profile', label: '👤 Profile' }
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
                {patient.has_gfe && !patient.gfe_not_candidate && (
                  <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>✅ GFE on file</Text>
                )}
                {patient.gfe_not_candidate && (
                  <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>🚫 Not a candidate</Text>
                )}
                {!patient.has_gfe && !patient.gfe_not_candidate && (
                  <Text style={{ color: '#FF9800', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No GFE on file</Text>
                )}
                <TouchableOpacity
                  style={{ backgroundColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 8 }}
                  onPress={() => { 
                    console.log('Chart patient:', JSON.stringify(patient)); 
                    setChartBooking(patient); 
                    setShowChart(true); 
                  }}
                >
                  <Text style={{ color: secondaryColor, fontSize: 13, fontWeight: '700' }}>📋 Chart</Text>
                </TouchableOpacity>
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

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 24, alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: primaryColor + '30', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Text style={{ color: primaryColor, fontSize: 28, fontWeight: '700' }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
          </View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4 }}>{user?.firstName} {user?.lastName}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 4 }}>{user?.email}</Text>
          <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600', marginBottom: 32 }}>{company?.name} · CLINIC TECH</Text>
          <TouchableOpacity
            style={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}
            onPress={() => Alert.alert('Change Password', 'Use the Forgot Password flow to change your password.')}
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
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>GFE</Text>
                  <Text style={[styles.infoValue, { color: selectedPatient.gfe_not_candidate ? '#e53e3e' : selectedPatient.has_gfe ? '#4CAF50' : '#FF9800' }]}>
                    {selectedPatient.gfe_not_candidate ? '🚫 Not a candidate' : selectedPatient.has_gfe ? '✅ On file' : '⚠️ Not on file'}
                  </Text>
                </View>
                {selectedPatient.has_gfe && selectedPatient.gfe_approved_services?.length > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Approved</Text>
                    <Text style={[styles.infoValue, { color: '#4CAF50' }]}>
                      {Array.isArray(selectedPatient.gfe_approved_services) ? selectedPatient.gfe_approved_services.join(', ') : selectedPatient.gfe_approved_services}
                    </Text>
                  </View>
                )}
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
  header: { paddingTop: Platform.OS === 'web' ? 16 : 56, paddingBottom: 20, paddingHorizontal: 24 },
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
