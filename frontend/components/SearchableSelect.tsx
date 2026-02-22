import React, { useState, useMemo, useRef } from 'react';
import {
    Modal, View, Text, TextInput, FlatList, TouchableOpacity,
    StyleSheet, useColorScheme, Platform, Keyboard, Animated,
    TouchableWithoutFeedback, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────
export interface SelectOption<T = string> {
    value: T;
    label: string;
    sublabel?: string;
}

interface SearchableSelectProps<T = string> {
    /** Currently selected value */
    value: string;
    /** Called with the selected value string when user picks one */
    onSelect: (value: string) => void;
    /** The list of options to display */
    options: SelectOption<T>[];
    /** Placeholder shown when nothing is selected */
    placeholder?: string;
    /** Label rendered above the trigger input */
    label?: string;
    /** Ionicons icon name for the trigger */
    icon?: string;
    /** If true the field renders in an error state */
    error?: boolean;
    /** Whether the user may also type a completely free-form value not in the list */
    allowCustom?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────
export default function SearchableSelect<T = string>({
    value,
    onSelect,
    options,
    placeholder = 'Select…',
    label,
    icon = 'search-outline',
    error = false,
    allowCustom = false,
}: SearchableSelectProps<T>) {
    const colorScheme = (useColorScheme() ?? 'light') as 'light' | 'dark';
    const theme = Colors[colorScheme];

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const inputRef = useRef<TextInput>(null);
    const slideAnim = useRef(new Animated.Value(300)).current;

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return options;
        return options.filter(
            o => o.label.toLowerCase().includes(q) ||
                (o.sublabel?.toLowerCase().includes(q) ?? false)
        );
    }, [query, options]);

    const openModal = () => {
        setQuery('');
        setOpen(true);
        Animated.spring(slideAnim, {
            toValue: 0, useNativeDriver: true, bounciness: 4,
        }).start(() => inputRef.current?.focus());
    };

    const closeModal = () => {
        Keyboard.dismiss();
        Animated.timing(slideAnim, {
            toValue: 300, duration: 200, useNativeDriver: true,
        }).start(() => setOpen(false));
    };

    const handleSelect = (label: string) => {
        onSelect(label);
        closeModal();
    };

    const handleCustomConfirm = () => {
        if (allowCustom && query.trim()) {
            onSelect(query.trim());
            closeModal();
        }
    };

    const borderColor = error ? theme.error : open ? theme.primary : theme.border;

    return (
        <View style={styles.wrapper}>
            {/* Label */}
            {label && <Text style={[styles.label, { color: theme.text }]}>{label}</Text>}

            {/* Trigger button */}
            <TouchableOpacity
                activeOpacity={0.75}
                onPress={openModal}
                style={[
                    styles.trigger,
                    { backgroundColor: theme.surface, borderColor }
                ]}
            >
                <Ionicons name={icon as any} size={20} color={theme.textSecondary} style={styles.triggerIcon} />
                <Text
                    style={[
                        styles.triggerText,
                        { color: value ? theme.text : theme.textSecondary },
                    ]}
                    numberOfLines={1}
                >
                    {value || placeholder}
                </Text>
                <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textSecondary}
                />
            </TouchableOpacity>

            {/* Modal ------------------------------------------------------- */}
            <Modal
                visible={open}
                transparent
                animationType="none"
                onRequestClose={closeModal}
                statusBarTranslucent
            >
                <TouchableWithoutFeedback onPress={closeModal}>
                    <View style={styles.backdrop} />
                </TouchableWithoutFeedback>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.kvWrapper}
                    pointerEvents="box-none"
                >
                    <Animated.View
                        style={[
                            styles.sheet,
                            { backgroundColor: theme.background, transform: [{ translateY: slideAnim }] }
                        ]}
                    >
                        {/* Sheet handle */}
                        <View style={[styles.handle, { backgroundColor: theme.border }]} />

                        {/* Sheet header */}
                        <View style={styles.sheetHeader}>
                            <Text style={[styles.sheetTitle, { color: theme.text }]}>
                                {label ?? 'Select an option'}
                            </Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                <Ionicons name="close" size={22} color={theme.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Search input */}
                        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                            <Ionicons name="search" size={18} color={theme.textSecondary} />
                            <TextInput
                                ref={inputRef}
                                style={[styles.searchInput, { color: theme.text }]}
                                placeholder={`Search ${label?.toLowerCase() ?? 'options'}…`}
                                placeholderTextColor={theme.textSecondary}
                                value={query}
                                onChangeText={setQuery}
                                returnKeyType={allowCustom ? 'done' : 'search'}
                                onSubmitEditing={handleCustomConfirm}
                            />
                            {query.length > 0 && (
                                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* "Use custom value" hint */}
                        {allowCustom && query.trim().length > 0 && filtered.length === 0 && (
                            <TouchableOpacity
                                style={[styles.customItem, { borderColor: theme.primary, backgroundColor: theme.primary + '12' }]}
                                onPress={handleCustomConfirm}
                            >
                                <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
                                <Text style={[styles.customItemText, { color: theme.primary }]}>
                                    Use "{query.trim()}"
                                </Text>
                            </TouchableOpacity>
                        )}

                        {/* Results list */}
                        <FlatList
                            data={filtered}
                            keyExtractor={(_, i) => String(i)}
                            keyboardShouldPersistTaps="handled"
                            contentContainerStyle={styles.listContent}
                            renderItem={({ item }) => {
                                const isSelected = item.label === value;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.optionItem,
                                            { borderBottomColor: theme.border },
                                            isSelected && { backgroundColor: theme.primary + '14' }
                                        ]}
                                        onPress={() => handleSelect(item.label)}
                                        activeOpacity={0.65}
                                    >
                                        <View style={styles.optionTexts}>
                                            <Text
                                                style={[
                                                    styles.optionLabel,
                                                    { color: isSelected ? theme.primary : theme.text }
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {item.label}
                                            </Text>
                                            {item.sublabel && (
                                                <Text style={[styles.optionSublabel, { color: theme.textSecondary }]} numberOfLines={1}>
                                                    {item.sublabel}
                                                </Text>
                                            )}
                                        </View>
                                        {isSelected && (
                                            <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                            ListEmptyComponent={
                                !allowCustom ? (
                                    <View style={styles.emptyContainer}>
                                        <Ionicons name="search-outline" size={40} color={theme.border} />
                                        <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                            No results for "{query}"
                                        </Text>
                                    </View>
                                ) : null
                            }
                        />
                    </Animated.View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: { marginBottom: Spacing.md },
    label: { fontSize: 14, fontWeight: '600', marginBottom: Spacing.sm },

    // Trigger
    trigger: {
        flexDirection: 'row', alignItems: 'center',
        height: 54, borderRadius: 14, borderWidth: 1,
        paddingHorizontal: Spacing.md,
    },
    triggerIcon: { marginRight: 10 },
    triggerText: { flex: 1, fontSize: 16 },

    // Modal
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
    kvWrapper: { flex: 1, justifyContent: 'flex-end' },
    sheet: {
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        maxHeight: '85%',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        elevation: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15, shadowRadius: 12,
    },

    handle: {
        alignSelf: 'center', width: 40, height: 4,
        borderRadius: 2, marginTop: 10, marginBottom: 4,
    },
    sheetHeader: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    },
    sheetTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
    closeBtn: { padding: 4 },

    // Search
    searchBar: {
        flexDirection: 'row', alignItems: 'center',
        marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md, height: 46,
        borderRadius: 14, borderWidth: 1,
    },
    searchInput: { flex: 1, marginLeft: 8, fontSize: 15 },

    // Custom value
    customItem: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.md, paddingVertical: 10,
        borderRadius: 12, borderWidth: 1,
    },
    customItemText: { fontSize: 14, fontWeight: '600' },

    // List
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 20 },
    optionItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    optionTexts: { flex: 1 },
    optionLabel: { fontSize: 15, fontWeight: '500' },
    optionSublabel: { fontSize: 12, marginTop: 2 },

    // Empty
    emptyContainer: { alignItems: 'center', paddingTop: 40 },
    emptyText: { fontSize: 14, marginTop: 10 },
});
