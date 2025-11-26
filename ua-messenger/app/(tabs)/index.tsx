import { StyleSheet, Text, View } from "react-native";

export default function Index() {
  return (
    <View>
      <Text style={styles.title}>Home Screen</Text>
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

    borderRadius: 5,
    marginVertical: 10,
  },
});
