import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { useState, useEffect, useCallback } from 'react'

const API_URL = 'https://api.infusepro.app'

export default function ProfileScreen({ route, navigation, onCompanyChange }) {
  const { token, user, company } = route.params
  const primaryColor = company?.primaryColor || '#5BBFB5'
  const headers = { Authorization: `Bearer ${token}` }

  const [linkedCompanies, setLinkedCompanies] = useState([])
  const [codeInput, setCodeInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [editModal, setEditModal] = useState(false)
const [editFirstName, setEditFirstName] = useState(user.firstName || '')
const [editLastName, setEditLastName] = useState(user.lastName || '')
const [editPhone, setEditPhone] = useState(user.phone || '')
const [editAddress, setEditAddress] = useState(user.homeAddress || '')
const [editCity, setEditCity] = useState(user.city || '')
const [editState, setEditState] = useState(user.state || '')
const [editZip, setEditZip] = useState(user.zip || '')
const [editDob, setEditDob] = useState(user.dob ? new Date(user.dob).toLocaleDateString() : '')
const [savingProfile, setSavingProfile] = useState(false)
const [changePasswordModal, setChangePasswordModal] = useState(false)
const [currentPassword, setCurrentPassword] = useState('')
const [newPassword, setNewPassword] = useState('')
const [confirmPassword, setConfirmPassword] = useState('')
const [changingPassword, setChangingPassword] = useState(false)

const [profileInfo, setProfileInfo] = useState(null)
const [perks, setPerks] = useState({ referralPerks: [], loyaltyRewards: [], loyaltyProgress: null })
  const [referralCode, setReferralCode] = useState(null)
  const [loadingPerks, setLoadingPerks] = useState(true)

  const fetchPerks = useCallback(async () => {
    try {
      const [perksRes, codeRes] = await Promise.all([
        fetch(`${API_URL}/perks/my-perks`, { headers }),
        fetch(`${API_URL}/referrals/my-code`, { headers })
      ])
      const [perksData, codeData] = await Promise.all([perksRes.json(), codeRes.json()])
      if (perksData.success) setPerks(perksData)
      if (codeData.success) setReferralCode(codeData.code)
    } catch (err) {
      console.error('Fetch perks error:', err)
    } finally {
      setLoadingPerks(false)
    }
  }, [token])

  useEffect(() => {
    fetchPerks()
  }, [fetchPerks])

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, { headers })
      const data = await res.json()
      if (data.success) {
        setProfileInfo(data.user)
        setEditFirstName(data.user.firstName || '')
        setEditLastName(data.user.lastName || '')
        setEditPhone(data.user.phone || '')
        setEditAddress(data.user.homeAddress || '')
        setEditCity(data.user.city || '')
        setEditState(data.user.state || '')
        setEditZip(data.user.zip || '')
        setEditDob(data.user.dob ? new Date(data.user.dob).toLocaleDateString() : '')
      }
    } catch (err) {
      console.error('Fetch profile error:', err)
    }
  }, [token])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const fetchLinkedCompanies = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/auth/my-companies`, { headers })
      const data = await res.json()
      setLinkedCompanies(data.companies || [])
    } catch (err) {
      console.error('Fetch companies error:', err)
    } finally {
      setLoadingCompanies(false)
    }
  }, [token])

  useEffect(() => {
    fetchLinkedCompanies()
  }, [fetchLinkedCompanies])

const changePassword = async () => {
  if (!currentPassword || !newPassword || !confirmPassword) {
    Alert.alert('Required', 'Please fill in all fields')
    return
  }
  if (newPassword !== confirmPassword) {
    Alert.alert('Error', 'New passwords do not match')
    return
  }
  if (newPassword.length < 8) {
    Alert.alert('Error', 'New password must be at least 8 characters')
    return
  }
  setChangingPassword(true)
  try {
    const res = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    })
    const data = await res.json()
    if (data.success) {
      Alert.alert('✅ Password Changed', 'Your password has been updated.')
      setChangePasswordModal(false)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } else {
      Alert.alert('Error', data.message || 'Could not change password')
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setChangingPassword(false)
  }
}

const saveProfile = async () => {
  setSavingProfile(true)
  try {
    const res = await fetch(`${API_URL}/auth/update-profile`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        homeAddress: editAddress,
        city: editCity,
        state: editState,
        zip: editZip,
        dob: editDob
      })
    })
    const data = await res.json()
    if (data.success) {
      Alert.alert('✅ Profile Updated', 'Your profile has been saved.')
      setEditModal(false)
      fetchProfile()
    } else {
      Alert.alert('Error', data.message || 'Could not update profile')
    }
  } catch (err) {
    Alert.alert('Error', 'Network error')
  } finally {
    setSavingProfile(false)
  }
}

  const linkCompany = async () => {
    if (!codeInput.trim()) return Alert.alert('Enter a company code')
    setLinking(true)
    try {
      const res = await fetch(`${API_URL}/auth/link-company`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyCode: codeInput.trim().toUpperCase() })
      })
      const data = await res.json()
      if (data.success) {
        setCodeInput('')
        setShowCodeInput(false)
        fetchLinkedCompanies()
        if (onCompanyChange) onCompanyChange()
        Alert.alert('Linked!', `You are now linked to ${data.company.name}`)
      } else {
        Alert.alert('Error', data.message || 'Invalid company code')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error')
    } finally {
      setLinking(false)
    }
  }

  const unlinkCompany = (companyId, companyName) => {
    Alert.alert(
      'Unlink Company',
      `Unlink from ${companyName}? Your booking history will be retained.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unlink', style: 'destructive', onPress: async () => {
            try {
              const res = await fetch(`${API_URL}/auth/unlink-company`, {
                method: 'PUT',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId })
              })
              const data = await res.json()
              if (data.success) {
                fetchLinkedCompanies()
                if (onCompanyChange) onCompanyChange()
              } else {
                Alert.alert('Error', data.message || 'Could not unlink')
              }
            } catch (err) {
              Alert.alert('Error', 'Network error')
            }
          }
        }
      ]
    )
  }

  const logout = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.avatar, { borderColor: primaryColor }]}>
        <Text style={[styles.avatarText, { color: primaryColor }]}>
          {user.firstName?.[0]}{user.lastName?.[0]}
        </Text>
      </View>
      <Text style={styles.name}>{profileInfo?.firstName || user.firstName} {profileInfo?.lastName || user.lastName}</Text>
      <Text style={styles.email}>{user.email}</Text>

      {/* Info Cards */}
      <View style={{ width: '100%', marginTop: 20, marginBottom: 8, gap: 10 }}>
        {profileInfo?.phone && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>PHONE</Text>
            <Text style={styles.infoCardValue}>{profileInfo.phone}</Text>
          </View>
        )}
        {profileInfo?.homeAddress && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>ADDRESS</Text>
            <Text style={styles.infoCardValue}>{profileInfo.homeAddress}</Text>
            {(profileInfo.city || profileInfo.state || profileInfo.zip) && (
              <Text style={styles.infoCardSub}>
                {[profileInfo.city, profileInfo.state, profileInfo.zip].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
        )}
        {profileInfo?.dob && (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardLabel}>DATE OF BIRTH</Text>
            <Text style={styles.infoCardValue}>
              {new Date(profileInfo.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>
        )}
        {!profileInfo?.phone && !profileInfo?.homeAddress && !profileInfo?.dob && (
          <TouchableOpacity style={[styles.infoCard, { alignItems: 'center', borderStyle: 'dashed' }]} onPress={() => setEditModal(true)}>
            <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>+ Complete your profile</Text>
            <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>Add phone, address and date of birth</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => setEditModal(true)}>
          <Text style={styles.rowLabel}>Edit profile</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => setChangePasswordModal(true)}>
          <Text style={styles.rowLabel}>Change password</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Companies</Text>
        {loadingCompanies ? (
          <ActivityIndicator color={primaryColor} style={{ marginVertical: 12 }} />
        ) : linkedCompanies.length === 0 ? (
          <Text style={styles.noCompanies}>No linked companies yet</Text>
        ) : (
          linkedCompanies.map(c => (
            <View key={c.id} style={[styles.companyCard, { borderColor: c.primary_color || primaryColor }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.companyName, { color: c.primary_color || primaryColor }]}>{c.name}</Text>
                {c.phone && <Text style={styles.companyDetail}>📞 {c.phone}</Text>}
                {c.bio && <Text style={styles.companyDetail}>{c.bio}</Text>}
              </View>
              <TouchableOpacity onPress={() => unlinkCompany(c.id, c.name)}>
                <Text style={styles.unlinkText}>Unlink</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        {showCodeInput && linkedCompanies.length === 0 ? (
          <View style={styles.codeInputContainer}>
            <TextInput
              style={[styles.codeInput, { borderColor: primaryColor }]}
              placeholder="Enter company code (e.g. MIVD)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={codeInput}
              onChangeText={setCodeInput}
              autoCapitalize="characters"
              maxLength={10}
            />
            <TouchableOpacity
              style={[styles.linkBtn, { backgroundColor: primaryColor }]}
              onPress={linkCompany}
              disabled={linking}
            >
              {linking ? <ActivityIndicator color="#0D1B4B" /> : <Text style={[styles.linkBtnText, { color: '#0D1B4B' }]}>Link Company</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowCodeInput(false); setCodeInput('') }}>
              <Text style={styles.cancelLink}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : linkedCompanies.length === 0 && (
          <TouchableOpacity style={[styles.addCompanyBtn, { borderColor: primaryColor }]} onPress={() => setShowCodeInput(true)}>
            <Text style={[styles.addCompanyText, { color: primaryColor }]}>+ Link a Company</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Perks & Rewards Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎁 Perks & Rewards</Text>

        {loadingPerks ? (
          <ActivityIndicator color={primaryColor} style={{ marginVertical: 12 }} />
        ) : (
          <>
            {/* Loyalty Progress */}
            {perks.loyaltyProgress && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>LOYALTY PROGRESS</Text>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 6 }}>
                  {perks.loyaltyProgress.punch_count} of {perks.loyaltyProgress.threshold} IVs completed
                </Text>
                {/* Progress bar */}
                <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginBottom: 8 }}>
                  <View style={{
                    height: 8,
                    backgroundColor: primaryColor,
                    borderRadius: 4,
                    width: `${Math.min((perks.loyaltyProgress.punch_count / perks.loyaltyProgress.threshold) * 100, 100)}%`
                  }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
                  {Math.max(perks.loyaltyProgress.threshold - perks.loyaltyProgress.punch_count, 0)} more until{' '}
                  {perks.loyaltyProgress.reward_type === 'free' ? 'a FREE IV' :
                   perks.loyaltyProgress.reward_type === 'fixed' ? `$${perks.loyaltyProgress.reward_amount} off` :
                   `${perks.loyaltyProgress.reward_percent}% off`}
                </Text>
              </View>
            )}

            {/* Active Loyalty Rewards */}
            {perks.loyaltyRewards.map(reward => (
              <View key={reward.id} style={{ backgroundColor: 'rgba(76,175,80,0.1)', borderWidth: 1, borderColor: '#4CAF50', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <Text style={{ color: '#4CAF50', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>🏆 LOYALTY REWARD</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                  {reward.reward_type === 'free' ? '🎁 FREE IV' :
                   reward.reward_type === 'fixed' ? `$${reward.reward_amount} off` :
                   `${reward.reward_percent}% off`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Show this to your tech to redeem</Text>
              </View>
            ))}

            {/* Active Referral Perks */}
            {perks.referralPerks.map(perk => (
              <View key={perk.id} style={{ backgroundColor: 'rgba(201,168,76,0.1)', borderWidth: 1, borderColor: primaryColor, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>⭐ REFERRAL PERK</Text>
                <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>
                  {perk.perk_type === 'fixed' ? `$${perk.perk_amount} off` : `${perk.perk_amount}% off`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Show this to your tech to redeem</Text>
              </View>
            ))}

            {perks.referralPerks.length === 0 && perks.loyaltyRewards.length === 0 && !perks.loyaltyProgress && (
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>No active perks yet</Text>
            )}

            {/* Referral Code */}
            {referralCode && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 16, marginTop: 8 }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>YOUR REFERRAL CODE</Text>
                <Text style={{ color: '#fff', fontSize: 32, fontWeight: '800', letterSpacing: 6, marginBottom: 8 }}>{referralCode}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 12 }}>Share this code with friends. When they complete their first booking you earn a perk!</Text>
                <TouchableOpacity
                  style={{ backgroundColor: primaryColor, borderRadius: 10, padding: 12, alignItems: 'center' }}
                  onPress={() => {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      navigator.share({ title: 'Try Infuse Pro!', text: `Use my referral code ${referralCode} when you book your first IV therapy session!` })
                    } else {
                      Alert.alert('Your Referral Code', `Share this code with friends: ${referralCode}`)
                    }
                  }}
                >
                  <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 14 }}>📤 Share My Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
      <Modal visible={editModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Edit Profile</Text>
            <TouchableOpacity onPress={saveProfile} disabled={savingProfile}>
              {savingProfile ? <ActivityIndicator color={primaryColor} size="small" /> : <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '700' }}>Save</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
            {/* Avatar */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={[styles.avatar, { borderColor: primaryColor, width: 88, height: 88, borderRadius: 44 }]}>
                <Text style={[styles.avatarText, { color: primaryColor, fontSize: 30 }]}>
                  {editFirstName?.[0]}{editLastName?.[0]}
                </Text>
              </View>
            </View>

            {/* First + Last Name */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
              <View style={{ flex: 1 }}>
                <Text style={editStyles.label}>First Name</Text>
                <TextInput style={editStyles.input} placeholder="First name" placeholderTextColor="#444" value={editFirstName} onChangeText={setEditFirstName} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={editStyles.label}>Last Name</Text>
                <TextInput style={editStyles.input} placeholder="Last name" placeholderTextColor="#444" value={editLastName} onChangeText={setEditLastName} />
              </View>
            </View>

            <Text style={editStyles.label}>Phone Number</Text>
            <TextInput style={editStyles.input} placeholder="(602) 555-0100" placeholderTextColor="#444" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />

            <Text style={editStyles.label}>Street Address</Text>
            <TextInput style={editStyles.input} placeholder="123 Main St" placeholderTextColor="#444" value={editAddress} onChangeText={setEditAddress} />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Text style={editStyles.label}>City</Text>
                <TextInput style={editStyles.input} placeholder="Phoenix" placeholderTextColor="#444" value={editCity} onChangeText={setEditCity} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={editStyles.label}>State</Text>
                <TextInput style={editStyles.input} placeholder="AZ" placeholderTextColor="#444" value={editState} onChangeText={setEditState} autoCapitalize="characters" maxLength={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={editStyles.label}>ZIP</Text>
                <TextInput style={editStyles.input} placeholder="85001" placeholderTextColor="#444" value={editZip} onChangeText={setEditZip} keyboardType="numeric" maxLength={5} />
              </View>
            </View>

            <Text style={editStyles.label}>Date of Birth</Text>
            <TextInput 
              style={editStyles.input} 
              placeholder="MM/DD/YYYY" 
              placeholderTextColor="#444" 
              value={editDob} 
              onChangeText={(text) => {
                const cleaned = text.replace(/\D/g, '')
                let formatted = cleaned
                if (cleaned.length >= 3 && cleaned.length <= 4) {
                  formatted = `${cleaned.slice(0,2)}/${cleaned.slice(2)}`
                } else if (cleaned.length >= 5) {
                  formatted = `${cleaned.slice(0,2)}/${cleaned.slice(2,4)}/${cleaned.slice(4,8)}`
                }
                setEditDob(formatted)
              }}
              keyboardType="numeric"
              maxLength={10}
            />

            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 16, backgroundColor: primaryColor }, savingProfile && { opacity: 0.6 }]}
              onPress={saveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? <ActivityIndicator color="#0D1B4B" /> : <Text style={{ color: '#0D1B4B', fontSize: 16, fontWeight: '700' }}>Save Changes</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      <Modal visible={changePasswordModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0D1B4B' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity onPress={() => { setChangePasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Change Password</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
              For your security, please enter your current password before setting a new one.
            </Text>

            <Text style={editStyles.label}>Current Password</Text>
            <TextInput
              style={editStyles.input}
              placeholder="Enter current password"
              placeholderTextColor="#444"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
            />

            <Text style={editStyles.label}>New Password</Text>
            <TextInput
              style={editStyles.input}
              placeholder="At least 8 characters"
              placeholderTextColor="#444"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
            />

            <Text style={editStyles.label}>Confirm New Password</Text>
            <TextInput
              style={editStyles.input}
              placeholder="Re-enter new password"
              placeholderTextColor="#444"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />

            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={{ color: '#f09090', fontSize: 13, marginBottom: 12 }}>⚠️ Passwords do not match</Text>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <Text style={{ color: '#4CAF50', fontSize: 13, marginBottom: 12 }}>✅ Passwords match</Text>
            )}

            <TouchableOpacity
              style={[{ borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8, backgroundColor: primaryColor }, changingPassword && { opacity: 0.6 }]}
              onPress={changePassword}
              disabled={changingPassword}
            >
              {changingPassword ? <ActivityIndicator color="#0D1B4B" /> : <Text style={{ color: '#0D1B4B', fontSize: 16, fontWeight: '700' }}>Update Password</Text>}
            </TouchableOpacity>
            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  )
}

const editStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff', marginBottom: 20 },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 48, alignItems: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontSize: 24, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '600', color: '#fff', marginBottom: 4 },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20, fontWeight: '300' },
  section: { width: '100%', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.6)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowLabel: { fontSize: 14, color: '#fff', fontWeight: '400' },
  rowArrow: { fontSize: 20, color: 'rgba(255,255,255,0.25)' },
  companyCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  companyName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  companyDetail: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  unlinkText: { color: '#f09090', fontSize: 13, fontWeight: '600' },
  noCompanies: { color: 'rgba(255,255,255,0.35)', fontSize: 13, marginVertical: 12, textAlign: 'center' },
  addCompanyBtn: { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8, borderStyle: 'dashed' },
  addCompanyText: { fontSize: 14, fontWeight: '600' },
  codeInputContainer: { marginTop: 8 },
  codeInput: { borderWidth: 1, borderRadius: 10, padding: 14, color: '#fff', fontSize: 16, marginBottom: 10, letterSpacing: 2 },
  linkBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  linkBtnText: { fontSize: 15, fontWeight: '700' },
  cancelLink: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  logoutButton: { marginTop: 16, width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', backgroundColor: 'rgba(220,80,80,0.08)' },
  logoutText: { color: '#f09090', fontSize: 15, fontWeight: '500' },
  infoCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 },
  infoCardLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(201,168,76,0.6)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  infoCardValue: { fontSize: 15, color: '#fff', fontWeight: '500' },
  infoCardSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 3 },
})