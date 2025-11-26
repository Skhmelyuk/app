import { useAuth } from "@clerk/clerk-expo";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const { signOut } = useAuth();

  return (
    <View>
      <Text style={styles.title}>Home Screen</Text>
      <TouchableOpacity style={styles.btn} onPress={() => signOut()}>
        <Text style={styles.btnText}>Sign Out</Text>
      </TouchableOpacity>
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
  btn: {
    padding: 10,
    backgroundColor: "red",
    borderRadius: 5,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
  },
});
