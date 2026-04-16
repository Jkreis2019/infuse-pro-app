import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Linking, TextInput } from 'react-native'
import { useState, useEffect } from 'react'
import { Platform } from 'react-native'
import * as Location from 'expo-location'
const MapView = Platform.select({
  web: () => null,
  default: require('react-native-maps').default,
})
const Marker = Platform.select({
  web: () => null,
  default: require('react-native-maps').Marker,
})

const API_URL = 'https://api.infusepro.app'

const DEFAULT_REGION = {
  latitude: 33.4484,
  longitude: -112.0740,
  latitudeDelta: 0.8,
  longitudeDelta: 0.8,
}

export default function MapScreen({ route, navigation }) {
  const { token, user, company, bookingMode } = route.params || {}
  const [companies, setCompanies] = useState([])
  const [filteredCompanies, setFilteredCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [region, setRegion] = useState(DEFAULT_REGION)
  const [citySearch, setCitySearch] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    getLocationAndLoad()
  }, [])

  const getLocationAndLoad = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        setRegion({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.8,
          longitudeDelta: 0.8,
        })
        // Reverse geocode to get city
        const geocode = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
        if (geocode[0]?.city) {
          const city = `${geocode[0].city}, ${geocode[0].region}`
          setCitySearch(city)
          await fetchCompanies(geocode[0].city)
          return
        }
      }
    } catch (err) {
      console.error('Location error:', err)
    }
    await fetchCompanies()
  }

  const fetchCompanies = async (city = '') => {
    try {
      const url = city ? `${API_URL}/map/companies?city=${encodeURIComponent(city)}` : `${API_URL}/map/companies`
      const response = await fetch(url)
      const data = await response.json()
      if (data.success) {
        setCompanies(data.companies)
        setFilteredCompanies(data.companies)
      }
    } catch (err) {
      console.error('Error fetching companies:', err)
    }
    setLoading(false)
  }

  const handleCitySearch = async (text) => {
    setCitySearch(text)
    setSelected(null)
    if (text.length < 2) {
      setFilteredCompanies(companies)
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`${API_URL}/map/companies?city=${encodeURIComponent(text)}`)
      const data = await res.json()
      if (data.success) setFilteredCompanies(data.companies)
    } catch (err) {}
    setSearching(false)
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
            <Text style={{ color: '#C9A84C', fontSize: 14, fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.bookingBannerText}>Select a company to book with</Text>
          <View style={{ width: 60 }} />
        </View>
      )}

      <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#0D1B4B', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10, paddingHorizontal: 12 }}>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            style={{ flex: 1, color: '#fff', fontSize: 15, paddingVertical: 10 }}
            placeholder="Search by city (e.g. Phoenix, AZ)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={citySearch}
            onChangeText={handleCitySearch}
          />
          {searching && <ActivityIndicator color="#C9A84C" size="small" />}
          {citySearch.length > 0 && !searching && (
            <TouchableOpacity onPress={() => { setCitySearch(''); setFilteredCompanies(companies) }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18, paddingLeft: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {filteredCompanies.length === 0 && !loading && citySearch.length > 0 && (
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginTop: 8 }}>No companies found in "{citySearch}"</Text>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#C9A84C" size="large" />
          <Text style={styles.loadingText}>Finding companies near you...</Text>
        </View>
      ) : (
        <>
          <MapView
            style={styles.map}
            initialRegion={region}
            userInterfaceStyle="dark"
          >
            {filteredCompanies.map((company) => (
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
              <TouchableOpacity style={styles.closeButton} onPress={() => setSelected(null)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>

              {selected.promoText && (
                <View style={{ backgroundColor: selected.branding.primaryColor + '25', borderWidth: 1, borderColor: selected.branding.primaryColor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10 }}>
                  <Text style={{ color: selected.branding.primaryColor, fontSize: 12, fontWeight: '700' }}>🏷️ {selected.promoText}</Text>
                </View>
              )}
              <Text style={[styles.companyName, { color: selected.branding.primaryColor }]}>
                {selected.name}
              </Text>
              <Text style={styles.companyLocation}>{selected.location}</Text>
              {selected.phone ? <Text style={styles.companyPhone}>📞 {selected.phone}</Text> : null}
              {selected.website && ['growth', 'scale', 'legacy'].includes(selected.listingTier) ? (
                <TouchableOpacity onPress={() => Linking.openURL(selected.website)}>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 }}>🌐 {selected.website.replace('https://','').replace('http://','')}</Text>
                </TouchableOpacity>
              ) : null}
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
                {/* Left side */}
                {selected.phone ? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${selected.phone}`)}>
                    <Text style={styles.codeLabel}>📞 Call</Text>
                    <Text style={[styles.code, { color: selected.branding.primaryColor, fontSize: 15 }]}>{selected.phone}</Text>
                  </TouchableOpacity>
                ) : <View />}

                {/* Right side - tiered actions */}
                {(() => {
                  const tier = selected.listingTier
                  const hasBooking = ['starter', 'solo', 'growth', 'scale', 'legacy'].includes(tier) && selected.platformActive
                  if (hasBooking) {
                    return bookingMode ? (
                      <TouchableOpacity
                        style={[styles.joinButton, { backgroundColor: selected.isOpen === false ? 'rgba(255,255,255,0.15)' : selected.branding.primaryColor }]}
                        onPress={() => selected.isOpen !== false && handleBook(selected)}
                        disabled={selected.isOpen === false}
                      >
                        <Text style={[styles.joinText, { color: selected.isOpen === false ? 'rgba(255,255,255,0.4)' : selected.branding.secondaryColor }]}>
                          {selected.isOpen === false ? 'Closed' : 'Book Now →'}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.joinButton, { backgroundColor: selected.branding.primaryColor }]}
                        onPress={() => { setSelected(null); navigation.navigate('Signup') }}
                      >
                        <Text style={[styles.joinText, { color: selected.branding.secondaryColor }]}>Join →</Text>
                      </TouchableOpacity>
                    )
                  }
                  return null
                })()}
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