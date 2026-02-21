
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, useColorScheme, Animated, ActivityIndicator, Alert, Linking } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { BLOOD_GROUPS } from '@/constants/data';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import { Platform } from 'react-native';
import Location from '@/utils/Location';
import MapView, { Marker, Callout } from '@/utils/Maps';

interface Donor {
  id: string;
  _id: string;
  name: string;
  bloodGroup: string;
  location: string;
  phone: string;
  isAvailable: boolean;
  avatar?: string;
  coordinates?: {
    coordinates: [number, number];
  };
}

export default function DonorsScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const theme = Colors[colorScheme];

  const { user } = useAuth();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapMode, setIsMapMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<any>(null);

  useEffect(() => {
    fetchDonors();
    getUserLocation();
  }, [selectedGroup]);

  useFocusEffect(
    useCallback(() => {
      fetchDonors();
    }, [selectedGroup])
  );

  const getUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
      }
    } catch (e) {
      console.log('Error getting location', e);
    }
  };

  const fetchDonors = async () => {
    setIsLoading(true);
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
    try {
      let url = `${baseUrl}/donors?role=donor&isAvailable=true`;
      if (selectedGroup) {
        url += `&bloodGroup=${encodeURIComponent(selectedGroup)}`;
      }

      const response = await axios.get(url);
      setDonors(response.data.data);
    } catch (error) {
      console.error('Error fetching donors', error);
      Alert.alert('Error', 'Failed to load donors');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDonors = useMemo(() => {
    return donors.filter(donor => {
      // Local search filtering
      const name = donor.name || '';
      const loc = donor.location || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.toLowerCase().includes(searchQuery.toLowerCase());

      // Secondary filter check (backend should already have filtered this, 
      // but good for UI consistency if there's any lag in state updates)
      const matchesGroup = selectedGroup ? donor.bloodGroup === selectedGroup : true;

      // Ensure only available donors are shown
      const isDonorAvailable = donor.isAvailable === true;

      return matchesSearch && matchesGroup && isDonorAvailable;
    });
  }, [searchQuery, donors, selectedGroup]);

  const handleCall = (phone: string) => {
    if (!phone) {
      Alert.alert('Error', 'Phone number not available for this donor.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(err => {
      Alert.alert('Error', 'Failed to open dialer. Please call manually.');
      console.error('Linking error:', err);
    });
  };

  const DonorCard = ({ item }: { item: Donor }) => (
    <View style={[styles.donorCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.donorHeader}>
        <View style={[styles.bloodBadge, { backgroundColor: theme.primary }]}>
          <Text style={styles.bloodText}>{item.bloodGroup}</Text>
        </View>
        <View style={styles.donorMainInfo}>
          <Text style={[styles.donorName, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location" size={14} color={theme.textSecondary} />
            <Text style={[styles.donorLoc, { color: theme.textSecondary }]}>{item.location}</Text>
          </View>
        </View>
        <View style={styles.availability}>
          <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? theme.success : theme.error }]} />
          <Text style={[styles.statusText, { color: item.isAvailable ? theme.success : theme.error }]}>
            {item.isAvailable ? 'Available' : 'Busy'}
          </Text>
        </View>
      </View>

      <View style={styles.donorFooter}>
        <View style={styles.footerDetail}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Phone</Text>
          <Text style={[styles.detailValue, { color: theme.text }]}>{item.phone}</Text>
        </View>
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: item.isAvailable ? theme.primary : theme.textSecondary }]}
          disabled={!item.isAvailable}
          onPress={() => handleCall(item.phone)}
        >
          <Ionicons name="call" size={18} color="#FFF" />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Find Donors</Text>
          <TouchableOpacity
            style={styles.toggleBtn}
            onPress={() => setIsMapMode(!isMapMode)}
          >
            <Ionicons name={isMapMode ? "list" : "map"} size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search by name or location..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={[styles.filterTitle, { color: theme.text }]}>Blood Group</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={BLOOD_GROUPS}
          keyExtractor={item => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedGroup(selectedGroup === item ? null : item)}
              style={[
                styles.filterChip,
                { backgroundColor: selectedGroup === item ? theme.primary : theme.surface, borderColor: theme.border }
              ]}
            >
              <Text style={[styles.filterChipText, { color: selectedGroup === item ? '#FFF' : theme.text }]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 10, color: theme.textSecondary }}>Searching for heroes...</Text>
        </View>
      ) : isMapMode ? (
        <View style={styles.mapWrapper}>
          {Platform.OS === 'web' ? (
            <View style={styles.webPlaceholder}>
              <Ionicons name="map-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.webPlaceholderText, { color: theme.textSecondary }]}>
                Interactive Map is available on our Mobile App!
              </Text>
              <Text style={{ color: theme.textSecondary, marginTop: 8 }}>
                Please use the List View for now.
              </Text>
              <TouchableOpacity
                style={[styles.toggleBtn, { backgroundColor: theme.primary, marginTop: 20, width: 150 }]}
                onPress={() => setIsMapMode(false)}
              >
                <Text style={{ color: '#FFF', fontWeight: 'bold' }}>See List View</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <MapView
              style={styles.map}
              initialRegion={{
                latitude: userLocation?.latitude || 28.6139,
                longitude: userLocation?.longitude || 77.2090,
                latitudeDelta: 0.1,
                longitudeDelta: 0.1,
              }}
            >
              {userLocation && (
                <Marker
                  coordinate={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }}
                  title="You are here"
                  pinColor="blue"
                />
              )}
              {filteredDonors.map((donor) => (
                donor.coordinates && (
                  <Marker
                    key={donor._id}
                    coordinate={{
                      latitude: donor.coordinates.coordinates[1],
                      longitude: donor.coordinates.coordinates[0],
                    }}
                    title={donor.name}
                    description={`Blood Group: ${donor.bloodGroup}`}
                  >
                    <Callout>
                      <View style={styles.calloutContainer}>
                        <Text style={styles.calloutTitle}>{donor.name}</Text>
                        <Text style={styles.calloutSubtitle}>{donor.bloodGroup} Donor</Text>
                        <Text style={styles.calloutSubtitle}>{donor.phone}</Text>
                      </View>
                    </Callout>
                  </Marker>
                )
              ))}
            </MapView>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDonors}
          keyExtractor={item => item._id}
          renderItem={({ item }) => <DonorCard item={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={80} color={theme.border} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No donors found matching your criteria</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  calloutContainer: {
    padding: 10,
    minWidth: 150,
  },
  calloutTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  webPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 24,
    margin: Spacing.lg,
  },
  webPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterSection: {
    padding: Spacing.lg,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.sm,
  },
  filterList: {
    paddingRight: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: Spacing.sm,
    borderWidth: 1,
    minWidth: 50,
    alignItems: 'center',
  },
  filterChipText: {
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 100,
  },
  donorCard: {
    borderRadius: 20,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  donorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  bloodBadge: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bloodText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  donorMainInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  donorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  donorLoc: {
    fontSize: 13,
    marginLeft: 4,
  },
  availability: {
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  donorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.md,
  },
  footerDetail: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  contactButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    marginTop: Spacing.md,
    fontSize: 16,
    textAlign: 'center',
  }
});
