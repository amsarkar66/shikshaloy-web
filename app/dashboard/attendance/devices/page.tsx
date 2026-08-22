import { listAttendanceDevices } from "@/lib/attendance/devices";
import DevicesClient from "./_components/DevicesClient";

export default async function AttendanceDevicesPage() {
  const devices = await listAttendanceDevices();
  return <DevicesClient initialDevices={devices} />;
}
