import * as Haptics from "expo-haptics";
import React, { forwardRef, useState } from "react";
import {
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { tAuth } from "../i18n/strings";
import { getTheme } from "../theme/colors";

interface PasswordFieldProps extends Omit<TextInputProps, "secureTextEntry"> {
  value: string;
  onChangeText: (v: string) => void;
  registerVariant?: boolean; // placeholder différent pour inscription
  disabled?: boolean;
}

export const PasswordField = forwardRef<TextInput, PasswordFieldProps>(
  ({ value, onChangeText, registerVariant, disabled, style, ...rest }, ref) => {
    const scheme = useColorScheme();
    const theme = getTheme(scheme);
    const [show, setShow] = useState(false);
    return (
      <View style={{ position: "relative" }}>
        <TextInput
          ref={ref}
          placeholder={
            registerVariant
              ? tAuth("passwordPlaceholderRegister")
              : tAuth("passwordPlaceholder")
          }
          secureTextEntry={!show}
          autoComplete={registerVariant ? "new-password" : "password"}
          textContentType={registerVariant ? "newPassword" : "password"}
          value={value}
          onChangeText={onChangeText}
          editable={!disabled}
          style={[
            {
              borderWidth: 1,
              borderColor: theme.colors.cardBorder,
              padding: 12,
              borderRadius: 8,
              color: theme.colors.text,
              paddingRight: 50,
            },
            style,
          ]}
          placeholderTextColor={theme.colors.tabBarInactive}
          {...rest}
        />
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShow((s) => !s);
          }}
          style={{ position: "absolute", right: 8, top: 12, padding: 4 }}
          disabled={disabled}
        >
          <Text style={{ color: theme.colors.text, fontSize: 12 }}>
            {show ? tAuth("passwordHide") : tAuth("passwordShow")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);
PasswordField.displayName = "PasswordField";

export default PasswordField;
