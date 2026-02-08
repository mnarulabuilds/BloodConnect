
import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Switch, useColorScheme, TextInput, Alert } from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const theme = Colors[colorScheme];

    const [isAvailable, setIsAvailable] = useState(true);
    const [name, setName] = useState('Mayank Kumar');
    const [phone, setPhone] = useState('+91 98765 43210');
    const [bloodGroup, setBloodGroup] = useState('A+');

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
                            <Ionicons name="person" size={48} color={theme.primary} />
                        </View>
                        <TouchableOpacity style={styles.editAvatarBtn}>
                            <Ionicons name="camera" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{name}</Text>
                    <Text style={styles.userRole}>Level 3 Donor • 5 Lives Saved</Text>
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
                        onValueChange={setIsAvailable}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#FFF"
                    />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Personal Information</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <OptionItem icon="person-outline" title="Full Name" value={name} />
                    <OptionItem icon="call-outline" title="Phone Number" value={phone} />
                    <OptionItem icon="water-outline" title="Blood Group" value={bloodGroup} />
                    <OptionItem icon="location-outline" title="Address" value="New Delhi, India" />
                </View>

                <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Settings</Text>
                <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <OptionItem icon="notifications-outline" title="Notifications" />
                    <OptionItem icon="shield-checkmark-outline" title="Privacy & Security" />
                    <OptionItem icon="help-circle-outline" title="Help & Support" />
                </View>

                <TouchableOpacity
                    style={[styles.logoutBtn, { borderColor: theme.error }]}
                    onPress={() => Alert.alert('Logout', 'Are you sure you want to sign out?', [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Logout', style: 'destructive' }
                    ])}
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
