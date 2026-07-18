import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardHome() {
  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to CommerceFlow</CardTitle>
          <CardDescription>
            This dashboard will be completed in Sprint 13.1
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Use the sidebar to explore upcoming admin areas. Only the Dashboard
            home is available in this foundation sprint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
