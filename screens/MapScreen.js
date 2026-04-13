import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Linking } from 'react-native'
import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
const MapView = Platform.select({
  web: () => null,
  default: require('react-native-maps').default,
})
const Marker = Platform.select({
  web: () => null,
  default: require('react-native-maps').Marker,
})

const API_URL = 'https://api.infusepro.app'

const PHOENIX_REGION = {
  latitude: 33.4484,
  longitude: -112.0740,
  latitudeDelta: 0.8,
  longitudeDelta: 0.8,
}

export default function MapScreen({ route, navigation }) {
  const { token, user, company, bookingMode } = route.params || {}
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch(`${API_URL}/map/companies`)
      const data = await response.json()
      if (data.success) setCompanies(data.companies)
    } catch (err) {
      console.error('Error fetching companies:', err)
    }
    setLoading(false)
  }

  const handleBook = (company) => {
    setSelected(null)
    navigation.navigate('Booking', {
      token,
      user,
      company: {
        id: company.id,
        name: company.name,
        code: company.code,
        primaryColor: company.branding.primaryColor,
        secondaryColor: company.branding.secondaryColor,
        location: company.location,
      }
    })
  }

  return (
    <View style={styles.container}>
      {bookingMode && (
        <View style={styles.bookingBanner}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#5BBFB5', fontSize: 14, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.bookingBannerText}>Select a company to book with</Text>
          <View style={{ width: 60 }} />
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#5BBFB5" size="large" />
          <Text style={styles.loadingText}>Finding companies near you...</Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            initialRegion={PHOENIX_REGION}
            userInterfaceStyle="dark"
          >
            {companies.map((company) => (
              <Marker
                key={company.id}
                coordinate={company.latitude && company.longitude 
                  ? { latitude: company.latitude, longitude: company.longitude }
                  : { latitude: 33.4484, longitude: -112.0740 }}
                onPress={() => setSelected(company)}
              >
                <View style={[
                  styles.pin,
                  { backgroundColor: company.branding.primaryColor },
                  company.listingTier === 'premium' && styles.premiumPin
                ]}>
                  <Text style={[styles.pinText, { color: company.branding.secondaryColor }]}>
                    {company.listingTier === 'premium' ? company.name : '💉'}
                  </Text>
                </View>
              </Marker>
            ))}
          </MapView>

          {selected ? (
            <View style={[styles.companyCard, { borderColor: selected.branding.primaryColor }]}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              <Text style={[styles.companyName, { color: selected.branding.primaryColor }]}>
                {selected.name}
              </Text>
              <Text style={styles.companyLocation}>{selected.location}</Text>
              {selected.platformActive && selected.bio ? <Text style={styles.companyBio}>{selected.bio}</Text> : null}
              {selected.phone ? <Text style={styles.companyPhone}>📞 {selected.phone}</Text> : null}
              {selected.googleRating && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Text style={{ color: '#FFD700', fontSize: 16 }}>
                    {'★'.repeat(Math.round(selected.googleRating))}{'☆'.repeat(5 - Math.round(selected.googleRating))}
                  </Text>
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>{selected.googleRating}</Text>
                  {selected.googleRatingCount && (
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>({selected.googleRatingCount} reviews)</Text>
                  )}
                </View>
              )}


              <View style={styles.cardFooter}>
                {/* Left side - call or code */}
                {selected.platformActive ? (
                  <View>
                    <Text style={styles.codeLabel}>Company code</Text>
                    <Text style={[styles.code, { color: selected.branding.primaryColor }]}>{selected.code}</Text>
                  </View>
                ) : (
                  selected.phone ? (
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
                      <Text style={styles.codeLabel}>Call to book</Text>
                      <Text style={[styles.code, { color: selected.branding.primaryColor, fontSize: 15 }]}>{selected.phone}</Text>
                    </TouchableOpacity>
                  ) : <View />
                )}

                {/* Right side - book or join */}
                {selected.platformActive ? (
                  bookingMode ? (
                    <TouchableOpacity
                      style={[styles.joinButton, { backgroundColor: selected.branding.primaryColor }]}
                      onPress={() => handleBook(selected)}
                    >
                      <Text style={[styles.joinText, { color: selected.branding.secondaryColor }]}>Book Now →</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.joinButton, { backgroundColor: selected.branding.primaryColor }]}
                      onPress={() => { setSelected(null); navigation.navigate('Signup') }}
                    >
                      <Text style={[styles.joinText, { color: selected.branding.secondaryColor }]}>Join →</Text>
                    </TouchableOpacity>
                  )
                ) : (
                  selected.phone ? (
                    <TouchableOpacity
                      style={[styles.joinButton, { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                      onPress={() => Linking.openURL(`tel:${selected.phone}`)}
                    >
                      <Text style={[styles.joinText, { color: '#fff' }]}>📞 Call</Text>
                    </TouchableOpacity>
                  ) : null
                )}
              </View>
            </View>
          ) : (
            <View style={styles.hint}>
              <Text style={styles.hintText}>
                {bookingMode ? '👆 Tap a pin to book with a company' : 'Tap a pin to see company details'}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B4B' },
  map: { flex: 1 },
  bookingBanner: { backgroundColor: '#0D1B4B', paddingTop: 56, paddingBottom: 14, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: 'rgba(201,168,76,0.2)' },
  bookingBannerText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  pin: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, maxWidth: 140 },
  premiumPin: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  pinText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  companyCard: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#0D1B4B', borderWidth: 1.5, borderRadius: 16, padding: 18 },
  closeButton: { position: 'absolute', top: 12, right: 12, padding: 6 },
  closeText: { color: 'rgba(255,255,255,0.4)', fontSize: 16 },
  companyName: { fontSize: 20, fontWeight: '600', marginBottom: 3, paddingRight: 24 },
  companyLocation: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: '300' },
  companyBio: { fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 19, marginBottom: 10 },
  companyPhone: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  codeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 },
  code: { fontSize: 20, fontWeight: '700', letterSpacing: 3 },
  joinButton: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  joinText: { fontSize: 14, fontWeight: '600' },
  hint: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: 'rgba(13,27,75,0.9)', borderRadius: 12, padding: 14, alignItems: 'center' },
  hintText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
})