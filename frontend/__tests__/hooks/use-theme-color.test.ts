import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '@/hooks/use-theme-color';

describe('useThemeColor', () => {
  it('returns theme color by name', () => {
    const { result } = renderHook(() => useThemeColor({}, 'text'));
    expect(result.current).toBeTruthy();
  });

  it('prefers prop override', () => {
    const { result } = renderHook(() => useThemeColor({ light: '#111111' }, 'text'));
    expect(result.current).toBe('#111111');
  });

  it('uses dark override when color scheme is dark', () => {
    jest.spyOn(require('@/hooks/use-color-scheme'), 'useColorScheme').mockReturnValue('dark');
    const { result } = renderHook(() => useThemeColor({ dark: '#222222' }, 'text'));
    expect(result.current).toBe('#222222');
  });
});
