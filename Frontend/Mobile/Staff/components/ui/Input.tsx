import React from "react";
import { TextInput, StyleSheet } from "react-native";

export default function Input({ ...props }) {
  return <TextInput style={styles.input} placeholderTextColor="#aaa" {...props} />;
}

const styles = StyleSheet.create({
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 6,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
  },
});
