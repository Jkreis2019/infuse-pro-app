import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native'

const API_URL = 'https://api.infusepro.app'

export default function MembershipsScreen({ route, navigation }) {
  const { token, user, company, membershipPlans = [], activeMembership } = route.params
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [policyModal, setPolicyModal] = useState(false)
  const [policyAgreed, setPolicyAgreed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  const primaryColor = company?.primaryColor || '#C9A84C'
  const secondaryColor = company?.secondaryColor || '#0D1B4B'
  const headers = { Authorization: `Bearer ${token}` }

  return (
    <>
    <ScrollView style={{ flex: 1, backgroundColor: '#0D1B4B' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
          <Text style={{ color: primaryColor, fontSize: 28, lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Memberships</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{company.name}</Text>
        </View>
      </View>

      {/* Active membership */}
      {activeMembership && (
        <View style={{ backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(201,168,76,0.3)' }}>
          <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8 }}>YOUR MEMBERSHIP</Text>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 4 }}>{activeMembership.plan_name}</Text>
          <View style={{ height: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 4, marginVertical: 12 }}>
            <View style={{ height: 8, backgroundColor: primaryColor, borderRadius: 4, width: `${Math.min((activeMembership.redemptions_this_cycle / (activeMembership.max_redemptions_per_cycle === 999 ? activeMembership.redemptions_this_cycle + 1 : activeMembership.max_redemptions_per_cycle)) * 100, 100)}%` }} />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
            {activeMembership.redemptions_this_cycle} of {activeMembership.max_redemptions_per_cycle === 999 ? 'unlimited' : activeMembership.max_redemptions_per_cycle} visits used this month
          </Text>
          {activeMembership.current_cycle_end && (
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 6 }}>
              Renews {new Date(activeMembership.current_cycle_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </Text>
          )}
        </View>
      )}

      {/* Plans */}
      <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
        {activeMembership ? 'AVAILABLE PLANS' : 'CHOOSE A PLAN'}
      </Text>

      {membershipPlans.map(plan => (
        <View key={plan.id} style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, marginBottom: 14, borderWidth: 1, borderColor: activeMembership?.plan_id === plan.id ? primaryColor : 'rgba(255,255,255,0.1)' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>🏅 {plan.name}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: primaryColor, fontSize: 20, fontWeight: '800' }}>${plan.price}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>/{plan.billing_cycle === 'yearly' ? 'year' : 'month'}</Text>
            </View>
          </View>
          {plan.description && <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 20, marginBottom: 10 }}>{plan.description}</Text>}
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 16 }}>
            {plan.max_redemptions_per_cycle === 999 ? 'Unlimited' : plan.max_redemptions_per_cycle} visits/{plan.billing_cycle === 'yearly' ? 'year' : 'month'}
          </Text>

          {activeMembership?.plan_id === plan.id ? (
            <View style={{ backgroundColor: 'rgba(76,175,80,0.15)', borderRadius: 10, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 14 }}>✓ Your Current Plan</Text>
            </View>
          ) : plan.stripe_price_id ? (
            <TouchableOpacity
              style={{ backgroundColor: primaryColor, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={() => { setSelectedPlan(plan); setPolicyAgreed(false); setPolicyModal(true) }}
            >
              <Text style={{ color: secondaryColor, fontWeight: '700', fontSize: 15 }}>Subscribe — ${plan.price}/mo</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Contact us to enroll</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>

    {/* Policy Modal */}
    {policyModal && selectedPlan && (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <View style={{ backgroundColor: '#0D1B4B', borderRadius: 20, width: '100%', maxWidth: 420, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <View style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)', padding: 20 }}>
            <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 4 }}>MEMBERSHIP</Text>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{selectedPlan.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>${selectedPlan.price}/month</Text>
          </View>
          <ScrollView style={{ padding: 20, maxHeight: 300 }}>
            {selectedPlan.cancellation_policy ? (
              <>
                <Text style={{ color: primaryColor, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>CANCELLATION POLICY</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 22, marginBottom: 16 }}>{selectedPlan.cancellation_policy}</Text>
              </>
            ) : (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>You can cancel your membership at any time.</Text>
            )}
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }} onPress={() => setPolicyAgreed(!policyAgreed)}>
              <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: policyAgreed ? primaryColor : 'rgba(255,255,255,0.3)', backgroundColor: policyAgreed ? primaryColor : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {policyAgreed && <Text style={{ color: '#000', fontSize: 14, fontWeight: '700' }}>✓</Text>}
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, flex: 1 }}>I agree to the cancellation policy and authorize recurring charges of ${selectedPlan.price}/month</Text>
            </TouchableOpacity>
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
            <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 14, alignItems: 'center' }} onPress={() => setPolicyModal(false)}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 2, backgroundColor: policyAgreed ? primaryColor : 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 14, alignItems: 'center', opacity: subscribing ? 0.6 : 1 }}
              disabled={!policyAgreed || subscribing}
              onPress={async () => {
                setSubscribing(true)
                try {
                  const res = await fetch(`${API_URL}/memberships/subscribe`, {
                    method: 'POST',
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ planId: selectedPlan.id })
                  })
                  const data = await res.json()
                  if (data.url) { setPolicyModal(false); Linking.openURL(data.url) }
                  else Alert.alert('Error', data.error || 'Could not start subscription')
                } catch (e) { Alert.alert('Error', 'Network error') } finally { setSubscribing(false) }
              }}
            >
              {subscribing ? <ActivityIndicator color={secondaryColor} /> : <Text style={{ color: policyAgreed ? secondaryColor : 'rgba(255,255,255,0.3)', fontWeight: '700', fontSize: 15 }}>Proceed to Checkout</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )}
    </>
  )
}
