import { STORIES } from '@/constants/mock-data';
import { styles } from '@/styles/feed.styles';
import { ScrollView } from 'react-native';
import { Story } from './Story';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/theme';

export function StoriesSection() {
  return (
    <LinearGradient colors={COLORS.gradients.stories} start={{ x: 1, y: 0 }} end={{ x: 0, y: 0.5 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.storiesContainer}>
        {STORIES.map((story) => (
          <Story key={story.id} story={story} />
        ))}
      </ScrollView>
    </LinearGradient>
  );
}
