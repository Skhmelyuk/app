import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { styles } from "@/styles/feed.styles";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";


export const Post = ({post} : {post: any}) => {
    return (
        <View style={styles.post}>
            <View style={styles.postHeader}>
                <Link href={`/(tabs)/notifications`}>
                    <TouchableOpacity style={styles.postHeaderLeft}>
                        <Image
                            source={post.author.image}
                            style={styles.postAvatar}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            transition={200}
                        />
                        <Text style={styles.postUsername}>{post.author.username}</Text>
                    </TouchableOpacity>
                </Link>
                <TouchableOpacity>
                    <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>
            <Image
                source={post.imageUrl}
                style={styles.postImage}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={200}
            />
            {/* POST ACTIONS */}
            <View style={styles.postActions}>
                <View style={styles.postActionsLeft}>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons
                    name={"heart-outline"}
                    size={24}
                    color={COLORS.white}
                    />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons name="chatbubble-outline" size={22} color={COLORS.white} />
                </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => {}}>
                    <Ionicons
                        name={"bookmark-outline"}
                        size={22}
                        color={COLORS.white}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}