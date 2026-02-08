
import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, useColorScheme, Animated } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { mockDonors, BLOOD_GROUPS, Donor } from '@/constants/data';
import { Ionicons } from '@expo/vector-icons';

export default function DonorsScreen() {
  const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
  const theme = Colors[colorScheme];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredDonors = useMemo(() => {
    return mockDonors.filter(donor => {
      const matchesSearch = donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        donor.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGroup = selectedGroup ? donor.bloodGroup === selectedGroup : true;
      return matchesSearch && matchesGroup;
    });
  }, [searchQuery, selectedGroup]);

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
          <View style={[styles.statusDot, { backgroundColor: item.available ? theme.success : theme.error }]} />
          <Text style={[styles.statusText, { color: item.available ? theme.success : theme.error }]}>
            {item.available ? 'Available' : 'Busy'}
          </Text>
        </View>
      </View>

      <View style={styles.donorFooter}>
        <View style={styles.footerDetail}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Distance</Text>
          <Text style={[styles.detailValue, { color: theme.text }]}>{item.distance}</Text>
        </View>
        <View style={styles.footerDetail}>
          <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Last Donated</Text>
          <Text style={[styles.detailValue, { color: theme.text }]}>{item.lastDonated}</Text>
        </View>
        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: item.available ? theme.primary : theme.textSecondary }]}
          disabled={!item.available}
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
        <Text style={styles.headerTitle}>Find Donors</Text>
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

      <FlatList
        data={filteredDonors}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <DonorCard item={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={80} color={theme.border} />
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No donors found matching your criteria</Text>
          </View>
        }
      />
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
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: Spacing.md,
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
