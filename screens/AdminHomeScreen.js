import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, TextInput,
  Modal, KeyboardAvoidingView, Platform, Image
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

const API_URL = 'https://api.infusepro.app'

export default function AdminHomeScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Dashboard
  const [stats, setStats] = useState(null)

  // Staff
  const [staff, setStaff] = useState([])

  // Services
  const [services, setServices] = useState([])

  // Billing
  const [billingStatus, setBillingStatus] = useState(null)
  const [loadingBilling, setLoadingBilling] = useState(false)

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

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const onRefresh = () => { setRefreshing(true); fetchAll() }

  const pickLogo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please allow access to your photo library')
        return
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [3, 1],
        quality: 0.3,
        base64: true,
        exif: false
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
        if (data.success) {
          setBrandingLogo(`data:image/jpeg;base64,${base64}`)
          Alert.alert('Logo Updated', 'Your company logo has been saved.')
        } else {
          Alert.alert('Error', data.message || 'Could not upload logo')
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open photo library')
    } finally {
      setUploadingLogo(false)
    }
  }

  const saveBranding = async () => {
    setSavingBranding(true)
    try {
      const res = await fetch(`${API_URL}/admin/branding`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryColor: brandingPrimary, secondaryColor: brandingSecondary })
      })
      const data = await res.json()
      if (data.success) Alert.alert('Saved', 'Branding colors updated.')
      else Alert.alert('Error', data.message || 'Could not save branding')
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSavingBranding(false)
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, phone: companyPhone, email: companyEmail, address: companyAddress })
      })
      const data = await res.json()
      if (data.success) Alert.alert('Saved', 'Company settings updated.')
      else Alert.alert('Error', data.message || 'Could not save settings')
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSavingSettings(false)
    }
  }

  const createStaff = async () => {
    if (!nsFirstName || !nsLastName || !nsEmail) {
      Alert.alert('Required', 'First name, last name and email are required')
      return
    }
    setCreatingStaff(true)
    try {
      const res = await fetch(`${API_URL}/admin/staff`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: nsFirstName, lastName: nsLastName,
          email: nsEmail, phone: nsPhone, role: nsRole
        })
      })
      const data = await res.json()
      if (data.success) {
        setNewStaffModal(false)
        setNsFirstName(''); setNsLastName(''); setNsEmail(''); setNsPhone(''); setNsRole('tech')
        Alert.alert('Staff Created', `Welcome email sent to ${nsEmail}`)
        fetchAll()
      } else {
        Alert.alert('Error', data.message || 'Could not create staff')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setCreatingStaff(false)
    }
  }

  const assignStaffRegion = async (userId, regionId) => {
  try {
    const res = await fetch(`${API_URL}/admin/staff/${userId}/region`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, regionId })
    })
    const text = await res.text()
    console.log('Assign region response:', text)
    const data = JSON.parse(text)
    if (data.success) setTimeout(() => fetchAll(), 300)
    else Alert.alert('Error', data.message || 'Could not assign region')
  } catch (err) {
    Alert.alert('Error', 'Network error')
  }
}

const saveRegion = async () => {
    if (!rName) { Alert.alert('Required', 'Region name is required'); return }
    setSavingRegion(true)
    try {
      const isEdit = !!selectedRegion
      const url = isEdit ? `${API_URL}/admin/regions/${selectedRegion.id}` : `${API_URL}/admin/regions`
      const method = isEdit ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: rName, color: rColor, cities: rCities })
      })
      const data = await res.json()
      if (data.success) {
        setNewRegionModal(false)
        setEditRegionModal(false)
        setSelectedRegion(null)
        setRName(''); setRColor('#C9A84C'); setRCities('')
        fetchAll()
      } else {
        Alert.alert('Error', data.message || 'Could not save region')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSavingRegion(false)
    }
  }

  const deleteRegion = async (regionId) => {
    try {
      const res = await fetch(`${API_URL}/admin/regions/${regionId}`, {
        method: 'DELETE', headers
      })
      const data = await res.json()
      if (data.success) fetchAll()
      else Alert.alert('Error', data.message || 'Could not delete region')
    } catch (err) {
      Alert.alert('Error', 'Network error')
    }
  }

  const createService = async () => {
    if (!svcName || !svcPrice) {
      Alert.alert('Required', 'Service name and price are required')
      return
    }
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
        Alert.alert('Service Added', `${svcName} has been added.`)
        fetchAll()
      } else {
        Alert.alert('Error', data.message || 'Could not create service')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setSavingService(false)
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={primaryColor} size="large" /></View>
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={[styles.companyName, { color: primaryColor }]}>{company?.name}</Text>
            <Text style={styles.headerTitle}>Admin Console</Text>
            <Text style={styles.headerSub}>{user?.firstName} {user?.lastName} · ADMIN</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 }}>Log out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: secondaryColor, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
        <View style={{ flexDirection: 'row' }}>
          {['dashboard', 'staff', 'services', 'regions', 'branding', 'announcements', 'referrals', 'loyalty', 'billing', 'settings'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={{ paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 2, borderBottomColor: activeTab === tab ? primaryColor : 'transparent' }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{ color: activeTab === tab ? primaryColor : 'rgba(255,255,255,0.4)', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
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
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setActiveTab('branding')}>
              <Text style={styles.actionBtnText}>Update Branding</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]} onPress={() => setActiveTab('services')}>
              <Text style={styles.actionBtnText}>Manage Services</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor, marginBottom: 20 }]} onPress={() => setNewStaffModal(true)}>
            <Text style={[styles.actionBtnText, { color: secondaryColor }]}>+ Add Staff Member</Text>
          </TouchableOpacity>
          {staff.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No staff members yet</Text>
          ) : (
            staff.map(member => (
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
                <Text style={{ color: member.status_updated_at ? '#4CAF50' : 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 8 }}>
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
                        Alert.alert(
                          'Assign Region',
                          `Select region for ${member.first_name}:`,
                          [
                            { text: 'Unassigned', onPress: () => assignStaffRegion(member.id, null) },
                            ...regions.map(r => ({ text: r.name, onPress: () => assignStaffRegion(member.id, r.id) })),
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        )
                      }
                    }}
                  >
                    <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>
                      {regions.find(r => parseInt(r.id) === parseInt(member.region_id))?.name || 'Unassigned'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor, marginBottom: 20 }]} onPress={() => setNewServiceModal(true)}>
            <Text style={[styles.actionBtnText, { color: secondaryColor }]}>+ Add Service</Text>
          </TouchableOpacity>
          {services.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No services yet</Text>
          ) : (
            services.map(svc => (
              <View key={svc.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cardName}>{svc.name}</Text>
                  <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>${svc.price}</Text>
                </View>
                {svc.duration && <Text style={styles.cardSub}>{svc.duration}</Text>}
                {svc.description && <Text style={styles.cardSub}>{svc.description}</Text>}
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Branding Tab */}
      {activeTab === 'branding' && (
        <ScrollView style={styles.scroll}>
          <Text style={styles.sectionTitle}>Company Logo</Text>
          <TouchableOpacity onPress={pickLogo} disabled={uploadingLogo} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderStyle: 'dashed' }}>
            {uploadingLogo ? (
              <ActivityIndicator color={primaryColor} />
            ) : brandingLogo ? (
              <Image source={{ uri: brandingLogo }} style={{ width: '100%', height: 100, resizeMode: 'contain' }} />
            ) : (
              <>
                <Text style={{ color: primaryColor, fontSize: 32, marginBottom: 8 }}>+</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Tap to upload company logo</Text>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>Recommended: horizontal, transparent background</Text>
              </>
            )}
          </TouchableOpacity>
          {brandingLogo && (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 20 }]} onPress={pickLogo}>
              <Text style={styles.actionBtnText}>Change Logo</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Brand Colors</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Primary Color</Text>
            <TextInput
              style={[styles.input, { borderColor: brandingPrimary }]}
              value={brandingPrimary}
              onChangeText={setBrandingPrimary}
              placeholder="#C9A84C"
              placeholderTextColor="#444"
              autoCapitalize="characters"
            />
            <View style={{ height: 40, borderRadius: 8, backgroundColor: brandingPrimary, marginBottom: 16 }} />

            <Text style={styles.fieldLabel}>Secondary Color</Text>
            <TextInput
              style={[styles.input, { borderColor: brandingSecondary }]}
              value={brandingSecondary}
              onChangeText={setBrandingSecondary}
              placeholder="#0D1B4B"
              placeholderTextColor="#444"
              autoCapitalize="characters"
            />
            <View style={{ height: 40, borderRadius: 8, backgroundColor: brandingSecondary, marginBottom: 16 }} />

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: primaryColor }, savingBranding && { opacity: 0.6 }]}
              onPress={saveBranding}
              disabled={savingBranding}
            >
              {savingBranding ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.actionBtnText, { color: secondaryColor }]}>Save Colors</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

{/* Regions Tab */}
      {activeTab === 'regions' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: primaryColor, marginBottom: 20 }]} onPress={() => { setRName(''); setRColor('#C9A84C'); setRCities(''); setSelectedRegion(null); setNewRegionModal(true) }}>
            <Text style={[styles.actionBtnText, { color: secondaryColor }]}>+ Add Region</Text>
          </TouchableOpacity>
          {regions.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>No regions yet — add one to get started</Text>
          ) : (
            regions.map(region => (
              <View key={region.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: region.color }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{region.name}</Text>
                    <Text style={styles.cardSub} numberOfLines={2}>{region.cities || 'No cities assigned'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      style={{ borderWidth: 1, borderColor: primaryColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                      onPress={() => { setSelectedRegion(region); setRName(region.name); setRColor(region.color); setRCities(region.cities || ''); setEditRegionModal(true) }}
                    >
                      <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ borderWidth: 1, borderColor: '#e53e3e', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          if (window.confirm(`Delete ${region.name}?`)) deleteRegion(region.id)
                        } else {
                          Alert.alert('Delete Region', `Delete ${region.name}?`, [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteRegion(region.id) }
                          ])
                        }
                      }}
                    >
                      <Text style={{ color: '#e53e3e', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: region.color }} />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{region.color}</Text>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
{/* Billing Tab */}
      {activeTab === 'billing' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          
          {/* Current Plan */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>Current Plan</Text>
            {billingStatus?.status === 'none' || !billingStatus ? (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>No active subscription</Text>
            ) : (
              <View style={{ backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>ACTIVE</Text>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', textTransform: 'capitalize' }}>{billingStatus.tier}</Text>
                {billingStatus.currentPeriodEnd && (
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>
                    Renews {new Date(billingStatus.currentPeriodEnd).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            {/* Plan Options */}
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
                {plan.features.map((f, i) => (
                  <Text key={i} style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 3 }}>✓ {f}</Text>
                ))}
                {billingStatus?.tier !== plan.tier && (
                  <TouchableOpacity
                    style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 }}
                    onPress={async () => {
                      console.log('Subscribe button tapped for tier:', plan.tier)
                      try {
                        const res = await fetch(`${API_URL}/billing/create-checkout`, {
                          method: 'POST',
                          headers: { ...headers, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ tier: plan.tier })
                        })
                        const data = await res.json()
                        if (data.url) {
                          if (typeof window !== 'undefined') {
                            window.open(data.url, '_blank')
                          } else {
                            Alert.alert('Checkout', 'Please open this URL:\n\n' + data.url)
                          }
                        } else {
                          Alert.alert('Error', data.error || 'Could not start checkout')
                        }
                      } catch (e) {
                        Alert.alert('Error', 'Network error')
                      }
                    }}
                  >
                    <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 14 }}>
                      {billingStatus?.status === 'none' || !billingStatus ? 'Subscribe' : 'Switch to'} {plan.tier.charAt(0).toUpperCase() + plan.tier.slice(1)}
                    </Text>
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

          {/* Cancel */}
          {billingStatus?.status === 'active' && (
            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: '#f09090', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 }}
              onPress={() => Alert.alert('Cancel Subscription', 'Your subscription will remain active until the end of the billing period.', [
                { text: 'Keep Subscription', style: 'cancel' },
                { text: 'Cancel', style: 'destructive', onPress: async () => {
                  try {
                    await fetch(`${API_URL}/billing/cancel`, { method: 'POST', headers })
                    fetchAll()
                    Alert.alert('Cancelled', 'Your subscription will end at the current billing period.')
                  } catch (e) {}
                }}
              ])}
            >
              <Text style={{ color: '#f09090', fontSize: 14, fontWeight: '600' }}>Cancel Subscription</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Referral Program</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
              Patients earn a perk when someone they refer completes their first booking.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Enable Referral Program</Text>
              <TouchableOpacity
                style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: referralActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }}
                onPress={() => setReferralActive(!referralActive)}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: referralActive ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Perk Type</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {['fixed', 'percent'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'center', borderColor: referralPerkType === type ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: referralPerkType === type ? primaryColor + '20' : 'transparent' }}
                  onPress={() => setReferralPerkType(type)}
                >
                  <Text style={{ color: referralPerkType === type ? primaryColor : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                    {type === 'fixed' ? '$ Fixed Amount' : '% Percentage'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {referralPerkType === 'fixed' ? (
              <>
                <Text style={styles.fieldLabel}>Perk Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={referralPerkAmount}
                  onChangeText={setReferralPerkAmount}
                  keyboardType="decimal-pad"
                  placeholder="20"
                  placeholderTextColor="#666"
                />
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Perk Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={referralPerkPercent}
                  onChangeText={setReferralPerkPercent}
                  keyboardType="decimal-pad"
                  placeholder="10"
                  placeholderTextColor="#666"
                />
              </>
            )}

            <TouchableOpacity
              style={[{ borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: primaryColor }, savingReferral && { opacity: 0.6 }]}
              onPress={async () => {
                setSavingReferral(true)
                try {
                  await fetch(`${API_URL}/admin/referral-settings`, {
                    method: 'PUT',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      perkType: referralPerkType,
                      perkAmount: referralPerkType === 'fixed' ? parseFloat(referralPerkAmount) : null,
                      perkPercent: referralPerkType === 'percent' ? parseFloat(referralPerkPercent) : null,
                      active: referralActive
                    })
                  })
                  Alert.alert('✅ Saved', 'Referral settings updated!')
                  fetchAll()
                } catch (err) {
                  Alert.alert('Error', 'Could not save')
                } finally {
                  setSavingReferral(false)
                }
              }}
              disabled={savingReferral}
            >
              {savingReferral ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Save Referral Settings</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Loyalty Tab */}
      {activeTab === 'loyalty' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Loyalty Program</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
              Reward patients who keep coming back. Like a digital punch card.
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Enable Loyalty Program</Text>
              <TouchableOpacity
                style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: loyaltyActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }}
                onPress={() => setLoyaltyActive(!loyaltyActive)}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: loyaltyActive ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Number of IVs to earn reward</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              {['3', '5', '6', '7', '10', '12'].map(n => (
                <TouchableOpacity
                  key={n}
                  style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10, borderColor: loyaltyThreshold === n ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: loyaltyThreshold === n ? primaryColor + '20' : 'transparent' }}
                  onPress={() => setLoyaltyThreshold(n)}
                >
                  <Text style={{ color: loyaltyThreshold === n ? primaryColor : 'rgba(255,255,255,0.5)', fontWeight: '600' }}>{n}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Reward Type</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              {['fixed', 'percent', 'free'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center', borderColor: loyaltyRewardType === type ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: loyaltyRewardType === type ? primaryColor + '20' : 'transparent' }}
                  onPress={() => setLoyaltyRewardType(type)}
                >
                  <Text style={{ color: loyaltyRewardType === type ? primaryColor : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' }}>
                    {type === 'fixed' ? '$ Off' : type === 'percent' ? '% Off' : '🎁 Free'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {loyaltyRewardType === 'fixed' && (
              <>
                <Text style={styles.fieldLabel}>Reward Amount ($)</Text>
                <TextInput
                  style={styles.input}
                  value={loyaltyRewardAmount}
                  onChangeText={setLoyaltyRewardAmount}
                  keyboardType="decimal-pad"
                  placeholder="25"
                  placeholderTextColor="#666"
                />
              </>
            )}
            {loyaltyRewardType === 'percent' && (
              <>
                <Text style={styles.fieldLabel}>Reward Percentage (%)</Text>
                <TextInput
                  style={styles.input}
                  value={loyaltyRewardPercent}
                  onChangeText={setLoyaltyRewardPercent}
                  keyboardType="decimal-pad"
                  placeholder="50"
                  placeholderTextColor="#666"
                />
              </>
            )}
            {loyaltyRewardType === 'free' && (
              <View style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderRadius: 10, padding: 14, marginBottom: 10 }}>
                <Text style={{ color: '#4CAF50', fontSize: 13 }}>🎁 Patient gets their next IV completely free!</Text>
              </View>
            )}

            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
              <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Preview</Text>
              <Text style={{ color: '#fff', fontSize: 14 }}>
                Every {loyaltyThreshold} IVs → {loyaltyRewardType === 'free' ? 'FREE IV' : loyaltyRewardType === 'fixed' ? `$${loyaltyRewardAmount} off` : `${loyaltyRewardPercent}% off`}
              </Text>
            </View>

            <TouchableOpacity
              style={[{ borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: primaryColor }, savingLoyalty && { opacity: 0.6 }]}
              onPress={async () => {
                setSavingLoyalty(true)
                try {
                  await fetch(`${API_URL}/admin/loyalty`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      threshold: parseInt(loyaltyThreshold),
                      rewardType: loyaltyRewardType,
                      rewardAmount: loyaltyRewardType === 'fixed' ? parseFloat(loyaltyRewardAmount) : loyaltyRewardType === 'free' ? 0 : null,
                      rewardPercent: loyaltyRewardType === 'percent' ? parseFloat(loyaltyRewardPercent) : null,
                      active: loyaltyActive
                    })
                  })
                  Alert.alert('✅ Saved', 'Loyalty program updated!')
                  fetchAll()
                } catch (err) {
                  Alert.alert('Error', 'Could not save')
                } finally {
                  setSavingLoyalty(false)
                }
              }}
              disabled={savingLoyalty}
            >
              {savingLoyalty ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 15, fontWeight: '700' }}>Save Loyalty Program</Text>}
            </TouchableOpacity>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: primaryColor }]}
            onPress={() => {
              setEditingAnnouncement(null)
              setAnTitle(''); setAnBody(''); setAnEmoji('📢')
              setAnCtaLabel(''); setAnCtaUrl(''); setAnBgStyle('solid'); setAnBgColor(''); setAnActive(true)
              setAnnouncementModal(true)
            }}
          >
            <Text style={[styles.addButtonText, { color: secondaryColor }]}>+ New Announcement</Text>
          </TouchableOpacity>

          {announcements.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyText}>No announcements yet</Text>
              <Text style={styles.emptySub}>Create one to show patients when they log in</Text>
            </View>
          ) : (
            announcements.map(an => (
              <View key={an.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: an.active ? primaryColor : '#aaa' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>{an.emoji}</Text>
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 }}>{an.title}</Text>
                    {an.body && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>{an.body}</Text>}
                    {an.cta_label && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ color: primaryColor, fontSize: 12, fontWeight: '600' }}>🔗 {an.cta_label}</Text>
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <View style={[{ borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: an.active ? '#4CAF50' : '#aaa' }]}>
                      <Text style={{ color: an.active ? '#4CAF50' : '#aaa', fontSize: 10, fontWeight: '700' }}>
                        {an.active ? 'ACTIVE' : 'INACTIVE'}
                      </Text>
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>{an.bg_style}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: primaryColor }]}
                    onPress={() => {
                      setEditingAnnouncement(an)
                      setAnTitle(an.title)
                      setAnBody(an.body || '')
                      setAnEmoji(an.emoji || '📢')
                      setAnCtaLabel(an.cta_label || '')
                      setAnCtaUrl(an.cta_url || '')
              setAnBgStyle(an.bg_style || 'solid')
              setAnBgColor(an.bg_color || '')
              setAnActive(an.active)
                      setAnnouncementModal(true)
                    }}
                  >
                    <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '600' }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: an.active ? '#aaa' : '#4CAF50' }]}
                    onPress={async () => {
                      try {
                        await fetch(`${API_URL}/admin/announcements/${an.id}`, {
                          method: 'PUT',
                          headers: { ...headers, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ...an, active: !an.active, ctaLabel: an.cta_label, ctaUrl: an.cta_url, bgStyle: an.bg_style, bgColor: an.bg_color, sortOrder: an.sort_order })
                        })
                        fetchAll()
                      } catch (err) {
                        Alert.alert('Error', 'Could not update')
                      }
                    }}
                  >
                    <Text style={{ color: an.active ? '#aaa' : '#4CAF50', fontSize: 13, fontWeight: '600' }}>
                      {an.active ? 'Deactivate' : 'Activate'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: '#f09090' }]}
                    onPress={() => {
                      Alert.alert('Delete', 'Delete this announcement?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Delete', style: 'destructive', onPress: async () => {
                          await fetch(`${API_URL}/admin/announcements/${an.id}`, { method: 'DELETE', headers })
                          fetchAll()
                        }}
                      ])
                    }}
                  >
                    <Text style={{ color: '#f09090', fontSize: 13, fontWeight: '600' }}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Announcement Modal */}
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
            <TextInput
              style={styles.input}
              value={anTitle}
              onChangeText={setAnTitle}
              placeholder="Spring Special!"
              placeholderTextColor="#666"
            />

            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              value={anBody}
              onChangeText={setAnBody}
              placeholder="Tell your patients something exciting..."
              placeholderTextColor="#666"
              multiline
            />

            <Text style={styles.fieldLabel}>Background Style</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['solid', 'gradient', 'dark', 'light'].map(style => (
                <TouchableOpacity
                  key={style}
                  style={{ flex: 1, borderWidth: 1, borderRadius: 8, padding: 10, alignItems: 'center', borderColor: anBgStyle === style ? primaryColor : 'rgba(255,255,255,0.2)', backgroundColor: anBgStyle === style ? primaryColor + '20' : 'transparent' }}
                  onPress={() => setAnBgStyle(style)}
                >
                  <Text style={{ color: anBgStyle === style ? primaryColor : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{style}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {(anBgStyle === 'solid' || anBgStyle === 'gradient') && (
              <>
                <Text style={styles.fieldLabel}>Background Color (hex)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={anBgColor}
                    onChangeText={setAnBgColor}
                    placeholder="#1a2a5e"
                    placeholderTextColor="#666"
                    autoCapitalize="none"
                  />
                  <View style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: anBgColor || '#1a2a5e', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }} />
                </View>
              </>
            )}

            <Text style={styles.fieldLabel}>CTA Button Label (optional)</Text>
            <TextInput
              style={styles.input}
              value={anCtaLabel}
              onChangeText={setAnCtaLabel}
              placeholder="Learn More"
              placeholderTextColor="#666"
            />

            <Text style={styles.fieldLabel}>CTA Button URL (optional)</Text>
            <TextInput
              style={styles.input}
              value={anCtaUrl}
              onChangeText={setAnCtaUrl}
              placeholder="https://yoursite.com/event"
              placeholderTextColor="#666"
              autoCapitalize="none"
              keyboardType="url"
            />

{/* Live Preview */}
            <Text style={styles.fieldLabel}>Preview</Text>
            <View style={{
              backgroundColor: anBgColor || (anBgStyle === 'dark' ? '#08101f' : anBgStyle === 'light' ? 'rgba(255,255,255,0.08)' : '#0a1535'),
              borderRadius: 20,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: primaryColor + '30',
              marginBottom: 20
            }}>
              <View style={{ height: 3, backgroundColor: primaryColor }} />
              <View style={{ padding: 20 }}>
                <View style={{ backgroundColor: primaryColor + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ color: primaryColor, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{company?.name?.toUpperCase()}</Text>
                </View>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: anBody ? 8 : 0 }}>{anTitle || 'Your Title Here'}</Text>
                {anBody ? <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, lineHeight: 20, marginBottom: anCtaLabel ? 14 : 0 }}>{anBody}</Text> : null}
                {anCtaLabel ? (
                  <View style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center' }}>
                    <Text style={{ color: secondaryColor, fontSize: 13, fontWeight: '800' }}>{anCtaLabel} →</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ color: '#fff', fontSize: 15 }}>Active</Text>
              <TouchableOpacity
                style={{ width: 52, height: 30, borderRadius: 15, backgroundColor: anActive ? primaryColor : 'rgba(255,255,255,0.2)', justifyContent: 'center', paddingHorizontal: 3 }}
                onPress={() => setAnActive(!anActive)}
              >
                <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff', alignSelf: anActive ? 'flex-end' : 'flex-start' }} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor }, savingAnnouncement && { opacity: 0.6 }]}
              onPress={async () => {
                if (!anTitle.trim()) { Alert.alert('Required', 'Title is required'); return }
                setSavingAnnouncement(true)
                try {
                  const payload = {
                    title: anTitle, body: anBody, emoji: anEmoji,
                    ctaLabel: anCtaLabel, ctaUrl: anCtaUrl,
                    bgStyle: anBgStyle, bgColor: anBgColor,
                    active: anActive,
                    sortOrder: editingAnnouncement?.sort_order || 0
                  }
                  if (editingAnnouncement) {
                    await fetch(`${API_URL}/admin/announcements/${editingAnnouncement.id}`, {
                      method: 'PUT',
                      headers: { ...headers, 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    })
                  } else {
                    await fetch(`${API_URL}/admin/announcements`, {
                      method: 'POST',
                      headers: { ...headers, 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    })
                  }
                  setAnnouncementModal(false)
                  fetchAll()
                } catch (err) {
                  Alert.alert('Error', 'Could not save announcement')
                } finally {
                  setSavingAnnouncement(false)
                }
              }}
              disabled={savingAnnouncement}
            >
              {savingAnnouncement ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Save Announcement</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Settings Tab */}
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
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: primaryColor }, savingSettings && { opacity: 0.6 }]}
              onPress={saveSettings}
              disabled={savingSettings}
            >
              {savingSettings ? <ActivityIndicator color={secondaryColor} /> : <Text style={[styles.actionBtnText, { color: secondaryColor }]}>Save Settings</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: 'rgba(229,62,62,0.15)', borderWidth: 1, borderColor: 'rgba(229,62,62,0.3)' }]}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
          >
            <Text style={[styles.actionBtnText, { color: '#f09090' }]}>Log out</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Region Modal */}
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
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginBottom: 8 }}>e.g. Phoenix, Scottsdale, Tempe, Mesa, Chandler</Text>
            <TextInput
              style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
              value={rCities}
              onChangeText={setRCities}
              placeholder="Phoenix, Glendale, Surprise, Tolleson, Avondale, Buckeye, Goodyear, Tempe, Scottsdale..."
              placeholderTextColor="#444"
              multiline
            />

            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor, marginTop: 8 }, savingRegion && { opacity: 0.6 }]}
              onPress={saveRegion}
              disabled={savingRegion}
            >
              {savingRegion ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>{selectedRegion ? 'Save Changes' : 'Create Region'}</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Staff Modal */}
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
              {['tech', 'np', 'dispatcher'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[{ flex: 1, borderWidth: 1, borderRadius: 10, padding: 12, alignItems: 'center' }, nsRole === role ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: 'rgba(255,255,255,0.2)' }]}
                  onPress={() => setNsRole(role)}
                >
                  <Text style={[{ fontSize: 13, fontWeight: '600' }, nsRole === role ? { color: secondaryColor } : { color: '#fff' }]}>{role.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor }, creatingStaff && { opacity: 0.6 }]}
              onPress={createStaff}
              disabled={creatingStaff}
            >
              {creatingStaff ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: secondaryColor, fontSize: 16, fontWeight: '700' }}>Create Staff Member</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* New Service Modal */}
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
            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', backgroundColor: primaryColor }, savingService && { opacity: 0.6 }]}
              onPress={createService}
              disabled={savingService}
            >
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
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptySub: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  addButton: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  addButtonText: { fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 8 },
})