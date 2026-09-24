
import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, useColorScheme, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ActivityIndicator } from 'react-native';
import { validateLoginForm } from '@/utils/validation';
import { a11yButton, a11yTextField } from '@/utils/accessibility';

export default function LoginScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [generalError, setGeneralError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        setGeneralError('');
        const validation = validateLoginForm(email, password);
        setEmailError(validation.emailError);
        setPasswordError(validation.passwordError);
        if (!validation.isValid) return;

        setIsLoading(true);
        try {
            await login(email, password);
            router.replace('/(tabs)');
        } catch (e: any) {
            setGeneralError(e.message);
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
                <View style={styles.logoContainer}>
                    <View style={[styles.logoCircle, { backgroundColor: theme.primary }]}>
                        <Ionicons name="water" size={60} color="#FFF" />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>BloodConnect</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Connect. Save. Be a Hero.</Text>
                </View>

                <View style={styles.form}>
                    {generalError ? (
                        <View
                            style={[styles.errorBanner, { backgroundColor: theme.error + '15' }]}
                            accessibilityLiveRegion="polite"
                            accessibilityRole="alert"
                        >
                            <Ionicons name="alert-circle" size={20} color={theme.error} />
                            <Text style={[styles.errorBannerText, { color: theme.error }]}>{generalError}</Text>
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
                                keyboardType="email-address"
                                textContentType="emailAddress"
                                autoComplete="email"
                                {...a11yTextField('Email address', emailError)}
                            />
                        </View>
                        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={[styles.label, { color: theme.text }]}>Password</Text>
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
                                textContentType="password"
                                autoComplete="password"
                                {...a11yTextField('Password', passwordError)}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                {...a11yButton(showPassword ? 'Hide password' : 'Show password')}
                            >
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                    </View>

                    <TouchableOpacity
                        style={styles.forgotBtn}
                        onPress={() => router.push('/(auth)/forgot-password' as any)}
                        {...a11yButton('Forgot password', 'Navigate to password reset')}
                    >
                        <Text style={{ color: theme.primary, fontWeight: '600' }}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.loginBtn, { backgroundColor: theme.primary, opacity: isLoading ? 0.8 : 1 }]}
                        onPress={handleLogin}
                        disabled={isLoading}
                        {...a11yButton('Secure login', 'Sign in to your BloodConnect account')}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.loginBtnText}>Secure Login</Text>
                                <Ionicons name="shield-checkmark" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/register' as any)}>
                            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Register Now</Text>
                        </TouchableOpacity>
                    </View>
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
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 16,
        marginTop: 4,
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
    forgotBtn: {
        alignSelf: 'flex-end',
        marginBottom: Spacing.lg,
    },
    loginBtn: {
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
    loginBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.xl,
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
