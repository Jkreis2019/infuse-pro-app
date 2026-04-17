import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Modal, View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function PatientDispatchChatScreen({ route, navigation }) {
  const { token, userId, company, bookingId } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [messages, setMessages] = useState([])
  const [showMenu, setShowMenu] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const flatListRef = useRef(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/dispatch/chat/${bookingId}/messages`, { headers })
      const data = await res.json()
      if (data.success) setMessages(data.messages)
    } catch (err) {
      console.error('Fetch dispatch chat error:', err)
    } finally {
      setLoading(false)
    }
  }, [bookingId, token])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    const submitReport = async () => {
    if (!reportReason) return
    setReportSubmitting(true)
    try {
      await fetch(`${API_URL}/chat/report/${bookingId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason })
      })
      setReportDone(true)
      setTimeout(() => { setShowReportModal(false); setReportDone(false); setReportReason('') }, 2000)
    } catch (e) {} finally { setReportSubmitting(false) }
  }

  return () => clearInterval(interval)
  }, [fetchMessages])

  const prevMessageCount = useRef(0)
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
    prevMessageCount.current = messages.length
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    const text = message.trim()
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/dispatch/chat/${bookingId}/messages`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      if (data.success) fetchMessages()
    } catch (err) {
      console.error('Send dispatch chat error:', err)
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === userId
    const submitReport = async () => {
    if (!reportReason) return
    setReportSubmitting(true)
    try {
      await fetch(`${API_URL}/chat/report/${bookingId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason })
      })
      setReportDone(true)
      setTimeout(() => { setShowReportModal(false); setReportDone(false); setReportReason('') }, 2000)
    } catch (e) {} finally { setReportSubmitting(false) }
  }

  return (
      <View style={[styles.messageRow, isMe && styles.messageRowMe]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, { color: primaryColor }]}>
              {item.sender_first?.[0]}{item.sender_last?.[0]}
            </Text>
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

  const submitReport = async () => {
    if (!reportReason) return
    setReportSubmitting(true)
    try {
      await fetch(`${API_URL}/chat/report/${bookingId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason })
      })
      setReportDone(true)
      setTimeout(() => { setShowReportModal(false); setReportDone(false); setReportReason('') }, 2000)
    } catch (e) {} finally { setReportSubmitting(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{company?.name || 'Support'}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Appointment Chat</Text>
        </View>
        <TouchableOpacity onPress={() => setShowMenu(!showMenu)} style={{ padding: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20 }}>⋯</Text>
        </TouchableOpacity>
      </View>
      {showMenu && (
        <View style={{ position: 'absolute', top: 90, right: 16, backgroundColor: '#1a2a5e', borderRadius: 10, padding: 4, zIndex: 100, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', minWidth: 180 }}>
          <TouchableOpacity style={{ padding: 14 }} onPress={() => { setShowMenu(false); setShowReportModal(true) }}>
            <Text style={{ color: '#f09090', fontSize: 14, fontWeight: '600' }}>Report this conversation</Text>
          </TouchableOpacity>
        </View>
      )}
      <Modal visible={showReportModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, width: '100%', maxWidth: 380, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            {reportDone ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Report submitted</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4, textAlign: 'center' }}>Our team will review within 24 hours.</Text>
              </View>
            ) : (
              <>
                <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
                  <Text style={{ color: '#e53e3e', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>REPORT CONVERSATION</Text>
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Are you sure?</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>This will send a full transcript to our safety team for review.</Text>
                </View>
                <View style={{ padding: 20 }}>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 10 }}>Reason for reporting</Text>
                  {['Inappropriate language', 'Unprofessional behavior', 'Harassment', 'Other'].map(r => (
                    <TouchableOpacity key={r} style={{ borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 8, borderColor: reportReason === r ? '#e53e3e' : 'rgba(255,255,255,0.15)', backgroundColor: reportReason === r ? 'rgba(229,62,62,0.1)' : 'transparent' }} onPress={() => setReportReason(r)}>
                      <Text style={{ color: reportReason === r ? '#e53e3e' : 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: 13 }}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                    <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => { setShowReportModal(false); setReportReason('') }}>
                      <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flex: 2, backgroundColor: '#e53e3e', borderRadius: 12, padding: 14, alignItems: 'center', opacity: (!reportReason || reportSubmitting) ? 0.5 : 1 }} onPress={submitReport} disabled={!reportReason || reportSubmitting}>
                      {reportSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Yes, Report</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={primaryColor} /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No messages yet</Text>
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8 }}>Send a message to your support team</Text>
            </View>
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={[styles.inputBar, { backgroundColor: secondaryColor }]}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          maxLength={500}
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
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  messageList: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarText: { fontSize: 12, fontWeight: '700' },
  bubble: { maxWidth: '75%', borderRadius: 16, padding: 12, paddingBottom: 8 },
  senderName: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
  messageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  messageTime: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  inputBar: { flexDirection: 'row', padding: 12, gap: 10, alignItems: 'flex-end', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 100 },
  sendBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10 },
  sendBtnText: { fontSize: 14, fontWeight: '700' },
})