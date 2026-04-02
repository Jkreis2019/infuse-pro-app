import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native'
import { useState } from 'react'

const API_URL = 'https://api.infusepro.app'

const SERVICES = [
  { name: 'Hangover Rescue', price: '$149', duration: '60-75 min' },
  { name: 'Myers Cocktail', price: '$179', duration: '60-75 min' },
  { name: 'Immunity Boost', price: '$159', duration: '45-60 min' },
  { name: 'NAD+ Therapy', price: '$299', duration: '90-120 min' },
  { name: 'Migraine Relief', price: '$149', duration: '45-60 min' },
  { name: 'Energy Boost', price: '$139', duration: '45-60 min' },
]

export default function BookingScreen({ route, navigation }) {
  const { token, user, company } = route.params

  const [selectedService, setSelectedService] = useState(null)
  const [address, setAddress] = useState('')
  const [addressNote, setAddressNote] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submitBooking = async () => {
    if (!selectedService) {
      setError('Please select a service')
      return
    }
    if (!address.trim()) {
      setError('Please enter your address')
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
          notes
        })
      })
      const data = await response.json()
      if (data.success) {
        navigation.navigate('Home', {
          token,
          user,
          company,
          message: 'Booking submitted! We will confirm shortly.'
        })
      } else {
        setError(data.message || 'Something went wrong')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    }
    setLoading(false)
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Book an appointment</Text>
      <Text style={styles.subtitle}>{company.name} · {company.location}</Text>

      <Text style={styles.sectionLabel}>Select a service</Text>
      {SERVICES.map((service) => (
        <TouchableOpacity
          key={service.name}
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
            <Text style={styles.serviceDuration}>{service.duration}</Text>
          </View>
          <Text style={[styles.servicePrice, selectedService?.name === service.name && { color: company.primaryColor }]}>
            {service.price}
          </Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionLabel}>Your location</Text>
      <TextInput
        style={styles.input}
        placeholder="Street address"
        placeholderTextColor="#666"
        value={address}
        onChangeText={setAddress}
      />
      <TextInput
        style={styles.input}
        placeholder="Apt, suite, room number (optional)"
        placeholderTextColor="#666"
        value={addressNote}
        onChangeText={setAddressNote}
      />

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
            Submit booking request
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: 14, fontSize: 14, color: '#fff', marginBottom: 10 },
  textarea: { height: 80, textAlignVertical: 'top' },
  error: { color: '#f09090', fontSize: 13, marginTop: 8, marginBottom: 4 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  buttonText: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
})