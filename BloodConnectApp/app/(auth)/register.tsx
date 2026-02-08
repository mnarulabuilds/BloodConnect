
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function RegisterScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [role, setRole] = useState<'Donor' | 'Recipient'>('Donor');
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        bloodGroup: '',
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const handleRegister = () => {
        // Mock registration
        router.replace('/(tabs)');
    };

    const InputField = ({ label, icon, placeholder, value, onChange, secureTextEntry = false }: any) => (
        <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Ionicons name={icon} size={20} color={theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={secureTextEntry}
                />
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>

                <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Join our community and help save lives.</Text>

                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'Donor' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        onPress={() => setRole('Donor')}
                    >
                        <Ionicons name="water" size={24} color={role === 'Donor' ? '#FFF' : theme.textSecondary} />
                        <Text style={[styles.roleText, { color: role === 'Donor' ? '#FFF' : theme.textSecondary }]}>Donor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.roleBtn, role === 'Recipient' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                        onPress={() => setRole('Recipient')}
                    >
                        <Ionicons name="medkit" size={24} color={role === 'Recipient' ? '#FFF' : theme.textSecondary} />
                        <Text style={[styles.roleText, { color: role === 'Recipient' ? '#FFF' : theme.textSecondary }]}>Recipient</Text>
                    </TouchableOpacity>
                </View>

                <InputField
                    label="Full Name"
                    icon="person-outline"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={(val: string) => setForm({ ...form, name: val })}
                />
                <InputField
                    label="Email Address"
                    icon="mail-outline"
                    placeholder="example@mail.com"
                    value={form.email}
                    onChange={(val: string) => setForm({ ...form, email: val })}
                />
                <InputField
                    label="Phone Number"
                    icon="call-outline"
                    placeholder="+91 00000 00000"
                    value={form.phone}
                    onChange={(val: string) => setForm({ ...form, phone: val })}
                />

                {role === 'Donor' && (
                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Blood Group</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
                            {bloodGroups.map(bg => (
                                <TouchableOpacity
                                    key={bg}
                                    style={[styles.groupChip, form.bloodGroup === bg && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                    onPress={() => setForm({ ...form, bloodGroup: bg })}
                                >
                                    <Text style={[styles.groupText, { color: form.bloodGroup === bg ? '#FFF' : theme.text }]}>{bg}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <InputField
                    label="Password"
                    icon="lock-closed-outline"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(val: string) => setForm({ ...form, password: val })}
                    secureTextEntry={true}
                />

                <TouchableOpacity style={[styles.registerBtn, { backgroundColor: theme.primary }]} onPress={handleRegister}>
                    <Text style={styles.registerBtnText}>Create {role} Account</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Login</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.xl,
        paddingTop: 60,
    },
    backBtn: {
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
        marginBottom: Spacing.xl,
    },
    roleContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: Spacing.xl,
    },
    roleBtn: {
        flex: 1,
        height: 60,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    roleText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    inputContainer: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.sm,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderRadius: 16,
        borderWidth: 1,
        paddingHorizontal: Spacing.md,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
    },
    groupScroll: {
        flexGrow: 0,
    },
    groupChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        marginRight: 8,
    },
    groupText: {
        fontWeight: 'bold',
    },
    registerBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.xl,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    registerBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.xl,
        marginBottom: 40,
    },
    footerText: {
        fontSize: 14,
    }
});
