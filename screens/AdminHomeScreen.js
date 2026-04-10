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
      const [statsRes, staffRes, svcRes, regRes] = await Promise.all([
        fetch(`${API_URL}/dispatch/stats`, { headers }),
        fetch(`${API_URL}/admin/staff`, { headers }),
        fetch(`${API_URL}/admin/services`, { headers }),
        fetch(`${API_URL}/admin/regions`, { headers })
      ])
      const [statsData, staffData, svcData, regData] = await Promise.all([
        statsRes.json(), staffRes.json(), svcRes.json(), regRes.json()
      ])
      if (statsData.stats) setStats(statsData.stats)
      if (staffData.staff) {
        console.log('Staff data:', JSON.stringify(staffData.staff.map(s => ({ id: s.id, name: s.first_name, region_id: s.region_id }))))
        setStaff(staffData.staff)
      }
      if (svcData.services) setServices(svcData.services)
      if (regData.regions) setRegions(regData.regions)
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
  console.log('assignStaffRegion called:', userId, regionId)
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
          {['dashboard', 'staff', 'services', 'regions', 'branding', 'settings'].map(tab => (
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
  actionBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  actionBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 8 },
})