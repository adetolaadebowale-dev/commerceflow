import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface StartupErrorBoundaryProps {
  readonly children: React.ReactNode;
}

interface StartupErrorBoundaryState {
  readonly error: Error | null;
}

export class StartupErrorBoundary extends React.Component<
  StartupErrorBoundaryProps,
  StartupErrorBoundaryState
> {
  state: StartupErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): StartupErrorBoundaryState {
    console.error("[startup][StartupErrorBoundary] caught render error", error);
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(
      "[startup][StartupErrorBoundary] componentDidCatch",
      error.message,
      error.stack,
      info.componentStack,
    );
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Startup Error</Text>
          <Text style={styles.message}>{this.state.error.message}</Text>
          <Text style={styles.stack}>{this.state.error.stack}</Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#FCEFEF",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
    color: "#991B1B",
  },
  message: {
    fontSize: 16,
    marginBottom: 12,
    color: "#1A2233",
  },
  stack: {
    fontSize: 12,
    color: "#5C6678",
  },
});
