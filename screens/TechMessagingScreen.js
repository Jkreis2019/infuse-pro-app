import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  ActivityIndicator, Image, Platform, KeyboardAvoidingView
, StatusBar} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function TechMessagingScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }
  const isWeb = Platform.OS === 'web'

  const [myRegion, setMyRegion] = useState(null)
  const [contacts, setContacts] = useState([])
  const [selectedRegion, setSelectedRegion] = useState(null)
  const [selectedContact, setSelectedContact] = useState(null)
  const [regionMessages, setRegionMessages] = useState([])
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const flatListRef = useRef(null)

  const [userId, setUserId] = useState(null)
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        setUserId(payload.userId)
      } catch (e) {}
    }
  }, [token])

  const fetchMyRegion = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/my-region`, { headers })
      const data = await res.json()
      if (data.success && data.region) setMyRegion(data.region)
    } catch (err) {
      console.error('Fetch my region error:', err)
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

  useEffect(() => {
    fetchMyRegion()
    fetchContacts()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts()
      if (selectedRegion) fetchRegionMessages(selectedRegion.id)
      if (selectedContact) fetchDMMessages(selectedContact.id)
    }, 10000)
    return () => clearInterval(interval)
  }, [selectedRegion, selectedContact])

  const prevMessageCount = useRef(0)
  useEffect(() => {
    const currentMessages = selectedRegion ? regionMessages : messages
    if (currentMessages.length > prevMessageCount.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
    prevMessageCount.current = currentMessages.length
  }, [regionMessages, messages])

  const selectRegion = (region) => {
    setSelectedRegion(region)
    setSelectedContact(null)
    setRegionMessages([])
    setMessages([])
    fetchRegionMessages(region.id, true)
    if (!isWeb) setShowChat(true)
  }

  const selectContact = (contact) => {
    setSelectedContact(contact)
    setSelectedRegion(null)
    setMessages([])
    setRegionMessages([])
    fetchDMMessages(contact.id, true)
    if (!isWeb) setShowChat(true)
  }

  const goBack = () => {
    setShowChat(false)
    setSelectedContact(null)
    setSelectedRegion(null)
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

  const sendMessage = () => {
    if (selectedRegion) sendRegionMessage()
    else if (selectedContact) sendDM()
  }

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === userId
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
        <View style={[styles.bubble, isMe ? { backgroundColor: primaryColor } : { backgroundColor: '#F0F8F8' }]}>
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

  const listData = [
    ...(myRegion ? [{ type: 'groupHeader' }, { type: 'region', ...myRegion }] : []),
    { type: 'dmHeader' },
    ...contacts.map(c => ({ type: 'contact', ...c }))
  ]

  const chatView = (
    <View style={styles.rightPane}>
      {!selectedContact && !selectedRegion ? (
        <View style={styles.emptyChat}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>💬</Text>
          <Text style={{ color: '#9BB5B4', fontSize: 16 }}>Select a conversation</Text>
        </View>
      ) : (
        <>
          <View style={[styles.chatHeader, { backgroundColor: secondaryColor }]}>
            <TouchableOpacity onPress={isWeb ? () => navigation.goBack() : goBack} style={{ marginRight: 12 }}>
              <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>← Back</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#1A2E2E', fontSize: 16, fontWeight: '700' }}>
                {selectedRegion ? `📍 ${selectedRegion.name}` : `${selectedContact.first_name} ${selectedContact.last_name}`}
              </Text>
              <Text style={{ color: '#9BB5B4', fontSize: 12 }}>
                {selectedRegion ? 'Region Channel' : selectedContact.role?.toUpperCase()}
              </Text>
            </View>
          </View>

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
                  <Text style={{ color: '#9BB5B4', fontSize: 14 }}>No messages yet — say hi!</Text>
                </View>
              }
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.inputBar, { backgroundColor: secondaryColor }]}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Type a message..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                maxLength={500}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) sendMessage()
                }}
              />
              <TouchableOpacity
                style={[styles.sendBtn, { backgroundColor: primaryColor }, (!message.trim() || sending) && { opacity: 0.4 }]}
                onPress={sendMessage}
                disabled={!message.trim() || sending}
              >
                {sending ? <ActivityIndicator color={secondaryColor} size="small" /> : <Text style={[styles.sendBtnText, { color: secondaryColor }]}>Send</Text>}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </>
      )}
    </View>
  )

  const contactList = (
    <View style={styles.leftPane}>
      <View style={[styles.leftHeader, { backgroundColor: secondaryColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ color: primaryColor, fontSize: 14, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Messages</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={primaryColor} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item, index) => `${item.type}-${item.id || index}`}
          renderItem={({ item }) => {
            if (item.type === 'groupHeader') {
              return (
                <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>REGION CHANNEL</Text>
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
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: item.color + '33', borderWidth: 2, borderColor: item.color, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Text style={{ fontSize: 18 }}>📍</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{item.name}</Text>
                    <Text style={styles.contactSub}>Region Channel</Text>
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18 }}>›</Text>
                </TouchableOpacity>
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
                  <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, marginLeft: 8 }}>›</Text>
                </TouchableOpacity>
              )
            }
          }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 40 }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No contacts in service</Text>
            </View>
          }
        />
      )}
    </View>
  )

  // Web: side by side | Mobile: show contact list OR chat
  if (isWeb) {
    return (
      <View style={[styles.container, { flexDirection: 'row' }]}>
        {contactList}
        {chatView}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {!showChat ? contactList : chatView}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FBFB' },
  leftPane: { width: Platform.OS === 'web' ? 320 : '100%', flex: Platform.OS === 'web' ? undefined : 1, borderRightWidth: 1, borderRightColor: 'rgba(10,186,181,0.15)', backgroundColor: '#0F2020' },
  rightPane: { flex: 1, backgroundColor: '#FFFFFF' },
  leftHeader: { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  contactRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  contactAvatar: { position: 'relative', width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 16, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0F2020' },
  contactName: { fontSize: 15, fontWeight: '600', color: '#fff', marginBottom: 2 },
  contactSub: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 },
  lastMessage: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  badge: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  chatHeader: { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 8 : 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: 'rgba(10,186,181,0.15)' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  messageList: { padding: 16, paddingBottom: 8, backgroundColor: '#FFFFFF' },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(10,186,181,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 12, paddingBottom: 8 },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  messageText: { color: '#1A2E2E', fontSize: 15, lineHeight: 20 },
  messageTime: { color: '#9BB5B4', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(10,186,181,0.15)', backgroundColor: '#FFFFFF' },
  input: { flex: 1, backgroundColor: '#F7FBFB', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(10,186,181,0.2)', paddingHorizontal: 16, paddingVertical: 10, color: '#1A2E2E', fontSize: 15, maxHeight: 100 },
  sendBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnText: { fontSize: 14, fontWeight: '700' },
})