
import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, useColorScheme, Alert, ActivityIndicator, Platform } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { requestService } from '@/utils/api';
import { router } from 'expo-router';
import { useToast } from '@/context/ToastContext';

const InputField = ({ label, icon, placeholder, value, onChange, keyboardType = 'default' }: any) => {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Ionicons name={icon} size={20} color={theme.textSecondary} style={styles.inputIcon} />
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
  )
};

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
    urgency: 'Normal', // Normal, Urgent, Critical
    contact: '',
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const urgencies = [
    { label: 'Normal', color: '#4CAF50' },
    { label: 'Urgent', color: '#FF9800' },
    { label: 'Critical', color: '#D32F2F' }
  ];

  const handleSubmit = async () => {
    if (!form.bloodGroup || !form.location || !form.contact) {
      showToast({ message: 'Please fill in all required fields', type: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      await requestService.createRequest({
        ...form,
        units: Number(form.units) || 1,
      });

      router.back();
      // Delay toast slightly to show on the next screen
      setTimeout(() => {
        showToast({
          message: 'Blood request posted successfully!',
          type: 'success'
        });
      }, 100);

    } catch (error: any) {
      console.error('Error creating request:', error);
      showToast({
        message: error.response?.data?.error || 'Failed to post request',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={Platform.OS === 'web' ? styles.webCenterWrapper : null}>
        <View style={styles.scrollContent}>
          <Text style={[styles.title, { color: theme.text }]}>Blood Request Details</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Fill this form to notify nearby donors immediately.</Text>

          <Text style={[styles.label, { color: theme.text, marginTop: Spacing.lg }]}>Blood Group Needed</Text>
          <View style={styles.bloodGroupsGrid}>
            {bloodGroups.map((group) => (
              <TouchableOpacity
                key={group}
                onPress={() => setForm({ ...form, bloodGroup: group })}
                style={[
                  styles.bloodChip,
                  { backgroundColor: form.bloodGroup === group ? theme.primary : theme.surface, borderColor: theme.border }
                ]}
              >
                <Text style={[styles.bloodChipText, { color: form.bloodGroup === group ? '#FFF' : theme.text }]}>
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            label="Patient Name (Optional)"
            icon="person-outline"
            placeholder="Enter patient name"
            value={form.patientName}
            onChange={(val: string) => setForm({ ...form, patientName: val })}
          />

          <InputField
            label="Hospital / Clinic Name"
            icon="business-outline"
            placeholder="Where is the blood needed?"
            value={form.hospital}
            onChange={(val: string) => setForm({ ...form, hospital: val })}
          />

          <InputField
            label="Location / City"
            icon="location-outline"
            placeholder="Enter city or area"
            value={form.location}
            onChange={(val: string) => setForm({ ...form, location: val })}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: Spacing.md }}>
              <InputField
                label="Units Needed"
                icon="water-outline"
                placeholder="e.g. 2"
                value={form.units}
                onChange={(val: string) => setForm({ ...form, units: val })}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1.5 }}>
              <InputField
                label="Contact Number"
                icon="call-outline"
                placeholder="10 digit phone"
                value={form.contact}
                onChange={(val: string) => setForm({ ...form, contact: val })}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: Spacing.md }]}>Urgency Level</Text>
          <View style={styles.urgencyGrid}>
            {urgencies.map((u) => (
              <TouchableOpacity
                key={u.label}
                onPress={() => setForm({ ...form, urgency: u.label })}
                style={[
                  styles.urgencyChip,
                  {
                    backgroundColor: form.urgency === u.label ? u.color : theme.surface,
                    borderColor: form.urgency === u.label ? u.color : theme.border
                  }
                ]}
              >
                <Text style={[styles.urgencyText, { color: form.urgency === u.label ? '#FFF' : theme.text }]}>
                  {u.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: isLoading ? 0.7 : 1 }]}
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
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webCenterWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 60,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  bloodGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  bloodChip: {
    width: '23%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  bloodChipText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
  },
  urgencyGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  urgencyChip: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  urgencyText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
  submitBtn: {
    marginTop: Spacing.xl,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
