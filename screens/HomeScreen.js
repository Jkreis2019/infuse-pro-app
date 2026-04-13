import React, { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Linking, Image } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

const API_URL = 'https://api.infusepro.app'

export default function HomeScreen({ route, navigation }) {
  const { token, user, company, message } = route.params
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasPendingIntake, setHasPendingIntake] = useState(false)
  const [intakeUrl, setIntakeUrl] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [currentAnnouncement, setCurrentAnnouncement] = useState(0)
  const [linkedCompanyId, setLinkedCompanyId] = useState(null)

  const fetchLinkedCompany = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/my-companies`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.companies && data.companies.length > 0) {
        setLinkedCompanyId(data.companies[0].id)
      } else {
        setLinkedCompanyId(null)
      }
    } catch (err) {
      console.error('Fetch linked company error:', err)
    }
  }

  useFocusEffect(
  React.useCallback(() => {
    fetchBookings()
    fetchIntakeStatus()
    fetchAnnouncements()
    fetchLinkedCompany()
    
    const interval = setInterval(() => {
      fetchIntakeStatus()
    }, 15000)
    
    return () => clearInterval(interval)
  }, [])
)

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/guest/bookings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setBookings(data.bookings)
      }
    } catch (err) {
      console.log('Error fetching bookings:', err)
    }
    setLoading(false)
  }

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch(`${API_URL}/announcements`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setAnnouncements(data.announcements)
    } catch (err) {
      console.error('Error fetching announcements:', err)
    }
  }

  const fetchIntakeStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/patient/intake-status`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.hasPendingIntake) {
        setHasPendingIntake(true)
        setIntakeUrl(data.formUrl)
      } else {
        setHasPendingIntake(false)
        setIntakeUrl(null)
      }
    } catch (err) {
      console.log('Error fetching intake status:', err)
    }
  }

  useEffect(() => {
    if (announcements.length <= 1) return
    const timer = setInterval(() => {
      setCurrentAnnouncement(prev => (prev + 1) % announcements.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [announcements])

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return '#8fda74'
      case 'pending': return '#E2C97E'
      case 'completed': return 'rgba(255,255,255,0.4)'
      case 'cancelled': return '#f09090'
      default: return '#a0c0f0'
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={[styles.header, { backgroundColor: company.secondaryColor }]}>
        {company.logoUrl ? (
          <View style={{ alignItems: 'center', marginBottom: 12, width: '100%' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: company.primaryColor + '20', borderWidth: 2, borderColor: company.primaryColor, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <Image source={{ uri: company.logoUrl }} style={{ width: 64, height: 64, resizeMode: 'contain' }} />
            </View>
            <Text style={[styles.companyName, { color: company.primaryColor, marginTop: 8 }]}>{company.name}</Text>
          </View>
        ) : (
          <Text style={[styles.companyName, { color: company.primaryColor }]}>{company.name}</Text>
        )}
        <Text style={styles.greeting}>Good morning, {user.firstName}</Text>
        <Text style={styles.location}>{company.location}</Text>
      </View>

{/* Announcements Carousel */}
      {announcements.length > 0 && (
        <View style={{ marginHorizontal: 16, marginTop: 20, marginBottom: 24 }}>
          {announcements.map((an, index) => {
            if (index !== currentAnnouncement) return null
            const isDark = an.bg_style === 'dark'
            const isLight = an.bg_style === 'light'
            const bgColor = an.bg_color || (isDark ? '#08101f' : isLight ? 'rgba(255,255,255,0.08)' : '#0a1535')
            return (
              <View key={an.id} style={{
                backgroundColor: bgColor,
                borderRadius: 20,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: company.primaryColor + '30',
                shadowColor: company.primaryColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
              }}>
                {/* Top accent bar */}
                <View style={{ height: 3, backgroundColor: company.primaryColor, width: '100%' }} />
                
                <View style={{ padding: 22 }}>
                  {/* Header row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <View style={{ backgroundColor: company.primaryColor + '20', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                          <Text style={{ color: company.primaryColor, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>
                            {company.name?.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, lineHeight: 26 }}>{an.title}</Text>
                    </View>
                    {announcements.length > 1 && (
                      <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{index + 1}/{announcements.length}</Text>
                    )}
                  </View>

                  {/* Body */}
                  {an.body && (
                    <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 22, marginBottom: an.cta_label ? 18 : 4 }}>
                      {an.body}
                    </Text>
                  )}

                  {/* CTA Button */}
                  {an.cta_label && an.cta_url && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: company.primaryColor,
                        borderRadius: 12,
                        padding: 14,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 8
                      }}
                      onPress={() => Linking.openURL(an.cta_url)}
                    >
                      <Text style={{ color: company.secondaryColor, fontSize: 14, fontWeight: '800', letterSpacing: 0.3 }}>{an.cta_label}</Text>
                      <Text style={{ color: company.secondaryColor, fontSize: 14 }}>→</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )
          })}

          {/* Dot indicators */}
          {announcements.length > 1 && (
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 12 }}>
              {announcements.map((_, index) => (
                <TouchableOpacity key={index} onPress={() => setCurrentAnnouncement(index)}>
                  <View style={{
                    width: index === currentAnnouncement ? 24 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: index === currentAnnouncement ? company.primaryColor : 'rgba(255,255,255,0.2)'
                  }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Intake Banner */}
      {hasPendingIntake && (
        <TouchableOpacity
          style={styles.intakeBanner}
          onPress={() => intakeUrl && Linking.openURL(intakeUrl)}
        >
          <Text style={styles.intakeBannerIcon}>⚠️</Text>
          <View style={styles.intakeBannerText}>
            <Text style={styles.intakeBannerTitle}>Complete your intake form</Text>
            <Text style={styles.intakeBannerSub}>Required before your appointment</Text>
          </View>
          <Text style={styles.intakeBannerArrow}>→</Text>
        </TouchableOpacity>
      )}

      {message ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{message}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.bookButton, { backgroundColor: company.primaryColor }]}
        onPress={() => {
          if (linkedCompanyId) {
            navigation.getParent()?.navigate('Booking', { token, user, company: { ...company, id: company?.id || user?.companyId } })
          } else {
            navigation.navigate('Map', { token, user, company, bookingMode: true })
          }
        }}
      >
        <Text style={[styles.bookButtonText, { color: company.secondaryColor }]}>Book an appointment</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ marginHorizontal: 24, marginTop: -16, marginBottom: 28, alignItems: 'center', padding: 10 }}
        onPress={() => navigation.navigate('Map', { token, user, company, bookingMode: true })}
      >
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>🗺 Guest Booking Map</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your appointments</Text>
        {loading ? (
          <ActivityIndicator color={company.primaryColor} style={{ marginTop: 20 }} />
        ) : bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No upcoming appointments</Text>
            <Text style={styles.emptySubtext}>Book your first IV session above</Text>
          </View>
        ) : (
          bookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={styles.bookingCard}
              onPress={() => navigation.navigate('AppointmentDetail', {
                bookingId: booking.id,
                token,
                company
              })}
            >
              <View style={styles.bookingTop}>
                <Text style={styles.bookingService}>{booking.service}</Text>
                <View style={[styles.statusPill, { borderColor: getStatusColor(booking.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                    {booking.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.bookingAddress}>{booking.address}</Text>
              <Text style={styles.bookingDate}>
                {new Date(booking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  content: { paddingBottom: 48 },
  header: { padding: 28, paddingTop: 48, marginBottom: 20 },
  companyName: { fontSize: 22, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  greeting: { fontSize: 28, fontWeight: '600', color: '#fff', marginBottom: 4 },
  location: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  intakeBanner: { 
    marginHorizontal: 24, 
    marginBottom: 16,
    backgroundColor: 'rgba(226,201,126,0.15)', 
    borderWidth: 1, 
    borderColor: '#E2C97E', 
    borderRadius: 12, 
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  intakeBannerIcon: { fontSize: 24 },
  intakeBannerText: { flex: 1 },
  intakeBannerTitle: { color: '#E2C97E', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  intakeBannerSub: { color: 'rgba(226,201,126,0.7)', fontSize: 12 },
  intakeBannerArrow: { color: '#E2C97E', fontSize: 18, fontWeight: '700' },
  successBanner: { marginHorizontal: 24, backgroundColor: 'rgba(100,180,80,0.15)', borderWidth: 1, borderColor: 'rgba(100,180,80,0.3)', borderRadius: 8, padding: 12, marginBottom: 16 },
  successText: { color: '#8fda74', fontSize: 13, textAlign: 'center' },
  bookButton: { marginHorizontal: 24, borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 28 },
  bookButtonText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  section: { paddingHorizontal: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 14, letterSpacing: 0.3 },
  emptyState: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 28, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500', marginBottom: 6 },
  emptySubtext: { color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: '300' },
  bookingCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 10 },
  bookingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  bookingService: { fontSize: 15, fontWeight: '500', color: '#fff' },
  statusPill: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  bookingAddress: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 },
  bookingDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)' },
})