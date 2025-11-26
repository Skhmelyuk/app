import { StyleSheet, Text, View } from "react-native";

export default function BookmarksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>BookmarksScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "blue",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
});
