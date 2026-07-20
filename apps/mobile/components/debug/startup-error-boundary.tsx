import { Component, type ErrorInfo, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

interface StartupErrorBoundaryProps {
  readonly children: ReactNode;
}

interface StartupErrorBoundaryState {
  readonly error: Error | null;
}

export class StartupErrorBoundary extends Component<
  StartupErrorBoundaryProps,
  StartupErrorBoundaryState
> {
  state: StartupErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): StartupErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("[StartupErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Startup error</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F6F4F1",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1A2233",
  },
  message: {
    fontSize: 14,
    color: "#5C6678",
    textAlign: "center",
  },
});
