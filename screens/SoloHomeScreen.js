import BugReportModal from '../components/BugReportModal'
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

// ─── DYNAMIC CHART MODAL ─────────────────────────────────────────────────────
function DynamicChartModal({ visible, onClose, call, token, company, patientName, patientDob }) {
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState(null)
  const [chartId, setChartId] = useState(null)
  const [responses, setResponses] = useState({})
  const [status, setStatus] = useState('open')
  const [amendmentText, setAmendmentText] = useState('')
  const [prefill, setPrefill] = useState(null)
  const [npChart, setNpChart] = useState(null)
  const [npChartModalVisible, setNpChartModalVisible] = useState(false)
  const [formulary, setFormulary] = useState([])
  const [services, setServices] = useState([])
  const [templatePickerVisible, setTemplatePickerVisible] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState([])

  const isLocked = status === 'submitted' && template?.submit_behavior === 'lock'

  useEffect(() => {
    if (visible && call?.call_id) {
      loadAll()
    }
  }, [visible, call?.call_id])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [tmplRes, formRes, svcRes, prefillRes, chartsRes] = await Promise.all([
        fetch(`${API_URL}/chart-templates?type=tech`, { headers }),
        fetch(`${API_URL}/company-formulary`, { headers }),
        fetch(`${API_URL}/tech/services`, { headers }),
        fetch(`${API_URL}/charts/prefill/${call.call_id}`, { headers }),
        fetch(`${API_URL}/charts/call/${call.call_id}/all`, { headers })
      ])
      const [tmplData, formData, svcData, prefillData, chartsData] = await Promise.all([
        tmplRes.json(), formRes.json(), svcRes.json(), prefillRes.json(), chartsRes.json()
      ])

      if (formData.success) setFormulary(formData.formulary || [])
      if (svcData.services) setServices(svcData.services || [])
      if (prefillData.success) setPrefill(prefillData.prefill)

      // Load NP chart if exists
      if (chartsData.success && chartsData.npCharts?.length > 0) {
        setNpChart(chartsData.npCharts[0])
      }

      // Load existing tech chart if exists
      if (chartsData.success && chartsData.techCharts?.length > 0) {
        const existingChart = chartsData.techCharts[0]
        setChartId(existingChart.id)
        setResponses(existingChart.responses || {})
        setStatus(existingChart.status || 'open')

        // Load template for existing chart
        if (existingChart.template_id) {
          const t = tmplData.templates?.find(t => t.id === existingChart.template_id)
          if (t) setTemplate(t)
        }
      } else {
        // New chart — find best template
        const templates = tmplData.templates || []
        setAvailableTemplates(templates)
        if (templates.length === 1) {
          setTemplate(templates[0])
          // Prefill responses from intake
          if (prefillData.prefill) {
            applyPrefill(prefillData.prefill, templates[0])
          }
        } else if (templates.length > 1) {
          setTemplatePickerVisible(true)
        }
      }
    } catch (err) {
      console.error('DynamicChartModal load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyPrefill = (prefillData, tmpl) => {
    if (!prefillData || !tmpl) return
    const prefillResponses = {}
    tmpl.fields?.forEach(field => {
      if (field.type === 'text' && field.label?.toLowerCase().includes('allerg')) {
        prefillResponses[field.id] = prefillData.allergies?.join(', ') || ''
      }
      if (field.type === 'textarea' && field.label?.toLowerCase().includes('medication')) {
        prefillResponses[field.id] = prefillData.medications || ''
      }
    })
    setResponses(prev => ({ ...prev, ...prefillResponses }))
  }

  const setResponse = (fieldId, value) => {
    if (isLocked) return
    setResponses(prev => ({ ...prev, [fieldId]: value }))
  }

  const saveChart = async (submit = false) => {
    if (isLocked) return
    if (!template) { Alert.alert('No Template', 'Please select a chart template first'); return }

    // Validate required fields
    if (submit) {
      const missingFields = template.fields?.filter(field => {
        if (!field.required) return false
        if (['heading', 'divider'].includes(field.type)) return false
        const val = responses[field.id]
        if (val === undefined || val === null || val === '') return true
        if (Array.isArray(val) && val.length === 0) return true
        return false
      })
      if (missingFields?.length > 0) {
        Alert.alert('Required Fields Missing', `Please complete: ${missingFields.map(f => f.label).join(', ')}`)
        return
      }
    }

    setSaving(true)
    try {
      let res
      if (chartId) {
        res = await fetch(`${API_URL}/charts/dynamic/${chartId}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ responses, status: submit ? 'submitted' : 'open' })
        })
      } else {
        res = await fetch(`${API_URL}/charts/dynamic`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callId: call.call_id,
            bookingId: call.id,
            templateId: template.id,
            chartType: 'tech',
            patientName: patientName || call?.patient_name,
            patientDob: patientDob || call?.patient_dob,
            responses
          })
        })
      }
      const data = await res.json()
      if (data.success) {
        if (!chartId && data.chart?.id) setChartId(data.chart.id)
        if (submit) {
          setStatus('submitted')
          Alert.alert('Chart Submitted', 'Chart has been saved and locked.')
          onClose()
        } else {
          Alert.alert('Saved', 'Chart saved as draft.')
        }
      } else {
        Alert.alert('Error', data.error || 'Could not save chart')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSaving(false)
    }
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
        Alert.alert('Amendment Saved', 'Your amendment has been recorded.')
        setAmendmentText('')
        setStatus('amended')
      } else {
        Alert.alert('Error', data.error || 'Could not save amendment')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    }
  }

  const shouldShowField = (field) => {
    if (!field.conditional) return true
    const { fieldId, value } = field.conditional
    const currentVal = responses[fieldId]
    if (typeof currentVal === 'string') return currentVal.toLowerCase() === value?.toLowerCase()
    if (typeof currentVal === 'boolean') return currentVal === (value === 'true' || value === true)
    return false
  }

  const renderField = (field) => {
    if (!shouldShowField(field)) return null
    const val = responses[field.id]

    switch (field.type) {
      case 'heading':
        return (
          <View key={field.id} style={{ marginBottom: 8, marginTop: 16 }}>
            <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' }}>{field.label}</Text>
            <View style={{ height: 1, backgroundColor: primaryColor + '40', marginTop: 6 }} />
          </View>
        )

      case 'divider':
        return <View key={field.id} style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 12 }} />

      case 'text':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TextInput
              style={[cStyles.input, isLocked && { opacity: 0.5 }]}
              placeholder={field.placeholder || ''}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={val || ''}
              onChangeText={v => setResponse(field.id, v)}
              editable={!isLocked}
            />
          </View>
        )

      case 'textarea':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TextInput
              style={[cStyles.input, { height: 80, textAlignVertical: 'top' }, isLocked && { opacity: 0.5 }]}
              placeholder={field.placeholder || ''}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={val || ''}
              onChangeText={v => setResponse(field.id, v)}
              multiline
              editable={!isLocked}
            />
          </View>
        )

      case 'number':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TextInput
              style={[cStyles.input, isLocked && { opacity: 0.5 }]}
              placeholder={field.placeholder || (field.min != null && field.max != null ? `${field.min} - ${field.max}` : '')}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={val?.toString() || ''}
              onChangeText={v => setResponse(field.id, v)}
              keyboardType="numeric"
              editable={!isLocked}
            />
          </View>
        )

      case 'yes_no':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {['Yes', 'No'].map(opt => (
                <TouchableOpacity key={opt} onPress={() => !isLocked && setResponse(field.id, opt)}
                  style={[cStyles.optionBtn, { flex: 1, alignItems: 'center' }, val === opt && { backgroundColor: primaryColor, borderColor: primaryColor }]}>
                  <Text style={[cStyles.optionText, val === opt && { color: secondaryColor }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )

      case 'dropdown':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(field.options || []).map(opt => (
                <TouchableOpacity key={opt} onPress={() => !isLocked && setResponse(field.id, opt)}
                  style={[cStyles.optionBtn, val === opt && { backgroundColor: primaryColor, borderColor: primaryColor }]}>
                  <Text style={[cStyles.optionText, val === opt && { color: secondaryColor }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )

      case 'multi_select':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(field.options || []).map(opt => {
                const selected = Array.isArray(val) && val.includes(opt)
                return (
                  <TouchableOpacity key={opt} onPress={() => {
                    if (isLocked) return
                    const current = Array.isArray(val) ? val : []
                    setResponse(field.id, selected ? current.filter(v => v !== opt) : [...current, opt])
                  }}
                    style={[cStyles.optionBtn, selected && { backgroundColor: primaryColor, borderColor: primaryColor }]}>
                    <Text style={[cStyles.optionText, selected && { color: secondaryColor }]}>{opt}</Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )

      case 'date':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TextInput
              style={[cStyles.input, isLocked && { opacity: 0.5 }]}
              placeholder={field.placeholder || 'MM/DD/YYYY'}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={val || ''}
              onChangeText={v => setResponse(field.id, v)}
              editable={!isLocked}
            />
          </View>
        )

      case 'time':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TextInput
              style={[cStyles.input, isLocked && { opacity: 0.5 }]}
              placeholder={field.placeholder || 'HH:MM'}
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={val || ''}
              onChangeText={v => setResponse(field.id, v)}
              editable={!isLocked}
            />
          </View>
        )

      case 'vitals':
        const vitalsVal = val || {}
        const vitalsEntries = Array.isArray(vitalsVal) ? vitalsVal : [vitalsVal]
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            {vitalsEntries.map((entry, idx) => (
              <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                {vitalsEntries.length > 1 && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>Entry {idx + 1}</Text>}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {[['bp', 'BP'], ['hr', 'HR'], ['o2', 'O2 %'], ['temp', 'Temp'], ['pain', 'Pain 1-10'], ['time', 'Time']].map(([k, label]) => (
                    <View key={k} style={{ flex: 1, minWidth: 80 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginBottom: 4 }}>{label}</Text>
                      <TextInput
                        style={[cStyles.input, { marginBottom: 0, fontSize: 13 }]}
                        placeholder="—"
                        placeholderTextColor="rgba(255,255,255,0.2)"
                        value={entry[k] || ''}
                        onChangeText={v => {
                          if (isLocked) return
                          const updated = [...vitalsEntries]
                          updated[idx] = { ...updated[idx], [k]: v }
                          setResponse(field.id, field.repeatable ? updated : updated[0])
                        }}
                        editable={!isLocked}
                      />
                    </View>
                  ))}
                </View>
                {field.repeatable && !isLocked && vitalsEntries.length > 1 && (
                  <TouchableOpacity onPress={() => {
                    const updated = vitalsEntries.filter((_, i) => i !== idx)
                    setResponse(field.id, updated)
                  }} style={{ marginTop: 8 }}>
                    <Text style={{ color: '#f06060', fontSize: 12 }}>Remove entry</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {field.repeatable && !isLocked && (
              <TouchableOpacity onPress={() => {
                const updated = [...vitalsEntries, {}]
                setResponse(field.id, updated)
              }} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: primaryColor, fontSize: 13 }}>+ Add Vitals Set</Text>
              </TouchableOpacity>
            )}
          </View>
        )

      case 'iv_details':
        const ivVal = val || {}
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
              {[['site', 'IV Site'], ['gauge', 'Catheter Size'], ['attempts', 'Attempts'], ['time_in', 'Time Initiated'], ['time_out', 'Time Discontinued'], ['status', 'Catheter Status']].map(([k, label]) => (
                <View key={k} style={{ marginBottom: 10 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>{label}</Text>
                  <TextInput
                    style={[cStyles.input, { marginBottom: 0 }, isLocked && { opacity: 0.5 }]}
                    placeholder=""
                    placeholderTextColor="rgba(255,255,255,0.2)"
                    value={ivVal[k] || ''}
                    onChangeText={v => !isLocked && setResponse(field.id, { ...ivVal, [k]: v })}
                    editable={!isLocked}
                  />
                </View>
              ))}
            </View>
          </View>
        )

      case 'med_row':
        const medEntries = Array.isArray(val) ? val : []
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            {medEntries.map((entry, idx) => (
              <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>Medication {idx + 1}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Select Medication</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {formulary.filter(f => ['IV Medication', 'IM Injection'].includes(f.category)).map(f => (
                    <TouchableOpacity key={f.id} onPress={() => {
                      if (isLocked) return
                      const updated = [...medEntries]
                      updated[idx] = { ...updated[idx], name: f.name, dose: f.dose, route: f.route }
                      setResponse(field.id, updated)
                    }}
                      style={[cStyles.optionBtn, entry.name === f.name && { backgroundColor: primaryColor, borderColor: primaryColor }]}>
                      <Text style={[cStyles.optionText, { fontSize: 11 }, entry.name === f.name && { color: secondaryColor }]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {formulary.filter(f => ['IV Medication', 'IM Injection'].includes(f.category)).length === 0 && (
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No medications in formulary</Text>
                  )}
                </View>
                {[['dose', 'Dose'], ['route', 'Route'], ['time', 'Time Given'], ['lot', 'Lot #'], ['given_by', 'Given By']].map(([k, label]) => (
                  <View key={k} style={{ marginBottom: 8 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>{label}</Text>
                    <TextInput
                      style={[cStyles.input, { marginBottom: 0 }, isLocked && { opacity: 0.5 }]}
                      value={entry[k] || ''}
                      onChangeText={v => {
                        if (isLocked) return
                        const updated = [...medEntries]
                        updated[idx] = { ...updated[idx], [k]: v }
                        setResponse(field.id, updated)
                      }}
                      editable={!isLocked}
                    />
                  </View>
                ))}
                {!isLocked && (
                  <TouchableOpacity onPress={() => setResponse(field.id, medEntries.filter((_, i) => i !== idx))}>
                    <Text style={{ color: '#f06060', fontSize: 12, marginTop: 4 }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {!isLocked && (
              <TouchableOpacity onPress={() => setResponse(field.id, [...medEntries, {}])}
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: primaryColor, fontSize: 13 }}>+ Add Medication</Text>
              </TouchableOpacity>
            )}
          </View>
        )

      case 'vitamin_row':
        const vitEntries = Array.isArray(val) ? val : []
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            {vitEntries.map((entry, idx) => (
              <View key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, marginBottom: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 8 }}>Vitamin/Additive {idx + 1}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>Select Item</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                  {formulary.filter(f => ['Bag Additive', 'Vitamin'].includes(f.category)).map(f => (
                    <TouchableOpacity key={f.id} onPress={() => {
                      if (isLocked) return
                      const updated = [...vitEntries]
                      updated[idx] = { ...updated[idx], name: f.name, dose: f.dose }
                      setResponse(field.id, updated)
                    }}
                      style={[cStyles.optionBtn, entry.name === f.name && { backgroundColor: primaryColor, borderColor: primaryColor }]}>
                      <Text style={[cStyles.optionText, { fontSize: 11 }, entry.name === f.name && { color: secondaryColor }]}>{f.name}</Text>
                    </TouchableOpacity>
                  ))}
                  {formulary.filter(f => ['Bag Additive', 'Vitamin'].includes(f.category)).length === 0 && (
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No vitamins in formulary</Text>
                  )}
                </View>
                {[['dose', 'Dose'], ['added_to', 'Added To (Bag #)'], ['time', 'Time Added']].map(([k, label]) => (
                  <View key={k} style={{ marginBottom: 8 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 4 }}>{label}</Text>
                    <TextInput
                      style={[cStyles.input, { marginBottom: 0 }, isLocked && { opacity: 0.5 }]}
                      value={entry[k] || ''}
                      onChangeText={v => {
                        if (isLocked) return
                        const updated = [...vitEntries]
                        updated[idx] = { ...updated[idx], [k]: v }
                        setResponse(field.id, updated)
                      }}
                      editable={!isLocked}
                    />
                  </View>
                ))}
                {!isLocked && (
                  <TouchableOpacity onPress={() => setResponse(field.id, vitEntries.filter((_, i) => i !== idx))}>
                    <Text style={{ color: '#f06060', fontSize: 12, marginTop: 4 }}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            {!isLocked && (
              <TouchableOpacity onPress={() => setResponse(field.id, [...vitEntries, {}])}
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, alignItems: 'center' }}>
                <Text style={{ color: primaryColor, fontSize: 13 }}>+ Add Vitamin/Additive</Text>
              </TouchableOpacity>
            )}
          </View>
        )

      case 'service_select':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {services.map(svc => {
                const selected = Array.isArray(val) ? val.includes(svc.name) : val === svc.name
                return (
                  <TouchableOpacity key={svc.id} onPress={() => {
                    if (isLocked) return
                    if (field.repeatable) {
                      const current = Array.isArray(val) ? val : []
                      setResponse(field.id, selected ? current.filter(v => v !== svc.name) : [...current, svc.name])
                    } else {
                      setResponse(field.id, svc.name)
                    }
                  }}
                    style={[cStyles.optionBtn, selected && { backgroundColor: primaryColor, borderColor: primaryColor }]}>
                    <Text style={[cStyles.optionText, selected && { color: secondaryColor }]}>{svc.name}</Text>
                  </TouchableOpacity>
                )
              })}
              {services.length === 0 && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>No services defined</Text>}
            </View>
          </View>
        )

      case 'photo':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TouchableOpacity
              style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
              onPress={async () => {
                if (isLocked) return
                if (!chartId) { Alert.alert('Save First', 'Please save draft before adding photos'); return }
                const permission = await ImagePicker.requestCameraPermissionsAsync()
                if (!permission.granted) return
                const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true })
                if (!result.canceled && result.assets[0].base64) {
                  const res = await fetch(`${API_URL}/charts/${chartId}/photo`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ photo: `data:image/jpeg;base64,${result.assets[0].base64}`, fieldId: field.id })
                  })
                  const data = await res.json()
                  if (data.success) setResponse(field.id, data.photoUrl)
                }
              }}>
              {val ? (
                <Image source={{ uri: val }} style={{ width: '100%', height: 200, borderRadius: 8 }} resizeMode="cover" />
              ) : (
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Tap to take photo</Text>
              )}
            </TouchableOpacity>
          </View>
        )

      case 'signature':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <Text style={cStyles.fieldLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: val ? primaryColor : 'rgba(255,255,255,0.1)' }}>
              {val ? (
                <Text style={{ color: '#4CAF50', fontSize: 13 }}>Signed</Text>
              ) : (
                <TouchableOpacity onPress={() => !isLocked && setResponse(field.id, `Signed by tech at ${new Date().toLocaleTimeString()}`)}>
                  <Text style={{ color: primaryColor, fontSize: 13 }}>Tap to sign</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )

      case 'consent':
        return (
          <View key={field.id} style={{ marginBottom: 14 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
              {field.consentText && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 12, lineHeight: 18 }}>{field.consentText}</Text>}
              <TouchableOpacity onPress={() => !isLocked && setResponse(field.id, !val)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={[cStyles.checkbox, val && { backgroundColor: primaryColor, borderColor: primaryColor }]}>
                  {val && <Text style={{ color: secondaryColor, fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={{ color: '#fff', fontSize: 14, flex: 1 }}>{field.label}{field.required ? ' *' : ''}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )

      default:
        return null
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a1a' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={[cStyles.header, { backgroundColor: secondaryColor }]}>
          <TouchableOpacity onPress={() => { saveChart(false); onClose() }}>
            <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>{isLocked ? 'Back' : 'Save & Back'}</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Chart</Text>
            {template && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{template.name}</Text>}
          </View>
          <TouchableOpacity onPress={() => !isLocked && saveChart(false)}>
            <Text style={{ color: isLocked ? 'rgba(255,255,255,0.2)' : primaryColor, fontSize: 14, fontWeight: '600' }}>
              {saving ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator color={primaryColor} size="large" />
          </View>
        ) : (
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">

            {/* Template Picker */}
            {templatePickerVisible && availableTemplates.length > 1 && (
              <View style={{ margin: 16, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 }}>Select Chart Template</Text>
                {availableTemplates.map(t => (
                  <TouchableOpacity key={t.id} onPress={() => {
                    setTemplate(t)
                    setTemplatePickerVisible(false)
                    if (prefill) applyPrefill(prefill, t)
                  }}
                    style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{t.name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>{(t.fields || []).length} fields</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* NP Chart Card */}
            {npChart && (
              <TouchableOpacity onPress={() => setNpChartModalVisible(true)}
                style={{ margin: 16, marginBottom: 8, backgroundColor: '#9C27B0' + '20', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#9C27B0' + '60', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={{ color: '#9C27B0', fontSize: 13, fontWeight: '700' }}>NP Chart Available</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>
                    {npChart.template_name || 'NP Assessment'} — Tap to view
                  </Text>
                </View>
                <Text style={{ color: '#9C27B0', fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            )}

            {/* Prefill Banner */}
            {prefill?.hasValidIntake && (
              <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: '#4CAF50' + '15', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#4CAF50' + '40' }}>
                <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: '600' }}>Intake on file — some fields pre-filled from patient intake</Text>
              </View>
            )}

            {/* GFE Banner */}
            {prefill?.gfe && (
              <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: primaryColor + '15', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: primaryColor + '40' }}>
                <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>GFE Approved — {prefill.gfe.npName}</Text>
                {prefill.gfe.restrictions && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 }}>Restrictions: {prefill.gfe.restrictions}</Text>}
                {prefill.gfe.npOrders && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>Orders: {prefill.gfe.npOrders}</Text>}
              </View>
            )}

            {/* Locked Banner */}
            {isLocked && (
              <View style={{ marginHorizontal: 16, marginBottom: 8, backgroundColor: 'rgba(240,100,100,0.1)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(240,100,100,0.3)' }}>
                <Text style={{ color: '#f06060', fontSize: 12, fontWeight: '600' }}>Chart submitted and locked. Add an addendum below if needed.</Text>
              </View>
            )}

            {/* Fields */}
            {template && (
              <View style={{ padding: 16 }}>
                {template.fields?.map(field => renderField(field))}
              </View>
            )}

            {!template && !templatePickerVisible && !loading && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center' }}>No chart template found. Contact your administrator to set up a chart template.</Text>
              </View>
            )}

            {/* Addendum */}
            {isLocked && chartId && (
              <View style={{ margin: 16, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Add Addendum</Text>
                <TextInput
                  style={[cStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Enter addendum notes..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  value={amendmentText}
                  onChangeText={setAmendmentText}
                  multiline
                />
                <TouchableOpacity onPress={submitAmendment}
                  style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>Save Addendum</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* Submit Button */}
        {!isLocked && template && (
          <View style={{ padding: 16, paddingBottom: 32, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0a0a1a' }}>
            <TouchableOpacity
              style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={() => Alert.alert('Submit Chart', 'Submit and lock this chart? You will only be able to add addendums after this.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Submit', onPress: () => saveChart(true) }
              ])}>
              <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>{saving ? 'Saving...' : 'Submit Chart'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* NP Chart View Modal */}
        <Modal visible={npChartModalVisible} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>NP Chart</Text>
              <TouchableOpacity onPress={() => setNpChartModalVisible(false)}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1, padding: 20 }}>
              {npChart && (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 }}>{npChart.template_name} — Read Only</Text>
                  {npChart.template_fields?.map(field => {
                    const val = npChart.responses?.[field.id]
                    if (val === undefined || val === null || val === '') return null
                    return (
                      <View key={field.id} style={{ marginBottom: 14 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase' }}>{field.label}</Text>
                        <Text style={{ color: '#fff', fontSize: 14 }}>{typeof val === 'object' ? JSON.stringify(val) : val.toString()}</Text>
                      </View>
                    )
                  })}
                </>
              )}
            </ScrollView>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </Modal>
  )
}

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
    fetch(`${API_URL}/chart-templates?type=tech`, { headers })
      .then(r => r.json())
      .then(d => setHasTemplates((d.templates || []).length > 0))
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
  const [active, setActive] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [reconfirmBookingId, setReconfirmBookingId] = useState(null)
  const [pendingBookingId, setPendingBookingId] = useState(null)
  const [confirmTimeModal, setConfirmTimeModal] = useState(false)
  const [confirmTime, setConfirmTime] = useState(new Date())

  const openReconfirmModal = (bookingId, currentTime) => {
    setReconfirmBookingId(bookingId)
    setConfirmTime(currentTime ? new Date(currentTime) : new Date())
    setConfirmTimeModal(true)
  }

  const reconfirmTime = async (bookingId, time) => {
    try {
      const res = await fetch(`${API_URL}/dispatch/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmedTime: time.toISOString() })
      })
      const data = await res.json()
      if (data.success) {
        setConfirmTimeModal(false)
        fetchAll()
        Alert.alert('✅ Time Updated', `Confirmed for ${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
      } else {
        Alert.alert('Error', data.message || 'Could not update time')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    }
  }
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

  const fetchAll = useCallback(async () => {
    try {
      const [qRes, sRes, aRes, upRes, lRes, stRes, naRes, svcRes] = await Promise.all([
        fetch(`${API_URL}/dispatch/queue`, { headers }),
        fetch(`${API_URL}/dispatch/scheduled`, { headers }),
        fetch(`${API_URL}/dispatch/active`, { headers }),
        fetch(`${API_URL}/dispatch/upcoming`, { headers }),
        fetch(`${API_URL}/dispatch/log`, { headers }),
        fetch(`${API_URL}/dispatch/stats`, { headers }),
        fetch(`${API_URL}/dispatch/needs-attention`, { headers }),
        fetch(`${API_URL}/admin/services`, { headers })
      ])
      const [qData, sData, aData, upData, lData, stData, naData, svcData] = await Promise.all([
        qRes.json(), sRes.json(), aRes.json(), upRes.json(), lRes.json(), stRes.json(), naRes.json(), svcRes.json()
      ])
      if (qData.queue) setQueue(qData.queue)
      if (sData.scheduled) setScheduled(sData.scheduled)
        if (aData.active) setActive(aData.active)
            if (upData.upcoming) setUpcoming(upData.upcoming)
      if (lData.log) setLog(lData.log)
      if (stData.stats) setStats(stData.stats)
      if (naData.bookings) setNeedsAttention(naData.bookings)
      if (svcData.services) setCompanyServices(svcData.services)
      const settingsRes = await fetch(`${API_URL}/admin/company/settings`, { headers })
      const settingsData = await settingsRes.json()
      if (settingsData.company) {
        setCompanyServiceArea(settingsData.company.serviceArea || '')
      }
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
          { key: 'active', label: `Active${active.length > 0 ? ` (${active.length})` : ''}` },
          { key: 'upcoming', label: `Upcoming${upcoming.length > 0 ? ` (${upcoming.length})` : ''}` },
          { key: 'messages', label: 'Messages' },
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>👤 {b.patient_name}</Text>
                {b.is_minor && <Text style={{ fontSize: 11, fontWeight: '700', color: '#e53e3e' }}>Minor</Text>}
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>📍 {b.address}</Text>
              {!b.has_valid_intake && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 4 }}>⚠️ No intake on file</Text>}
              {b.patient_phone && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4 }}>📞 {b.patient_phone}</Text>}
              {b.notes && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 4, fontStyle: 'italic' }}>📝 {b.notes}</Text>}
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>
                {(b.confirmed_time || b.requested_time)
                  ? `📅 ${b.confirmed_time ? 'Confirmed' : 'Scheduled'}: ${new Date(b.confirmed_time || b.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: company?.timezone || 'America/Phoenix' })} at ${new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}`
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
                const date = new Date(b.confirmed_time || b.requested_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: company?.timezone || 'America/Phoenix' })
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
                        {new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}
                        {b.confirmed_time && <Text style={{ color: '#4CAF50' }}> ✓</Text>}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>👤 {b.patient_name}</Text>
                {b.is_minor && <Text style={{ fontSize: 11, fontWeight: '700', color: '#e53e3e' }}>Minor</Text>}
              </View>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>📍 {b.address}</Text>
                    {!b.has_valid_intake && <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '600', marginBottom: 8 }}>⚠️ No intake on file</Text>}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        style={{ flex: 1, backgroundColor: primaryColor, borderRadius: 10, padding: 10, alignItems: 'center' }}
                        onPress={() => {
                          setPendingBookingId(b.id)
                          setConfirmTime(b.requested_time ? new Date(b.requested_time) : new Date())
                          setConfirmTimeModal(true)
                        }}
                      >
                        <Text style={{ color: secondaryColor, fontSize: 13, fontWeight: '700' }}>✓ Confirm</Text>
                      </TouchableOpacity>
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

      {/* Active Tab */}
      {dispatchTab === 'active' && (
        <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll() }} tintColor={primaryColor} />}>
          {active.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>No active calls</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>Assigned calls will appear here</Text>
            </View>
          ) : active.map(call => (
            <View key={call.id} style={sStyles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 }}>{call.service}</Text>
                <View style={{ backgroundColor: call.status === 'en_route' ? 'rgba(33,150,243,0.2)' : call.status === 'on_scene' ? 'rgba(76,175,80,0.2)' : 'rgba(201,168,76,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: call.status === 'en_route' ? '#2196F3' : call.status === 'on_scene' ? '#4CAF50' : primaryColor, fontSize: 10, fontWeight: '700' }}>{call.status?.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>👤 {call.patient_name}</Text>
                {call.is_minor && <Text style={{ fontSize: 11, fontWeight: '700', color: '#e53e3e' }}>Minor</Text>}
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 4 }}>📍 {call.address}</Text>
              {call.tech_first && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>🧑‍⚕️ {call.tech_first} {call.tech_last}</Text>}
              {(call.confirmed_time || call.requested_time) && (
                <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600', marginBottom: 8 }}>
                  🕐 {new Date(call.confirmed_time || call.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}
                </Text>
              )}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <TouchableOpacity
                  style={{ flex: 1, borderWidth: 1, borderColor: '#FF9800', borderRadius: 10, padding: 12, alignItems: 'center' }}
                  onPress={() => openReconfirmModal(call.id, call.confirmed_time || call.requested_time)}
                >
                  <Text style={{ color: '#FF9800', fontSize: 13, fontWeight: '600' }}>🕐 Change Time</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, borderWidth: 1, borderColor: '#f09090', borderRadius: 10, padding: 12, alignItems: 'center' }}
                  onPress={() => { setCancelBookingId(call.id); setCancelReason(''); setCancelDisposition(''); setCancelModal(true) }}
                >
                  <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Upcoming Tab */}
      {dispatchTab === 'upcoming' && (
        <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll() }} tintColor={primaryColor} />}>
          {upcoming.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>🗓</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>No upcoming assignments</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>Pre-assigned future bookings will appear here</Text>
            </View>
          ) : Object.entries(
            upcoming.reduce((groups, b) => {
              const date = new Date(b.confirmed_time || b.requested_time).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: company?.timezone || 'America/Phoenix' })
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
                      {new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>👤 {b.patient_name}</Text>
                {b.is_minor && <Text style={{ fontSize: 11, fontWeight: '700', color: '#e53e3e' }}>Minor</Text>}
              </View>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 8 }}>📍 {b.address}</Text>
                  {b.tech_first_name && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>🧑‍⚕️ {b.tech_first_name} {b.tech_last_name}</Text>}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={{ flex: 1, borderWidth: 1, borderColor: '#FF9800', borderRadius: 10, padding: 12, alignItems: 'center' }}
                      onPress={() => openReconfirmModal(b.id, b.confirmed_time || b.requested_time)}
                    >
                      <Text style={{ color: '#FF9800', fontSize: 13, fontWeight: '600' }}>🕐 Change Time</Text>
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
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Reconfirm Time Modal */}
      <Modal visible={confirmTimeModal} transparent animationType="slide">
        <View style={sStyles.modalOverlay}>
          <View style={sStyles.modalCard}>
            <Text style={sStyles.modalTitle}>Change Appointment Time</Text>
            <Text style={sStyles.modalSub}>Select the new confirmed time</Text>
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
            <TouchableOpacity style={[sStyles.primaryBtn, { backgroundColor: primaryColor }]} onPress={() => {
              if (pendingBookingId) {
                confirmBooking(pendingBookingId, confirmTime)
              } else {
                reconfirmTime(reconfirmBookingId, confirmTime)
              }
            }}>
              <Text style={[sStyles.primaryBtnText, { color: secondaryColor }]}>Confirm {confirmTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} →</Text>
            </TouchableOpacity>
            <TouchableOpacity style={sStyles.cancelBtn} onPress={() => setConfirmTimeModal(false)}>
              <Text style={sStyles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
  const [hasTemplates, setHasTemplates] = useState(false)
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
      {hasTemplates ? (
        <DynamicChartModal key={chartPatient?.name || 'chart'} visible={showChart} onClose={() => { setShowChart(false); setChartPatient(null); fetchCall() }} call={call} token={token} company={company} patientName={chartPatient?.name} patientDob={chartPatient?.dob} />
      ) : (
        <ChartModal key={chartPatient?.name || 'chart'} visible={showChart} onClose={() => { setShowChart(false); setChartPatient(null); fetchCall() }} call={call} token={token} company={company} patientName={chartPatient?.name} patientDob={chartPatient?.dob} />
      )}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{call.patient_name}</Text>
                  {call.is_minor && <Text style={{ fontSize: 11, fontWeight: '700', color: '#e53e3e' }}>Minor</Text>}
                </View>
                {call.patient_phone && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>📞 {call.patient_phone}</Text>}
                
                {(call.confirmed_time || call.requested_time) && (
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 }}>
                    🕐 {call.confirmed_time ? 'Confirmed' : 'Scheduled'}: {new Date(call.confirmed_time || call.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}
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
                    🕐 {new Date(b.confirmed_time || b.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })}
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
  const [psEditEmergencyContact, setPsEditEmergencyContact] = useState('')
  const [psEditEmergencyPhone, setPsEditEmergencyPhone] = useState('')
  const [psEditEmergencyRelationship, setPsEditEmergencyRelationship] = useState('')
  const [psEditInsuranceProvider, setPsEditInsuranceProvider] = useState('')
  const [psEditInsuranceMemberId, setPsEditInsuranceMemberId] = useState('')
  const [psEditInsuranceGroupNumber, setPsEditInsuranceGroupNumber] = useState('')
  const [psEditInsurancePhone, setPsEditInsurancePhone] = useState('')

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

// Schedule
  const [scheduleHours, setScheduleHours] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(false)
  const [scheduleSaving, setScheduleSaving] = useState(false)
  const [blackoutDate, setBlackoutDate] = useState('')
  const [blackouts, setBlackouts] = useState([])

  const fetchSchedule = useCallback(async () => {
    const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    setScheduleLoading(true)
    try {
      const [hoursRes, blackoutRes] = await Promise.all([
        fetch(`${API_URL}/schedule/hours`, { headers }),
        fetch(`${API_URL}/schedule/blackouts`, { headers })
      ])
      const [hoursData, blackoutData] = await Promise.all([hoursRes.json(), blackoutRes.json()])
      if (hoursData.hours) {
        const filled = DAY_NAMES.map((_, i) => {
          const existing = hoursData.hours.find(h => h.day_of_week === i)
          return existing || { day_of_week: i, is_open: false, open_time: '09:00', close_time: '18:00', max_per_slot: 3, slot_duration: 30 }
        })
        setScheduleHours(filled)
      }
      if (blackoutData.blackouts) setBlackouts(blackoutData.blackouts)
    } catch (err) { console.error('Schedule fetch error:', err) }
    finally { setScheduleLoading(false) }
  }, [token])

  const saveSchedule = async () => {
    setScheduleSaving(true)
    try {
      const res = await fetch(`${API_URL}/admin/hours`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: scheduleHours })
      })
      const data = await res.json()
      if (data.success) Alert.alert('✅ Saved', 'Hours updated successfully')
      else Alert.alert('Error', data.message || 'Could not save hours')
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setScheduleSaving(false) }
  }

  const addBlackout = async () => {
    if (!blackoutDate.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Invalid date', 'Use format YYYY-MM-DD'); return }
    try {
      await fetch(`${API_URL}/admin/blackout`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: blackoutDate })
      })
      setBlackoutDate('')
      fetchSchedule()
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  const removeBlackout = async (date) => {
    try {
      await fetch(`${API_URL}/admin/blackout/${date}`, { method: 'DELETE', headers })
      fetchSchedule()
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  // Settings
  const [requireGFE, setRequireGFE] = useState(false)
  const [companyName, setCompanyName] = useState(company?.name || '')
  const [companyTimezone, setCompanyTimezone] = useState(company?.timezone || 'America/Phoenix')
  const [acceptMinors, setAcceptMinors] = useState(true)
  const [minimumMinorAge, setMinimumMinorAge] = useState(0)
  const [companyServiceArea, setCompanyServiceArea] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [bugReportModal, setBugReportModal] = useState(false)

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
      const [settingsRes, companyRes] = await Promise.all([
        fetch(`${API_URL}/admin/settings`, { headers }),
        fetch(`${API_URL}/admin/company/settings`, { headers })
      ])
      const [settingsData, companyData] = await Promise.all([settingsRes.json(), companyRes.json()])
      if (settingsData.settings) setRequireGFE(settingsData.settings.require_gfe || false)
      if (companyData.company) {
        setCompanyServiceArea(companyData.company.serviceArea || '')
        setAcceptMinors(companyData.company.accept_minors !== false)
        setMinimumMinorAge(companyData.company.minimum_minor_age || 0)
      }
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
    if (adminTab === 'schedule') fetchSchedule()
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
        setPsEditEmergencyContact(data.patient?.emergency_contact_name || '')
        setPsEditEmergencyPhone(data.patient?.emergency_contact_phone || '')
        setPsEditEmergencyRelationship(data.patient?.emergency_contact_relationship || '')
        setPsEditInsuranceProvider(data.patient?.insurance_provider || '')
        setPsEditInsuranceMemberId(data.patient?.insurance_member_id || '')
        setPsEditInsuranceGroupNumber(data.patient?.insurance_group_number || '')
        setPsEditInsurancePhone(data.patient?.insurance_phone || '')
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
        body: JSON.stringify({ phone: psEditPhone, homeAddress: psEditAddress, city: psEditCity, state: psEditState, zip: psEditZip, emergencyContactName: psEditEmergencyContact, emergencyContactPhone: psEditEmergencyPhone, emergencyContactRelationship: psEditEmergencyRelationship, insuranceProvider: psEditInsuranceProvider, insuranceMemberId: psEditInsuranceMemberId, insuranceGroupNumber: psEditInsuranceGroupNumber, insurancePhone: psEditInsurancePhone })
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
      await Promise.all([
        fetch(`${API_URL}/admin/settings`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: companyName, requireGFE, timezone: companyTimezone, acceptMinors, minimumMinorAge })
        }),
        fetch(`${API_URL}/admin/company/settings`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceArea: companyServiceArea })
        })
      ])
      Alert.alert('✅ Saved', 'Settings updated')
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
            { key: 'schedule', label: '🕐 Schedule' },
            { key: 'memberships', label: '🏅 Memberships' },
            { key: 'billing', label: '💳 Billing' },
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{p.first_name} {p.last_name}</Text>
                    {p.is_minor && <Text style={{ fontSize: 11, fontWeight: '700', color: '#e53e3e' }}>Minor</Text>}
                  </View>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{p.phone || 'No phone'}{p.email && !p.email.includes('@infusepro.internal') ? ' · ' + p.email : ''}</Text>
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
                      {psProfileData?.patient?.dob && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>DOB: {(() => { const d = new Date(psProfileData.patient.dob); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString() })()}</Text>}
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
                      {psProfileData?.intake?.allergies_detail?.length > 0 && (
                        <View style={{ backgroundColor: 'rgba(229,62,62,0.15)', borderWidth: 1, borderColor: '#e53e3e', borderRadius: 10, padding: 10, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontSize: 16 }}>⚠️</Text>
                          <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '700', flex: 1 }}>ALLERGIES: {Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail.join(', ') : psProfileData.intake.allergies_detail}</Text>
                        </View>
                      )}
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1 }}>CONTACT INFORMATION</Text>
                          <TouchableOpacity onPress={() => setPsEditing(!psEditing)}>
                            <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>{psEditing ? 'Cancel' : '✏️ Edit'}</Text>
                          </TouchableOpacity>
                        </View>
                        <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>PHONE</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditPhone} onChangeText={setPsEditPhone} placeholder="Phone number" placeholderTextColor="#666" keyboardType="phone-pad" /> : <Text style={{ color: psEditPhone ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditPhone || 'Not on file'}</Text>}
                        </View>
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
                          ) : <Text style={{ color: psEditAddress ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditAddress ? `${psEditAddress}${psEditCity ? `, ${psEditCity}` : ''}${psEditState ? `, ${psEditState}` : ''}${psEditZip ? ` ${psEditZip}` : ''}` : 'Not on file'}</Text>}
                        </View>
                      </View>

                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>EMERGENCY CONTACT</Text>
                        <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>NAME</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditEmergencyContact} onChangeText={setPsEditEmergencyContact} placeholder="Emergency contact name" placeholderTextColor="#666" /> : <Text style={{ color: psEditEmergencyContact ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditEmergencyContact || 'Not on file'}</Text>}
                        </View>
                        <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>PHONE</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditEmergencyPhone} onChangeText={setPsEditEmergencyPhone} placeholder="Emergency contact phone" placeholderTextColor="#666" keyboardType="phone-pad" /> : <Text style={{ color: psEditEmergencyPhone ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditEmergencyPhone || 'Not on file'}</Text>}
                        </View>
                        <View style={{ paddingVertical: 6 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>RELATIONSHIP</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditEmergencyRelationship} onChangeText={setPsEditEmergencyRelationship} placeholder="e.g. Spouse, Parent" placeholderTextColor="#666" /> : <Text style={{ color: psEditEmergencyRelationship ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditEmergencyRelationship || 'Not on file'}</Text>}
                        </View>
                      </View>

                      {psProfileData?.intake && (
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>MEDICAL FLAGS</Text>
                          {psProfileData.intake.allergies_detail?.length > 0 && (
                            <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                              <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>⚠️ ALLERGIES</Text>
                              {(Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail : []).map((a, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {a}</Text>)}
                            </View>
                          )}
                          {psProfileData.intake.important_history?.length > 0 && (
                            <View style={{ backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 8, padding: 10 }}>
                              <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>⚡ IMPORTANT HISTORY</Text>
                              {(Array.isArray(psProfileData.intake.important_history) ? psProfileData.intake.important_history : []).map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13 }}>• {h}</Text>)}
                            </View>
                          )}
                        </View>
                      )}

                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>INSURANCE</Text>
                        <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>PROVIDER</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsuranceProvider} onChangeText={setPsEditInsuranceProvider} placeholder="e.g. Blue Cross" placeholderTextColor="#666" /> : <Text style={{ color: psEditInsuranceProvider ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsuranceProvider || 'Not on file'}</Text>}
                        </View>
                        <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>MEMBER ID</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsuranceMemberId} onChangeText={setPsEditInsuranceMemberId} placeholder="Member ID" placeholderTextColor="#666" /> : <Text style={{ color: psEditInsuranceMemberId ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsuranceMemberId || 'Not on file'}</Text>}
                        </View>
                        <View style={{ paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>GROUP NUMBER</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsuranceGroupNumber} onChangeText={setPsEditInsuranceGroupNumber} placeholder="Group number" placeholderTextColor="#666" /> : <Text style={{ color: psEditInsuranceGroupNumber ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsuranceGroupNumber || 'Not on file'}</Text>}
                        </View>
                        <View style={{ paddingVertical: 6 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>INSURANCE PHONE</Text>
                          {psEditing ? <TextInput style={{ color: '#fff', fontSize: 13, borderBottomWidth: 1, borderBottomColor: primaryColor, paddingVertical: 4 }} value={psEditInsurancePhone} onChangeText={setPsEditInsurancePhone} placeholder="Insurance phone" placeholderTextColor="#666" keyboardType="phone-pad" /> : <Text style={{ color: psEditInsurancePhone ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: '600' }}>{psEditInsurancePhone || 'Not on file'}</Text>}
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

      {/* Schedule */}
      {adminTab === 'schedule' && (
        <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={scheduleLoading} onRefresh={fetchSchedule} tintColor={primaryColor} />}>
          <Text style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Business Hours</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>Set when patients can schedule appointments.</Text>
          {scheduleLoading ? (
            <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
          ) : scheduleHours.map((day, i) => (
            <View key={i} style={[sStyles.card, { borderLeftWidth: 3, borderLeftColor: day.is_open ? primaryColor : 'rgba(255,255,255,0.15)' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: day.is_open ? 14 : 0 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}</Text>
                <TouchableOpacity
                  style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: day.is_open ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }}
                  onPress={() => {
                    const updated = [...scheduleHours]
                    updated[i] = { ...updated[i], is_open: !updated[i].is_open }
                    setScheduleHours(updated)
                  }}
                >
                  <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: day.is_open ? 'flex-end' : 'flex-start' }} />
                </TouchableOpacity>
              </View>
              {day.is_open && (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={sStyles.fieldLabel}>Open</Text>
                    <TextInput style={[sStyles.input, { marginBottom: 0, fontSize: 14, padding: 12 }]} value={day.open_time?.slice(0,5)} onChangeText={(t) => { const u = [...scheduleHours]; u[i] = { ...u[i], open_time: t }; setScheduleHours(u) }} placeholder="09:00" placeholderTextColor="#666" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sStyles.fieldLabel}>Close</Text>
                    <TextInput style={[sStyles.input, { marginBottom: 0, fontSize: 14, padding: 12 }]} value={day.close_time?.slice(0,5)} onChangeText={(t) => { const u = [...scheduleHours]; u[i] = { ...u[i], close_time: t }; setScheduleHours(u) }} placeholder="18:00" placeholderTextColor="#666" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sStyles.fieldLabel}>Max/Slot</Text>
                    <TextInput style={[sStyles.input, { marginBottom: 0, fontSize: 14, padding: 12 }]} value={String(day.max_per_slot)} onChangeText={(t) => { const u = [...scheduleHours]; u[i] = { ...u[i], max_per_slot: parseInt(t) || 1 }; setScheduleHours(u) }} keyboardType="numeric" placeholder="3" placeholderTextColor="#666" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={sStyles.fieldLabel}>Duration</Text>
                    <TouchableOpacity style={[sStyles.input, { marginBottom: 0, fontSize: 14, padding: 12, justifyContent: 'center' }]} onPress={() => { const u = [...scheduleHours]; u[i] = { ...u[i], slot_duration: day.slot_duration === 30 ? 60 : 30 }; setScheduleHours(u) }}>
                      <Text style={{ color: primaryColor, fontWeight: '700', fontSize: 14 }}>{day.slot_duration === 60 ? '60 min' : '30 min'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={[sStyles.primaryBtn, { backgroundColor: primaryColor, opacity: scheduleSaving ? 0.6 : 1, marginBottom: 32 }]} onPress={saveSchedule} disabled={scheduleSaving}>
            {scheduleSaving ? <ActivityIndicator color={secondaryColor} /> : <Text style={[sStyles.primaryBtnText, { color: secondaryColor }]}>Save Hours</Text>}
          </TouchableOpacity>

          <Text style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>Blackout Dates</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 12 }}>Block specific dates from scheduling.</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TextInput style={[sStyles.input, { flex: 1, marginBottom: 0, fontSize: 14, padding: 12 }]} value={blackoutDate} onChangeText={setBlackoutDate} placeholder="YYYY-MM-DD" placeholderTextColor="#666" />
            <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' }} onPress={addBlackout}>
              <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 14 }}>Add</Text>
            </TouchableOpacity>
          </View>
          {blackouts.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 16 }}>No blackout dates set</Text>
          ) : blackouts.map((b, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>🚫 {b.blackout_date} {b.reason ? `— ${b.reason}` : ''}</Text>
              <TouchableOpacity onPress={() => removeBlackout(b.blackout_date)}>
                <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Settings */}
      {adminTab === 'settings' && (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={{ color: 'rgba(201,168,76,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Company</Text>
          <View style={sStyles.card}>
            <Text style={sStyles.fieldLabel}>Company Name</Text>
            <TextInput style={sStyles.input} value={companyName} onChangeText={setCompanyName} placeholder="Company name" placeholderTextColor="#444" />
            <Text style={sStyles.fieldLabel}>Service Area</Text>
            <TextInput style={sStyles.input} value={companyServiceArea} onChangeText={setCompanyServiceArea} placeholder="Phoenix, Scottsdale, Tempe..." placeholderTextColor="#444" />
            <Text style={sStyles.fieldLabel}>Timezone</Text>
            {Platform.OS === 'web' ? (
              <select
                value={companyTimezone}
                onChange={(e) => setCompanyTimezone(e.target.value)}
                style={{ background: '#0a1540', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, fontSize: 15, color: '#fff', width: '100%', marginBottom: 12, height: 52, cursor: 'pointer' }}
              >
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Phoenix">Arizona (AZ — no DST)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="America/Anchorage">Alaska (AKT)</option>
                <option value="America/Honolulu">Hawaii (HT)</option>
              </select>
            ) : (
              <View style={{ marginBottom: 12 }}>
                {['America/New_York','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles','America/Anchorage','America/Honolulu'].map(tz => (
                  <TouchableOpacity
                    key={tz}
                    onPress={() => setCompanyTimezone(tz)}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' }}
                  >
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      {companyTimezone === tz && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: primaryColor }} />}
                    </View>
                    <Text style={{ color: '#fff', fontSize: 14 }}>{tz.replace('America/', '').replace('_', ' ')}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
            style={[sStyles.primaryBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', marginTop: 16 }]}
            onPress={() => {
              const { Linking } = require('react-native')
              Linking.openURL('https://api.infusepro.app/list-your-company')
            }}
          >
            <Text style={[sStyles.primaryBtnText, { color: primaryColor }]}>📍 Request Map Listing</Text>
          </TouchableOpacity>
          {/* Minor Booking Policy */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginTop: 16, marginBottom: 8 }}>
            <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>MINOR BOOKING POLICY</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>Accept Minor Bookings</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 2 }}>Allow patients under 18 to be booked</Text>
              </View>
              <TouchableOpacity style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: acceptMinors ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={() => setAcceptMinors(!acceptMinors)}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: acceptMinors ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>
            {acceptMinors && (
              <>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginBottom: 10 }}>Minimum age allowed</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[0, 13, 14, 15, 16, 17].map(age => (
                    <TouchableOpacity key={age} style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderColor: minimumMinorAge === age ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: minimumMinorAge === age ? primaryColor + '20' : 'transparent' }} onPress={() => setMinimumMinorAge(age)}>
                      <Text style={{ color: minimumMinorAge === age ? primaryColor : 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 }}>{age === 0 ? 'Any age' : `${age}+`}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}
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

      {adminTab === 'billing' && (
        <SoloBillingSection token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} headers={{ Authorization: `Bearer ${token}` }} />
      )}

      {adminTab === 'memberships' && (
        <SoloMembershipsSection token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} headers={{ Authorization: `Bearer ${token}` }} />
      )}
    </View>
  )
}

// ─── SOLO BILLING SECTION ─────────────────────────────────────────────────────
function SoloBillingSection({ token, primaryColor, secondaryColor, headers }) {
  const API_URL = 'https://api.infusepro.app'
  const [billingStatus, setBillingStatus] = useState(null)
  const [connectStatus, setConnectStatus] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/billing/status`, { headers }).then(r => r.json()).then(d => { if (d.subscription) setBillingStatus(d.subscription) }).catch(() => {})
    fetch(`${API_URL}/billing/connect/status`, { headers }).then(r => r.json()).then(d => { if (d.success) setConnectStatus(d) }).catch(() => {})
  }, [])

  const plans = [
    { tier: 'solo', price: '$49.99/mo', features: ['Solo operator mode', 'Dispatch + tech in one', 'Patient app', 'Up to 2 staff'] },
    { tier: 'starter', price: '$99/mo', features: ['Full platform access', 'Up to 5 staff accounts', 'Dispatch console', 'Tech & patient app'] },
    { tier: 'growth', price: '$199/mo', features: ['Everything in Starter', 'Unlimited staff', 'Announcements & banners', 'Referral & loyalty programs'] },
    { tier: 'scale', price: '$349/mo', features: ['Everything in Growth', 'Analytics dashboard', 'White label branding', 'Multi-region support'] }
  ]

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Current Plan</Text>
        {!billingStatus || billingStatus?.status === 'none' ? (
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>No active subscription</Text>
        ) : (
          <View style={{ backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>ACTIVE</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', textTransform: 'capitalize' }}>{billingStatus.tier}</Text>
            {billingStatus.currentPeriodEnd && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Renews {new Date(billingStatus.currentPeriodEnd).toLocaleDateString()}</Text>}
          </View>
        )}
        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>AVAILABLE PLANS</Text>
        {plans.map(plan => (
          <View key={plan.tier} style={{ borderWidth: 1, borderColor: billingStatus?.tier === plan.tier ? primaryColor : 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: billingStatus?.tier === plan.tier ? primaryColor + '10' : 'transparent' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>{plan.tier}</Text>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>{plan.price}</Text>
            </View>
            {plan.features.map((f, i) => <Text key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 3 }}>✓ {f}</Text>)}
            {billingStatus?.tier !== plan.tier && (
              <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 }} onPress={async () => {
                try {
                  const isExisting = billingStatus && billingStatus.status !== 'none'
                  const endpoint = isExisting ? `${API_URL}/billing/update-tier` : `${API_URL}/billing/create-checkout`
                  const res = await fetch(endpoint, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: plan.tier }) })
                  const data = await res.json()
                  if (isExisting && data.success) Alert.alert('Updated!', `Plan changed to ${plan.tier}`)
                  else if (data.url) Linking.openURL(data.url)
                  else Alert.alert('Error', data.error || 'Could not update plan')
                } catch (e) { Alert.alert('Error', 'Network error') }
              }}>
                <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 14 }}>{!billingStatus || billingStatus?.status === 'none' ? 'Subscribe' : 'Switch to'} {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}</Text>
              </TouchableOpacity>
            )}
            {billingStatus?.tier === plan.tier && (
              <View style={{ backgroundColor: primaryColor + '20', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 8 }}>
                <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>✓ Current Plan</Text>
              </View>
            )}
          </View>
        ))}
      </View>
      <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Stripe Payouts</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 12 }}>Connect your bank account to receive cancel fee payouts and membership payments.</Text>
        {connectStatus?.connected ? (
          <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(76,175,80,0.3)' }}>
            <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: '700' }}>Stripe Connected</Text>
          </View>
        ) : (
          <View style={{ backgroundColor: 'rgba(240,144,144,0.08)', borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(240,144,144,0.2)' }}>
            <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '700' }}>Not Connected</Text>
          </View>
        )}
        <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 14, alignItems: 'center' }} onPress={async () => {
          try {
            const res = await fetch(`${API_URL}/billing/connect`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' } })
            const data = await res.json()
            if (data.url) Linking.openURL(data.url)
            else Alert.alert('Error', data.error || 'Could not start bank onboarding')
          } catch (e) { Alert.alert('Error', 'Network error') }
        }}>
          <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 14 }}>{connectStatus?.connected ? 'Update Stripe Account' : 'Connect Stripe'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// ─── SOLO MEMBERSHIPS SECTION ─────────────────────────────────────────────────
function SoloMembershipsSection({ token, primaryColor, secondaryColor, headers }) {
  const API_URL = 'https://api.infusepro.app'
  const [membershipTab, setMembershipTab] = useState('plans')
  const [plans, setPlans] = useState([])
  const [memberships, setMemberships] = useState([])
  const [newPlanName, setNewPlanName] = useState('')
  const [newPlanPrice, setNewPlanPrice] = useState('')
  const [newPlanDesc, setNewPlanDesc] = useState('')
  const [newPlanVisits, setNewPlanVisits] = useState('4')
  const [newPlanPolicy, setNewPlanPolicy] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)

  useEffect(() => {
    fetch(`${API_URL}/memberships/plans`, { headers }).then(r => r.json()).then(d => { if (d.plans) setPlans(d.plans) }).catch(() => {})
    fetch(`${API_URL}/memberships`, { headers }).then(r => r.json()).then(d => { if (d.memberships) setMemberships(d.memberships) }).catch(() => {})
  }, [])

  const reload = () => {
    fetch(`${API_URL}/memberships/plans`, { headers }).then(r => r.json()).then(d => { if (d.plans) setPlans(d.plans) }).catch(() => {})
    fetch(`${API_URL}/memberships`, { headers }).then(r => r.json()).then(d => { if (d.memberships) setMemberships(d.memberships) }).catch(() => {})
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {['plans', 'members'].map(t => (
          <TouchableOpacity key={t} style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: membershipTab === t ? primaryColor : 'transparent' }} onPress={() => setMembershipTab(t)}>
            <Text style={{ color: membershipTab === t ? secondaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '700', textTransform: 'capitalize' }}>{t === 'plans' ? 'Membership Plans' : 'Active Members'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {membershipTab === 'plans' && (
        <>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 16 }}>Create Plan</Text>
            <TextInput style={sStyles.input} value={newPlanName} onChangeText={setNewPlanName} placeholder="Plan Name" placeholderTextColor="#666" />
            <TextInput style={sStyles.input} value={newPlanDesc} onChangeText={setNewPlanDesc} placeholder="Description" placeholderTextColor="#666" />
            <TextInput style={sStyles.input} value={newPlanPrice} onChangeText={setNewPlanPrice} placeholder="Monthly Price ($)" placeholderTextColor="#666" keyboardType="decimal-pad" />
            <TextInput style={[sStyles.input, { height: 80, textAlignVertical: 'top' }]} value={newPlanPolicy} onChangeText={setNewPlanPolicy} placeholder="Cancellation Policy" placeholderTextColor="#666" multiline />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['1','2','3','4','6','8','unlimited'].map(n => (
                <TouchableOpacity key={n} style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderColor: newPlanVisits === n ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: newPlanVisits === n ? primaryColor + '20' : 'transparent' }} onPress={() => setNewPlanVisits(n)}>
                  <Text style={{ color: newPlanVisits === n ? primaryColor : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center', opacity: savingPlan ? 0.6 : 1 }} disabled={savingPlan} onPress={async () => {
              if (!newPlanName || !newPlanPrice) return Alert.alert('Required', 'Name and price required')
              setSavingPlan(true)
              try {
                const res = await fetch(`${API_URL}/memberships/plans`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newPlanName, description: newPlanDesc, price: parseFloat(newPlanPrice), billingCycle: 'monthly', maxRedemptionsPerCycle: newPlanVisits === 'unlimited' ? 999 : parseInt(newPlanVisits), cancellationPolicy: newPlanPolicy }) })
                const data = await res.json()
                if (data.success) { Alert.alert('Created!', 'Membership plan created'); setNewPlanName(''); setNewPlanPrice(''); setNewPlanDesc(''); setNewPlanPolicy(''); reload() }
                else Alert.alert('Error', data.error || 'Failed')
              } catch (e) { Alert.alert('Error', 'Network error') } finally { setSavingPlan(false) }
            }}>
              {savingPlan ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontWeight: '700' }}>Create Plan</Text>}
            </TouchableOpacity>
          </View>
          {plans.map(plan => (
            <View key={plan.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: primaryColor }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>{plan.name}</Text>
                <Text style={{ color: primaryColor, fontWeight: '700' }}>${plan.price}/mo</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{plan.max_redemptions_per_cycle === 999 ? 'Unlimited' : plan.max_redemptions_per_cycle} visits/month · Monthly billing</Text>
            </View>
          ))}
        </>
      )}

      {membershipTab === 'members' && (
        memberships.length === 0 ? (
          <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No active members yet</Text>
        ) : memberships.map(m => (
          <View key={m.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{m.first_name} {m.last_name}</Text>
              <Text style={{ color: primaryColor, fontWeight: '700' }}>{m.plan_name}</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{m.redemptions_this_cycle} of {m.max_redemptions_per_cycle === 999 ? '∞' : m.max_redemptions_per_cycle} visits used · Monthly billing</Text>
          </View>
        ))
      )}
    </ScrollView>
  )
}

// ─── MAIN SOLO SCREEN ─────────────────────────────────────────────────────────

export default function SoloHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }
  const [activeTab, setActiveTab] = useState('dispatch')
  const [bugReportModal, setBugReportModal] = useState(false)
  const [chartTemplates, setChartTemplates] = useState([])
  const [formulary, setFormulary] = useState([])
  const [services, setServices] = useState([])
  const [templateModalVisible, setTemplateModalVisible] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateName, setTemplateName] = useState('')
  const [templateType, setTemplateType] = useState('tech')
  const [templateIsDefault, setTemplateIsDefault] = useState(false)
  const [templateServiceTypes, setTemplateServiceTypes] = useState([])
  const [templateFields, setTemplateFields] = useState([])
  const [fieldConfigModal, setFieldConfigModal] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editingFieldIndex, setEditingFieldIndex] = useState(null)
  const [formularyModalVisible, setFormularyModalVisible] = useState(false)
  const [editingFormularyItem, setEditingFormularyItem] = useState(null)
  const [formularyName, setFormularyName] = useState('')
  const [formularyDose, setFormularyDose] = useState('')
  const [formularyRoute, setFormularyRoute] = useState('iv_push')
  const [formularyCategory, setFormularyCategory] = useState('')
  const [formularyContraindications, setFormularyContraindications] = useState('')
  const [chartsSubTab, setChartsSubTab] = useState('templates')
  const [templateSubmitBehavior, setTemplateSubmitBehavior] = useState('lock')
  const [templateBuilderTab, setTemplateBuilderTab] = useState('Build')
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] = useState(null)
  const [deleteConfirmFormulary, setDeleteConfirmFormulary] = useState(null)

  useEffect(() => {
    const fetchChartsData = async () => {
      try {
        const [tmplRes, formRes, svcRes] = await Promise.all([
          fetch(`${API_URL}/chart-templates`, { headers }),
          fetch(`${API_URL}/company-formulary`, { headers }),
          fetch(`${API_URL}/admin/services`, { headers })
        ])
        const [tmplData, formData, svcData] = await Promise.all([tmplRes.json(), formRes.json(), svcRes.json()])
        if (tmplData.success) setChartTemplates(tmplData.templates || [])
        if (formData.success) setFormulary(formData.formulary || [])
        if (svcData.services) setServices(svcData.services)
      } catch (e) {}
    }
    fetchChartsData()
  }, [])

  const TABS = [
    { key: 'dispatch', label: 'Dispatch', icon: '📋' },
    { key: 'tech', label: 'My Calls', icon: '🚗' },
    { key: 'charts', label: 'Charts', icon: '📊' },
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
          <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }} onPress={() => setBugReportModal(true)}>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Report a Problem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
          >
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <BugReportModal visible={bugReportModal} onClose={() => setBugReportModal(false)} token={token} screen="SoloHomeScreen" />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'dispatch' && (
          <DispatchSection token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} navigation={navigation} user={user} company={company} />
        )}
        {activeTab === 'tech' && (
          <TechSection token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} navigation={navigation} user={user} company={company} />
        )}
        {activeTab === 'charts' && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
              {['templates', 'formulary'].map(st => (
                <TouchableOpacity key={st} onPress={() => setChartsSubTab(st)}
                  style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: chartsSubTab === st ? primaryColor : 'transparent' }}>
                  <Text style={{ color: chartsSubTab === st ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600' }}>
                    {st === 'templates' ? 'Templates' : 'Formulary'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {chartsSubTab === 'templates' && (
              <ScrollView style={{ flex: 1, padding: 16 }}>
                <TouchableOpacity style={{ backgroundColor: primaryColor, marginBottom: 12, borderRadius: 8, padding: 14, alignItems: 'center' }}
                  onPress={() => { setEditingTemplate(null); setTemplateName(''); setTemplateType('tech'); setTemplateIsDefault(false); setTemplateServiceTypes([]); setTemplateFields([]); setTemplateSubmitBehavior('lock'); setTemplateModalVisible(true) }}>
                  <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>+ New Template</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>🔧 Tech Templates</Text>
                {chartTemplates.filter(t => t.chart_type === 'tech').length === 0 ? (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center', paddingVertical: 24 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No tech templates yet</Text>
                  </View>
                ) : chartTemplates.filter(t => t.chart_type === 'tech').map(t => (
                  <View key={t.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{t.name}</Text>
                        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{(t.fields || []).length} fields</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}
                          onPress={async () => {
                            const res = await fetch(`${API_URL}/chart-templates/${t.id}/duplicate`, { method: 'POST', headers })
                            const data = await res.json()
                            if (data.success) { const r = await fetch(`${API_URL}/chart-templates`, { headers }); const d = await r.json(); if (d.success) setChartTemplates(d.templates) }
                          }}>
                          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>⧉ Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: primaryColor + '20', borderRadius: 8, padding: 8 }}
                          onPress={async () => {
                            const res = await fetch(`${API_URL}/chart-templates/${t.id}`, { headers })
                            const data = await res.json()
                            if (data.success) { setEditingTemplate(data.template); setTemplateName(data.template.name); setTemplateType(data.template.chart_type); setTemplateIsDefault(data.template.is_default); setTemplateServiceTypes(data.template.service_types || []); setTemplateFields(data.template.fields || []); setTemplateSubmitBehavior(data.template.submit_behavior || 'lock'); setTemplateModalVisible(true) }
                          }}>
                          <Text style={{ color: primaryColor, fontSize: 12 }}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: 'rgba(240,100,100,0.15)', borderRadius: 8, padding: 8 }} onPress={() => setDeleteConfirmTemplate(t)}>
                          <Text style={{ color: '#f06060', fontSize: 12 }}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
                <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8, marginTop: 12 }}>🩺 NP Templates</Text>
                {chartTemplates.filter(t => t.chart_type === 'np').length === 0 ? (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12, alignItems: 'center', paddingVertical: 24 }}>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No NP templates yet</Text>
                  </View>
                ) : chartTemplates.filter(t => t.chart_type === 'np').map(t => (
                  <View key={t.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{t.name}</Text>
                        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{(t.fields || []).length} fields</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}
                          onPress={async () => {
                            const res = await fetch(`${API_URL}/chart-templates/${t.id}/duplicate`, { method: 'POST', headers })
                            const data = await res.json()
                            if (data.success) { const r = await fetch(`${API_URL}/chart-templates`, { headers }); const d = await r.json(); if (d.success) setChartTemplates(d.templates) }
                          }}>
                          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>⧉ Copy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: '#9C27B020', borderRadius: 8, padding: 8 }}
                          onPress={async () => {
                            const res = await fetch(`${API_URL}/chart-templates/${t.id}`, { headers })
                            const data = await res.json()
                            if (data.success) { setEditingTemplate(data.template); setTemplateName(data.template.name); setTemplateType(data.template.chart_type); setTemplateIsDefault(data.template.is_default); setTemplateServiceTypes(data.template.service_types || []); setTemplateFields(data.template.fields || []); setTemplateSubmitBehavior(data.template.submit_behavior || 'lock'); setTemplateModalVisible(true) }
                          }}>
                          <Text style={{ color: '#9C27B0', fontSize: 12 }}>✏️ Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ backgroundColor: 'rgba(240,100,100,0.15)', borderRadius: 8, padding: 8 }} onPress={() => setDeleteConfirmTemplate(t)}>
                          <Text style={{ color: '#f06060', fontSize: 12 }}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
            {chartsSubTab === 'formulary' && (
              <ScrollView style={{ flex: 1, padding: 16 }}>
                <TouchableOpacity style={{ backgroundColor: primaryColor, marginBottom: 12, borderRadius: 8, padding: 14, alignItems: 'center' }}
                  onPress={() => { setEditingFormularyItem(null); setFormularyName(''); setFormularyDose(''); setFormularyRoute('iv_push'); setFormularyCategory(''); setFormularyContraindications(''); setFormularyModalVisible(true) }}>
                  <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>+ Add to Formulary</Text>
                </TouchableOpacity>
                {formulary.length === 0 ? (
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 24, alignItems: 'center' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No formulary items yet</Text>
                  </View>
                ) : ['IV Medication','IM Injection','Bag Additive','Vitamin','Other'].map(cat => {
                  const items = formulary.filter(f => (f.category || 'Other') === cat)
                  if (items.length === 0) return null
                  return (
                    <View key={cat}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 8 }}>{cat}</Text>
                      {items.map(item => (
                        <View key={item.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{item.name}</Text>
                              {item.dose && <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{item.dose}</Text>}
                              {item.contraindications && <Text style={{ fontSize: 12, color: '#f09090', marginTop: 4 }}>⚠️ {item.contraindications}</Text>}
                            </View>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                              <TouchableOpacity style={{ backgroundColor: primaryColor + '20', borderRadius: 8, padding: 8 }}
                                onPress={() => { setEditingFormularyItem(item); setFormularyName(item.name); setFormularyDose(item.dose || ''); setFormularyRoute(item.route || 'iv_push'); setFormularyCategory(item.category || ''); setFormularyContraindications(item.contraindications || ''); setFormularyModalVisible(true) }}>
                                <Text style={{ color: primaryColor, fontSize: 12 }}>✏️</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={{ backgroundColor: 'rgba(240,100,100,0.15)', borderRadius: 8, padding: 8 }} onPress={() => setDeleteConfirmFormulary(item)}>
                                <Text style={{ color: '#f06060', fontSize: 12 }}>🗑</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )
                })}
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
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

      {/* DELETE TEMPLATE CONFIRM */}
      {deleteConfirmTemplate && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 9999 }}>
          <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, width: '100%', maxWidth: 380, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(240,100,100,0.3)' }}>
            <View style={{ backgroundColor: 'rgba(240,100,100,0.1)', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(240,100,100,0.2)' }}>
              <Text style={{ color: '#f06060', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>DELETE TEMPLATE</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{deleteConfirmTemplate.name}</Text>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 20 }}>This template will be deactivated. Charts already filled using this template are unaffected.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setDeleteConfirmTemplate(null)}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 2, backgroundColor: '#f06060', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={async () => {
                  const t = deleteConfirmTemplate
                  setDeleteConfirmTemplate(null)
                  await fetch(`${API_URL}/chart-templates/${t.id}`, { method: 'DELETE', headers })
                  const tmplRes = await fetch(`${API_URL}/chart-templates`, { headers })
                  const tmplData = await tmplRes.json()
                  if (tmplData.success) setChartTemplates(tmplData.templates)
                }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* DELETE FORMULARY CONFIRM */}
      {deleteConfirmFormulary && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 9999 }}>
          <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, width: '100%', maxWidth: 380, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(240,100,100,0.3)' }}>
            <View style={{ backgroundColor: 'rgba(240,100,100,0.1)', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(240,100,100,0.2)' }}>
              <Text style={{ color: '#f06060', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>REMOVE FROM FORMULARY</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{deleteConfirmFormulary.name}</Text>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 20 }}>This item will be removed from your formulary. Existing charts are unaffected.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setDeleteConfirmFormulary(null)}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 2, backgroundColor: '#f06060', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={async () => {
                  const item = deleteConfirmFormulary
                  setDeleteConfirmFormulary(null)
                  await fetch(`${API_URL}/company-formulary/${item.id}`, { method: 'DELETE', headers })
                  const formRes = await fetch(`${API_URL}/company-formulary`, { headers })
                  const formData = await formRes.json()
                  if (formData.success) setFormulary(formData.formulary)
                }}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* TEMPLATE BUILDER MODAL */}
      <Modal visible={templateModalVisible} animationType="slide" presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}>
        <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{editingTemplate ? 'Edit Template' : 'New Template'}</Text>
            <TouchableOpacity onPress={() => setTemplateModalVisible(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>X Cancel</Text>
            </TouchableOpacity>
          </View>
          {Platform.OS !== 'web' && (
            <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', margin: 12, borderRadius: 10, padding: 3 }}>
              {['Build', 'Preview'].map(t => (
                <TouchableOpacity key={t} onPress={() => setTemplateBuilderTab(t)}
                  style={{ flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, backgroundColor: templateBuilderTab === t ? primaryColor : 'transparent' }}>
                  <Text style={{ color: templateBuilderTab === t ? secondaryColor : 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 13 }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={{ flex: 1, flexDirection: Platform.OS === 'web' ? 'row' : 'column' }}>
            {(Platform.OS === 'web' || templateBuilderTab === 'Build') && (
              <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
                <View style={{ padding: 20 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Template Name *</Text>
                  <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} placeholder="e.g. Standard IV Drip Chart" placeholderTextColor="rgba(255,255,255,0.3)" value={templateName} onChangeText={setTemplateName} />
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    {[{ value: 'tech', label: 'Tech' }, { value: 'np', label: 'NP' }].map(opt => (
                      <TouchableOpacity key={opt.value} onPress={() => setTemplateType(opt.value)}
                        style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: templateType === opt.value ? primaryColor + '20' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: templateType === opt.value ? primaryColor : 'rgba(255,255,255,0.1)' }}>
                        <Text style={{ color: templateType === opt.value ? primaryColor : 'rgba(255,255,255,0.4)', fontWeight: '700', fontSize: 13 }}>{opt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <TouchableOpacity onPress={() => setTemplateIsDefault(!templateIsDefault)}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: templateIsDefault ? primaryColor + '15' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: templateIsDefault ? primaryColor : 'rgba(255,255,255,0.1)' }}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: templateIsDefault ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: templateIsDefault ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {templateIsDefault && <Text style={{ color: secondaryColor, fontSize: 10, fontWeight: '800' }}>v</Text>}
                      </View>
                      <Text style={{ color: templateIsDefault ? primaryColor : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>Default</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setTemplateSubmitBehavior(prev => prev === 'lock' ? 'draft' : 'lock')}
                      style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: templateSubmitBehavior === 'lock' ? 'rgba(255,152,0,0.12)' : 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: templateSubmitBehavior === 'lock' ? '#FF9800' : 'rgba(255,255,255,0.1)' }}>
                      <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: templateSubmitBehavior === 'lock' ? '#FF9800' : 'rgba(255,255,255,0.3)', backgroundColor: templateSubmitBehavior === 'lock' ? '#FF9800' : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                        {templateSubmitBehavior === 'lock' && <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>v</Text>}
                      </View>
                      <Text style={{ color: templateSubmitBehavior === 'lock' ? '#FF9800' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>Lock on Submit</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 12 }} />
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Fields ({templateFields.length})</Text>
                  {templateFields.length === 0 ? (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 20, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', borderStyle: 'dashed' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Add fields from the palette below</Text>
                    </View>
                  ) : templateFields.map((field, index) => (
                    <View key={field.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 10, marginBottom: 6, borderLeftWidth: 3, borderLeftColor: field.type === 'heading' ? primaryColor : field.type === 'divider' ? 'rgba(255,255,255,0.2)' : '#4CAF50' }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{field.label || field.type}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 2 }}>{field.type}{field.required ? ' · required' : ''}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 4 }}>
                          {index > 0 && <TouchableOpacity onPress={() => { const f=[...templateFields]; [f[index-1],f[index]]=[f[index],f[index-1]]; setTemplateFields(f) }} style={{ padding: 6 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>up</Text></TouchableOpacity>}
                          {index < templateFields.length-1 && <TouchableOpacity onPress={() => { const f=[...templateFields]; [f[index+1],f[index]]=[f[index],f[index+1]]; setTemplateFields(f) }} style={{ padding: 6 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>dn</Text></TouchableOpacity>}
                          <TouchableOpacity onPress={() => { setEditingField({...field}); setEditingFieldIndex(index); setFieldConfigModal(true) }} style={{ padding: 6 }}><Text style={{ color: primaryColor, fontSize: 13 }}>edit</Text></TouchableOpacity>
                          <TouchableOpacity onPress={() => setTemplateFields(prev => prev.filter((_,i) => i !== index))} style={{ padding: 6 }}><Text style={{ color: '#f06060', fontSize: 13 }}>del</Text></TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 }}>Add Field</Text>
                  {[
                    { group: 'Structure', fields: [{ type: 'heading', label: 'Heading' }, { type: 'divider', label: 'Divider' }] },
                    { group: 'Input', fields: [{ type: 'text', label: 'Text' }, { type: 'textarea', label: 'Long Text' }, { type: 'number', label: 'Number' }, { type: 'yes_no', label: 'Yes/No' }, { type: 'dropdown', label: 'Dropdown' }, { type: 'multi_select', label: 'Multi-Select' }, { type: 'date', label: 'Date' }, { type: 'time', label: 'Time' }] },
                    { group: 'Medical', fields: [{ type: 'vitals', label: 'Vitals' }, { type: 'iv_details', label: 'IV Details' }, { type: 'med_row', label: 'Medication' }, { type: 'vitamin_row', label: 'Vitamin' }, { type: 'service_select', label: 'Service' }] },
                    { group: 'Media & Legal', fields: [{ type: 'photo', label: 'Photo' }, { type: 'signature', label: 'Signature' }, { type: 'consent', label: 'Consent' }] },
                  ].map(group => (
                    <View key={group.group} style={{ marginBottom: 12 }}>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' }}>{group.group}</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {group.fields.map(ft => (
                          <TouchableOpacity key={ft.type}
                            onPress={() => {
                              const newField = { id: `field_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, type: ft.type, label: ft.label, placeholder: '', required: false, repeatable: ['med_row','vitamin_row','vitals'].includes(ft.type), options: [], min: null, max: null, conditional: null }
                              setTemplateFields(prev => [...prev, newField])
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' }}>{ft.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  ))}
                  <View style={{ height: 40 }} />
                </View>
              </ScrollView>
            )}
            {(Platform.OS === 'web' || templateBuilderTab === 'Preview') && (
              <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
                <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', letterSpacing: 1, textAlign: 'center' }}>CHART PREVIEW</Text>
                </View>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                  {templateFields.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingTop: 60 }}>
                      <Text style={{ fontSize: 32, marginBottom: 12 }}>📋</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, textAlign: 'center' }}>Add fields to see a preview</Text>
                    </View>
                  ) : templateFields.map(field => {
                    if (field.type === 'heading') return (
                      <View key={field.id} style={{ marginBottom: 8, marginTop: 16 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>{field.label || 'HEADING'}</Text>
                        <View style={{ height: 1, backgroundColor: primaryColor + '40', marginTop: 4 }} />
                      </View>
                    )
                    if (field.type === 'divider') return <View key={field.id} style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 }} />
                    if (field.type === 'vitals') return (
                      <View key={field.id} style={{ marginBottom: 12 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 6 }}>{field.label || 'Vitals'}{field.required ? ' *' : ''}</Text>
                        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                          {['BP','HR','O2','Temp','Pain'].map(v => (
                            <View key={v} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 55, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>{v}</Text>
                              <View style={{ width: 40, height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 8 }} />
                            </View>
                          ))}
                        </View>
                      </View>
                    )
                    if (field.type === 'yes_no') return (
                      <View key={field.id} style={{ marginBottom: 10 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{field.label || 'Yes/No'}{field.required ? ' *' : ''}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {['Yes','No'].map(o => <View key={o} style={{ paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{o}</Text></View>)}
                        </View>
                      </View>
                    )
                    if (field.type === 'photo') return (
                      <View key={field.id} style={{ marginBottom: 10 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{field.label || 'Photo'}{field.required ? ' *' : ''}</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Tap to take photo</Text>
                        </View>
                      </View>
                    )
                    if (field.type === 'signature') return (
                      <View key={field.id} style={{ marginBottom: 10 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{field.label || 'Signature'}{field.required ? ' *' : ''}</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, height: 80, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderStyle: 'dashed' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Sign here</Text>
                        </View>
                      </View>
                    )
                    if (field.type === 'iv_details') return (
                      <View key={field.id} style={{ marginBottom: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 8 }}>IV Details</Text>
                        {['Site','Catheter Size','Attempts','Time Started'].map(l => (
                          <View key={l} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' }}>
                            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{l}</Text>
                            <View style={{ width: 80, height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginTop: 8 }} />
                          </View>
                        ))}
                      </View>
                    )
                    if (field.type === 'dropdown' || field.type === 'multi_select') return (
                      <View key={field.id} style={{ marginBottom: 10 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{field.label || field.type}{field.required ? ' *' : ''}</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{field.options?.length ? field.options[0] : 'Select...'}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.3)' }}>v</Text>
                        </View>
                      </View>
                    )
                    if (field.type === 'med_row' || field.type === 'vitamin_row') return (
                      <View key={field.id} style={{ marginBottom: 10 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{field.label || (field.type === 'med_row' ? 'Medication' : 'Vitamin')}{field.required ? ' *' : ''}</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>Select from formulary...</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.3)' }}>v</Text>
                        </View>
                      </View>
                    )
                    if (field.type === 'consent') return (
                      <View key={field.id} style={{ marginBottom: 10, backgroundColor: 'rgba(255,152,0,0.06)', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(255,152,0,0.2)' }}>
                        <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 4 }}>CONSENT</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>{field.consentText || 'Consent statement will appear here...'}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <View style={{ width: 18, height: 18, borderRadius: 4, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }} />
                          <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>I agree</Text>
                        </View>
                      </View>
                    )
                    return (
                      <View key={field.id} style={{ marginBottom: 10 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 6 }}>{field.label || field.type}{field.required ? ' *' : ''}</Text>
                        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minHeight: field.type === 'textarea' ? 80 : 44 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>{field.placeholder || (field.type === 'date' ? 'MM/DD/YYYY' : field.type === 'time' ? 'HH:MM' : field.type === 'number' ? '0' : 'Enter text...')}</Text>
                        </View>
                      </View>
                    )
                  })}
                  <View style={{ height: 40 }} />
                </ScrollView>
              </View>
            )}
          </View>
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={async () => {
                if (!templateName.trim()) { Alert.alert('Error', 'Template name is required'); return }
                if (templateFields.length === 0) { Alert.alert('Error', 'Add at least one field'); return }
                try {
                  const method = editingTemplate ? 'PUT' : 'POST'
                  const url = editingTemplate ? `${API_URL}/chart-templates/${editingTemplate.id}` : `${API_URL}/chart-templates`
                  const res = await fetch(url, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: templateName, chartType: templateType, isDefault: templateIsDefault, serviceTypes: templateServiceTypes, fields: templateFields, submitBehavior: templateSubmitBehavior }) })
                  const data = await res.json()
                  if (data.success) {
                    setTemplateModalVisible(false)
                    const tmplRes = await fetch(`${API_URL}/chart-templates`, { headers })
                    const tmplData = await tmplRes.json()
                    if (tmplData.success) setChartTemplates(tmplData.templates)
                    Alert.alert('Success', editingTemplate ? 'Template updated' : 'Template created')
                  } else { Alert.alert('Error', data.error || 'Could not save template') }
                } catch (err) { Alert.alert('Error', 'Could not save template') }
              }}>
              <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>{editingTemplate ? 'Save Changes' : 'Create Template'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FIELD CONFIG MODAL */}
      <Modal visible={fieldConfigModal} animationType="slide" presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}>
        <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Configure Field</Text>
            <TouchableOpacity onPress={() => setFieldConfigModal(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>X Close</Text>
            </TouchableOpacity>
          </View>
          {editingField && (
            <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Label *</Text>
              <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} placeholder="e.g. Blood Pressure" placeholderTextColor="rgba(255,255,255,0.3)" value={editingField.label} onChangeText={val => setEditingField(prev => ({ ...prev, label: val }))} />
              {!['vitals','iv_details','med_row','vitamin_row','heading','divider','signature','photo','service_select'].includes(editingField.type) && (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Placeholder</Text>
                  <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} placeholder="e.g. 120/80" placeholderTextColor="rgba(255,255,255,0.3)" value={editingField.placeholder} onChangeText={val => setEditingField(prev => ({ ...prev, placeholder: val }))} />
                </>
              )}
              {!['heading','divider'].includes(editingField.type) && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Required</Text>
                  <TouchableOpacity style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: editingField.required ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={() => setEditingField(prev => ({ ...prev, required: !prev.required }))}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: editingField.required ? 'flex-end' : 'flex-start' }} />
                  </TouchableOpacity>
                </View>
              )}
              {['dropdown','multi_select'].includes(editingField.type) && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Options</Text>
                  {(editingField.options || []).map((opt, i) => (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <TextInput style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} value={opt} onChangeText={val => { const newOpts = [...editingField.options]; newOpts[i] = val; setEditingField(prev => ({ ...prev, options: newOpts })) }} />
                      <TouchableOpacity onPress={() => setEditingField(prev => ({ ...prev, options: prev.options.filter((_,j) => j !== i) }))}><Text style={{ color: '#f06060', fontSize: 18 }}>X</Text></TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' }} onPress={() => setEditingField(prev => ({ ...prev, options: [...(prev.options || []), ''] }))}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>+ Add Option</Text>
                  </TouchableOpacity>
                </View>
              )}
              {editingField.type === 'consent' && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Consent Text</Text>
                  <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 100, textAlignVertical: 'top' }} placeholder="Enter the consent statement..." placeholderTextColor="rgba(255,255,255,0.3)" multiline value={editingField.consentText || ''} onChangeText={val => setEditingField(prev => ({ ...prev, consentText: val }))} />
                </View>
              )}
              <View style={{ height: 40 }} />
            </ScrollView>
          )}
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={() => {
                if (!editingField.label.trim()) { Alert.alert('Error', 'Field label is required'); return }
                const newFields = [...templateFields]
                newFields[editingFieldIndex] = editingField
                setTemplateFields(newFields)
                setFieldConfigModal(false)
              }}>
              <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Save Field</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* FORMULARY MODAL */}
      <Modal visible={formularyModalVisible} animationType="slide" presentationStyle={Platform.OS === "ios" ? "pageSheet" : "fullScreen"}>
        <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{editingFormularyItem ? 'Edit Item' : 'Add to Formulary'}</Text>
            <TouchableOpacity onPress={() => setFormularyModalVisible(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>X Cancel</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Name *</Text>
            <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} placeholder="e.g. Reglan 10mg" placeholderTextColor="rgba(255,255,255,0.3)" value={formularyName} onChangeText={setFormularyName} />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Dose</Text>
            <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} placeholder="e.g. 10mg/2mL" placeholderTextColor="rgba(255,255,255,0.3)" value={formularyDose} onChangeText={setFormularyDose} />
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Route</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['iv_push','iv_bag','im','sq','oral','topical','other'].map(r => (
                <TouchableOpacity key={r} onPress={() => setFormularyRoute(r)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: formularyRoute === r ? primaryColor + '20' : 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: formularyRoute === r ? primaryColor : 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: formularyRoute === r ? primaryColor : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>{r.replace('_',' ').toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Category</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['IV Medication','IM Injection','Bag Additive','Vitamin','Other'].map(cat => (
                <TouchableOpacity key={cat} onPress={() => setFormularyCategory(cat)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: formularyCategory === cat ? primaryColor + '20' : 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: formularyCategory === cat ? primaryColor : 'rgba(255,255,255,0.1)' }}>
                  <Text style={{ color: formularyCategory === cat ? primaryColor : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Contraindications</Text>
            <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 15, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', height: 80, textAlignVertical: 'top' }} placeholder="e.g. Sulfa allergy, renal failure" placeholderTextColor="rgba(255,255,255,0.3)" multiline value={formularyContraindications} onChangeText={setFormularyContraindications} />
          </ScrollView>
          <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={async () => {
                if (!formularyName.trim()) { Alert.alert('Error', 'Name is required'); return }
                try {
                  const method = editingFormularyItem ? 'PUT' : 'POST'
                  const url = editingFormularyItem ? `${API_URL}/company-formulary/${editingFormularyItem.id}` : `${API_URL}/company-formulary`
                  const res = await fetch(url, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: formularyName, dose: formularyDose, route: formularyRoute, category: formularyCategory, contraindications: formularyContraindications }) })
                  const data = await res.json()
                  if (data.success || data.item) {
                    setFormularyModalVisible(false)
                    const formRes = await fetch(`${API_URL}/company-formulary`, { headers })
                    const formData = await formRes.json()
                    if (formData.success) setFormulary(formData.formulary)
                  } else { Alert.alert('Error', data.error || 'Could not save item') }
                } catch (err) { Alert.alert('Error', 'Could not save item') }
              }}>
              <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>{editingFormularyItem ? 'Save Changes' : 'Add to Formulary'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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