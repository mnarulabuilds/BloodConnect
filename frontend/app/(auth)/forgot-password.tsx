import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import axios from 'axios';

export default function ForgotPasswordScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailError, setEmailError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [generalError, setGeneralError] = useState('');

    const handleResetRequest = async () => {
        if (!email) {
            setEmailError('Please enter your email address');
            return;
        }

        setIsLoading(true);
        setGeneralError('');
        setSuccessMessage('');

        try {
            const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';
            const response = await axios.post(`${baseUrl}/auth/forgotpassword`, { email });

            // For demo/setup purposes, since we don't send emails, 
            // we'll simulate success and potentially redirect to reset screen
            setSuccessMessage('Password reset link has been generated. Check console for the token!');

            // In a real app, the user would check their email
            // For this flow, let's navigate them to reset password after 2 seconds
            if (response.data.token) {
                console.log('RESET TOKEN:', response.data.token);
                setTimeout(() => {
                    router.push({
                        pathname: '/(auth)/reset-password',
                        params: { token: response.data.token }
                    } as any);
                }, 2000);
            }
        } catch (e: any) {
            setGeneralError(e.response?.data?.error || 'Something went wrong. Please try again.');
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
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>

                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="key-outline" size={40} color={theme.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>Forgot Password?</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Enter your email address and we'll send you a link to reset your password.
                    </Text>
                </View>

                <View style={styles.form}>
                    {generalError ? (
                        <View style={[styles.errorBanner, { backgroundColor: theme.error + '15' }]}>
                            <Ionicons name="alert-circle" size={20} color={theme.error} />
                            <Text style={[styles.errorBannerText, { color: theme.error }]}>{generalError}</Text>
                        </View>
                    ) : null}

                    {successMessage ? (
                        <View style={[styles.successBanner, { backgroundColor: '#4CAF5015' }]}>
                            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                            <Text style={[styles.successBannerText, { color: '#4CAF50' }]}>{successMessage}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Email Address</Text>
                        <View style={[
                            styles.inputWrapper,
                            { backgroundColor: theme.surface, borderColor: emailError ? theme.error : theme.border }
                        ]}>
                            <Ionicons name="mail-outline" size={20} color={emailError ? theme.error : theme.textSecondary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { color: theme.text }]}
                                placeholder="example@mail.com"
                                placeholderTextColor={theme.textSecondary}
                                value={email}
                                onChangeText={(val) => {
                                    setEmail(val);
                                    if (emailError) setEmailError('');
                                }}
                                autoCapitalize="none"
                            />
                        </View>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                    </View>

                    <TouchableOpacity
                        style={[styles.resetBtn, { backgroundColor: theme.primary, opacity: isLoading ? 0.8 : 1 }]}
                        onPress={handleResetRequest}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.resetBtnText}>Send Reset Link</Text>
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
        paddingTop: 60,
    },
    backBtn: {
        marginBottom: Spacing.xl,
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
        marginBottom: Spacing.xl,
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
    },
    successBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        marginBottom: Spacing.lg,
        gap: 8,
    },
    successBannerText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    }
});
