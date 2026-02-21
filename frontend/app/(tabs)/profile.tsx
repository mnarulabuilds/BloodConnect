
import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, useColorScheme, TextInput, Alert, Platform } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image, ActivityIndicator } from 'react-native';
import Location from '@/utils/Location';

export default function ProfileScreen() {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const { user, logout, updateUser } = useAuth();

    const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
    const [isUploading, setIsUploading] = useState(false);
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
    const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);

    const toggleAvailability = async (value: boolean) => {
        setIsUpdatingAvailability(true);
        try {
            await updateUser({ isAvailable: value });
            setIsAvailable(value);
        } catch (error) {
            Alert.alert('Error', 'Failed to update availability status.');
            // Revert on error
            setIsAvailable(!value);
        } finally {
            setIsUpdatingAvailability(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Logout Error', 'Failed to log out cleanly.');
        }
    };

    const handleEditAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'We need camera roll permissions to upload your profile picture.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setIsUploading(true);
            try {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                await updateUser({ avatar: base64Image });
                Alert.alert('Success', 'Profile picture updated successfully!');
            } catch (e: any) {
                Alert.alert('Error', e.message || 'Failed to upload image');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleUpdateLocation = async () => {
        setIsUpdatingLocation(true);
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (Platform.OS === 'web') {
                    Alert.alert('Info', 'Location detection is optimized for our mobile app.');
                } else {
                    Alert.alert('Permission Denied', 'Please enable location permissions in settings.');
                }
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            let reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });
            let address = '';
            if (reverseGeocode.length > 0) {
                const item = reverseGeocode[0];
                address = `${item.city || ''}, ${item.region || ''}, ${item.country || ''}`.replace(/^, /, '');
            }

            await updateUser({
                location: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                latitude,
                longitude
            } as any);

            Alert.alert('Success', 'Location updated successfully!');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update location');
        } finally {
            setIsUpdatingLocation(false);
        }
    };

    const OptionItem = ({ icon, title, value, onPress, color }: { icon: any; title: string; value?: string; onPress?: () => void; color?: string }) => (
        <TouchableOpacity style={[styles.optionItem, { borderBottomColor: theme.border }]} onPress={onPress}>
            <View style={[styles.optionIcon, { backgroundColor: color || theme.surface }]}>
                <Ionicons name={icon} size={22} color={color ? '#FFF' : theme.text} />
            </View>
            <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: theme.text }]}>{title}</Text>
                {value && <Text style={[styles.optionValue, { color: theme.textSecondary }]}>{value}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.primary }]}>
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <View style={[styles.avatar, { backgroundColor: theme.surface }]}>
                            {user?.avatar ? (
                                <Image
                                    key={user.avatar.substring(0, 100)} // Key helps force re-render if URI is complex
                                    source={{ uri: user.avatar }}
                                    style={styles.avatarImage}
                                />
                            ) : (
                                <Ionicons name="person" size={48} color={theme.primary} />
                            )}
                            {isUploading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="small" color={theme.primary} />
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEditAvatar} disabled={isUploading}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{user?.name || 'Guest User'}</Text>
                    <Text style={styles.userRole}>{user?.role === 'donor' ? 'Donor' : 'Hospital'} • Verified</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={[styles.availabilityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Availability Status</Text>
                        <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                            {isAvailable ? 'Visible to those in need' : 'Currently hidden from search'}
                        </Text>
                    </View>
                    <Switch
                        value={isAvailable}
                        onValueChange={toggleAvailability}
                        disabled={isUpdatingAvailability}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#FFF"
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Information</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <OptionItem icon="person-outline" title="Full Name" value={user?.name} />
                    <OptionItem icon="call-outline" title="Phone Number" value={user?.phone || 'Not set'} />
                    <OptionItem icon="water-outline" title="Blood Group" value={user?.bloodGroup} />
                    <OptionItem
                        icon="location-outline"
                        title="Address"
                        value={isUpdatingLocation ? 'Updating location...' : (user?.location || 'Not set')}
                        onPress={handleUpdateLocation}
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Settings</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <OptionItem icon="notifications-outline" title="Notifications" />
                    <OptionItem icon="shield-checkmark-outline" title="Privacy & Security" />
                    <OptionItem icon="help-circle-outline" title="Help & Support" />
                </View>

                <TouchableOpacity
                    style={[styles.logoutBtn, { borderColor: theme.error }]}
                    onPress={() => {
                        console.log('Sign Out button clicked');
                        if (Platform.OS === 'web') {
                            if (window.confirm('Are you sure you want to sign out?')) {
                                handleLogout();
                            }
                        } else {
                            Alert.alert('Logout', 'Are you sure you want to sign out?', [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Logout', style: 'destructive', onPress: handleLogout }
                            ]);
                        }
                    }}
                >
                    <Ionicons name="log-out-outline" size={20} color={theme.error} />
                    <Text style={[styles.logoutText, { color: theme.error }]}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.0 (Beta)</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 80,
        paddingBottom: 40,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    profileInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: Spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editAvatarBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#000',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    userName: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    userRole: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        marginTop: 4,
    },
    content: {
        padding: Spacing.lg,
    },
    availabilityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: -40,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    cardSubtitle: {
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: Spacing.xl,
        marginBottom: Spacing.md,
    },
    sectionCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
    },
    optionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 15,
        fontWeight: '600',
    },
    optionValue: {
        fontSize: 13,
        marginTop: 2,
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xxl,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    logoutText: {
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 16,
    },
    versionText: {
        textAlign: 'center',
        color: '#9E9E9E',
        marginTop: Spacing.lg,
        fontSize: 12,
        marginBottom: 40,
    }
});
