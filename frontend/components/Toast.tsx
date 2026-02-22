import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, Animated, Platform, View, TouchableOpacity } from 'react-native';
import { useToast } from '../context/ToastContext';
import { Colors } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';

const Toast = () => {
    const { toast } = useToast();
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (toast.visible) {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(translateY, {
                    toValue: 20,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [toast.visible]);

    const isVisible = toast.visible;

    const getIcon = () => {
        switch (toast.type) {
            case 'success': return 'checkmark-circle';
            case 'error': return 'alert-circle';
            case 'info': return 'information-circle';
            default: return 'checkmark-circle';
        }
    };

    const getBackgroundColor = () => {
        switch (toast.type) {
            case 'success': return '#4CAF50';
            case 'error': return theme.error;
            case 'info': return theme.primary;
            default: return '#4CAF50';
        }
    };

    return (
        <Animated.View
            pointerEvents={isVisible ? 'auto' : 'none'}
            style={[
                styles.container,
                {
                    opacity,
                    transform: [{ translateY }],
                    backgroundColor: getBackgroundColor(),
                },
            ]}
        >
            <Ionicons name={getIcon()} size={24} color="#FFF" />
            <Text style={styles.text}>{toast.message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: Platform.OS === 'web' ? 40 : 100,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        minHeight: 50,
        maxWidth: '90%',
        width: Platform.OS === 'web' ? 400 : 'auto',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        zIndex: 9999,
    },
    text: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
        textAlign: 'center',
    },
});

export default Toast;
