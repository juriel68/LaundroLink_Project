import StatusScreen from "@/components/StatusScreen";

export default function Processing() {
  return (
    <StatusScreen
      title="Processing"
      statusKey="Processing" // ✅ Changed this to the correct status name
    />
  );
}