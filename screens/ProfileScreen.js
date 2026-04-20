import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { useState, useEffect, useCallback } from 'react'

const API_URL = 'https://api.infusepro.app'

export default function ProfileScreen({ route, navigation, onCompanyChange }) {
  const { token, user, company } = route.params
  const primaryColor = company?.primaryColor || '#C9A84C'
  const headers = { Authorization: `Bearer ${token}` }

  const [linkedCompanies, setLinkedCompanies] = useState([])
  const [codeInput, setCodeInput] = useState('')
  const [linking, setLinking] = useState(false)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(true)
  const [memberships, setMemberships] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [addFamilyModal, setAddFamilyModal] = useState(false)
  const [fmFirstName, setFmFirstName] = useState('')
  const [fmLastName, setFmLastName] = useState('')
  const [fmDob, setFmDob] = useState('')
  const [fmRelationship, setFmRelationship] = useState('')
  const [savingFm, setSavingFm] = useState(false)
  const [editModal, setEditModal] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
const [editFirstName, setEditFirstName] = useState(user.firstName || '')
const [editLastName, setEditLastName] = useState(user.lastName || '')
const [editPhone, setEditPhone] = useState(user.phone || '')
const [editAddress, setEditAddress] = useState(user.homeAddress || '')
const [editCity, setEditCity] = useState(user.city || '')
const [editState, setEditState] = useState(user.state || '')
const [editZip, setEditZip] = useState(user.zip || '')
const [editDob, setEditDob] = useState(user.dob ? new Date(user.dob + 'T12:00:00').toLocaleDateString() : '')
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
        setEditDob(data.user.dob ? new Date(data.user.dob + 'T12:00:00').toLocaleDateString() : '')
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
      const [companiesRes, membershipsRes, familyRes] = await Promise.all([
        fetch(`${API_URL}/auth/my-companies`, { headers }),
        fetch(`${API_URL}/auth/my-memberships`, { headers }),
        fetch(`${API_URL}/family-members`, { headers })
      ])
      const companiesData = await companiesRes.json()
      setLinkedCompanies(companiesData.companies || [])
      try {
        const membershipsData = await membershipsRes.json()
        setMemberships(membershipsData.memberships || [])
      } catch (e) {}
      try {
        const familyData = await familyRes.json()
        setFamilyMembers(familyData.members || [])
      } catch (e) {}
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
              {(() => { const d = new Date(profileInfo.dob); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) })()}
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
          linkedCompanies.map(c => {
            const membership = memberships.find(m => m.company_id === c.id)
            return (
            <View key={c.id} style={[styles.companyCard, { borderColor: c.primary_color || primaryColor }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.companyName, { color: c.primary_color || primaryColor }]}>{c.name}</Text>
                {c.phone && <Text style={styles.companyDetail}>📞 {c.phone}</Text>}
                {c.bio && <Text style={styles.companyDetail}>{c.bio}</Text>}
                {membership && (
                  <View style={{ backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 8, padding: 8, marginTop: 8, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' }}>
                    <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700', marginBottom: 2 }}>🏅 {membership.plan_name}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{membership.redemptions_this_cycle} of {membership.max_redemptions_per_cycle === 999 ? '∞' : membership.max_redemptions_per_cycle} visits used · Renews {new Date(membership.current_cycle_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => unlinkCompany(c.id, c.name)}>
                <Text style={styles.unlinkText}>Unlink</Text>
              </TouchableOpacity>
            </View>
            )
          })
        )}
        {/* Memberships with unlinked companies */}
        {memberships.filter(m => !linkedCompanies.find(c => c.id === m.company_id)).map(m => (
          <View key={m.id} style={{ backgroundColor: '#FFF8F0', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(196,135,106,0.3)' }}>
            <Text style={{ color: '#C4876A', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>🏅 ACTIVE MEMBERSHIP</Text>
            <Text style={{ color: '#1A2E2E', fontSize: 15, fontWeight: '700' }}>{m.plan_name} — {m.company_name}</Text>
            <Text style={{ color: '#9BB5B4', fontSize: 12, marginTop: 4 }}>{m.redemptions_this_cycle} of {m.max_redemptions_per_cycle === 999 ? '∞' : m.max_redemptions_per_cycle} visits used · Renews {new Date(m.current_cycle_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
            <Text style={{ color: '#FF9800', fontSize: 12, marginTop: 6 }}>⚠️ You are no longer linked to {m.company_name} but still have an active subscription</Text>
          </View>
        ))}

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

      {/* Family Members Section */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>👨‍👩‍👦 Family Members</Text>
          <TouchableOpacity onPress={() => { setFmFirstName(''); setFmLastName(''); setFmDob(''); setFmRelationship(''); setAddFamilyModal(true) }}>
            <Text style={{ color: primaryColor, fontSize: 13, fontWeight: '700' }}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {familyMembers.length === 0 ? (
          <Text style={{ color: '#9BB5B4', fontSize: 13 }}>No family members added yet</Text>
        ) : familyMembers.map(fm => {
          const age = Math.floor((new Date() - new Date(fm.dob)) / (365.25 * 24 * 60 * 60 * 1000))
          const isMinor = age < 18
          return (
            <View key={fm.id} style={{ backgroundColor: '#F7FBFB', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(10,186,181,0.1)', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ color: '#1A2E2E', fontWeight: '700', fontSize: 15 }}>{fm.first_name} {fm.last_name}</Text>
                <Text style={{ color: '#9BB5B4', fontSize: 12, marginTop: 2 }}>{fm.relationship} · Age {age}{isMinor ? ' · Minor' : ''}</Text>
              </View>
              <TouchableOpacity onPress={async () => { try { await fetch(`${API_URL}/family-members/${fm.id}`, { method: 'DELETE', headers }); fetchLinkedCompanies() } catch(e) {} }}>
                <Text style={{ color: '#f09090', fontSize: 12 }}>Remove</Text>
              </TouchableOpacity>
            </View>
          )
        })}
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
              <View style={{ backgroundColor: '#F7FBFB', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(10,186,181,0.12)' }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>LOYALTY PROGRESS</Text>
                <Text style={{ color: '#1A2E2E', fontSize: 15, fontWeight: '600', marginBottom: 6 }}>
                  {perks.loyaltyProgress.punch_count} of {perks.loyaltyProgress.threshold} IVs completed
                </Text>
                {/* Progress bar */}
                <View style={{ height: 8, backgroundColor: 'rgba(10,186,181,0.1)', borderRadius: 4, marginBottom: 8 }}>
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
              <View key={perk.id} style={{ backgroundColor: '#F7FBFB', borderWidth: 1.5, borderColor: '#0ABAB5', borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6, color: '#0ABAB5' }}>⭐ REFERRAL PERK</Text>
                <Text style={{ color: '#1A2E2E', fontSize: 18, fontWeight: '700' }}>
                  {perk.perk_type === 'fixed' ? `$${perk.perk_amount} off` : `${perk.perk_amount}% off`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 4 }}>Show this to your tech to redeem</Text>
              </View>
            ))}

            {perks.referralPerks.length === 0 && perks.loyaltyRewards.length === 0 && !perks.loyaltyProgress && (
              <Text style={{ color: '#9BB5B4', fontSize: 13, textAlign: 'center', paddingVertical: 12 }}>No active perks yet</Text>
            )}

            {/* Referral Code */}
            {referralCode && (
              <View style={{ backgroundColor: '#F7FBFB', borderRadius: 12, padding: 16, marginTop: 8, borderWidth: 1, borderColor: 'rgba(10,186,181,0.12)' }}>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>YOUR REFERRAL CODE</Text>
                <Text style={{ color: '#1A2E2E', fontSize: 32, fontWeight: '800', letterSpacing: 6, marginBottom: 8 }}>{referralCode}</Text>
                <Text style={{ color: '#9BB5B4', fontSize: 12, marginBottom: 12 }}>Share this code with friends. When they complete their first booking you earn a perk!</Text>
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
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>📤 Share My Code</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 12, width: '100%', padding: 14, alignItems: 'center' }}
        onPress={() => { setDeletePassword(''); setDeleteError(''); setDeleteModal(true) }}
      >
        <Text style={{ color: 'rgba(0,0,0,0.4)', fontSize: 13, fontWeight: '500', textDecorationLine: 'underline' }}>Delete account</Text>
      </TouchableOpacity>

      <Modal visible={deleteModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFFFF' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(10,186,181,0.1)' }}>
            <TouchableOpacity onPress={() => { if (!deleting) setDeleteModal(false) }}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#1A2E2E', fontSize: 18, fontWeight: '700' }}>Delete account</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={{ padding: 24 }}>
            <View style={{ backgroundColor: 'rgba(220,80,80,0.08)', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(220,80,80,0.2)' }}>
              <Text style={{ color: '#c53030', fontSize: 14, fontWeight: '700', marginBottom: 8 }}>This action is permanent</Text>
              <Text style={{ color: '#1A2E2E', fontSize: 13, lineHeight: 19 }}>
                Deleting your account will:{'\n\n'}• Remove your name, email, phone, and address from Infuse Pro{'\n'}• Disable your login permanently{'\n'}• Unlink you from any company you were connected to{'\n\n'}For HIPAA compliance, your medical records (intake forms, treatment history, charts) are retained by your provider for the legally required period.{'\n\n'}You will not be able to recover this account or use this email address again.
              </Text>
            </View>

            <Text style={{ color: '#1A2E2E', fontSize: 13, fontWeight: '600', marginBottom: 8 }}>Confirm your password to proceed</Text>
            <TextInput
              style={{ width: '100%', backgroundColor: '#F7FBFB', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: deleteError ? '#e53e3e' : 'rgba(10,186,181,0.2)', marginBottom: 8, color: '#1A2E2E' }}
              value={deletePassword}
              onChangeText={(t) => { setDeletePassword(t); setDeleteError('') }}
              placeholder="Password"
              placeholderTextColor="rgba(0,0,0,0.3)"
              secureTextEntry
              autoCapitalize="none"
            />
            {deleteError ? <Text style={{ color: '#e53e3e', fontSize: 13, marginBottom: 8 }}>{deleteError}</Text> : null}

            <TouchableOpacity
              style={{ marginTop: 16, backgroundColor: '#c53030', borderRadius: 12, padding: 16, alignItems: 'center', opacity: (deleting || !deletePassword) ? 0.5 : 1 }}
              disabled={deleting || !deletePassword}
              onPress={async () => {
                setDeleting(true)
                setDeleteError('')
                try {
                  const res = await fetch(`${API_URL}/account`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: deletePassword })
                  })
                  const data = await res.json()
                  if (data.success) {
                    setDeleteModal(false)
                    if (Platform.OS === 'web') window.alert('Your account has been deleted.')
                    else Alert.alert('Account deleted', 'Your account has been deleted.')
                    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })
                  } else {
                    setDeleteError(data.error || 'Could not delete account')
                  }
                } catch (e) {
                  setDeleteError('Network error')
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Permanently delete my account</Text>}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={editModal} animationType="slide" presentationStyle="fullScreen">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFFFF' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(10,186,181,0.1)' }}>
            <TouchableOpacity onPress={() => setEditModal(false)}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#1A2E2E', fontSize: 18, fontWeight: '700' }}>Edit Profile</Text>
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
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#FFFFFF' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{ paddingTop: 56, paddingBottom: 20, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(10,186,181,0.1)' }}>
            <TouchableOpacity onPress={() => { setChangePasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}>
              <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ color: '#1A2E2E', fontSize: 18, fontWeight: '700' }}>Change Password</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24 }}>
            <Text style={{ color: '#9BB5B4', fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
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

      {/* Add Family Member Modal */}
      <Modal visible={addFamilyModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(10,186,181,0.1)' }}>
              <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>FAMILY MEMBER</Text>
              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>Add Family Member</Text>
            </View>
            <View style={{ padding: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>FIRST NAME</Text>
              <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} value={fmFirstName} onChangeText={setFmFirstName} placeholder="First name" placeholderTextColor="#666" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>LAST NAME</Text>
              <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} value={fmLastName} onChangeText={setFmLastName} placeholder="Last name" placeholderTextColor="#666" />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>DATE OF BIRTH</Text>
              <TextInput
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                value={fmDob}
                onChangeText={(text) => {
                  const cleaned = text.replace(/\D/g, '')
                  let formatted = cleaned
                  if (cleaned.length >= 3 && cleaned.length <= 4) formatted = cleaned.slice(0,2) + '/' + cleaned.slice(2)
                  else if (cleaned.length > 4) formatted = cleaned.slice(0,2) + '/' + cleaned.slice(2,4) + '/' + cleaned.slice(4,8)
                  setFmDob(formatted)
                }}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#666"
                keyboardType="numeric"
                maxLength={10}
              />
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', marginBottom: 6 }}>RELATIONSHIP</Text>
              <TextInput style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 12, color: '#fff', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }} value={fmRelationship} onChangeText={setFmRelationship} placeholder="e.g. Son, Daughter, Spouse" placeholderTextColor="#666" />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setAddFamilyModal(false)}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 2, backgroundColor: primaryColor, borderRadius: 12, padding: 14, alignItems: 'center', opacity: savingFm ? 0.6 : 1 }}
                  disabled={savingFm}
                  onPress={async () => {
                    if (!fmFirstName || !fmLastName || !fmDob) return Alert.alert('Required', 'Please fill in name and date of birth')
                    setSavingFm(true)
                    try {
                      const dobParts = fmDob.split('/')
                      const dobFormatted = dobParts.length === 3 ? `${dobParts[2]}-${dobParts[0].padStart(2,'0')}-${dobParts[1].padStart(2,'0')}` : fmDob
                      const res = await fetch(`${API_URL}/family-members`, {
                        method: 'POST',
                        headers: { ...headers, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ firstName: fmFirstName, lastName: fmLastName, dob: dobFormatted, relationship: fmRelationship })
                      })
                      const data = await res.json()
                      if (data.success) { setAddFamilyModal(false); fetchLinkedCompanies() }
                      else Alert.alert('Error', data.error || 'Could not add family member')
                    } catch (e) { Alert.alert('Error', 'Network error') } finally { setSavingFm(false) }
                  }}
                >
                  {savingFm ? <ActivityIndicator color="#0D1B4B" /> : <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 15 }}>Add Family Member</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const editStyles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: '700', color: '#0ABAB5', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  input: { backgroundColor: '#F7FBFB', borderWidth: 1, borderColor: 'rgba(10,186,181,0.2)', borderRadius: 12, padding: 16, fontSize: 16, color: '#1A2E2E', marginBottom: 20 },
})

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 48, alignItems: 'center', backgroundColor: '#FFFFFF' },
  avatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, backgroundColor: '#F7FBFB', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontSize: 24, fontWeight: '600' },
  name: { fontSize: 22, fontWeight: '600', color: '#1A2E2E', marginBottom: 4 },
  email: { fontSize: 13, color: '#9BB5B4', marginBottom: 20, fontWeight: '300' },
  section: { width: '100%', marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#0ABAB5', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(10,186,181,0.1)' },
  rowLabel: { fontSize: 14, color: '#1A2E2E', fontWeight: '400' },
  rowArrow: { fontSize: 20, color: '#9BB5B4' },
  companyCard: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FBFB' },
  companyName: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  companyDetail: { fontSize: 12, color: '#9BB5B4', marginBottom: 2 },
  unlinkText: { color: '#f09090', fontSize: 13, fontWeight: '600' },
  noCompanies: { color: '#9BB5B4', fontSize: 13, marginVertical: 12, textAlign: 'center' },
  addCompanyBtn: { borderWidth: 1, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8, borderStyle: 'dashed' },
  addCompanyText: { fontSize: 14, fontWeight: '600' },
  codeInputContainer: { marginTop: 8 },
  codeInput: { borderWidth: 1, borderRadius: 10, padding: 14, color: '#1A2E2E', fontSize: 16, marginBottom: 10, letterSpacing: 2 },
  linkBtn: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 8 },
  linkBtnText: { fontSize: 15, fontWeight: '700' },
  cancelLink: { color: '#9BB5B4', fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  logoutButton: { marginTop: 16, width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(220,80,80,0.3)', alignItems: 'center', backgroundColor: 'rgba(220,80,80,0.08)' },
  logoutText: { color: '#f09090', fontSize: 15, fontWeight: '500' },
  infoCard: { width: '100%', backgroundColor: '#F7FBFB', borderWidth: 1, borderColor: 'rgba(10,186,181,0.12)', borderRadius: 12, padding: 16 },
  infoCardLabel: { fontSize: 10, fontWeight: '700', color: '#0ABAB5', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  infoCardValue: { fontSize: 15, color: '#1A2E2E', fontWeight: '500' },
  infoCardSub: { fontSize: 13, color: '#9BB5B4', marginTop: 3 },
})