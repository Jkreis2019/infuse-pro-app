import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function BugReportModal({ visible, onClose, token, screen }) {
  const [description, setDescription] = useState('')
  const [urgency, setUrgency] = useState('low')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const submit = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    try {
      await fetch(`${API_URL}/bug-report`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, urgency, screen })
      })
      setSubmitted(true)
      setTimeout(() => { setSubmitted(false); setDescription(''); setUrgency('low'); onClose() }, 2000)
    } catch (e) {} finally { setSubmitting(false) }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, width: '100%', maxWidth: 400, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <View style={{ padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: '#C9A84C', fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>REPORT A PROBLEM</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>Help us improve</Text>
          </View>
          {submitted ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>✅</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Report submitted!</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>Thank you for the feedback.</Text>
            </View>
          ) : (
            <View style={{ padding: 20 }}>
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>Describe the issue</Text>
              <TextInput
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, color: '#fff', fontSize: 14, minHeight: 100, textAlignVertical: 'top', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
                value={description}
                onChangeText={setDescription}
                placeholder="What went wrong? What were you trying to do?"
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
              />
              <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8 }}>Urgency</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {['low', 'medium', 'urgent'].map(u => (
                  <TouchableOpacity
                    key={u}
                    style={{ flex: 1, borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: urgency === u ? (u === 'urgent' ? '#e53e3e' : u === 'medium' ? '#FF9800' : '#4CAF50') : 'rgba(255,255,255,0.15)', backgroundColor: urgency === u ? (u === 'urgent' ? 'rgba(229,62,62,0.15)' : u === 'medium' ? 'rgba(255,152,0,0.15)' : 'rgba(76,175,80,0.15)') : 'transparent' }}
                    onPress={() => setUrgency(u)}
                  >
                    <Text style={{ color: urgency === u ? (u === 'urgent' ? '#e53e3e' : u === 'medium' ? '#FF9800' : '#4CAF50') : 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '600', textTransform: 'capitalize' }}>{u === 'urgent' ? '🚨 Urgent' : u === 'medium' ? '⚠️ Medium' : '✓ Low'}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={onClose}>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 2, backgroundColor: '#C9A84C', borderRadius: 12, padding: 14, alignItems: 'center', opacity: submitting ? 0.6 : 1 }} onPress={submit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#0D1B4B" /> : <Text style={{ color: '#0D1B4B', fontWeight: '700', fontSize: 15 }}>Submit Report</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}
