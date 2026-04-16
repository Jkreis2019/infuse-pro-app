import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Platform, KeyboardAvoidingView
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function DispatcherMessagingScreen({ route, navigation }) {
    console.log('DispatcherMessagingScreen loaded')
  const { token, user, company, soloMode } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [activeTab, setActiveTab] = useState(soloMode === true ? 'patients' : 'team')
  const [regions, setRegions] = useState([])
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [regionMessages, setRegionMessages] = useState([])
  const [contacts, setContacts] = useState([])
  const [patientChats, setPatientChats] = useState([])
  const [selectedContact, setSelectedContact] = useState(null)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [showChat, setShowChat] = useState(false)
  const flatListRef = useRef(null)

  // Decode userId from token
  const [userId, setUserId] = useState(null)
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.userId)
      } catch (e) {}
    }
  }, [token])

  const fetchRegions = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/regions`, { headers })
      const data = await res.json()
      if (data.success) setRegions(data.regions)
    } catch (err) {
      console.error('Fetch regions error:', err)
    }
  }, [token])

  const fetchRegionMessages = useCallback(async (regionId, showLoader = false) => {
    if (showLoader) setMessagesLoading(true)
    try {
      const res = await fetch(`${API_URL}/chat/region/${regionId}/messages`, { headers })
      const data = await res.json()
      if (data.success) setRegionMessages(data.messages)
    } catch (err) {
      console.error('Fetch region messages error:', err)
    } finally {
      if (showLoader) setMessagesLoading(false)
    }
  }, [token])

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/contacts`, { headers })
      const data = await res.json()
      if (data.success) setContacts(data.contacts)
    } catch (err) {
      console.error('Fetch contacts error:', err)
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchPatientChats = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dispatch/patient-chats`, { headers })
      const data = await res.json()
      if (data.success) setPatientChats(data.chats)
    } catch (err) {
      console.error('Fetch patient chats error:', err)
    }
  }, [token])

  useEffect(() => {
    fetchContacts()
    fetchPatientChats()
    fetchRegions()
    const interval = setInterval(() => {
      fetchContacts()
      fetchPatientChats()
      fetchRegions()
      if (selectedRegion) fetchRegionMessages(selectedRegion.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [fetchContacts, fetchPatientChats])

  const fetchDMMessages = useCallback(async (contactId, showLoader = false) => {
    if (showLoader) setMessagesLoading(true)
    try {
      const res = await fetch(`${API_URL}/chat/dm/${contactId}`, { headers })
      const data = await res.json()
      if (data.success) setMessages(data.messages)
    } catch (err) {
      console.error('Fetch DM error:', err)
    } finally {
      if (showLoader) setMessagesLoading(false)
    }
  }, [token])

  const fetchPatientMessages = useCallback(async (bookingId, showLoader = false) => {
    if (showLoader) setMessagesLoading(true)
    try {
      const res = await fetch(`${API_URL}/dispatch/chat/${bookingId}/messages`, { headers })
      const data = await res.json()
      if (data.success) setMessages(data.messages)
    } catch (err) {
      console.error('Fetch patient messages error:', err)
    } finally {
      if (showLoader) setMessagesLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (!selectedContact && !selectedPatient) return
    const interval = setInterval(() => {
      if (selectedContact) fetchDMMessages(selectedContact.id, false)
      if (selectedPatient) fetchPatientMessages(selectedPatient.booking_id, false)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedContact, selectedPatient])

  const prevMessageCount = useRef(0)
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
    prevMessageCount.current = messages.length
  }, [messages])

  const selectContact = (contact) => {
    setSelectedContact(contact)
    setSelectedPatient(null)
    setMessages([])
    fetchDMMessages(contact.id, true)
    if (!isWeb) setShowChat(true)
  }

  const selectRegion = (region) => {
    setSelectedRegion(region)
    setSelectedContact(null)
    setSelectedPatient(null)
    setMessages([])
    setRegionMessages([])
    fetchRegionMessages(region.id, true)
    if (!isWeb) setShowChat(true)
  }

  const sendRegionMessage = async () => {
    if (!message.trim() || !selectedRegion) return
    setSending(true)
    const text = message.trim()
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/chat/region/${selectedRegion.id}/messages`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      if (data.success) fetchRegionMessages(selectedRegion.id)
    } catch (err) {
      console.error('Send region message error:', err)
    } finally {
      setSending(false)
    }
  }

  const selectPatient = (chat) => {
    setSelectedPatient(chat)
    setSelectedContact(null)
    setMessages([])
    fetchPatientMessages(chat.booking_id, true)
    if (!isWeb) setShowChat(true)
  }

  const sendDM = async () => {
    if (!message.trim() || !selectedContact) return
    setSending(true)
    const text = message.trim()
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/chat/dm/${selectedContact.id}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      if (data.success) fetchDMMessages(selectedContact.id)
    } catch (err) {
      console.error('Send DM error:', err)
    } finally {
      setSending(false)
    }
  }

  const sendPatientMessage = async () => {
    if (!message.trim() || !selectedPatient) return
    setSending(true)
    const text = message.trim()
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/dispatch/chat/${selectedPatient.booking_id}/messages`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      if (data.success) fetchPatientMessages(selectedPatient.booking_id)
    } catch (err) {
      console.error('Send patient message error:', err)
    } finally {
      setSending(false)
    }
  }

  const togglePatientChat = async (chat) => {
    const endpoint = chat.status === 'open'
      ? `/dispatch/chat-session/${chat.booking_id}/close`
      : `/dispatch/chat-session/${chat.booking_id}/open`
    try {
      const res = await fetch(`${API_URL}${endpoint}`, { method: 'POST', headers })
      const data = await res.json()
      fetchPatientChats()
      if (selectedPatient?.booking_id === chat.booking_id) {
        setSelectedPatient(prev => ({ ...prev, status: chat.status === 'open' ? 'closed' : 'open' }))
      }
    } catch (err) {
      console.error('Toggle chat error:', err)
    }
  }

  const sendMessage = () => {
    if (selectedRegion) sendRegionMessage()
    else if (selectedContact) sendDM()
    else if (selectedPatient) sendPatientMessage()
  }

  // Group contacts by region
  const groupedContacts = contacts
    .filter(c => !search || `${c.first_name} ${c.last_name}`.toLowerCase().includes(search.toLowerCase()))
    .reduce((groups, contact) => {
      const region = contact.region_name || 'Unassigned'
      if (!groups[region]) groups[region] = { color: contact.region_color || '#aaa', contacts: [] }
      groups[region].contacts.push(contact)
      return groups
    }, {})

  const filteredPatientChats = patientChats.filter(c =>
    !search || c.patient_name?.toLowerCase().includes(search.toLowerCase())
  )

  const renderMessage = ({ item }) => {
    const isMe = Number(item.sender_id) === Number(userId)
    return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            {item.sender_photo ? (
              <Image source={{ uri: item.sender_photo }} style={styles.avatarImg} />
            ) : (
              <Text style={[styles.avatarText, { color: primaryColor }]}>
                {item.sender_first?.[0]}{item.sender_last?.[0]}
              </Text>
            )}
          </View>
        )}
        <View style={[styles.bubble, isMe ? { backgroundColor: primaryColor } : { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          {!isMe && (
            <Text style={[styles.senderName, { color: primaryColor }]}>
              {item.sender_first} {item.sender_last}
            </Text>
          )}
          <Text style={[styles.messageText, isMe && { color: secondaryColor }]}>{item.body}</Text>
          <Text style={[styles.messageTime, isMe && { color: secondaryColor + '99' }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    )
  }

  const isWeb = Platform.OS === 'web'

  return (
    <KeyboardAvoidingView style={[styles.container, { flexDirection: isWeb ? 'row' : 'column' }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* LEFT PANE */}
      {(!showChat || isWeb) && (
      <View style={[styles.leftPane, { borderRightColor: 'rgba(255,255,255,0.08)' }]}>
        {/* Header */}
        <View style={[styles.leftHeader, { backgroundColor: secondaryColor }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
            <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Messages</Text>
        </View>

        {/* Search */}
        <View style={{ padding: 12, backgroundColor: secondaryColor }}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { backgroundColor: secondaryColor }]}>
          {!soloMode && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'team' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('team')}
            >
              <Text style={[styles.tabText, activeTab === 'team' && { color: primaryColor }]}>👥 Team</Text>
            </TouchableOpacity>
          )}
          {user?.role !== 'np' && (
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'patients' && { borderBottomColor: primaryColor, borderBottomWidth: 2 }]}
              onPress={() => setActiveTab('patients')}
            >
              <Text style={[styles.tabText, activeTab === 'patients' && { color: primaryColor }]}>
                🏥 Patients {patientChats.filter(c => c.status === 'open').length > 0 ? `(${patientChats.filter(c => c.status === 'open').length})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Contact List */}
        <FlatList
          data={activeTab === 'team'
            ? [
                { type: 'groupHeader' },
                ...regions.map(r => ({ type: 'region', ...r })),
                { type: 'dmHeader' },
                ...Object.entries(groupedContacts).flatMap(([region, data]) => [
                  { type: 'header', region, color: data.color },
                  ...data.contacts.map(c => ({ type: 'contact', ...c }))
                ])
              ]
            : filteredPatientChats.map(c => ({ type: 'patient', ...c }))
          }
          keyExtractor={(item, index) => `${item.type}-${item.id || item.booking_id || index}`}
          renderItem={({ item }) => {
            if (item.type === 'groupHeader') {
              return (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>REGION CHANNELS</Text>
                </View>
              )
            }
            if (item.type === 'dmHeader') {
              return (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.02)', marginTop: 8 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>DIRECT MESSAGES</Text>
                </View>
              )
            }
            if (item.type === 'region') {
              const isSelected = selectedRegion?.id === item.id
              return (
                <TouchableOpacity
                  style={[styles.contactRow, isSelected && { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                  onPress={() => selectRegion(item)}
                >
                  <View style={[styles.contactAvatar, { alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: item.color + '33', borderWidth: 2, borderColor: item.color, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 18 }}>📍</Text>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactSub}>Region Channel</Text>
                    {item.last_message && (
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {item.last_sender}: {item.last_message}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )
            }
            if (item.type === 'header') {
              return (
                <View style={styles.regionHeader}>
                  <View style={[styles.regionDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.regionText, { color: item.color }]}>{item.region}</Text>
                </View>
              )
            }
            if (item.type === 'contact') {
              const isSelected = selectedContact?.id === item.id
              return (
                <TouchableOpacity
                  style={[styles.contactRow, isSelected && { backgroundColor: 'rgba(255,255,255,0.08)' }]}
                  onPress={() => selectContact(item)}
                >
                  <View style={styles.contactAvatar}>
                    {item.profile_photo ? (
                      <Image source={{ uri: item.profile_photo }} style={styles.avatarImg} />
                    ) : (
                      <Text style={[styles.avatarText, { color: primaryColor }]}>
                        {item.first_name?.[0]}{item.last_name?.[0]}
                      </Text>
                    )}
                    <View style={[styles.onlineDot, { backgroundColor: item.in_service ? '#4CAF50' : '#aaa' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{item.first_name} {item.last_name}</Text>
                    <Text style={styles.contactSub}>{item.role?.toUpperCase()}</Text>
                    {item.last_message && <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message}</Text>}
                  </View>
                  {item.unread_count > 0 && (
                    <View style={[styles.badge, { backgroundColor: primaryColor }]}>
                      <Text style={[styles.badgeText, { color: secondaryColor }]}>{item.unread_count}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              )
            }
            if (item.type === 'patient') {
              const isSelected = selectedPatient?.booking_id === item.booking_id
              const isOpen = item.status === 'open'
              return (
                <TouchableOpacity
                  style={[styles.contactRow, isSelected && { backgroundColor: 'rgba(255,255,255,0.08)' }, activeTab === 'team' && !isOpen && !soloMode && { opacity: 0.5 }]}
                  onPress={() => selectPatient(item)}
                >
                  <View style={styles.contactAvatar}>
                    <View style={[styles.patientInitial, { borderColor: (isOpen || soloMode) ? primaryColor : '#aaa' }]}>
  <Text style={[styles.avatarText, { color: (isOpen || soloMode) ? primaryColor : '#aaa' }]}>
                        {item.patient_name?.[0]}
                      </Text>
                    </View>
                    <View style={[styles.onlineDot, { backgroundColor: isOpen ? '#4CAF50' : '#aaa' }]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.contactName, !isOpen && { color: 'rgba(255,255,255,0.4)' }]}>{item.patient_name}</Text>
                    <Text style={styles.contactSub}>{item.service}</Text>
                    {item.last_message && <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message}</Text>}
                  </View>
                </TouchableOpacity>
              )
            }
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                {activeTab === 'team' ? 'No contacts in service' : 'No patient chats yet'}
              </Text>
            </View>
          }
        />
      </View>
      )}

      {/* RIGHT PANE */}
      {(showChat || isWeb) && (
      <View style={styles.rightPane}>
        {!selectedContact && !selectedPatient && !selectedRegion ? (
          <View style={styles.emptyChat}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>Select a conversation</Text>
          </View>
        ) : (
          <>
            {/* Chat Header */}
            <View style={[styles.chatHeader, { backgroundColor: secondaryColor }]}>
              {!isWeb && (
                <TouchableOpacity onPress={() => { setShowChat(false); setSelectedContact(null); setSelectedPatient(null); setSelectedRegion(null) }} style={{ marginRight: 12 }}>
                  <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>← Back</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
                  {selectedRegion ? `📍 ${selectedRegion.name}` : selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}` : selectedPatient?.patient_name}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                  {selectedRegion ? 'Region Channel' : selectedContact ? `${selectedContact.role?.toUpperCase()} · ${selectedContact.region_name || ''}` : selectedPatient?.service}
                </Text>
              </View>
            </View>

            {/* Messages */}
            {messagesLoading ? (
              <View style={styles.emptyChat}><ActivityIndicator color={primaryColor} /></View>
            ) : (
              <FlatList
                ref={flatListRef}
                data={selectedRegion ? regionMessages : messages}
                keyExtractor={item => item.id.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messageList}
                ListEmptyComponent={
                  <View style={styles.emptyChat}>
                    <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No messages yet — say hi!</Text>
                  </View>
                }
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              />
            )}

            {/* Input */}
            {(selectedContact || selectedPatient || selectedRegion) && (
              <View style={[styles.inputBar, { backgroundColor: secondaryColor }]}>
                <TextInput
                  style={styles.input}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Type a message..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  maxLength={500}
                  blurOnSubmit={true}
                  onSubmitEditing={sendMessage}
                />
                <TouchableOpacity
                  style={[styles.sendBtn, { backgroundColor: primaryColor }, (!message.trim() || sending) && { opacity: 0.4 }]}
                  onPress={() => { ; sendMessage() }}
                  disabled={!message.trim() || sending}
                >
                  {sending ? <ActivityIndicator color={secondaryColor} size="small" /> : <Text style={[styles.sendBtnText, { color: secondaryColor }]}>Send</Text>}
                </TouchableOpacity>
              </View>
            )}
            {selectedPatient?.status !== 'open' && selectedPatient && !soloMode && (
              <View style={[styles.inputBar, { backgroundColor: secondaryColor, justifyContent: 'center' }]}>
                <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Chat is closed — tap OPEN to start messaging</Text>
              </View>
            )}
          </>
        )}
      </View>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  leftPane: { width: Platform.OS === 'web' ? 320 : '100%', borderRightWidth: 1, backgroundColor: '#0a1540', overflow: 'hidden' },
  rightPane: { flex: 1, backgroundColor: '#0D1B4B' },
  leftHeader: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 10, color: '#fff', fontSize: 14 },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.4)' },
  regionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  regionDot: { width: 8, height: 8, borderRadius: 4 },
  regionText: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  contactAvatar: { position: 'relative', width: 44, height: 44 },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0a1540' },
  contactName: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  contactSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  lastMessage: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  badge: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  patientInitial: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  chatToggle: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  chatHeader: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  messageList: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '60%', borderRadius: 16, padding: 12, paddingBottom: 8 },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  messageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  messageTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100 },
  sendBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnText: { fontSize: 14, fontWeight: '700' },
})