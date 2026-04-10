import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Image
} from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function ChatContactsScreen({ route, navigation }) {
  const { token, user, company } = route.params || {}
  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/chat/contacts`, { headers })
      const data = await res.json()
      if (data.success) setContacts(data.contacts)
    } catch (err) {
      console.error('Fetch contacts error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchContacts()
    const interval = setInterval(fetchContacts, 10000)
    return () => clearInterval(interval)
  }, [fetchContacts])

  const onRefresh = () => { setRefreshing(true); fetchContacts() }

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactRow}
      onPress={() => navigation.navigate('Chat', { token, user, company, contact: item })}
    >
      <View style={styles.avatarContainer}>
        {item.profile_photo ? (
          <Image source={{ uri: item.profile_photo }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { borderColor: item.region_color || primaryColor }]}>
            <Text style={[styles.avatarText, { color: item.region_color || primaryColor }]}>
              {item.first_name?.[0]}{item.last_name?.[0]}
            </Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: item.in_service ? '#4CAF50' : '#aaa' }]} />
      </View>

      <View style={styles.contactInfo}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.contactName}>{item.first_name} {item.last_name}</Text>
          {item.last_message_at && (
            <Text style={styles.lastTime}>
              {new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.contactRole}>
            {item.role?.toUpperCase()}{item.region_name ? ` · ${item.region_name}` : ''}
          </Text>
          {item.unread_count > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: primaryColor }]}>
              <Text style={[styles.unreadText, { color: secondaryColor }]}>{item.unread_count}</Text>
            </View>
          )}
        </View>
        {item.last_message && (
          <Text style={styles.lastMessage} numberOfLines={1}>{item.last_message}</Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={[styles.header, { backgroundColor: secondaryColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: primaryColor, fontSize: 16, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={primaryColor} size="large" />
        </View>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item.id.toString()}
          renderItem={renderContact}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={primaryColor} />}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15 }}>No contacts in service</Text>
              <Text style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 8 }}>Staff will appear here when in service</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 76 }} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  contactRow: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700' },
  statusDot: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#0D1B4B' },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  contactRole: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  lastMessage: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  lastTime: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
  unreadBadge: { borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { fontSize: 11, fontWeight: '700' },
})
