import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native'

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

  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'

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
    const interval = setInterval(fetchBooking, 15000)
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
        headers: { Authorization: `Bearer ${token}` }
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
  const canCancel = ['pending', 'confirmed', 'en_route'].includes(booking.status)
  const canMessage = ['en_route', 'on_scene'].includes(booking.status)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

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
                  isPending && { backgroundColor: 'rgba(255,255,255,0.15)' }
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
                  isPending && { color: 'rgba(255,255,255,0.3)' }
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
        <Text style={styles.label}>🕐 Requested</Text>
        <Text style={styles.value}>
          {booking.requested_time
            ? new Date(booking.requested_time).toLocaleString()
            : 'As soon as possible'}
        </Text>
      </View>

      {/* Tech Info */}
      {booking.tech_first && (
        <View style={styles.detailCard}>
          <Text style={styles.cardTitle}>Your Tech</Text>
          <Text style={styles.techName}>
            {booking.tech_first} {booking.tech_last}
          </Text>
          {booking.tech_phone && (
            <Text style={styles.techPhone}>📞 {booking.tech_phone}</Text>
          )}
        </View>
      )}

      {/* Actions */}
      {canMessage && (
        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: primaryColor }]}
          onPress={() => Alert.alert('Coming soon', 'Chat with dispatch coming soon!')}
        >
          <Text style={[styles.messageButtonText, { color: secondaryColor }]}>
            💬 Message Dispatch
          </Text>
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
    backgroundColor: '#0D1B4B'
  },
  content: {
    padding: 20,
    paddingBottom: 48
  },
  centered: {
    flex: 1,
    backgroundColor: '#0D1B4B',
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorText: {
    color: '#fff',
    fontSize: 16
  },
  stepperCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16
  },
  stepperTitle: {
    color: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 2
  },
  stepRight: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 20
  },
  stepLabel: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500'
  },
  stepCurrent: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2
  },
  detailCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16
  },
  cardTitle: {
    color: 'rgba(201,168,76,0.8)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12
  },
  service: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4
  },
  value: {
    color: '#fff',
    fontSize: 15
  },
  techName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6
  },
  techPhone: {
    color: 'rgba(255,255,255,0.6)',
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