import React from 'react'
import MapView, { Marker } from 'react-native-maps'

export default function MapComponent({ lat, lng, techFirst, techLast }) {
  return (
    <MapView
      style={{ height: 200, borderRadius: 10, overflow: 'hidden' }}
      region={{ latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 }}
    >
      <Marker coordinate={{ latitude: lat, longitude: lng }} title={`${techFirst} ${techLast}`} description="Your tech" />
    </MapView>
  )
}