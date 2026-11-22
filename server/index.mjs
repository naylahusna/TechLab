import { startAttendanceServer } from './attendance.mjs';

try {
  startAttendanceServer();
} catch (error) {
  console.error('Attendance API configuration error:', error.message);
  process.exitCode = 1;
}
