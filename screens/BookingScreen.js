import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from 'react-native'
import { useState, useEffect } from 'react'
import { Calendar } from 'react-native-calendars'

const API_URL = 'https://api.infusepro.app'

export default function BookingScreen({ route, navigation }) {
  const { token, user, company } = route.params

  const [companyServices, setCompanyServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(true)
  const [selectedService, setSelectedService] = useState(null)
  const [address, setAddress] = useState('')
  const [loadingAddress, setLoadingAddress] = useState(true)
  const [addressNote, setAddressNote] = useState('')
  const [notes, setNotes] = useState('')
  const [ivCount, setIvCount] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Scheduling
 const [scheduleType, setScheduleType] = useState('now')
  const [selectedScheduleDate, setSelectedScheduleDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  })
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch(`${API_URL}/companies/${company?.id}/services`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success) {
          const services = data.services.slice(0, 10)
          services.push({ id: 'other', name: 'Other', description: 'Something else — dispatcher will follow up', price: null })
          setCompanyServices(services)
        }
      } catch (err) {
        console.error('Fetch services error:', err)
      } finally {
        setLoadingServices(false)
      }
    }
    fetchServices()
  }, [token])
useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.success && data.user?.homeAddress) {
          const parts = [data.user.homeAddress, data.user.city, data.user.state, data.user.zip].filter(Boolean)
          setAddress(parts.join(', '))
        }
      } catch (err) {
        console.error('Fetch profile error:', err)
      } finally {
        setLoadingAddress(false)
      }
    }
    fetchProfile()
  }, [token])

  const fetchSlots = async (date) => {
    setLoadingSlots(true)
    setSelectedSlot(null)
    try {
      const res = await fetch(`${API_URL}/schedule/available?date=${date}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setSlots(data.slots || [])
    } catch (err) {
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  const submitBooking = async () => {
    if (!selectedService) {
      setError('Please select a service')
      return
    }
    if (!address.trim()) {
      setError('Please enter your address')
      return
    }
    if (scheduleType === 'later' && !selectedSlot) {
      setError('Please select a time slot')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          patientName: `${user.firstName} ${user.lastName}`,
          service: selectedService.name,
          address,
          addressNote,
          notes,
          patientCount: ivCount,
          requestedTime: scheduleType === 'later' && selectedSlot ? selectedSlot.datetime : null,
          guestCompanyId: company?.id || null
        })
      })
      const data = await response.json()
      if (data.success) {
       setSelectedService(null)
        setAddress('')
        setAddressNote('')
        setNotes('')
        setIvCount(1)
        setScheduleType('now')
        setSelectedSlot(null)
        setError('')
       navigation.navigate('Home', { token, user, company })
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      console.log('Booking error:', err)
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Book an appointment</Text>
      <Text style={styles.subtitle}>{company.name} · {company.location}</Text>

      <Text style={styles.sectionLabel}>Select a service</Text>
      {loadingServices ? (
        <ActivityIndicator color={company.primaryColor} style={{ marginBottom: 16 }} />
      ) : companyServices.map((service) => (
        <TouchableOpacity
          key={service.id || service.name}
          style={[
            styles.serviceCard,
            selectedService?.name === service.name && {
              borderColor: company.primaryColor,
              backgroundColor: `${company.primaryColor}15`
            }
          ]}
          onPress={() => setSelectedService(service)}
        >
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            {service.description ? <Text style={styles.serviceDuration}>{service.description}</Text> : null}
          </View>
          {service.price ? (
            <Text style={[styles.servicePrice, selectedService?.name === service.name && { color: company.primaryColor }]}>
              ${service.price}
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionLabel}>When do you need us?</Text>
      <View style={styles.scheduleRow}>
        <TouchableOpacity
          style={[styles.scheduleBtn, scheduleType === 'now' && { backgroundColor: company.primaryColor, borderColor: company.primaryColor }]}
          onPress={() => setScheduleType('now')}
        >
          <Text style={[styles.scheduleBtnText, scheduleType === 'now' && { color: company.secondaryColor }]}>⚡ ASAP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.scheduleBtn, scheduleType === 'later' && { backgroundColor: company.primaryColor, borderColor: company.primaryColor }]}
          onPress={() => { setScheduleType('later'); fetchSlots(selectedScheduleDate) }}
        >
          <Text style={[styles.scheduleBtnText, scheduleType === 'later' && { color: company.secondaryColor }]}>📅 Schedule</Text>
        </TouchableOpacity>
      </View>

      {scheduleType === 'later' && (
        <View>
          <Calendar
            minDate={new Date().toISOString().split('T')[0]}
            onDayPress={(day) => { setSelectedScheduleDate(day.dateString); fetchSlots(day.dateString) }}
            markedDates={{
              [selectedScheduleDate]: { selected: true, selectedColor: company.primaryColor }
            }}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'rgba(255,255,255,0.05)',
              textSectionTitleColor: 'rgba(255,255,255,0.5)',
              selectedDayBackgroundColor: company.primaryColor,
              selectedDayTextColor: company.secondaryColor,
              todayTextColor: company.primaryColor,
              dayTextColor: '#fff',
              textDisabledColor: 'rgba(255,255,255,0.2)',
              monthTextColor: '#fff',
              arrowColor: company.primaryColor,
              borderRadius: 12,
            }}
            style={{ borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}
          />

          {/* Time slots */}
          {loadingSlots ? (
            <ActivityIndicator color={company.primaryColor} style={{ marginVertical: 16 }} />
          ) : !selectedScheduleDate ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginVertical: 16 }}>Select a date to see available times</Text>
          ) : slots.length === 0 ? (
            <Text style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginVertical: 16 }}>No availability on this day</Text>
          ) : (
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {slots.map(slot => (
                <TouchableOpacity
                  key={slot.time}
                  disabled={!slot.available}
                  style={[
                    styles.slotRow,
                    selectedSlot?.time === slot.time && { backgroundColor: company.primaryColor + '22', borderColor: company.primaryColor },
                    !slot.available && { opacity: 0.3 }
                  ]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotRowTime, selectedSlot?.time === slot.time && { color: company.primaryColor }]}>
                    {new Date(`2000-01-01T${slot.time}:00`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.slotRowStatus}>
                    {!slot.available ? (slot.reason === 'too_soon' ? 'Too soon' : 'Full') : `${slot.maxPerSlot - slot.booked} spot${slot.maxPerSlot - slot.booked !== 1 ? 's' : ''} left`}
                  </Text>
                  {selectedSlot?.time === slot.time && <Text style={{ color: company.primaryColor, fontWeight: '700' }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      

      <Text style={styles.sectionLabel}>Your location</Text>
      {loadingAddress ? (
        <ActivityIndicator color={company.primaryColor} style={{ marginBottom: 10 }} />
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Street address"
            placeholderTextColor="#666"
            value={address}
            onChangeText={setAddress}
          />
          {address ? <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: -6, marginBottom: 8 }}>Pre-filled from your profile — tap to edit</Text> : null}
        </>
      )}
      <TextInput
        style={styles.input}
        placeholder="Apt, suite, room number (optional)"
        placeholderTextColor="#666"
        value={addressNote}
        onChangeText={setAddressNote}
      />

<Text style={styles.sectionLabel}>How many IVs? (including yourself)</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 16, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setIvCount(prev => Math.max(1, (typeof prev === 'number' ? prev : 1) - 1))}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '300' }}>−</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: company.primaryColor, fontSize: 32, fontWeight: '800' }}>{ivCount}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{ivCount === 1 ? 'person' : 'people'}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setIvCount(prev => Math.min(50, (typeof prev === 'number' ? prev : 1) + 1))}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: company.primaryColor, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: company.secondaryColor, fontSize: 22, fontWeight: '300' }}>＋</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Notes for your tech</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Symptoms, allergies, access instructions..."
        placeholderTextColor="#666"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.button, { backgroundColor: company.primaryColor }]}
        onPress={submitBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={company.secondaryColor} />
        ) : (
          <Text style={[styles.buttonText, { color: company.secondaryColor }]}>
            {scheduleType === 'later' ? 'Schedule appointment' : 'Submit booking request'}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  content: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '600', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontWeight: '300' },
  sectionLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(201,168,76,0.7)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, marginTop: 20 },
  serviceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 14, marginBottom: 8 },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 14, fontWeight: '500', color: '#fff', marginBottom: 2 },
  serviceDuration: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '300' },
  servicePrice: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  scheduleRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  scheduleBtn: { flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 14, alignItems: 'center' },
  scheduleBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  dateTimeRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dateTimeBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, alignItems: 'center' },
  dateTimeBtnText: { color: '#fff', fontSize: 14 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff', marginBottom: 10 },
  textarea: { height: 80, textAlignVertical: 'top' },
  error: { color: '#f09090', fontSize: 13, marginTop: 8, marginBottom: 4 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  dateChip: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: 10, marginRight: 8, alignItems: 'center', minWidth: 64 },
  dateChipDay: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  dateChipDate: { fontSize: 13, color: '#fff', fontWeight: '600' },
  slotBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14 },
  slotBtnText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  slotRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, marginBottom: 8, backgroundColor: 'rgba(255,255,255,0.04)' },
  slotRowTime: { fontSize: 15, color: '#fff', fontWeight: '600' },
  slotRowStatus: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
})