import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const InputField = ({ label, icon, placeholder, value, onChange, secureTextEntry = false, error }: any) => {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    return (
        <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme.surface, borderColor: error ? theme.error : theme.border }]}>
                <Ionicons name={icon} size={20} color={error ? theme.error : theme.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.textSecondary}
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={secureTextEntry}
                />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
    );
}

export default function RegisterScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { register } = useAuth();

    const [role, setRole] = useState<'Donor' | 'Recipient'>('Donor');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [generalError, setGeneralError] = useState('');
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        bloodGroup: '',
        location: '',
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const validate = () => {
        let newErrors: any = {};
        if (!form.name) newErrors.name = 'Full name is required';
        if (!form.email) {
            newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = 'Please enter a valid email';
        }
        if (!form.phone) newErrors.phone = 'Phone number is required';
        if (!form.location) newErrors.location = 'Location is required';
        if (role === 'Donor' && !form.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
        if (!form.password) {
            newErrors.password = 'Password is required';
        } else if (form.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        setGeneralError('');
        if (!validate()) return;

        setIsLoading(true);
        try {
            await register({
                ...form,
                role: role.toLowerCase() === 'donor' ? 'donor' : 'hospital'
            });
            router.replace('/(tabs)');
        } catch (e: any) {
            setGeneralError(e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const updateForm = (key: string, value: string) => {
        setForm({ ...form, [key]: value });
        if (errors[key]) {
            setErrors({ ...errors, [key]: '' });
        }
    };

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

                <View style={styles.form}>
                    {generalError ? (
                        <View style={[styles.errorBanner, { backgroundColor: theme.error + '15' }]}>
                            <Ionicons name="alert-circle" size={20} color={theme.error} />
                            <Text style={[styles.errorBannerText, { color: theme.error }]}>{generalError}</Text>
                        </View>
                    ) : null}

                    <InputField
                        label="Full Name"
                        icon="person-outline"
                        placeholder="John Doe"
                        value={form.name}
                        onChange={(val: string) => updateForm('name', val)}
                        error={errors.name}
                    />
                    <InputField
                        label="Email Address"
                        icon="mail-outline"
                        placeholder="example@mail.com"
                        value={form.email}
                        onChange={(val: string) => updateForm('email', val)}
                        error={errors.email}
                    />
                    <InputField
                        label="Phone Number"
                        icon="call-outline"
                        placeholder="+91 00000 00000"
                        value={form.phone}
                        onChange={(val: string) => updateForm('phone', val)}
                        error={errors.phone}
                    />
                    <InputField
                        label="Location"
                        icon="location-outline"
                        placeholder="City, India"
                        value={form.location}
                        onChange={(val: string) => updateForm('location', val)}
                        error={errors.location}
                    />

                    {role === 'Donor' && (
                        <View style={styles.inputContainer}>
                            <Text style={[styles.label, { color: theme.text }]}>Blood Group</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupScroll}>
                                {bloodGroups.map(bg => (
                                    <TouchableOpacity
                                        key={bg}
                                        style={[styles.groupChip, form.bloodGroup === bg && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                                        onPress={() => updateForm('bloodGroup', bg)}
                                    >
                                        <Text style={[styles.groupText, { color: form.bloodGroup === bg ? '#FFF' : theme.text }]}>{bg}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                            {errors.bloodGroup ? <Text style={styles.errorText}>{errors.bloodGroup}</Text> : null}
                        </View>
                    )}

                    <InputField
                        label="Password"
                        icon="lock-closed-outline"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(val: string) => updateForm('password', val)}
                        secureTextEntry={true}
                        error={errors.password}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.registerBtn, { backgroundColor: theme.primary, opacity: isLoading ? 0.8 : 1 }]}
                    onPress={handleRegister}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text style={styles.registerBtnText}>Create {role} Account</Text>
                    )}
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
    form: {
        width: '100%',
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
    },
    errorText: {
        color: '#D32F2F',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
        fontWeight: '500',
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: Spacing.lg,
        gap: 8,
    },
    errorBannerText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    }
});
