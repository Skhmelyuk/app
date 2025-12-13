import { COLORS } from '@/constants/theme';
import { styles } from '@/styles/profile.styles';
import { Ionicons } from '@expo/vector-icons';
import { Modal, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Doc } from '@/convex/_generated/dataModel';

interface ModalPrivewPostProps {
  post: Doc<'posts'> | null;
  setSelectedPost: (post: Doc<'posts'> | null) => void;
}

export const ModalPrivewPost = ({ post, setSelectedPost }: ModalPrivewPostProps) => {
  return (
    <Modal
      visible={!!post}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setSelectedPost(null)}
    >
      <View style={styles.modalBackdrop}>
        {post && (
          <View style={styles.postDetailContainer}>
            <View style={styles.postDetailHeader}>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </View>

            <Image
              source={post.imageUrl}
              cachePolicy={'memory-disk'}
              style={styles.postDetailImage}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};
