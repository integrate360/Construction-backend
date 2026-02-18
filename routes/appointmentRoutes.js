import express from "express";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  rescheduleAppointment,
  cancelAppointment,
  completeAppointment,
  getUpcomingAppointments,
  getAppointmentStats,
  addAttendee,
  removeAttendee,
  checkAvailability,
  getCalendarAppointments,
  getAgendaView,
} from "../controllers/appointmentController.js";
import authMiddleware from "../middleware/authmiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/stats", getAppointmentStats);

router.get(
  "/upcoming",
  getUpcomingAppointments,
);

router.get("/getAppointments", getAppointments);

router.post("/createAppointment", createAppointment);

router.get("/getAppointmentById/:id", getAppointmentById);

router.put("/updateAppointment/:id", updateAppointment);

router.delete("/deleteAppointment/:id", deleteAppointment);

router.patch("/rescheduleAppointment/:id/reschedule", rescheduleAppointment);

router.patch("/cancelAppointment/:id/cancel", cancelAppointment);

router.patch("/completeAppointment/:id/complete", completeAppointment);

router.post("/addAttendee/:id/attendees", addAttendee);

router.delete("/removeAttendee/:id/attendees/:attendee", removeAttendee);

router.get("/calendar", getCalendarAppointments);

router.get("/agenda", getAgendaView);

router.get("/check-availability", checkAvailability);

export default router;
