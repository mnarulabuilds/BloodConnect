import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { useToast } from '@/context/ToastContext';

export default function ResetPasswordScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { token } = useLocalSearchParams<{ token: string }>();
    const { showToast } = useToast();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleResetPassword = async () => {
        let hasError = false;

        if (!password) {
            setPasswordError('Please enter a new password');
            hasError = true;
        } else if (password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            hasError = true;
        } else if (password !== confirmPassword) {
            setPasswordError('Passwords do not match');
            hasError = true;
        } else {
            setPasswordError('');
        }

        if (hasError) return;

        setIsLoading(true);
        setGeneralError('');

        try {
            const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
            await axios.put(`${baseUrl}/auth/resetpassword/${token}`, { password });

            showToast({ message: 'Password reset successfully!', type: 'success', duration: 5000 });
            router.replace('/(auth)/login');
        } catch (e: any) {
            setGeneralError(e.response?.data?.error || 'Failed to reset password. Link may have expired.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.background }]}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="lock-open-outline" size={40} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Enter your new password below to regain access to your account.
                    </Text>
                </View>

                <View style={styles.form}>
                    {generalError ? (
                        <View style={[styles.errorBanner, { backgroundColor: theme.error + '15' }]}>
                            <Ionicons name="alert-circle" size={20} color={theme.error} />
                            <Text style={[styles.errorBannerText, { color: theme.error }]}>{generalError}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>New Password</Text>
                        <View style={[
                            styles.inputWrapper,
                            { backgroundColor: theme.surface, borderColor: passwordError ? theme.error : theme.border }
                        ]}>
                            <Ionicons name="lock-closed-outline" size={20} color={passwordError ? theme.error : theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={(val) => {
                                    setPassword(val);
                                    if (passwordError) setPasswordError('');
                                }}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Confirm New Password</Text>
                        <View style={[
                            styles.inputWrapper,
                            { backgroundColor: theme.surface, borderColor: passwordError ? theme.error : theme.border }
                        ]}>
                            <Ionicons name="shield-outline" size={20} color={passwordError ? theme.error : theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.textSecondary}
                                secureTextEntry={!showPassword}
                                value={confirmPassword}
                                onChangeText={(val) => {
                                    setConfirmPassword(val);
                                    if (passwordError) setPasswordError('');
                                }}
                            />
                        </View>
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    </View>

                    <TouchableOpacity
                        style={[styles.resetBtn, { backgroundColor: theme.primary, opacity: isLoading ? 0.8 : 1 }]}
                        onPress={handleResetPassword}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.resetBtnText}>Update Password</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: Spacing.xl,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 22,
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
    resetBtn: {
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.lg,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    resetBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
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
