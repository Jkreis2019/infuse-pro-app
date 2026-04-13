import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function ChatScreen({ route, navigation }) {
  const { token, user, company, contact } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const flatListRef = useRef(null)

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/dm/${contact.id}`, { headers })
      const data = await res.json()
      if (data.success) setMessages(data.messages)
    } catch (err) {
      console.error('Fetch messages error:', err)
    } finally {
      setLoading(false)
    }
  }, [contact.id, token])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages])

  const sendMessage = async () => {
    if (!message.trim()) return
    setSending(true)
    const text = message.trim()
    setMessage('')
    try {
      const res = await fetch(`${API_URL}/chat/dm/${contact.id}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      const data = await res.json()
      if (data.success) fetchMessages()
    } catch (err) {
      console.error('Send message error:', err)
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }) => {
    const isMe = item.sender_id === (user?.id || user?.userId)
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
          <Text style={[styles.messageText, isMe && { color: secondaryColor }]}>{item.body || item.message}</Text>
          <Text style={[styles.messageTime, isMe && { color: secondaryColor + '99' }]}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
          <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>
            {contact.first_name} {contact.last_name}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
            {contact.role?.toUpperCase()} {contact.region_name ? '· ' + contact.region_name : ''}
          </Text>
        </View>
        <View style={[styles.onlineDot, { backgroundColor: contact.in_service ? '#4CAF50' : '#aaa' }]} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={primaryColor} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No messages yet — say hi!</Text>
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
          blurOnSubmit={true}
          onSubmitEditing={sendMessage}
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
  onlineDot: { width: 10, height: 10, borderRadius: 5 },
  messageList: { padding: 16, paddingBottom: 8 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12 },
  messageRowMe: { flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarImg: { width: 32, height: 32, borderRadius: 16 },
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