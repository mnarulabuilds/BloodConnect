import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, useColorScheme, TextInput, Platform, Modal, Image, ActivityIndicator, Alert } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Location from '@/utils/Location';

export default function ProfileScreen() {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const theme = Colors[colorScheme];
    const { user, logout, updateUser } = useAuth();
    const { showToast } = useToast();

    const [isAvailable, setIsAvailable] = useState(user?.isAvailable ?? true);
    const [isUploading, setIsUploading] = useState(false);
    const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
    const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState(false);
    const [showChecklist, setShowChecklist] = useState(false);
    const [checklistLoading, setChecklistLoading] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phone || '');
    const [editBloodGroup, setEditBloodGroup] = useState(user?.bloodGroup || '');
    const [isSaving, setIsSaving] = useState(false);

    // Calculate eligibility (90 days)
    const nextEligibleDate = new Date(user?.nextEligibleDate || 0);
    const today = new Date();
    const isEligible = nextEligibleDate <= today;
    const daysRemaining = Math.ceil((nextEligibleDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const toggleAvailability = async (value: boolean) => {
        if (value && !isEligible) {
            showToast({
                message: `On recovery. Visible again in ${daysRemaining} days.`,
                type: 'info'
            });
            return;
        }
        setIsUpdatingAvailability(true);
        try {
            await updateUser({ isAvailable: value });
            setIsAvailable(value);
        } catch (error) {
            showToast({ message: 'Failed to update availability status.', type: 'error' });
            setIsAvailable(!value);
        } finally {
            setIsUpdatingAvailability(false);
        }
    };

    const handleChecklistSubmit = async () => {
        setChecklistLoading(true);
        try {
            await updateUser({ isMedicalHistoryClear: true });
            setShowChecklist(false);
            showToast({ message: 'Medical status updated!', type: 'success' });
        } catch (e) {
            showToast({ message: 'Failed to update medical status.', type: 'error' });
        } finally {
            setChecklistLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Error during logout:', error);
            showToast({ message: 'Failed to log out cleanly.', type: 'error' });
        }
    };

    const handleRoleSwitch = async (newRole: 'donor' | 'hospital') => {
        if (user?.role === newRole) return;

        setIsUpdatingRole(true);
        try {
            await updateUser({ role: newRole });
            showToast({ message: `Identity switched to ${newRole === 'donor' ? 'Donor' : 'Recipient'}`, type: 'success' });
        } catch (e: any) {
            showToast({ message: e.message || 'Failed to switch identity', type: 'error' });
        } finally {
            setIsUpdatingRole(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            showToast({ message: 'Name is required', type: 'error' });
            return;
        }
        setIsSaving(true);
        try {
            await updateUser({
                name: editName,
                phone: editPhone,
                bloodGroup: editBloodGroup
            });
            setShowEditModal(false);
            showToast({ message: 'Profile updated successfully', type: 'success' });
        } catch (e: any) {
            showToast({ message: e.message || 'Failed to update profile', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            showToast({ message: 'Media library permission denied.', type: 'error' });
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
                showToast({ message: 'Profile picture updated!', type: 'success' });
            } catch (e: any) {
                showToast({ message: e.message || 'Failed to upload image', type: 'error' });
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
                    showToast({ message: 'Location works best on mobile.', type: 'info' });
                } else {
                    showToast({ message: 'Location permission denied.', type: 'error' });
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
            });
            showToast({ message: 'Location updated!', type: 'success' });
        } catch (e) {
            console.error(e);
            showToast({ message: 'Failed to update location', type: 'error' });
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
                                    key={user.avatar.substring(0, 100)}
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
                    <Text style={styles.userRole}>{user?.role === 'donor' ? 'Donor' : 'Recipient'} • Verified</Text>
                </View>
            </View>

            <View style={styles.content}>
                <View style={[styles.roleCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.cardTitle, { color: theme.text, marginBottom: Spacing.sm }]}>I want to be a:</Text>
                    <View style={styles.roleButtons}>
                        <TouchableOpacity
                            style={[
                                styles.roleBtn,
                                user?.role === 'donor' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                            onPress={() => handleRoleSwitch('donor')}
                            disabled={isUpdatingRole}
                        >
                            <Ionicons name="water" size={18} color={user?.role === 'donor' ? '#FFF' : theme.text} />
                            <Text style={[styles.roleBtnText, { color: user?.role === 'donor' ? '#FFF' : theme.text }]}>Donor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.roleBtn,
                                user?.role === 'hospital' && { backgroundColor: theme.primary, borderColor: theme.primary }
                            ]}
                            onPress={() => handleRoleSwitch('hospital')}
                            disabled={isUpdatingRole}
                        >
                            <Ionicons name="medkit" size={18} color={user?.role === 'hospital' ? '#FFF' : theme.text} />
                            <Text style={[styles.roleBtnText, { color: user?.role === 'hospital' ? '#FFF' : theme.text }]}>Recipient</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {user?.role === 'donor' && (
                    <>
                        <View style={[styles.availabilityCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, { color: theme.text }]}>Availability Status</Text>
                                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                                    {!isEligible ? `On Cool-down (${daysRemaining} days left)` : (isAvailable ? 'Visible to those in need' : 'Currently hidden from search')}
                                </Text>
                            </View>
                            <Switch
                                value={isEligible && isAvailable}
                                onValueChange={toggleAvailability}
                                disabled={isUpdatingAvailability || !isEligible}
                                trackColor={{ false: theme.border, true: theme.primary }}
                                thumbColor="#FFF"
                            />
                        </View>

                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Eligibility & Health</Text>
                        <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border, padding: Spacing.md }]}>
                            <View style={styles.eligibilityRow}>
                                <View style={[styles.eligibilityIcon, { backgroundColor: isEligible ? theme.success + '20' : theme.error + '20' }]}>
                                    <Ionicons name={isEligible ? "checkmark-circle" : "time"} size={24} color={isEligible ? theme.success : theme.error} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.eligibilityTitle, { color: theme.text }]}>
                                        {isEligible ? 'Eligible to Donate' : 'On Cool-down period'}
                                    </Text>
                                    <Text style={[styles.eligibilitySubtitle, { color: theme.textSecondary }]}>
                                        {isEligible ? 'You have completed your recovery!' : `Wait ${daysRemaining} days to ensure your health.`}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity style={[styles.checklistBtn, { backgroundColor: theme.primary }]} onPress={() => setShowChecklist(true)}>
                                <Text style={styles.checklistBtnText}>Update Health Checklist</Text>
                                <Ionicons name="medical" size={18} color="#FFF" />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Information</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <OptionItem icon="person-outline" title="Full Name" value={user?.name} onPress={() => { setEditName(user?.name || ''); setShowEditModal(true); }} />
                    <OptionItem icon="call-outline" title="Phone Number" value={user?.phone || 'Not set'} onPress={() => { setEditPhone(user?.phone || ''); setShowEditModal(true); }} />
                    <OptionItem icon="water-outline" title="Blood Group" value={user?.bloodGroup} onPress={() => { setEditBloodGroup(user?.bloodGroup || ''); setShowEditModal(true); }} />
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

            <Modal visible={showChecklist} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Safety Checklist</Text>
                        <Text style={[styles.modalDesc, { color: theme.textSecondary }]}>
                            Please confirm the following to ensure safe donation:
                        </Text>

                        <View style={styles.checkItem}>
                            <Ionicons name="checkbox" size={20} color={theme.primary} />
                            <Text style={[styles.checkText, { color: theme.text }]}>I am currently in good health.</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <Ionicons name="checkbox" size={20} color={theme.primary} />
                            <Text style={[styles.checkText, { color: theme.text }]}>I haven't had a tattoo in 6 months.</Text>
                        </View>
                        <View style={styles.checkItem}>
                            <Ionicons name="checkbox" size={20} color={theme.primary} />
                            <Text style={[styles.checkText, { color: theme.text }]}>I am not on any heavy medication.</Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalSubmit, { backgroundColor: theme.primary }]}
                            onPress={handleChecklistSubmit}
                            disabled={checklistLoading}
                        >
                            {checklistLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSubmitText}>Confirm & Update</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowChecklist(false)}>
                            <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showEditModal} animationType="fade" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Full Name</Text>
                            <TextInput
                                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                                value={editName}
                                onChangeText={setEditName}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Phone Number</Text>
                            <TextInput
                                style={[styles.textInput, { color: theme.text, borderColor: theme.border }]}
                                value={editPhone}
                                onChangeText={setEditPhone}
                                keyboardType="phone-pad"
                                placeholder="Enter your phone"
                                placeholderTextColor={theme.textSecondary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Blood Group</Text>
                            <View style={styles.bloodGroupContainer}>
                                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                                    <TouchableOpacity
                                        key={group}
                                        style={[
                                            styles.bloodGroupOption,
                                            { borderColor: theme.border },
                                            editBloodGroup === group && { backgroundColor: theme.primary, borderColor: theme.primary }
                                        ]}
                                        onPress={() => setEditBloodGroup(group)}
                                    >
                                        <Text style={[
                                            styles.bloodGroupText,
                                            { color: theme.text },
                                            editBloodGroup === group && { color: '#FFF' }
                                        ]}>{group}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.modalSubmit, { backgroundColor: theme.primary }]}
                            onPress={handleSaveProfile}
                            disabled={isSaving}
                        >
                            {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.modalSubmitText}>Save Changes</Text>}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEditModal(false)}>
                            <Text style={{ color: theme.textSecondary }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    cardSubtitle: {
        fontSize: 12,
    },
    roleCard: {
        padding: Spacing.md,
        borderRadius: 20,
        borderWidth: 1,
        marginTop: -40,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: Spacing.md,
    },
    roleButtons: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    roleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    roleBtnText: {
        marginLeft: 8,
        fontWeight: 'bold',
        fontSize: 14,
    },
    availabilityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: Spacing.md,
        borderRadius: 20,
        borderWidth: 1,
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
    eligibilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    eligibilityIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    eligibilityTitle: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    eligibilitySubtitle: {
        fontSize: 13,
    },
    checklistBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
    },
    checklistBtnText: {
        color: '#FFF',
        fontWeight: 'bold',
        marginRight: 8,
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
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    modalContent: {
        borderRadius: 30,
        padding: Spacing.xl,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalDesc: {
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    checkText: {
        marginLeft: 12,
        fontSize: 15,
    },
    modalSubmit: {
        marginTop: 25,
        height: 55,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalSubmitText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalCancel: {
        marginTop: 15,
        alignItems: 'center',
    },
    inputGroup: {
        marginTop: 15,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 5,
        marginLeft: 5,
    },
    textInput: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        fontSize: 15,
    },
    bloodGroupContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    bloodGroupOption: {
        width: '22%',
        height: 40,
        borderWidth: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bloodGroupText: {
        fontSize: 14,
        fontWeight: 'bold',
    }
});
