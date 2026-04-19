import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native'
import { Platform } from 'react-native'
import MapComponent from './MapComponent'

const API_URL = 'https://api.infusepro.app'

const STATUS_STEPS = ['pending', 'confirmed', 'en_route', 'on_scene', 'completed']
const STATUS_LABELS = {
  pending: 'Booked',
  confirmed: 'Confirmed',
  en_route: 'Tech En Route',
  on_scene: 'On Scene',
  completed: 'Complete'
}
const STATUS_ICONS = {
  pending: '📋',
  confirmed: '✅',
  en_route: '🚗',
  on_scene: '💉',
  completed: '⭐'
}

export default function AppointmentDetailScreen({ route, navigation }) {
  const { bookingId, token, company } = route.params || {}
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [techLocation, setTechLocation] = useState(null)
  const [linkedCompanyId, setLinkedCompanyId] = useState(null)
  const [linkingCompany, setLinkingCompany] = useState(false)

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
  const [chatSession, setChatSession] = useState(null)
  const [userId, setUserId] = useState(null)

useEffect(() => {
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setUserId(payload.userId)
    } catch (e) {
      console.error('Token decode error', e)
    }
  }
}, [token])

  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'

const fetchTechLocation = async () => {
    if (!bookingId || !token) return
    try {
      const res = await fetch(`${API_URL}/tech/location/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.available) setTechLocation(data)
      else setTechLocation(null)
    } catch (err) {
      console.error('Tech location error:', err)
    }
  }

const fetchChatSession = async () => {
    try {
      const res = await fetch(`${API_URL}/dispatch/chat-session/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setChatSession(data.session)
    } catch (err) {
      console.error('Chat session error:', err)
    }
  }

  const fetchBooking = async () => {
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) setBooking(data.booking)
    } catch (err) {
      console.error('Failed to load booking', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBooking()
    fetchTechLocation()
    fetchChatSession()
    fetchLinkedCompany()
    const interval = setInterval(() => {
      fetchBooking()
      fetchTechLocation()
      fetchChatSession()
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const handleCancel = () => {
  if (booking.status === 'en_route') {
    Alert.alert(
      'Cancellation Fee May Apply',
      'Your tech is already on the way. Cancelling at this stage may result in a cancellation fee. Do you still want to cancel?',
      [
        { text: 'Keep appointment', style: 'cancel' },
        {
          text: 'Cancel anyway',
          style: 'destructive',
          onPress: confirmCancel
        }
      ]
    )
  } else if (booking.status === 'confirmed') {
    Alert.alert(
      'Cancel appointment?',
      'A tech has already been assigned. Are you sure you want to cancel?',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Cancel appointment',
          style: 'destructive',
          onPress: confirmCancel
        }
      ]
    )
  } else {
    Alert.alert(
      'Cancel appointment?',
      'Are you sure you want to cancel this appointment?',
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Confirm cancel',
          style: 'destructive',
          onPress: confirmCancel
        }
      ]
    )
  }
}

  const confirmCancel = async () => {
    setCancelling(true)
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by patient' })
      })
      const data = await res.json()
      if (data.success) {
        Alert.alert('Cancelled', 'Your appointment has been cancelled.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ])
      } else {
        Alert.alert('Error', data.message || 'Could not cancel appointment')
      }
    } catch (err) {
      Alert.alert('Error', 'Network error. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={primaryColor} size="large" />
      </View>
    )
  }

  if (!booking) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Booking not found</Text>
      </View>
    )
  }

  const currentStep = STATUS_STEPS.indexOf(booking.status)
  const isPast = booking.requested_time && new Date(booking.requested_time) < new Date() && booking.status === 'confirmed'
  const canCancel = ['pending', 'confirmed', 'en_route'].includes(booking.status) && !isPast
  const canMessage = booking.status === 'en_route'

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
{booking.status === 'cancelled' && (
        <View style={{ backgroundColor: booking.cancellation_reason === 'Booking merged' ? 'rgba(33,150,243,0.1)' : 'rgba(240,144,144,0.1)', borderWidth: 1, borderColor: booking.cancellation_reason === 'Booking merged' ? '#2196F3' : '#f09090', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: booking.cancellation_reason === 'Booking merged' ? '#2196F3' : '#f09090', fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
            {booking.cancellation_reason === 'Booking merged' ? '🔀 Booking Merged' : '❌ Appointment Cancelled'}
          </Text>
          <Text style={{ color: '#9BB5B4', fontSize: 13 }}>
            {booking.cancellation_reason === 'Booking merged'
              ? 'Your booking has been merged with another appointment. Your tech is still on the way!'
              : 'This appointment has been cancelled.'}
          </Text>
        </View>
      )}
      {isPast && (
        <View style={{ backgroundColor: 'rgba(240,144,144,0.1)', borderWidth: 1, borderColor: '#f09090', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: '#f09090', fontWeight: '700', fontSize: 15, marginBottom: 4 }}>⚠️ Appointment Not Completed</Text>
          <Text style={{ color: '#9BB5B4', fontSize: 13 }}>This appointment passed without being completed. Please contact the company to reschedule.</Text>
        </View>
      )}

      {/* Status Stepper */}
      <View style={styles.stepperCard}>
        <Text style={styles.stepperTitle}>Appointment Status</Text>
        {STATUS_STEPS.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isPending = index > currentStep

          return (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepLeft}>
                <View style={[
                  styles.stepDot,
                  isCompleted && { backgroundColor: '#4CAF50' },
                  isCurrent && { backgroundColor: primaryColor },
                  isPending && { backgroundColor: 'rgba(10,186,181,0.08)' }
                ]}>
                  <Text style={styles.stepDotText}>
                    {isCompleted ? '✓' : STATUS_ICONS[step]}
                  </Text>
                </View>
                {index < STATUS_STEPS.length - 1 && (
                  <View style={[
                    styles.stepLine,
                    isCompleted && { backgroundColor: '#4CAF50' }
                  ]} />
                )}
              </View>
              <View style={styles.stepRight}>
                <Text style={[
                  styles.stepLabel,
                  isCurrent && { color: primaryColor, fontWeight: '700' },
                  isPending && { color: '#9BB5B4' }
                ]}>
                  {STATUS_LABELS[step]}
                </Text>
                {isCurrent && (
                  <Text style={styles.stepCurrent}>Current status</Text>
                )}
              </View>
            </View>
          )
        })}
      </View>

      {/* Booking Details */}
      <View style={styles.detailCard}>
        <Text style={styles.cardTitle}>Appointment Details</Text>
        <Text style={styles.service}>{booking.service}</Text>
        <Text style={styles.label}>📍 Address</Text>
        <Text style={styles.value}>{booking.address}</Text>
        {booking.address_note ? (
          <>
            <Text style={styles.label}>🏠 Note</Text>
            <Text style={styles.value}>{booking.address_note}</Text>
          </>
        ) : null}
        {booking.notes ? (
          <>
            <Text style={styles.label}>📝 Notes</Text>
            <Text style={styles.value}>{booking.notes}</Text>
          </>
        ) : null}
        {booking.confirmed_time ? (
                <>
                  <Text style={[styles.detailLabel, { color: 'rgba(255,255,255,0.5)' }]}>🕐 Confirmed for</Text>
                  <Text style={[styles.detailValue, { color: '#fff' }]}>
                    {new Date(booking.confirmed_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })} · {new Date(booking.confirmed_time).toLocaleDateString('en-US', { timeZone: company?.timezone || 'America/Phoenix' })}
                  </Text>
                </>
              ) : booking.requested_time ? (
                <>
                  <Text style={[styles.detailLabel, { color: 'rgba(255,255,255,0.5)' }]}>🕐 Scheduled for</Text>
                  <Text style={[styles.detailValue, { color: '#fff' }]}>
                    {new Date(booking.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: company?.timezone || 'America/Phoenix' })} · {new Date(booking.requested_time).toLocaleDateString('en-US', { timeZone: company?.timezone || 'America/Phoenix' })}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.detailLabel, { color: 'rgba(255,255,255,0.5)' }]}>🕐 Requested</Text>
                  <Text style={[styles.detailValue, { color: '#fff' }]}>As soon as possible</Text>
                </>
              )}
      </View>

{/* Live Tracking Map */}
      {booking.status === 'en_route' && techLocation && (
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Tech En Route</Text>
          <Text style={{ color: '#9BB5B4', fontSize: 13, marginBottom: 12 }}>
            {booking.tech_first} is on the way · Updated {new Date(techLocation.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <MapComponent lat={techLocation.lat} lng={techLocation.lng} techFirst={booking.tech_first} techLast={booking.tech_last} />
        </View>
      )}

      {/* Tech Info */}
      {booking.tech_first && (
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Your Tech</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            {booking.tech_photo ? (
              <Image
                source={{ uri: booking.tech_photo }}
                style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16, borderWidth: 2, borderColor: primaryColor }}
              />
            ) : (
              <View style={{ width: 64, height: 64, borderRadius: 32, marginRight: 16, borderWidth: 2, borderColor: primaryColor, backgroundColor: '#F7FBFB', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: primaryColor, fontSize: 22, fontWeight: '700' }}>
                  {booking.tech_first?.[0]}{booking.tech_last?.[0]}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.techName}>{booking.tech_first} {booking.tech_last}</Text>
              {booking.tech_phone && <Text style={styles.techPhone}>📞 {booking.tech_phone}</Text>}
              <Text style={{ color: '#9BB5B4', fontSize: 12, marginTop: 4 }}>Your IV Therapy Tech</Text>
            </View>
          </View>
        </View>
      )}

{(booking.status === 'confirmed' || booking.status === 'pending' || booking.status === 'assigned') && (
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: secondaryColor, borderWidth: 1, borderColor: primaryColor, marginBottom: 8 }]}
          onPress={() => navigation.navigate('PatientDispatchChat', {
            token,
            userId,
            company,
            bookingId,
          })}
        >
          <Text style={[styles.messageButtonText, { color: primaryColor }]}>
            💬 Message Dispatch
          </Text>
        </TouchableOpacity>
      )}

      {/* Actions */}
      {booking.status === 'en_route' && (
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: primaryColor }]}
          onPress={() => navigation.navigate('BookingChat', {
            token,
            userId,
            company,
            bookingId,
            patientName: booking.tech_first ? `${booking.tech_first} ${booking.tech_last}` : 'Your Tech'
          })}
        >
          <Text style={[styles.messageButtonText, { color: secondaryColor }]}>
            Message Your Tech
          </Text>
        </TouchableOpacity>
      )}

      {linkedCompanyId === null && booking?.company_id && (
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: 'rgba(76,175,80,0.15)', borderWidth: 1, borderColor: '#4CAF50', marginBottom: 8 }]}
          disabled={linkingCompany}
          onPress={async () => {
            setLinkingCompany(true)
            try {
              const res = await fetch(`${API_URL}/auth/my-companies`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              const compData = await res.json()
              const companyCode = compData.companies?.find(c => c.id === booking.company_id)?.code
              
              // Link using company_id directly
              const linkRes = await fetch(`${API_URL}/auth/link-by-id`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ companyId: booking.company_id })
              })
              const linkData = await linkRes.json()
              if (linkData.success) {
                setLinkedCompanyId(booking.company_id)
                Alert.alert('✅ Linked!', `You are now linked to ${linkData.company?.name || 'this company'}. You can now book directly with them!`)
              } else {
                Alert.alert('Error', linkData.message || 'Could not link')
              }
            } catch (err) {
              Alert.alert('Error', 'Network error')
            } finally {
              setLinkingCompany(false)
            }
          }}
        >
          {linkingCompany ? (
            <ActivityIndicator color="#4CAF50" />
          ) : (
            <Text style={[styles.messageButtonText, { color: '#4CAF50' }]}>
              🔗 Link to {booking?.company_name || 'this company'}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {canCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#f09090" />
          ) : (
            <Text style={styles.cancelText}>Cancel Appointment</Text>
          )}
        </TouchableOpacity>
      )}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF'
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    backgroundColor: '#FFFFFF'
  },
  centered: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    color: '#1A2E2E',
    fontSize: 16
  },
  stepperCard: {
    backgroundColor: '#F7FBFB',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,186,181,0.12)'
  },
  stepperTitle: {
    color: '#1A2E2E',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 20
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  stepLeft: {
    alignItems: 'center',
    width: 36,
    marginRight: 14
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDotText: {
    fontSize: 16
  },
  stepLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(10,186,181,0.15)',
    marginTop: 2
  },
  stepRight: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 20
  },
  stepLabel: {
    fontSize: 15,
    color: '#1A2E2E',
    fontWeight: '500'
  },
  stepCurrent: {
    fontSize: 12,
    color: '#9BB5B4',
    marginTop: 2
  },
  detailCard: {
    backgroundColor: '#F7FBFB',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(10,186,181,0.12)'
  },
  cardTitle: {
    color: '#0ABAB5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12
  },
  service: {
    color: '#1A2E2E',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16
  },
  label: {
    color: '#9BB5B4',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4
  },
  value: {
    color: '#1A2E2E',
    fontSize: 15
  },
  techName: {
    color: '#1A2E2E',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6
  },
  techPhone: {
    color: '#9BB5B4',
    fontSize: 14
  },
  messageButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '700'
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#f09090',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  cancelText: {
    color: '#f09090',
    fontSize: 15,
    fontWeight: '600'
  }
})