import React, { useState } from 'react';
import {
  StyleSheet, View, Text, ScrollView, TouchableOpacity,
  TextInput, useColorScheme, ActivityIndicator, Platform
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { requestService } from '@/utils/api';
import { router } from 'expo-router';
import { useToast } from '@/context/ToastContext';
import { KNOWN_HOSPITALS, KNOWN_LOCATIONS, } from '@/constants/data';
import SearchableSelect, { SelectOption } from '@/components/SearchableSelect';

// ─── Helpers ──────────────────────────────────────────────────────────────
// Build option lists once (stable reference via module scope → fast)
const HOSPITAL_OPTIONS: SelectOption[] = KNOWN_HOSPITALS.map(h => ({
  value: h.name,
  label: h.name,
  sublabel: h.city,
}));

const LOCATION_OPTIONS: SelectOption[] = KNOWN_LOCATIONS.map(loc => ({
  value: loc,
  label: loc,
}));

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCIES = [
  { label: 'Normal', color: '#4CAF50' },
  { label: 'Urgent', color: '#FF9800' },
  { label: 'Critical', color: '#D32F2F' },
];

// ─── Plain text input sub-component ──────────────────────────────────────
interface InputFieldProps {
  label: string;
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: 'default' | 'numeric' | 'phone-pad';
}
const InputField = ({ label, icon, placeholder, value, onChange, keyboardType = 'default' }: InputFieldProps) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name={icon as any} size={20} color={theme.textSecondary} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: theme.text, outlineStyle: 'none' } as any]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────
export default function RequestBloodScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [form, setForm] = useState({
    patientName: '',
    bloodGroup: '',
    hospital: '',
    location: '',
    units: '',
    urgency: 'Normal',
    contact: '',
  });

  // Track whether any hospital was chosen from the list — if so we can
  // auto-suggest its city as location (nice UX touch).
  const handleHospitalSelect = (name: string) => {
    const match = KNOWN_HOSPITALS.find(h => h.name === name);
    setForm(prev => ({
      ...prev,
      hospital: name,
      // Auto-fill location only if empty so we don't overwrite user's choice
      location: prev.location || match?.city || prev.location,
    }));
  };

  const handleSubmit = async () => {
    const missing: string[] = [];
    if (!form.bloodGroup) missing.push('Blood Group');
    if (!form.location) missing.push('Location');
    if (!form.contact) missing.push('Contact Number');

    if (missing.length > 0) {
      showToast({ message: `Please fill in: ${missing.join(', ')}`, type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await requestService.createRequest({
        ...form,
        units: Number(form.units) || 1,
      });

      router.back();
      setTimeout(() =>
        showToast({ message: 'Blood request posted successfully!', type: 'success' }),
        100
      );
    } catch (error: any) {
      showToast({
        message: error.response?.data?.error || 'Failed to post request',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isComplete = Boolean(form.bloodGroup && form.location && form.contact);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={Platform.OS === 'web' ? styles.webCenterWrapper : null}>
        <View style={styles.scrollContent}>

          {/* Title */}
          <Text style={[styles.title, { color: theme.text }]}>Blood Request Details</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Fill this form to notify nearby donors immediately.
          </Text>

          {/* ── Blood Group ──────────────────────────────────── */}
          <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>
            Blood Group Needed <Text style={{ color: theme.error }}>*</Text>
          </Text>
          <View style={styles.bloodGroupsGrid}>
            {BLOOD_GROUPS.map(group => (
              <TouchableOpacity
                key={group}
                onPress={() => setForm(f => ({ ...f, bloodGroup: group }))}
                style={[
                  styles.bloodChip,
                  {
                    backgroundColor: form.bloodGroup === group ? theme.primary : theme.surface,
                    borderColor: form.bloodGroup === group ? theme.primary : theme.border,
                  }
                ]}
              >
                <Text style={[
                  styles.bloodChipText,
                  { color: form.bloodGroup === group ? '#FFF' : theme.text }
                ]}>
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Patient Name ─────────────────────────────────── */}
          <InputField
            label="Patient Name (Optional)"
            icon="person-outline"
            placeholder="Enter patient name"
            value={form.patientName}
            onChange={v => setForm(f => ({ ...f, patientName: v }))}
          />

          {/* ── Hospital — Searchable Select ──────────────────── */}
          <SearchableSelect
            label="Hospital / Clinic"
            icon="business-outline"
            placeholder="Search and select a hospital…"
            options={HOSPITAL_OPTIONS}
            value={form.hospital}
            onSelect={handleHospitalSelect}
            allowCustom={true}
          />

          {/* ── Location — Searchable Select ──────────────────── */}
          <SearchableSelect
            label="Location / City *"
            icon="location-outline"
            placeholder="Search and select a city…"
            options={LOCATION_OPTIONS}
            value={form.location}
            onSelect={v => setForm(f => ({ ...f, location: v }))}
            allowCustom={true}
          />

          {/* ── Units + Contact ──────────────────────────────── */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <InputField
                label="Units Needed"
                icon="water-outline"
                placeholder="e.g. 2"
                value={form.units}
                onChange={v => setForm(f => ({ ...f, units: v }))}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1.5 }}>
              <InputField
                label={`Contact Number *`}
                icon="call-outline"
                placeholder="10 digit phone"
                value={form.contact}
                onChange={v => setForm(f => ({ ...f, contact: v }))}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* ── Urgency ──────────────────────────────────────── */}
          <Text style={[styles.label, { color: theme.text, marginTop: Spacing.md }]}>
            Urgency Level
          </Text>
          <View style={styles.urgencyGrid}>
            {URGENCIES.map(u => (
              <TouchableOpacity
                key={u.label}
                onPress={() => setForm(f => ({ ...f, urgency: u.label }))}
                style={[
                  styles.urgencyChip,
                  {
                    backgroundColor: form.urgency === u.label ? u.color : theme.surface,
                    borderColor: form.urgency === u.label ? u.color : theme.border,
                  }
                ]}
              >
                <Text style={[styles.urgencyText, { color: form.urgency === u.label ? '#FFF' : theme.text }]}>
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Submit ───────────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: isComplete ? theme.primary : theme.textSecondary, opacity: isLoading ? 0.75 : 1 }
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>Post Request Now</Text>
                <Ionicons name="send" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </>
            )}
          </TouchableOpacity>

          {/* Required fields note */}
          <Text style={[styles.requiredNote, { color: theme.textSecondary }]}>
            * Required fields
          </Text>

        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  webCenterWrapper: { alignItems: 'center', width: '100%' },
  scrollContent: {
    padding: Spacing.lg, paddingBottom: 60,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
  },

  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.sm },

  bloodGroupsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.lg },
  bloodChip: {
    width: '23%', height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  bloodChipText: { fontWeight: 'bold', fontSize: 16 },

  inputContainer: { marginBottom: Spacing.md },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    height: 54, borderRadius: 14, borderWidth: 1, paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },

  row: { flexDirection: 'row' },
  urgencyGrid: { flexDirection: 'row', gap: 10, marginTop: 4 },
  urgencyChip: {
    flex: 1, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  urgencyText: { fontWeight: 'bold', fontSize: 13 },

  submitBtn: {
    marginTop: Spacing.xl, height: 56, borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  submitBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  requiredNote: { fontSize: 12, textAlign: 'center', marginTop: Spacing.md },
});
