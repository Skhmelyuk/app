import { COLORS } from '@/constants/theme';
import { View, Text } from 'react-native';

export const NoPostsFound = () => (
  <View
    style={{
      flex: 1,
      backgroundColor: COLORS.background,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ fontSize: 20, color: COLORS.primary }}>No posts yet</Text>
  </View>
);
