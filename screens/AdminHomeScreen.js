import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
  Modal, KeyboardAvoidingView, Platform, Image
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

const API_URL = 'https://api.infusepro.app'

function AuditLogTab({ token, primaryColor, secondaryColor }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true)
      try {
        const url = filter === 'all'
          ? 'https://api.infusepro.app/admin/audit-log?limit=100&excludeStatus=true'
          : `https://api.infusepro.app/admin/audit-log?resource=${filter}&limit=100`
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        const data = await res.json()
        if (data.logs) setLogs(data.logs)
      } catch (err) {
        console.error('Audit log fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [filter])

  const actionColor = (action) => {
    if (action.includes('create')) return '#4CAF50'
    if (action.includes('update') || action.includes('status')) return '#2196F3'
    if (action.includes('view')) return '#C9A84C'
    if (action.includes('delete')) return '#f09090'
    return '#aaa'
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52, backgroundColor: secondaryColor, paddingHorizontal: 12 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10 }}>
          {['all', 'chart', 'bookings', 'gfe', 'intake'].map(f => (
            <TouchableOpacity
              key={f}
              style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: filter === f ? primaryColor : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: filter === f ? primaryColor : 'rgba(255,255,255,0.15)' }}
              onPress={() => setFilter(f)}
            >
              <Text style={{ color: filter === f ? secondaryColor : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {loading ? (
          <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
        ) : logs.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📋</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No logs yet</Text>
          </View>
        ) : logs.map((log, i) => (
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
  )
}

export default function AdminHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  // Store token in ref so it's always accessible in closures
  const tokenRef = useRef(token)
  useEffect(() => { tokenRef.current = token }, [token])

  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Dashboard
  const [stats, setStats] = useState(null)

  // Staff
  const [staff, setStaff] = useState([])

  // Services
  const [services, setServices] = useState([])

  // Reports
  const [reportData, setReportData] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportPeriod, setReportPeriod] = useState('today')
  const [reportCustomStart, setReportCustomStart] = useState('')
  const [reportCustomEnd, setReportCustomEnd] = useState('')

  // Billing
  const [billingStatus, setBillingStatus] = useState(null)

  // Referral settings
  const [referralActive, setReferralActive] = useState(false)
  const [referralPerkType, setReferralPerkType] = useState('fixed')
  const [referralPerkAmount, setReferralPerkAmount] = useState('20')
  const [referralPerkPercent, setReferralPerkPercent] = useState('10')
  const [savingReferral, setSavingReferral] = useState(false)

  // Loyalty settings
  const [loyaltyProgram, setLoyaltyProgram] = useState(null)
  const [loyaltyActive, setLoyaltyActive] = useState(false)
  const [loyaltyThreshold, setLoyaltyThreshold] = useState('6')
  const [loyaltyRewardType, setLoyaltyRewardType] = useState('fixed')
  const [loyaltyRewardAmount, setLoyaltyRewardAmount] = useState('0')
  const [loyaltyRewardPercent, setLoyaltyRewardPercent] = useState('50')
  const [savingLoyalty, setSavingLoyalty] = useState(false)

  // Announcements
  const [announcements, setAnnouncements] = useState([])
  const [announcementModal, setAnnouncementModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [anTitle, setAnTitle] = useState('')
  const [anBody, setAnBody] = useState('')
  const [anEmoji, setAnEmoji] = useState('📢')
  const [anCtaLabel, setAnCtaLabel] = useState('')
  const [anCtaUrl, setAnCtaUrl] = useState('')
  const [anBgStyle, setAnBgStyle] = useState('solid')
  const [anBgColor, setAnBgColor] = useState('')
  const [anActive, setAnActive] = useState(true)
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
const [showImportModal, setShowImportModal] = useState(false)
  const [importCsv, setImportCsv] = useState('')
  const [importSendEmails, setImportSendEmails] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // Patients search
  const [psQuery, setPsQuery] = useState('')
  const [psResults, setPsResults] = useState([])
  const [psSearching, setPsSearching] = useState(false)

  const [psSelectedPatient, setPsSelectedPatient] = useState(null)
  const [psProfileModal, setPsProfileModal] = useState(false)
  const [psProfileData, setPsProfileData] = useState(null)
  const [psLoadingProfile, setPsLoadingProfile] = useState(false)
  const [psActiveTab, setPsActiveTab] = useState('overview')
  const [psSelectedChart, setPsSelectedChart] = useState(null)
  const [psChartModal, setPsChartModal] = useState(false)
  const [psEditing, setPsEditing] = useState(false)
  const [psEditPhone, setPsEditPhone] = useState('')
  const [psEditAddress, setPsEditAddress] = useState('')
  const [psEditCity, setPsEditCity] = useState('')
  const [psEditState, setPsEditState] = useState('')
  const [psEditZip, setPsEditZip] = useState('')
  const [psEditEmergencyContact, setPsEditEmergencyContact] = useState('')
  const [psEditEmergencyPhone, setPsEditEmergencyPhone] = useState('')
  const [psEditEmergencyRelationship, setPsEditEmergencyRelationship] = useState('')
  const [psEditInsuranceProvider, setPsEditInsuranceProvider] = useState('')
  const [psEditInsuranceMemberId, setPsEditInsuranceMemberId] = useState('')
  const [psEditInsuranceGroupNumber, setPsEditInsuranceGroupNumber] = useState('')
  const [psEditInsurancePhone, setPsEditInsurancePhone] = useState('')
  const [psSavingProfile, setPsSavingProfile] = useState(false)
  const searchPsPatients = async (q) => {
    setPsQuery(q)
    if (q.length < 2) { setPsResults([]); return }
    setPsSearching(true)
    try {
      const res = await fetch(`${API_URL}/patients/search?q=${encodeURIComponent(q)}`, { headers })
      const data = await res.json()
      if (data.patients) setPsResults(data.patients)
    } catch (err) {
      console.error('Patient search error:', err)
    } finally {
      setPsSearching(false)
    }
  }

  const savePsProfile = async () => {
    setPsSavingProfile(true)
    try {
      const res = await fetch(`${API_URL}/patients/${psSelectedPatient.id}/update`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: psEditPhone, homeAddress: psEditAddress, city: psEditCity,
          state: psEditState, zip: psEditZip, emergencyContact: psEditEmergencyContact,
          emergencyContactPhone: psEditEmergencyPhone, emergencyContactRelationship: psEditEmergencyRelationship,
          insuranceProvider: psEditInsuranceProvider, insuranceMemberId: psEditInsuranceMemberId,
          insuranceGroupNumber: psEditInsuranceGroupNumber, insurancePhone: psEditInsurancePhone
        })
      })
      const data = await res.json()
      if (data.success) { setPsEditing(false); openPsProfile(psSelectedPatient); Alert.alert('✅ Saved', 'Patient profile updated') }
      else Alert.alert('Error', data.message)
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setPsSavingProfile(false) }
  }

  const openPsProfile = async (patient) => {
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
        setPsEditEmergencyContact(data.intake?.emergency_contact || '')
        setPsEditEmergencyPhone(data.intake?.emergency_contact_phone || '')
        setPsEditEmergencyRelationship(data.intake?.emergency_contact_relationship || '')
        setPsEditInsuranceProvider(data.patient?.insurance_provider || '')
        setPsEditInsuranceMemberId(data.patient?.insurance_member_id || '')
        setPsEditInsuranceGroupNumber(data.patient?.insurance_group_number || '')
        setPsEditInsurancePhone(data.patient?.insurance_phone || '')
      } else Alert.alert('Error', 'Could not load patient profile')
    } catch (err) { Alert.alert('Error', 'Network error') }
    finally { setPsLoadingProfile(false) }
  }

  // Documents
  const [documents, setDocuments] = useState([])
  const [docLoading, setDocLoading] = useState(false)
  const [docCategory, setDocCategory] = useState('All')
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [docTitle, setDocTitle] = useState('')
  const [docDescription, setDocDescription] = useState('')
  const [docCategory2, setDocCategory2] = useState('Protocol')
  const [docModal, setDocModal] = useState(false)

  // Use refs for doc form fields so they're always current in the upload closure
  const docTitleRef = useRef('')
  const docCategoryRef = useRef('Protocol')
  const docDescriptionRef = useRef('')

  // Branding
  const [brandingLogo, setBrandingLogo] = useState(company?.logo || null)
  const [brandingPrimary, setBrandingPrimary] = useState(company?.primaryColor || '#C9A84C')
  const [brandingSecondary, setBrandingSecondary] = useState(company?.secondaryColor || '#0D1B4B')
  const [savingBranding, setSavingBranding] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // Settings
  const [companyName, setCompanyName] = useState(company?.name || '')
  const [companyPhone, setCompanyPhone] = useState('')
  const [companyEmail, setCompanyEmail] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)

  // New staff modal
  const [newStaffModal, setNewStaffModal] = useState(false)
  const [nsFirstName, setNsFirstName] = useState('')
  const [nsLastName, setNsLastName] = useState('')
  const [nsEmail, setNsEmail] = useState('')
  const [nsPhone, setNsPhone] = useState('')
  const [nsRole, setNsRole] = useState('tech')
  const [creatingStaff, setCreatingStaff] = useState(false)

  // Regions
  const [regions, setRegions] = useState([])
  const [newRegionModal, setNewRegionModal] = useState(false)
  const [editRegionModal, setEditRegionModal] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [rName, setRName] = useState('')
  const [rColor, setRColor] = useState('#C9A84C')
  const [rCities, setRCities] = useState('')
  const [savingRegion, setSavingRegion] = useState(false)

  // New service modal
  const [newServiceModal, setNewServiceModal] = useState(false)
  const [svcName, setSvcName] = useState('')
  const [svcPrice, setSvcPrice] = useState('')
  const [svcDuration, setSvcDuration] = useState('')
  const [svcDescription, setSvcDescription] = useState('')
  const [savingService, setSavingService] = useState(false)

  const fetchDocuments = useCallback(async () => {
    setDocLoading(true)
    try {
      const res = await fetch(`${API_URL}/documents`, { headers })
      const data = await res.json()
      if (data.success) setDocuments(data.documents)
    } catch (err) {
      console.error('Fetch documents error:', err)
    } finally {
      setDocLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (activeTab === 'documents') fetchDocuments()
  }, [activeTab])

  const fetchReports = useCallback(async (period = 'today', customStart = '', customEnd = '') => {
    setReportLoading(true)
    try {
      const now = new Date()
      let start, end
      switch(period) {
        case 'today':
          start = new Date(now.setHours(0,0,0,0)).toISOString()
          end = new Date(now.setHours(23,59,59,999)).toISOString()
          break
        case 'yesterday':
          const yesterday = new Date(now)
          yesterday.setDate(yesterday.getDate() - 1)
          start = new Date(yesterday.setHours(0,0,0,0)).toISOString()
          end = new Date(yesterday.setHours(23,59,59,999)).toISOString()
          break
        case 'this_week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          start = new Date(weekStart.setHours(0,0,0,0)).toISOString()
          end = new Date().toISOString()
          break
        case 'last_week':
          const lastWeekEnd = new Date(now)
          lastWeekEnd.setDate(now.getDate() - now.getDay() - 1)
          const lastWeekStart = new Date(lastWeekEnd)
          lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
          start = new Date(lastWeekStart.setHours(0,0,0,0)).toISOString()
          end = new Date(lastWeekEnd.setHours(23,59,59,999)).toISOString()
          break
        case 'this_month':
          start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          end = new Date().toISOString()
          break
        case 'last_month':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
          end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
          break
        case 'last_3_months':
          start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString()
          end = new Date().toISOString()
          break
        case 'this_year':
          start = new Date(now.getFullYear(), 0, 1).toISOString()
          end = new Date().toISOString()
          break
        case 'last_year':
          start = new Date(now.getFullYear() - 1, 0, 1).toISOString()
          end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString()
          break
        case 'custom':
          start = customStart ? new Date(customStart).toISOString() : new Date(now.setHours(0,0,0,0)).toISOString()
          end = customEnd ? new Date(new Date(customEnd).setHours(23,59,59,999)).toISOString() : new Date().toISOString()
          break
        default:
          start = new Date(now.setHours(0,0,0,0)).toISOString()
          end = new Date(now.setHours(23,59,59,999)).toISOString()
      }
      const res = await fetch(`${API_URL}/admin/reports?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`, { headers })
      const data = await res.json()
      if (data.success) setReportData(data)
    } catch (err) {
      console.error('Reports fetch error:', err)
    } finally {
      setReportLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (activeTab === 'reports') fetchReports(reportPeriod)
  }, [activeTab])

  const fetchAll = useCallback(async () => {
    try {
      const [statsRes, staffRes, svcRes, regRes, anRes, refRes, loyRes, bilRes] = await Promise.all([
        fetch(`${API_URL}/dispatch/stats`, { headers }),
        fetch(`${API_URL}/admin/staff`, { headers }),
        fetch(`${API_URL}/admin/services`, { headers }),
        fetch(`${API_URL}/admin/regions`, { headers }),
        fetch(`${API_URL}/admin/announcements`, { headers }),
        fetch(`${API_URL}/admin/referral-settings`, { headers }),
        fetch(`${API_URL}/admin/loyalty`, { headers }),
        fetch(`${API_URL}/billing/status`, { headers })
      ])
      const [statsData, staffData, svcData, regData, anData, refData, loyData, bilData] = await Promise.all([
        statsRes.json(), staffRes.json(), svcRes.json(), regRes.json(), anRes.json(), refRes.json(), loyRes.json(), bilRes.json()
      ])
      if (statsData.stats) setStats(statsData.stats)
      if (staffData.staff) setStaff(staffData.staff)
      if (svcData.services) setServices(svcData.services)
      if (regData.regions) setRegions(regData.regions)
      if (anData.announcements) setAnnouncements(anData.announcements)
      if (bilData.subscription) setBillingStatus(bilData.subscription)
      if (refData.settings) {
        setReferralActive(refData.settings.referral_active || false)
        setReferralPerkType(refData.settings.referral_perk_type || 'fixed')
        setReferralPerkAmount(refData.settings.referral_perk_amount?.toString() || '20')
        setReferralPerkPercent(refData.settings.referral_perk_percent?.toString() || '10')
      }
      if (loyData.program) {
        setLoyaltyProgram(loyData.program)
        setLoyaltyActive(loyData.program.active || false)
        setLoyaltyThreshold(loyData.program.threshold?.toString() || '6')
        setLoyaltyRewardType(loyData.program.reward_type || 'fixed')
        setLoyaltyRewardAmount(loyData.program.reward_amount?.toString() || '0')
        setLoyaltyRewardPercent(loyData.program.reward_percent?.toString() || '50')
      }
    } catch (err) {
      console.error('Admin fetch error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchAll() }, [fetchAll])

  const onRefresh = () => { setRefreshing(true); fetchAll() }

  const handleUploadDocument = async () => {
    const t = docTitle.trim()
    if (!t) { Alert.alert('Required', 'Document title is required'); return }
    if (typeof window === 'undefined') {
      Alert.alert('Coming Soon', 'Document upload is only available on web.')
      return
    }
    // Capture everything we need BEFORE creating the input
    const capturedToken = tokenRef.current
    const capturedTitle = t
    const capturedCategory = docCategory2
    const capturedDescription = docDescription

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/pdf'
    input.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0;'
    document.body.appendChild(input)

    input.onchange = async (e) => {
      const file = e.target.files[0]
      document.body.removeChild(input)
      if (!file) return

      setUploadingDoc(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', capturedTitle)
      formData.append('category', capturedCategory)
      formData.append('description', capturedDescription)

      try {
        const res = await fetch(`${API_URL}/documents/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${capturedToken}` },
          body: formData
        })
        const data = await res.json()
        if (data.success) {
          setDocModal(false)
          setDocTitle('')
          setDocDescription('')
          setDocCategory2('Protocol')
          fetchDocuments()
          Alert.alert('✅ Uploaded', `${capturedTitle} has been uploaded successfully.`)
        } else {
          Alert.alert('Upload Failed', data.error || 'Something went wrong')
        }
      } catch (err) {
        console.error('Upload error:', err)
        Alert.alert('Error', 'Upload failed. Please try again.')
      } finally {
        setUploadingDoc(false)
      }
    }

    input.click()
  }

  const handleDeleteDocument = async (doc) => {
    const confirmed = Platform.OS === 'web'
      ? window.confirm(`Delete "${doc.title}"?`)
      : await new Promise(resolve => Alert.alert('Delete Document', `Delete "${doc.title}"?`, [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
        ]))
    if (!confirmed) return
    try {
      const res = await fetch(`${API_URL}/documents/${doc.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${tokenRef.current}` }
      })
      const data = await res.json()
      if (data.success) fetchDocuments()
      else Alert.alert('Error', data.error || 'Could not delete document')
    } catch (err) {
      Alert.alert('Error', 'Could not delete document')
    }
  }

  const handleViewDocument = async (doc) => {
    try {
      const res = await fetch(`${API_URL}/documents/${doc.id}/url`, {
        headers: { Authorization: `Bearer ${tokenRef.current}` }
      })
      const data = await res.json()
      if (data.url) {
        if (typeof window !== 'undefined') window.open(data.url, '_blank')
        else Alert.alert('Document URL', data.url)
      } else {
        Alert.alert('Error', 'Could not get document URL')
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open document')
    }
  }

  const pickLogo = async () => {
    try {
      if (Platform.OS === 'web') {
        // Web: use file input
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async (e) => {
          const file = e.target.files[0]
          console.log('File selected:', file?.name, file?.size)
          if (!file) return
          setUploadingLogo(true)
          const reader = new FileReader()
          reader.onload = async (event) => {
            const base64 = event.target.result
            console.log('Logo base64 length:', base64?.length)
            console.log('Uploading logo to server...')
            try {
              const res = await fetch(`${API_URL}/admin/branding/logo`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${tokenRef.current}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ logo: base64 })
              })
              const data = await res.json()
              if (data.success) { setBrandingLogo(data.logoUrl); Alert.alert('Logo Updated', 'Your company logo has been saved.') }
              else Alert.alert('Error', data.message || 'Could not upload logo')
            } catch (err) {
              Alert.alert('Error', 'Could not upload logo')
            } finally {
              setUploadingLogo(false)
            }
          }
          reader.readAsDataURL(file)
        }
        document.body.appendChild(input)
        input.click()
      } else {
        // Mobile: use ImagePicker
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) { Alert.alert('Permission needed', 'Please allow access to your photo library'); return }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], allowsEditing: true, aspect: [3, 1], quality: 0.3, base64: true, exif: false
        })
        if (!result.canceled && result.assets[0]) {
          setUploadingLogo(true)
          const base64 = result.assets[0].base64
          const res = await fetch(`${API_URL}/admin/branding/logo`, {
            method: 'PUT',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ logo: `data:image/jpeg;base64,${base64}` })
          })
          const data = await res.json()
          if (data.success) { setBrandingLogo(data.logoUrl); Alert.alert('Logo Updated', 'Your company logo has been saved.') }
          else Alert.alert('Error', data.message || 'Could not upload logo')
        }
      }
    } catch (err) {
      console.error('Logo upload error:', err)
      Alert.alert('Error', 'Could not upload logo')
    } finally {
      if (Platform.OS !== 'web') setUploadingLogo(false)
    }
  }

  const saveBranding = async () => {
    setSavingBranding(true)
    try {
      const res = await fetch(`${API_URL}/admin/branding`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor: brandingPrimary, secondaryColor: brandingSecondary })
      })
      const data = await res.json()
      if (data.success) Alert.alert('Saved', 'Branding colors updated.')
      else Alert.alert('Error', data.message || 'Could not save branding')
    } catch (err) { Alert.alert('Error', 'Network error') } finally { setSavingBranding(false) }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, phone: companyPhone, email: companyEmail, address: companyAddress })
      })
      const data = await res.json()
      if (data.success) Alert.alert('Saved', 'Company settings updated.')
      else Alert.alert('Error', data.message || 'Could not save settings')
    } catch (err) { Alert.alert('Error', 'Network error') } finally { setSavingSettings(false) }
  }

  const createStaff = async () => {
    if (!nsFirstName || !nsLastName || !nsEmail) { Alert.alert('Required', 'First name, last name and email are required'); return }
    setCreatingStaff(true)
    try {
      const res = await fetch(`${API_URL}/admin/staff`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: nsFirstName, lastName: nsLastName, email: nsEmail, phone: nsPhone, role: nsRole })
      })
      const data = await res.json()
      if (data.success) {
        setNewStaffModal(false)
        setNsFirstName(''); setNsLastName(''); setNsEmail(''); setNsPhone(''); setNsRole('tech')
        Alert.alert('Staff Created', `Welcome email sent to ${nsEmail}`)
        fetchAll()
      } else Alert.alert('Error', data.message || 'Could not create staff')
    } catch (err) { Alert.alert('Error', 'Network error') } finally { setCreatingStaff(false) }
  }

  const assignStaffRegion = async (userId, regionId) => {
    try {
      const res = await fetch(`${API_URL}/admin/staff/${userId}/region`, {
        method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, regionId })
      })
      const data = await res.json()
      if (data.success) setTimeout(() => fetchAll(), 300)
      else Alert.alert('Error', data.message || 'Could not assign region')
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  const saveRegion = async () => {
    if (!rName) { Alert.alert('Required', 'Region name is required'); return }
    setSavingRegion(true)
    try {
      const isEdit = !!selectedRegion
      const url = isEdit ? `${API_URL}/admin/regions/${selectedRegion.id}` : `${API_URL}/admin/regions`
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, color: rColor, cities: rCities })
      })
      const data = await res.json()
      if (data.success) {
        setNewRegionModal(false); setEditRegionModal(false); setSelectedRegion(null)
        setRName(''); setRColor('#C9A84C'); setRCities('')
        fetchAll()
      } else Alert.alert('Error', data.message || 'Could not save region')
    } catch (err) { Alert.alert('Error', 'Network error') } finally { setSavingRegion(false) }
  }

  const deleteRegion = async (regionId) => {
    try {
      const res = await fetch(`${API_URL}/admin/regions/${regionId}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (data.success) fetchAll()
      else Alert.alert('Error', data.message || 'Could not delete region')
    } catch (err) { Alert.alert('Error', 'Network error') }
  }

  const createService = async () => {
    if (!svcName || !svcPrice) { Alert.alert('Required', 'Service name and price are required'); return }
    setSavingService(true)
    try {
      const res = await fetch(`${API_URL}/admin/services`, {
        method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: svcName, price: svcPrice, duration: svcDuration, description: svcDescription })
      })
      const data = await res.json()
      if (data.success) {
        setNewServiceModal(false)
        setSvcName(''); setSvcPrice(''); setSvcDuration(''); setSvcDescription('')
        Alert.alert('Service Added', `${svcName} has been added.`)
        fetchAll()
      } else Alert.alert('Error', data.message || 'Could not create service')
    } catch (err) { Alert.alert('Error', 'Network error') } finally { setSavingService(false) }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={primaryColor} size="large" /></View>
  }

  const TABS = ['dashboard', 'patients', 'reports', 'staff', 'services', 'regions', 'documents', 'branding', 'announcements', 'referrals', 'loyalty', ...(user?.role === 'owner' ? ['billing'] : []), 'audit', 'settings']

  return (
    <View style={styles.container}>
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
            <Text style={styles.headerTitle}>Admin Console</Text>
            <Text style={styles.headerSub}>{user?.firstName} {user?.lastName} · {user?.role?.toUpperCase()}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', overflowX: Platform.OS === 'web' ? 'auto' : 'visible' }}>
        <View style={{ flexDirection: 'row' }}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: activeTab === tab ? primaryColor : 'transparent' }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{ color: activeTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ── DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <ScrollView style={[styles.scroll, { flex: 1 }]} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <Text style={styles.sectionTitle}>Today's Overview</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Pending', value: stats?.pending || 0, color: primaryColor },
              { label: 'Active', value: stats?.active || 0, color: '#2196F3' },
              { label: 'Completed', value: stats?.completed_today || 0, color: '#4CAF50' },
              { label: 'Cancelled', value: stats?.cancelled_today || 0, color: '#e53e3e' },
            ].map(item => (
              <View key={item.label} style={{ flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, alignItems: 'center', borderTopWidth: 3, borderTopColor: item.color }}>
                <Text style={{ color: item.color, fontSize: 36, fontWeight: '700' }}>{item.value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>{item.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sectionTitle}>Team Overview</Text>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>{staff.length}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Total staff members</Text>
            <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Techs: {staff.filter(s => s.role === 'tech').length}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>NPs: {staff.filter(s => s.role === 'np').length}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>Dispatchers: {staff.filter(s => s.role === 'dispatcher').length}</Text>
            </View>
          </View>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={{ gap: 10 }}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor }]} onPress={() => setActiveTab('staff')}>
              <Text style={[styles.actionBtnText, { color: secondaryColor }]}>Manage Staff</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setActiveTab('documents')}>
              <Text style={styles.actionBtnText}>Document Library</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setActiveTab('branding')}>
              <Text style={styles.actionBtnText}>Update Branding</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <Modal visible={showImportModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a1a' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
            <TouchableOpacity onPress={() => { setShowImportModal(false); setImportCsv(''); setImportResult(null) }}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Import Patients</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>CSV FORMAT</Text>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 20 }}>Paste your CSV data below. First row must be headers. Required: first_name, last_name, email. Optional: phone, address, insurance_provider, insurance_member_id, insurance_group_number</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 8, fontFamily: 'monospace' }}>first_name,last_name,email,phone{'\n'}John,Smith,john@email.com,6025550100</Text>
            </View>

            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>Paste CSV Data</Text>
            <TextInput
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 14, fontSize: 12, color: '#fff', height: 200, textAlignVertical: 'top', fontFamily: 'monospace', marginBottom: 16 }}
              placeholder="first_name,last_name,email,phone&#10;John,Smith,john@example.com,6025550100"
              placeholderTextColor="#444"
              value={importCsv}
              onChangeText={setImportCsv}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}
              onPress={() => setImportSendEmails(!importSendEmails)}
            >
              <View style={{ width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: importSendEmails ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: importSendEmails ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {importSendEmails && <Text style={{ color: secondaryColor, fontSize: 12, fontWeight: '700' }}>✓</Text>}
              </View>
              <View>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Send welcome emails to new patients</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Includes app download link and password reset code</Text>
              </View>
            </TouchableOpacity>

            {importResult && (
              <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <Text style={{ color: '#4CAF50', fontSize: 15, fontWeight: '700', marginBottom: 4 }}>✅ Import Complete</Text>
                <Text style={{ color: '#fff', fontSize: 14 }}>Imported: {importResult.imported}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Skipped (already exist): {importResult.skipped}</Text>
                {importResult.errors > 0 && <Text style={{ color: '#f09090', fontSize: 13 }}>Errors: {importResult.errors}</Text>}
              </View>
            )}

            <TouchableOpacity
              style={[{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }, importing && { opacity: 0.6 }]}
              disabled={importing || !importCsv.trim()}
              onPress={async () => {
                if (!importCsv.trim()) return
                setImporting(true)
                setImportResult(null)
                try {
                  const lines = importCsv.trim().split('\n')
                  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\r/g, ''))
                  const patients = lines.slice(1).map(line => {
                    const vals = line.split(',').map(v => v.trim().replace(/\r/g, ''))
                    const obj = {}
                    headers.forEach((h, i) => { obj[h] = vals[i] || '' })
                    return obj
                  }).filter(p => p.first_name || p.last_name || p.email)

                  const res = await fetch(`${API_URL}/admin/patients/import`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ patients, sendEmails: importSendEmails })
                  })
                  const data = await res.json()
                  if (data.success) {
                    setImportResult(data)
                    setImportCsv('')
                  } else {
                    Alert.alert('Error', data.error || 'Import failed')
                  }
                } catch (err) {
                  Alert.alert('Error', 'Network error')
                } finally {
                  setImporting(false)
                }
              }}
            >
              {importing ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Import Patients</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── PATIENTS ── */}
      {activeTab === 'patients' && (
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: secondaryColor, paddingHorizontal: 16, paddingVertical: 12 }}>
            <TextInput
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 14, fontSize: 15, color: '#fff' }}
              placeholder="Search by name, email or phone..."
              placeholderTextColor="#666"
              value={psQuery}
              onChangeText={searchPsPatients}
            />
            <TouchableOpacity
              style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              onPress={() => setShowImportModal(true)}
            >
              <Text style={{ color: secondaryColor, fontSize: 14, fontWeight: '700' }}>⬆️ Import Patients from CSV</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            {psSearching && <View style={{ alignItems: 'center', padding: 20 }}><ActivityIndicator color={primaryColor} /></View>}
            {!psSearching && psQuery.length >= 2 && psResults.length === 0 && (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>No patients found for "{psQuery}"</Text>
              </View>
            )}
            {psResults.map(patient => (
              <TouchableOpacity
                key={patient.id}
                style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16 }}
                onPress={() => openPsProfile(patient)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 }}>{patient.first_name} {patient.last_name}</Text>
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>{patient.phone || 'No phone'} · {patient.email}</Text>
                  {patient.last_address && <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>📍 {patient.last_address}</Text>}
                  <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{patient.total_bookings || 0} visits</Text>
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
        </View>
      )}

      {/* ── REPORTS ── */}
      {activeTab === 'reports' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16, marginHorizontal: -16, paddingHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { key: 'today', label: 'Today' }, { key: 'yesterday', label: 'Yesterday' },
                { key: 'this_week', label: 'This Week' }, { key: 'last_week', label: 'Last Week' },
                { key: 'this_month', label: 'This Month' }, { key: 'last_month', label: 'Last Month' },
                { key: 'last_3_months', label: 'Last 3 Months' }, { key: 'this_year', label: 'This Year' },
                { key: 'last_year', label: 'Last Year' }, { key: 'custom', label: 'Custom' },
              ].map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: reportPeriod === p.key ? primaryColor : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: reportPeriod === p.key ? primaryColor : 'rgba(255,255,255,0.15)' }}
                  onPress={() => { setReportPeriod(p.key); fetchReports(p.key) }}
                >
                  <Text style={{ color: reportPeriod === p.key ? secondaryColor : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          {reportPeriod === 'custom' && (
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>START DATE</Text>
                <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} placeholder="YYYY-MM-DD" placeholderTextColor="#666" value={reportCustomStart} onChangeText={setReportCustomStart} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>END DATE</Text>
                <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 12, color: '#fff', fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }} placeholder="YYYY-MM-DD" placeholderTextColor="#666" value={reportCustomEnd} onChangeText={setReportCustomEnd} />
              </View>
              <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 8, paddingHorizontal: 16, alignSelf: 'flex-end', paddingVertical: 12 }} onPress={() => fetchReports('custom', reportCustomStart, reportCustomEnd)}>
                <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 13 }}>Go</Text>
              </TouchableOpacity>
            </View>
          )}
          {reportLoading ? (
            <View style={{ alignItems: 'center', padding: 40 }}><ActivityIndicator color={primaryColor} size="large" /></View>
          ) : reportData ? (
            <>
              <Text style={styles.sectionTitle}>Key Metrics</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Total Bookings', value: reportData.stats.total, color: primaryColor },
                  { label: 'Completed', value: reportData.stats.completed, color: '#4CAF50' },
                  { label: 'Cancelled', value: reportData.stats.cancelled, color: '#f09090' },
                  { label: 'No Shows', value: reportData.stats.noShows, color: '#FF9800' },
                  { label: 'Completion Rate', value: reportData.stats.completionRate + '%', color: '#2196F3' },
                  { label: 'Avg Duration', value: reportData.stats.avgCompletionMinutes + 'm', color: '#9C27B0' },
                ].map(item => (
                  <View key={item.label} style={{ width: '47%', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: item.color }}>
                    <Text style={{ color: item.color, fontSize: 28, fontWeight: '800' }}>{item.value}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4 }}>{item.label}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.sectionTitle}>Patient Type</Text>
              <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 14 }}>🆕 New Patients</Text>
                  <Text style={{ color: '#4CAF50', fontSize: 14, fontWeight: '700' }}>{reportData.newPatients}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#fff', fontSize: 14 }}>🔄 Returning Patients</Text>
                  <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '700' }}>{reportData.returningPatients}</Text>
                </View>
              </View>
              {reportData.byService?.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Top Services</Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    {reportData.byService.map((s, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < reportData.byService.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{s.service}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{s.completed} completed</Text>
                        </View>
                        <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>{s.total}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {reportData.byTech?.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Tech Performance</Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    {reportData.byTech.map((t, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < reportData.byTech.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>{t.first_name} {t.last_name}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{t.completed} completed · {t.cancelled} cancelled</Text>
                        </View>
                        <Text style={{ color: primaryColor, fontSize: 18, fontWeight: '700' }}>{t.total}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}
              {reportData.daily?.length > 1 && (
                <>
                  <Text style={styles.sectionTitle}>Daily Breakdown</Text>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                    {reportData.daily.map((d, i) => (
                      <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: i < reportData.daily.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })}</Text>
                        <View style={{ flexDirection: 'row', gap: 16 }}>
                          <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>{d.total} total</Text>
                          <Text style={{ color: '#4CAF50', fontSize: 13 }}>{d.completed} ✓</Text>
                          <Text style={{ color: '#f09090', fontSize: 13 }}>{d.cancelled} ✗</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          ) : (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Text style={{ fontSize: 40, marginBottom: 16 }}>📊</Text>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No data yet</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Select a time period to view reports</Text>
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── STAFF ── */}
      {activeTab === 'staff' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor, marginBottom: 20 }]} onPress={() => setNewStaffModal(true)}>
            <Text style={[styles.actionBtnText, { color: secondaryColor }]}>+ Add Staff Member</Text>
          </TouchableOpacity>
          {staff.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No staff members yet</Text>
          ) : staff.map(member => (
            <View key={member.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{member.first_name} {member.last_name}</Text>
                  <Text style={styles.cardSub}>{member.email}</Text>
                  {member.phone && <Text style={styles.cardSub}>{member.phone}</Text>}
                </View>
                <View style={[styles.roleBadge, { borderColor: primaryColor }]}>
                  <Text style={[styles.roleBadgeText, { color: primaryColor }]}>{member.role?.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={{ color: member.password_changed ? '#4CAF50' : 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>
                {member.password_changed ? 'Active account' : 'Pending first login'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Region:</Text>
                <TouchableOpacity
                  style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      const choice = window.prompt(`Assign region for ${member.first_name}:\n${regions.map((r, i) => `${i + 1}. ${r.name}`).join('\n')}\n\nEnter region name:`)
                      if (choice) {
                        const region = regions.find(r => r.name.toLowerCase() === choice.toLowerCase())
                        assignStaffRegion(member.id, region?.id || null)
                      }
                    } else {
                      Alert.alert('Assign Region', `Select region for ${member.first_name}:`, [
                        { text: 'Unassigned', onPress: () => assignStaffRegion(member.id, null) },
                        ...regions.map(r => ({ text: r.name, onPress: () => assignStaffRegion(member.id, r.id) })),
                        { text: 'Cancel', style: 'cancel' }
                      ])
                    }
                  }}
                >
                  <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>
                    {regions.find(r => parseInt(r.id) === parseInt(member.region_id))?.name || 'Unassigned'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── SERVICES ── */}
      {activeTab === 'services' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor, marginBottom: 20 }]} onPress={() => setNewServiceModal(true)}>
            <Text style={[styles.actionBtnText, { color: secondaryColor }]}>+ Add Service</Text>
          </TouchableOpacity>
          {services.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No services yet</Text>
          ) : services.map(svc => (
            <View key={svc.id} style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.cardName}>{svc.name}</Text>
                <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>${svc.price}</Text>
              </View>
              {svc.duration && <Text style={styles.cardSub}>{svc.duration}</Text>}
              {svc.description && <Text style={styles.cardSub}>{svc.description}</Text>}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── REGIONS ── */}
      {activeTab === 'regions' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor, marginBottom: 20 }]} onPress={() => { setRName(''); setRColor('#C9A84C'); setRCities(''); setSelectedRegion(null); setNewRegionModal(true) }}>
            <Text style={[styles.actionBtnText, { color: secondaryColor }]}>+ Add Region</Text>
          </TouchableOpacity>
          {regions.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No regions yet</Text>
          ) : regions.map(region => (
            <View key={region.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: region.color }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{region.name}</Text>
                  <Text style={styles.cardSub} numberOfLines={2}>{region.cities || 'No cities assigned'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: primaryColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => { setSelectedRegion(region); setRName(region.name); setRColor(region.color); setRCities(region.cities || ''); setEditRegionModal(true) }}>
                    <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ borderWidth: 1, borderColor: '#e53e3e', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }} onPress={() => {
                    if (Platform.OS === 'web') { if (window.confirm(`Delete ${region.name}?`)) deleteRegion(region.id) }
                    else Alert.alert('Delete Region', `Delete ${region.name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteRegion(region.id) }])
                  }}>
                    <Text style={{ color: '#e53e3e', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: region.color }} />
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{region.color}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── DOCUMENTS ── */}
      {activeTab === 'documents' && (
        <View style={{ flex: 1 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 52, backgroundColor: secondaryColor, paddingHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10 }}>
              {['All', 'Protocol', 'Standing Order', 'IV Recipe', 'Other'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: docCategory === cat ? primaryColor : 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: docCategory === cat ? primaryColor : 'rgba(255,255,255,0.15)' }}
                  onPress={() => setDocCategory(cat)}
                >
                  <Text style={{ color: docCategory === cat ? secondaryColor : 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          <ScrollView style={{ flex: 1, padding: 16 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchDocuments} tintColor={primaryColor} />}>
            <TouchableOpacity
              style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 20 }}
              onPress={() => { setDocTitle(''); setDocDescription(''); setDocCategory2('Protocol'); setDocModal(true) }}
            >
              <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>+ Upload Document</Text>
            </TouchableOpacity>
            {docLoading ? (
              <ActivityIndicator color={primaryColor} style={{ marginTop: 40 }} />
            ) : documents.filter(d => docCategory === 'All' || d.category === docCategory).length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60 }}>
                <Text style={{ fontSize: 48, marginBottom: 16 }}>📄</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>No documents yet</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Upload protocols, standing orders, and IV recipes</Text>
              </View>
            ) : documents.filter(d => docCategory === 'All' || d.category === docCategory).map(doc => (
              <View key={doc.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: doc.category === 'Protocol' ? primaryColor : doc.category === 'Standing Order' ? '#2196F3' : doc.category === 'IV Recipe' ? '#4CAF50' : '#9C27B0' }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>📄 {doc.title}</Text>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>{doc.category.toUpperCase()}</Text>
                {doc.description && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>{doc.description}</Text>}
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginBottom: 12 }}>
                  Uploaded by {doc.uploaded_by_first} {doc.uploaded_by_last} · {new Date(doc.created_at).toLocaleDateString()}
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: primaryColor, borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => handleViewDocument(doc)}>
                    <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, borderWidth: 1, borderColor: '#f09090', borderRadius: 8, padding: 10, alignItems: 'center' }} onPress={() => handleDeleteDocument(doc)}>
                    <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* ── BRANDING ── */}
      {activeTab === 'branding' && (
        <ScrollView style={styles.scroll}>
          <Text style={styles.sectionTitle}>Company Logo</Text>
          <TouchableOpacity onPress={pickLogo} disabled={uploadingLogo} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed', minHeight: 120, justifyContent: 'center' }}>
            {uploadingLogo ? <ActivityIndicator color={primaryColor} /> : brandingLogo ? (
              <Image source={{ uri: brandingLogo }} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
            ) : (
              <>
                <Text style={{ color: primaryColor, fontSize: 32, marginBottom: 8 }}>+</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Tap to upload company logo</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.sectionTitle}>Brand Colors</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Primary Color</Text>
            <TextInput style={[styles.input, { borderColor: brandingPrimary }]} value={brandingPrimary} onChangeText={setBrandingPrimary} placeholder="#C9A84C" placeholderTextColor="#444" autoCapitalize="characters" />
            <View style={{ height: 40, borderRadius: 8, backgroundColor: brandingPrimary, marginBottom: 16 }} />
            <Text style={styles.fieldLabel}>Secondary Color</Text>
            <TextInput style={[styles.input, { borderColor: brandingSecondary }]} value={brandingSecondary} onChangeText={setBrandingSecondary} placeholder="#0D1B4B" placeholderTextColor="#444" autoCapitalize="characters" />
            <View style={{ height: 40, borderRadius: 8, backgroundColor: brandingSecondary, marginBottom: 16 }} />
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor }, savingBranding && { opacity: 0.6 }]} onPress={saveBranding} disabled={savingBranding}>
              {savingBranding ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.actionBtnText, { color: secondaryColor }]}>Save Colors</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── ANNOUNCEMENTS ── */}
      {activeTab === 'announcements' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity style={[styles.addButton, { backgroundColor: primaryColor }]} onPress={() => {
            setEditingAnnouncement(null); setAnTitle(''); setAnBody(''); setAnEmoji('📢')
            setAnCtaLabel(''); setAnCtaUrl(''); setAnBgStyle('solid'); setAnBgColor(''); setAnActive(true)
            setAnnouncementModal(true)
          }}>
            <Text style={[styles.addButtonText, { color: secondaryColor }]}>+ New Announcement</Text>
          </TouchableOpacity>
          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyText}>No announcements yet</Text>
              <Text style={styles.emptySub}>Create one to show patients when they log in</Text>
            </View>
          ) : announcements.map(an => (
            <View key={an.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: an.active ? primaryColor : '#aaa' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, marginBottom: 4 }}>{an.emoji}</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{an.title}</Text>
                  {an.body && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>{an.body}</Text>}
                </View>
                <View style={[{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: an.active ? '#4CAF50' : '#aaa' }]}>
                  <Text style={{ color: an.active ? '#4CAF50' : '#aaa', fontSize: 10, fontWeight: '700' }}>{an.active ? 'ACTIVE' : 'INACTIVE'}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: primaryColor }]} onPress={() => {
                  setEditingAnnouncement(an); setAnTitle(an.title); setAnBody(an.body || ''); setAnEmoji(an.emoji || '📢')
                  setAnCtaLabel(an.cta_label || ''); setAnCtaUrl(an.cta_url || ''); setAnBgStyle(an.bg_style || 'solid'); setAnBgColor(an.bg_color || ''); setAnActive(an.active)
                  setAnnouncementModal(true)
                }}>
                  <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: an.active ? '#aaa' : '#4CAF50' }]} onPress={async () => {
                  try {
                    await fetch(`${API_URL}/admin/announcements/${an.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ ...an, active: !an.active, ctaLabel: an.cta_label, ctaUrl: an.cta_url, bgStyle: an.bg_style, bgColor: an.bg_color, sortOrder: an.sort_order }) })
                    fetchAll()
                  } catch (err) { Alert.alert('Error', 'Could not update') }
                }}>
                  <Text style={{ color: an.active ? '#aaa' : '#4CAF50', fontSize: 13, fontWeight: '600' }}>{an.active ? 'Deactivate' : 'Activate'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { borderColor: '#f09090' }]} onPress={() => Alert.alert('Delete', 'Delete this announcement?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { await fetch(`${API_URL}/admin/announcements/${an.id}`, { method: 'DELETE', headers }); fetchAll() } }])}>
                  <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── REFERRALS ── */}
      {activeTab === 'referrals' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Referral Program</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>Patients earn a perk when someone they refer completes their first booking.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Enable Referral Program</Text>
              <TouchableOpacity style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: referralActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={() => setReferralActive(!referralActive)}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: referralActive ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Perk Type</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {['fixed', 'percent'].map(type => (
                <TouchableOpacity key={type} style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center', borderColor: referralPerkType === type ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: referralPerkType === type ? primaryColor + '20' : 'transparent' }} onPress={() => setReferralPerkType(type)}>
                  <Text style={{ color: referralPerkType === type ? primaryColor : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{type === 'fixed' ? '$ Fixed Amount' : '% Percentage'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {referralPerkType === 'fixed' ? (
              <><Text style={styles.fieldLabel}>Perk Amount ($)</Text><TextInput style={styles.input} value={referralPerkAmount} onChangeText={setReferralPerkAmount} keyboardType="decimal-pad" placeholder="20" placeholderTextColor="#666" /></>
            ) : (
              <><Text style={styles.fieldLabel}>Perk Percentage (%)</Text><TextInput style={styles.input} value={referralPerkPercent} onChangeText={setReferralPerkPercent} keyboardType="decimal-pad" placeholder="10" placeholderTextColor="#666" /></>
            )}
            <TouchableOpacity style={[{ borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: primaryColor }, savingReferral && { opacity: 0.6 }]} onPress={async () => {
              setSavingReferral(true)
              try {
                await fetch(`${API_URL}/admin/referral-settings`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ perkType: referralPerkType, perkAmount: referralPerkType === 'fixed' ? parseFloat(referralPerkAmount) : null, perkPercent: referralPerkType === 'percent' ? parseFloat(referralPerkPercent) : null, active: referralActive }) })
                Alert.alert('✅ Saved', 'Referral settings updated!'); fetchAll()
              } catch (err) { Alert.alert('Error', 'Could not save') } finally { setSavingReferral(false) }
            }} disabled={savingReferral}>
              {savingReferral ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Save Referral Settings</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── LOYALTY ── */}
      {activeTab === 'loyalty' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Loyalty Program</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>Reward patients who keep coming back. Like a digital punch card.</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Enable Loyalty Program</Text>
              <TouchableOpacity style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: loyaltyActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={() => setLoyaltyActive(!loyaltyActive)}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: loyaltyActive ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Number of IVs to earn reward</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['3', '5', '6', '7', '10', '12'].map(n => (
                <TouchableOpacity key={n} style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, borderColor: loyaltyThreshold === n ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: loyaltyThreshold === n ? primaryColor + '20' : 'transparent' }} onPress={() => setLoyaltyThreshold(n)}>
                  <Text style={{ color: loyaltyThreshold === n ? primaryColor : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Reward Type</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {['fixed', 'percent', 'free'].map(type => (
                <TouchableOpacity key={type} style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center', borderColor: loyaltyRewardType === type ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: loyaltyRewardType === type ? primaryColor + '20' : 'transparent' }} onPress={() => setLoyaltyRewardType(type)}>
                  <Text style={{ color: loyaltyRewardType === type ? primaryColor : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>{type === 'fixed' ? '$ Off' : type === 'percent' ? '% Off' : '🎁 Free'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {loyaltyRewardType === 'fixed' && (<><Text style={styles.fieldLabel}>Reward Amount ($)</Text><TextInput style={styles.input} value={loyaltyRewardAmount} onChangeText={setLoyaltyRewardAmount} keyboardType="decimal-pad" placeholder="25" placeholderTextColor="#666" /></>)}
            {loyaltyRewardType === 'percent' && (<><Text style={styles.fieldLabel}>Reward Percentage (%)</Text><TextInput style={styles.input} value={loyaltyRewardPercent} onChangeText={setLoyaltyRewardPercent} keyboardType="decimal-pad" placeholder="50" placeholderTextColor="#666" /></>)}
            {loyaltyRewardType === 'free' && (<View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 14, marginBottom: 10 }}><Text style={{ color: '#4CAF50', fontSize: 13 }}>🎁 Patient gets their next IV completely free!</Text></View>)}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Preview</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>Every {loyaltyThreshold} IVs → {loyaltyRewardType === 'free' ? 'FREE IV' : loyaltyRewardType === 'fixed' ? `$${loyaltyRewardAmount} off` : `${loyaltyRewardPercent}% off`}</Text>
            </View>
            <TouchableOpacity style={[{ borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: primaryColor }, savingLoyalty && { opacity: 0.6 }]} onPress={async () => {
              setSavingLoyalty(true)
              try {
                await fetch(`${API_URL}/admin/loyalty`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ threshold: parseInt(loyaltyThreshold), rewardType: loyaltyRewardType, rewardAmount: loyaltyRewardType === 'fixed' ? parseFloat(loyaltyRewardAmount) : loyaltyRewardType === 'free' ? 0 : null, rewardPercent: loyaltyRewardType === 'percent' ? parseFloat(loyaltyRewardPercent) : null, active: loyaltyActive }) })
                Alert.alert('✅ Saved', 'Loyalty program updated!'); fetchAll()
              } catch (err) { Alert.alert('Error', 'Could not save') } finally { setSavingLoyalty(false) }
            }} disabled={savingLoyalty}>
              {savingLoyalty ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Save Loyalty Program</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── BILLING ── */}
      {activeTab === 'billing' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
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
            {[
              { tier: 'starter', price: '$99/mo', features: ['Full platform access', 'Up to 5 staff accounts', 'Dispatch console', 'Tech & patient app'] },
              { tier: 'growth', price: '$199/mo', features: ['Everything in Starter', 'Unlimited staff', 'Announcements & banners', 'Referral & loyalty programs'] },
              { tier: 'scale', price: '$349/mo', features: ['Everything in Growth', 'Analytics dashboard', 'White label branding', 'Multi-region support'] }
            ].map(plan => (
              <View key={plan.tier} style={{ borderWidth: 1, borderColor: billingStatus?.tier === plan.tier ? primaryColor : 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: billingStatus?.tier === plan.tier ? primaryColor + '10' : 'transparent' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', textTransform: 'capitalize' }}>{plan.tier}</Text>
                  <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>{plan.price}</Text>
                </View>
                {plan.features.map((f, i) => <Text key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 3 }}>✓ {f}</Text>)}
                {billingStatus?.tier !== plan.tier && (
                  <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 }} onPress={async () => {
                    try {
                      const res = await fetch(`${API_URL}/billing/create-checkout`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: plan.tier }) })
                      const data = await res.json()
                      if (data.url) { if (typeof window !== 'undefined') window.location.href = data.url; else Alert.alert('Checkout', 'Please open:\n' + data.url) }
                      else Alert.alert('Error', data.error || 'Could not start checkout')
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
          {billingStatus?.status === 'active' && (
            <TouchableOpacity style={{ borderWidth: 1, borderColor: '#f09090', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 }} onPress={() => Alert.alert('Cancel Subscription', 'Your subscription will remain active until the end of the billing period.', [{ text: 'Keep Subscription', style: 'cancel' }, { text: 'Cancel', style: 'destructive', onPress: async () => { try { await fetch(`${API_URL}/billing/cancel`, { method: 'POST', headers }); fetchAll(); Alert.alert('Cancelled', 'Subscription will end at current billing period.') } catch (e) {} } }])}>
              <Text style={{ color: '#f09090', fontSize: 14, fontWeight: '600' }}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── PATIENT PROFILE MODAL ── */}
      <Modal visible={psProfileModal} animationType="slide" presentationStyle="fullScreen">
        <View style={{ flex: 1, backgroundColor: '#0D1B4B' }}>

          {/* Full Chart Detail Modal */}
          <Modal visible={psChartModal} animationType="slide" presentationStyle="fullScreen">
            <View style={{ flex: 1, backgroundColor: '#0a0a1a' }}>
              <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
                <TouchableOpacity onPress={() => setPsChartModal(false)}>
                  <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Full Chart</Text>
                <View style={{ width: 60 }} />
              </View>
              <ScrollView contentContainerStyle={{ padding: 16 }}>
                {psSelectedChart && (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{psSelectedChart.tech_name}</Text>
                      <View style={{ backgroundColor: psSelectedChart.status === 'submitted' || psSelectedChart.status === 'amended' ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                        <Text style={{ color: psSelectedChart.status === 'submitted' || psSelectedChart.status === 'amended' ? '#4CAF50' : '#FF9800', fontSize: 11, fontWeight: '700' }}>{psSelectedChart.status?.toUpperCase()}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>INITIAL VITALS</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {psSelectedChart.blood_pressure && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>BP</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.blood_pressure}</Text></View>}
                        {psSelectedChart.heart_rate && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>HR</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.heart_rate}</Text></View>}
                        {psSelectedChart.oxygen_sat && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>O2</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.oxygen_sat}%</Text></View>}
                        {psSelectedChart.temperature && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>TEMP</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.temperature}°C</Text></View>}
{psSelectedChart.pain_scale && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>PAIN</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.pain_scale}/10</Text></View>}
                      </View>
                    </View>
                    {psSelectedChart.chief_complaint && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>CHIEF COMPLAINT</Text><Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{psSelectedChart.chief_complaint}</Text></View>}
{(psSelectedChart.medical_history_changes || psSelectedChart.allergies_detail) && (
  <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>NURSING ASSESSMENT</Text>
    {psSelectedChart.medical_history_changes && <View style={{ marginBottom: 10 }}><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>HISTORY/MED CHANGES</Text><Text style={{ color: '#fff', fontSize: 14 }}>{psSelectedChart.medical_history_changes}</Text></View>}
    {psSelectedChart.allergies_detail && <View><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>ALLERGIES & REACTIONS</Text><Text style={{ color: '#fff', fontSize: 14 }}>{psSelectedChart.allergies_detail}</Text></View>}
  </View>
)}
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>IV DETAILS</Text>
                      {psSelectedChart.iv_insertion_site && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Site</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedChart.iv_insertion_site}</Text></View>}
                      {psSelectedChart.iv_catheter_size && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Catheter</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedChart.iv_catheter_size}</Text></View>}
                      {psSelectedChart.iv_attempts && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Attempts</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedChart.iv_attempts}</Text></View>}
                      {psSelectedChart.iv_time_initiated && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Started</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedChart.iv_time_initiated}</Text></View>}
                      {psSelectedChart.iv_time_discontinued && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Discontinued</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedChart.iv_time_discontinued}</Text></View>}
                      {psSelectedChart.iv_catheter_status && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}><Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Catheter Status</Text><Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psSelectedChart.iv_catheter_status}</Text></View>}
                    </View>
                    {psSelectedChart.iv_fluids_used?.length > 0 && (
  <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
    <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>FLUIDS USED</Text>
    {psSelectedChart.iv_fluids_used.map((fluid, i) => (
      <View key={i} style={{ paddingVertical: 6, borderBottomWidth: i < psSelectedChart.iv_fluids_used.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
        <Text style={{ color: '#fff', fontSize: 13 }}>• {fluid}</Text>
      </View>
    ))}
  </View>
)}
                    {psSelectedChart.prn_iv_medications && Object.keys(psSelectedChart.prn_iv_medications).filter(k => psSelectedChart.prn_iv_medications[k]).length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>IV MEDICATIONS</Text>
                        {Object.entries(psSelectedChart.prn_iv_medications).filter(([k, v]) => v).map(([key, val]) => (
                          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>{key.replace(/_/g, ' ')}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{val?.time || ''}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {psSelectedChart.prn_bag_addons && Object.keys(psSelectedChart.prn_bag_addons).filter(k => psSelectedChart.prn_bag_addons[k]).length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>BAG ADD-ONS</Text>
                        {Object.entries(psSelectedChart.prn_bag_addons).filter(([k, v]) => v).map(([key, val]) => (
                          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>{key.replace(/_/g, ' ')}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{val?.dose || val?.time || ''}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {psSelectedChart.prn_im_injections && Object.keys(psSelectedChart.prn_im_injections).filter(k => psSelectedChart.prn_im_injections[k]).length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>IM INJECTIONS</Text>
                        {Object.entries(psSelectedChart.prn_im_injections).filter(([k, v]) => v).map(([key, val]) => (
                          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ color: '#fff', fontSize: 13, flex: 1 }}>{key.replace(/_/g, ' ')}</Text>
                            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{val?.dose || val?.time || ''}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {psSelectedChart.vitals_post && (psSelectedChart.vitals_post.bp || psSelectedChart.vitals_post.hr) && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>POST INFUSION VITALS</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                          {psSelectedChart.vitals_post.bp && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>BP</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.vitals_post.bp}</Text></View>}
                          {psSelectedChart.vitals_post.hr && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>HR</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.vitals_post.hr}</Text></View>}
                          {psSelectedChart.vitals_post.o2 && <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 10, alignItems: 'center', minWidth: 70 }}><Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>O2</Text><Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{psSelectedChart.vitals_post.o2}%</Text></View>}
                        </View>
                      </View>
                    )}
                    {psSelectedChart.complications === 'Yes' && (
                      <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderWidth: 1, borderColor: '#e53e3e', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>⚠️ COMPLICATIONS</Text>
                        <Text style={{ color: '#fff', fontSize: 14 }}>{psSelectedChart.complications_detail}</Text>
                      </View>
                    )}
                    {psSelectedChart.chartServices?.length > 0 && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>SERVICES ADMINISTERED</Text>
                        {psSelectedChart.chartServices.map((svc, i) => (
                          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: i < psSelectedChart.chartServices.length - 1 ? 1 : 0, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                            <Text style={{ color: '#fff', fontSize: 13 }}>{svc.service_name}</Text>
                            {svc.service_price && <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>${svc.service_price}</Text>}
                          </View>
                        ))}
                      </View>
                    )}
                    {psSelectedChart.tech_notes && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>TECH NOTES</Text><Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{psSelectedChart.tech_notes}</Text></View>}
                    {psSelectedChart.amendment_notes && (
                      <View style={{ backgroundColor: 'rgba(255,152,0,0.08)', borderWidth: 1, borderColor: '#FF9800', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                        <Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>📝 AMENDMENT</Text>
                        <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{psSelectedChart.amendment_notes}</Text>
                        {psSelectedChart.amended_by_name && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>By {psSelectedChart.amended_by_name} · {new Date(psSelectedChart.amended_at).toLocaleString()}</Text>}
                      </View>
                    )}
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center', marginTop: 8 }}>Submitted {new Date(psSelectedChart.created_at).toLocaleString()}</Text>
                  </>
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </Modal>

          {/* Header */}
          <View style={{ paddingTop: 56, paddingBottom: 0, backgroundColor: secondaryColor }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 }}>
              <TouchableOpacity onPress={() => { setPsProfileModal(false); setPsProfileData(null); setPsEditing(false) }}>
                <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
              </TouchableOpacity>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Patient Profile</Text>
              <View style={{ width: 60 }} />
            </View>

            {/* Patient Hero */}
            <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: primaryColor + '30', borderWidth: 2, borderColor: primaryColor, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: primaryColor, fontSize: 22, fontWeight: '700' }}>{psSelectedPatient?.first_name?.[0]}{psSelectedPatient?.last_name?.[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 }}>{psSelectedPatient?.first_name} {psSelectedPatient?.last_name}</Text>
                  {psProfileData?.patient?.dob && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>DOB: {new Date(psProfileData.patient.dob).toLocaleDateString()}</Text>}
                </View>
              </View>
              {psProfileData?.intake?.allergies_detail?.length > 0 && (
                <View style={{ backgroundColor: 'rgba(229,62,62,0.15)', borderWidth: 1, borderColor: '#e53e3e', borderRadius: 10, padding: 10, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 16 }}>⚠️</Text>
                  <Text style={{ color: '#e53e3e', fontSize: 12, fontWeight: '700', flex: 1 }}>ALLERGIES: {Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail.join(', ') : psProfileData.intake.allergies_detail}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                {[
                  { label: 'COMPLETED', value: psProfileData?.completedBookings || 0, color: primaryColor },
                  { label: 'CANCELLED', value: psProfileData?.cancelledBookings || 0, color: '#f09090' },
                  { label: 'CHARTS', value: psProfileData?.charts?.length || 0, color: '#4CAF50' },
                  { label: 'INTAKE', value: psProfileData?.intake ? '✓' : '✗', color: psProfileData?.intake ? '#4CAF50' : '#f09090' },
                ].map(s => (
                  <View key={s.label} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, alignItems: 'center' }}>
                    <Text style={{ color: s.color, fontSize: 20, fontWeight: '800' }}>{s.value}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600' }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Tabs */}
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
              {['overview', 'appointments', 'charts', 'intake', 'gfe', 'perks'].map(tab => (
                <TouchableOpacity key={tab} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: psActiveTab === tab ? primaryColor : 'transparent' }} onPress={() => { setPsActiveTab(tab); setPsEditing(false) }}>
                  <Text style={{ color: psActiveTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '700' }}>
                    {tab === 'overview' ? '👤' : tab === 'appointments' ? '📅' : tab === 'charts' ? '📋' : tab === 'intake' ? '🏥' : tab === 'gfe' ? '🩺' : '🎁'}
                  </Text>
                  <Text style={{ color: psActiveTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '600', marginTop: 2 }}>{tab.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {psLoadingProfile ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={primaryColor} size="large" /></View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>

              {/* Overview Tab */}
              {psActiveTab === 'overview' && (
                <>
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
                    <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Patient since</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psProfileData?.patient?.created_at ? new Date(psProfileData.patient.created_at).toLocaleDateString() : '—'}</Text>
                    </View>
                    {psProfileData?.lastBooking && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Last service</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{psProfileData.lastBooking.service}</Text>
                          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{new Date(psProfileData.lastBooking.created_at).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    )}
                    {psProfileData?.noShows > 0 && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>No-shows</Text>
                        <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '700' }}>⚠️ {psProfileData.noShows}</Text>
                      </View>
                    )}
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
                    <TouchableOpacity style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16, opacity: psSavingProfile ? 0.6 : 1 }} onPress={savePsProfile} disabled={psSavingProfile}>
                      {psSavingProfile ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Save Changes</Text>}
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Appointments Tab */}
              {psActiveTab === 'appointments' && (
                <>
                  {!psProfileData?.bookings?.length ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No appointments on record</Text>
                  ) : psProfileData.bookings.map(b => (
                    <View key={b.id} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: b.status === 'completed' ? '#4CAF50' : b.status === 'cancelled' ? '#f09090' : primaryColor }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15, flex: 1 }}>{b.service}</Text>
                        <View style={{ backgroundColor: b.status === 'completed' ? 'rgba(76,175,80,0.2)' : b.status === 'cancelled' ? 'rgba(240,144,144,0.2)' : 'rgba(201,168,76,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: b.status === 'completed' ? '#4CAF50' : b.status === 'cancelled' ? '#f09090' : primaryColor, fontSize: 10, fontWeight: '700' }}>{b.status?.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>📅 {b.requested_time ? new Date(b.requested_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                      {b.address && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>📍 {b.address}</Text>}
                      {b.tech_name && <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginBottom: 2 }}>🧑‍⚕️ {b.tech_name}</Text>}
                      {b.source && <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{b.source === 'phone' ? '📞 Phone booking' : '📱 App booking'}</Text>}
                    </View>
                  ))}
                </>
              )}

              {/* Charts Tab */}
              {psActiveTab === 'charts' && (
                <>
                  {!psProfileData?.charts?.length ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No charts on record</Text>
                  ) : psProfileData.charts.map((ch, i) => (
                    <TouchableOpacity key={ch.id || i} style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: ch.status === 'submitted' || ch.status === 'amended' ? '#4CAF50' : '#FF9800' }} onPress={() => { setPsSelectedChart(ch); setPsChartModal(true) }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>📋 {ch.tech_name}</Text>
                        <View style={{ backgroundColor: ch.status === 'submitted' || ch.status === 'amended' ? 'rgba(76,175,80,0.2)' : 'rgba(255,152,0,0.2)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                          <Text style={{ color: ch.status === 'submitted' || ch.status === 'amended' ? '#4CAF50' : '#FF9800', fontSize: 10, fontWeight: '700' }}>{ch.status?.toUpperCase()}</Text>
                        </View>
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 6 }}>{new Date(ch.created_at).toLocaleString()}</Text>
                      {ch.chief_complaint && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 4 }}>{ch.chief_complaint}</Text>}
                      {ch.amendment_notes && <Text style={{ color: '#FF9800', fontSize: 12, marginTop: 4 }}>📝 Has amendment</Text>}
                      <Text style={{ color: primaryColor, fontSize: 12, marginTop: 8, textAlign: 'right' }}>Tap to view full chart →</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}

              {/* Intake Tab */}
              {psActiveTab === 'intake' && (
                <>
                  {!psProfileData?.intake ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No intake on file</Text>
                  ) : (
                    <>
                      <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 12, marginBottom: 12 }}><Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 13 }}>✅ Submitted {new Date(psProfileData.intake.submitted_at).toLocaleDateString()}</Text></View>
                      {psProfileData.intake.medications && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>💊 MEDICATIONS</Text><Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{psProfileData.intake.medications}</Text></View>}
                      {psProfileData.intake.allergies_detail?.length > 0 && <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e53e3e' }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>⚠️ ALLERGIES</Text>{(Array.isArray(psProfileData.intake.allergies_detail) ? psProfileData.intake.allergies_detail : []).map((a, i) => <Text key={i} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>• {a}</Text>)}</View>}
                      {psProfileData.intake.important_history?.length > 0 && <View style={{ backgroundColor: 'rgba(255,152,0,0.1)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#FF9800' }}><Text style={{ color: '#FF9800', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>⚡ IMPORTANT HISTORY</Text>{(Array.isArray(psProfileData.intake.important_history) ? psProfileData.intake.important_history : []).map((h, i) => <Text key={i} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>• {h}</Text>)}</View>}
                      {psProfileData.intake.supplements && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>🌿 SUPPLEMENTS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{psProfileData.intake.supplements}</Text></View>}
                      {psProfileData.intake.current_symptoms && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>🤒 CURRENT SYMPTOMS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{psProfileData.intake.current_symptoms}</Text></View>}
                    </>
                  )}
                </>
              )}

              {/* GFE Tab */}
              {psActiveTab === 'gfe' && (
                <>
                  {!psProfileData?.gfe ? (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No GFE on file</Text>
                  ) : (
                    <>
                      <View style={{ backgroundColor: psProfileData.gfe.notACandidate ? 'rgba(229,62,62,0.1)' : 'rgba(76,175,80,0.1)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: psProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50' }}>
                        <Text style={{ color: psProfileData.gfe.notACandidate ? '#e53e3e' : '#4CAF50', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>{psProfileData.gfe.notACandidate ? '🚫 NOT A CANDIDATE' : '✅ APPROVED FOR TREATMENT'}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Signed by {psProfileData.gfe.npName}</Text>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Valid until {new Date(psProfileData.gfe.validUntil).toLocaleDateString()}</Text>
                      </View>
                      {psProfileData.gfe.approvedServices?.length > 0 && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>✅ APPROVED SERVICES</Text>{psProfileData.gfe.approvedServices.map((s, i) => <Text key={i} style={{ color: '#fff', fontSize: 13, marginBottom: 4 }}>• {s}</Text>)}</View>}
                      {psProfileData.gfe.restrictions && <View style={{ backgroundColor: 'rgba(229,62,62,0.1)', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e53e3e' }}><Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', marginBottom: 8 }}>❌ RESTRICTIONS</Text><Text style={{ color: '#fff', fontSize: 13 }}>{psProfileData.gfe.restrictions}</Text></View>}
                      {psProfileData.gfe.npOrders && <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}><Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>📝 NP ORDERS</Text><Text style={{ color: '#fff', fontSize: 13, lineHeight: 20 }}>{psProfileData.gfe.npOrders}</Text></View>}
                    </>
                  )}
                </>
              )}

              {/* Perks Tab */}
              {psActiveTab === 'perks' && (
                <>
                  {psProfileData?.loyalty?.threshold && (
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                      <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>🏆 LOYALTY PROGRESS</Text>
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 8 }}>{psProfileData.loyalty.punches} of {psProfileData.loyalty.threshold} IVs</Text>
                      <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }}>
                        <View style={{ height: 8, backgroundColor: primaryColor, borderRadius: 4, width: `${Math.min((psProfileData.loyalty.punches / psProfileData.loyalty.threshold) * 100, 100)}%` }} />
                      </View>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{Math.max(psProfileData.loyalty.threshold - psProfileData.loyalty.punches, 0)} more until reward</Text>
                    </View>
                  )}
                  {psProfileData?.loyalty?.rewards?.length > 0 ? psProfileData.loyalty.rewards.map(r => (
                    <View key={r.id} style={{ backgroundColor: r.status === 'active' ? 'rgba(76,175,80,0.1)' : 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: r.status === 'active' ? '#4CAF50' : 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                      <Text style={{ color: r.status === 'active' ? '#4CAF50' : 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>{r.status === 'active' ? '🎁 ACTIVE REWARD' : '✓ REDEEMED'}</Text>
                      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{r.reward_type === 'free' ? 'FREE IV' : r.reward_type === 'fixed' ? `$${r.reward_amount} off` : `${r.reward_percent}% off`}</Text>
                      {r.redeemed_at && <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>Redeemed {new Date(r.redeemed_at).toLocaleDateString()}</Text>}
                    </View>
                  )) : <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No loyalty rewards yet</Text>}
                </>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* ── AUDIT LOG ── */}
      {activeTab === 'audit' && (
        <AuditLogTab token={token} primaryColor={primaryColor} secondaryColor={secondaryColor} />
      )}

      {/* ── SETTINGS ── */}
      {activeTab === 'settings' && (
        <ScrollView style={styles.scroll}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Company Name</Text>
            <TextInput style={styles.input} value={companyName} onChangeText={setCompanyName} placeholder="Company name" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput style={styles.input} value={companyPhone} onChangeText={setCompanyPhone} placeholder="(602) 555-0100" placeholderTextColor="#444" keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput style={styles.input} value={companyEmail} onChangeText={setCompanyEmail} placeholder="info@company.com" placeholderTextColor="#444" keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.fieldLabel}>Address</Text>
            <TextInput style={styles.input} value={companyAddress} onChangeText={setCompanyAddress} placeholder="123 Main St, Phoenix AZ 85001" placeholderTextColor="#444" />
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor }, savingSettings && { opacity: 0.6 }]} onPress={saveSettings} disabled={savingSettings}>
              {savingSettings ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.actionBtnText, { color: secondaryColor }]}>Save Settings</Text>}
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(229,62,62,0.15)', borderWidth: 1, borderColor: 'rgba(229,62,62,0.3)' }]} onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Text style={[styles.actionBtnText, { color: '#f09090' }]}>Log out</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* ── DOCUMENT UPLOAD MODAL ── */}
      <Modal visible={docModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', backgroundColor: secondaryColor }}>
            <TouchableOpacity onPress={() => setDocModal(false)}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Upload Document</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Document Title *</Text>
            <TextInput
              style={styles.input}
              value={docTitle}
              onChangeText={setDocTitle}
              placeholder="e.g. Myers Cocktail Protocol"
              placeholderTextColor="#444"
            />
            <Text style={styles.fieldLabel}>Category *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {['Protocol', 'Standing Order', 'IV Recipe', 'Other'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, borderColor: docCategory2 === cat ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: docCategory2 === cat ? primaryColor + '20' : 'transparent' }}
                  onPress={() => setDocCategory2(cat)}
                >
                  <Text style={{ color: docCategory2 === cat ? primaryColor : 'rgba(255,255,255,0.5)', fontWeight: '600', fontSize: 13 }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={docDescription}
              onChangeText={setDocDescription}
              placeholder="Brief description of this document..."
              placeholderTextColor="#444"
              multiline
            />
            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor, marginTop: 8 }, uploadingDoc && { opacity: 0.6 }]}
              disabled={uploadingDoc}
              onPress={handleUploadDocument}
            >
              {uploadingDoc ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Select PDF & Upload</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── ANNOUNCEMENT MODAL ── */}
      <Modal visible={announcementModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: secondaryColor }}>
            <TouchableOpacity onPress={() => setAnnouncementModal(false)}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput style={styles.input} value={anTitle} onChangeText={setAnTitle} placeholder="Spring Special!" placeholderTextColor="#666" />
            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} value={anBody} onChangeText={setAnBody} placeholder="Tell your patients something exciting..." placeholderTextColor="#666" multiline />
            <Text style={styles.fieldLabel}>Background Style</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['solid', 'gradient', 'dark', 'light'].map(style => (
                <TouchableOpacity key={style} style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center', borderColor: anBgStyle === style ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: anBgStyle === style ? primaryColor + '20' : 'transparent' }} onPress={() => setAnBgStyle(style)}>
                  <Text style={{ color: anBgStyle === style ? primaryColor : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{style}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {(anBgStyle === 'solid' || anBgStyle === 'gradient') && (
              <>
                <Text style={styles.fieldLabel}>Background Color (hex)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={anBgColor} onChangeText={setAnBgColor} placeholder="#1a2a5e" placeholderTextColor="#666" autoCapitalize="none" />
                  <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: anBgColor || '#1a2a5e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                </View>
              </>
            )}
            <Text style={styles.fieldLabel}>CTA Button Label (optional)</Text>
            <TextInput style={styles.input} value={anCtaLabel} onChangeText={setAnCtaLabel} placeholder="Learn More" placeholderTextColor="#666" />
            <Text style={styles.fieldLabel}>CTA Button URL (optional)</Text>
            <TextInput style={styles.input} value={anCtaUrl} onChangeText={setAnCtaUrl} placeholder="https://yoursite.com/event" placeholderTextColor="#666" autoCapitalize="none" keyboardType="url" />
            <Text style={styles.fieldLabel}>Preview</Text>
            <View style={{ backgroundColor: anBgColor || (anBgStyle === 'dark' ? '#08101f' : '#0a1535'), borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: primaryColor + '30', marginBottom: 20 }}>
              <View style={{ height: 3, backgroundColor: primaryColor }} />
              <View style={{ padding: 20 }}>
                <View style={{ backgroundColor: primaryColor + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ color: primaryColor, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{company?.name?.toUpperCase()}</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: anBody ? 8 : 0 }}>{anTitle || 'Your Title Here'}</Text>
                {anBody ? <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20, marginBottom: anCtaLabel ? 14 : 0 }}>{anBody}</Text> : null}
                {anCtaLabel ? <View style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center' }}><Text style={{ color: secondaryColor, fontSize: 13, fontWeight: '800' }}>{anCtaLabel} →</Text></View> : null}
              </View>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Active</Text>
              <TouchableOpacity style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: anActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }} onPress={() => setAnActive(!anActive)}>
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: anActive ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor }, savingAnnouncement && { opacity: 0.6 }]} onPress={async () => {
              if (!anTitle.trim()) { Alert.alert('Required', 'Title is required'); return }
              setSavingAnnouncement(true)
              try {
                const payload = { title: anTitle, body: anBody, emoji: anEmoji, ctaLabel: anCtaLabel, ctaUrl: anCtaUrl, bgStyle: anBgStyle, bgColor: anBgColor, active: anActive, sortOrder: editingAnnouncement?.sort_order || 0 }
                if (editingAnnouncement) await fetch(`${API_URL}/admin/announcements/${editingAnnouncement.id}`, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                else await fetch(`${API_URL}/admin/announcements`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                setAnnouncementModal(false); fetchAll()
              } catch (err) { Alert.alert('Error', 'Could not save announcement') } finally { setSavingAnnouncement(false) }
            }} disabled={savingAnnouncement}>
              {savingAnnouncement ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Save Announcement</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── REGION MODAL ── */}
      <Modal visible={newRegionModal || editRegionModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => { setNewRegionModal(false); setEditRegionModal(false) }}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>{selectedRegion ? 'Edit Region' : 'Add Region'}</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Region Name *</Text>
            <TextInput style={styles.input} value={rName} onChangeText={setRName} placeholder="e.g. Phoenix Metro" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Color</Text>
            <TextInput style={[styles.input, { borderColor: rColor }]} value={rColor} onChangeText={setRColor} placeholder="#C9A84C" placeholderTextColor="#444" autoCapitalize="characters" />
            <View style={{ height: 40, borderRadius: 8, backgroundColor: rColor, marginBottom: 16 }} />
            <Text style={styles.fieldLabel}>Cities (comma separated)</Text>
            <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} value={rCities} onChangeText={setRCities} placeholder="Phoenix, Scottsdale, Tempe..." placeholderTextColor="#444" multiline />
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor, marginTop: 8 }, savingRegion && { opacity: 0.6 }]} onPress={saveRegion} disabled={savingRegion}>
              {savingRegion ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>{selectedRegion ? 'Save Changes' : 'Create Region'}</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── NEW STAFF MODAL ── */}
      <Modal visible={newStaffModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => setNewStaffModal(false)}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Add Staff Member</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>First Name *</Text>
            <TextInput style={styles.input} value={nsFirstName} onChangeText={setNsFirstName} placeholder="First name" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Last Name *</Text>
            <TextInput style={styles.input} value={nsLastName} onChangeText={setNsLastName} placeholder="Last name" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Email *</Text>
            <TextInput style={styles.input} value={nsEmail} onChangeText={setNsEmail} placeholder="email@company.com" placeholderTextColor="#444" keyboardType="email-address" autoCapitalize="none" />
            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput style={styles.input} value={nsPhone} onChangeText={setNsPhone} placeholder="(602) 555-0100" placeholderTextColor="#444" keyboardType="phone-pad" />
            <Text style={styles.fieldLabel}>Role *</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {['tech', 'np', 'dispatcher', 'admin'].map(role => (
                <TouchableOpacity key={role} style={[{ flex: 1, borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center' }, nsRole === role ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: 'rgba(255,255,255,0.2)' }]} onPress={() => setNsRole(role)}>
                  <Text style={[{ fontSize: 13, fontWeight: '600' }, nsRole === role ? { color: secondaryColor } : { color: '#fff' }]}>{role.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor }, creatingStaff && { opacity: 0.6 }]} onPress={createStaff} disabled={creatingStaff}>
              {creatingStaff ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Create Staff Member</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── NEW SERVICE MODAL ── */}
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
            <Text style={styles.fieldLabel}>Service Name *</Text>
            <TextInput style={styles.input} value={svcName} onChangeText={setSvcName} placeholder="e.g. Myers Cocktail" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Price *</Text>
            <TextInput style={styles.input} value={svcPrice} onChangeText={setSvcPrice} placeholder="149" placeholderTextColor="#444" keyboardType="numeric" />
            <Text style={styles.fieldLabel}>Duration</Text>
            <TextInput style={styles.input} value={svcDuration} onChangeText={setSvcDuration} placeholder="60-75 min" placeholderTextColor="#444" />
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={svcDescription} onChangeText={setSvcDescription} placeholder="Brief description..." placeholderTextColor="#444" multiline />
            <TouchableOpacity style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor }, savingService && { opacity: 0.6 }]} onPress={createService} disabled={savingService}>
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
  centered: { flex: 1, backgroundColor: '#0D1B4B', alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24 },
  companyName: { fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  scroll: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  roleBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  roleBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  addButton: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  addButtonText: { fontSize: 15, fontWeight: '700' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 8 },
})