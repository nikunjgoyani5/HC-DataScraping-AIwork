const nodeEnvEnums = {
  PRODUCTION: "production",
  DEVELOPMENT: "development",
};

const authProviderEnum = {
  GOOGLE: "google",
  EMAIL: "email",
};

const userRoleEnum = {
  USER: "user",
  ADMIN: "admin",
  DOCTOR: "doctor",
  CAREGIVER: "caregiver",
  SUPERADMIN: "superadmin",
};

const socketEventEnums = {
  SEND_MESSAGE: "send_message",
};

const scheduleStatusEnums = {
  TAKEN: "taken",
  MISSED: "missed",
  PENDING: "pending",
};

const progressStatusEnums = {
  COMPLETED: "completed",
  IN_PROGRESS: "in_progress",
  NOT_STARTED: "not_started",
  TIMEOUT: "timeout",
};

const resultStatusEnums = {
  PASSED: "passed",
  FAILED: "failed",
  PENDING: "pending",
  TIMEOUT: "timeout",
};

const contentHubTypeEnums = {
  HEALTH_TIPS: "health_tips",
  LATEST_ARTICLES: "latest_articles",
  COMMUTINY_SUCCESS_STORIES: "community_success_stories",
  FEATURED_VIDEOS: "featured_videos",
  HEALTH_QNA: "health_qna",
};

const requestStatusEnum = {
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  PENDING: "pending",
};

const appointmentTypeEnums = {
  URGENT_CARE: "urgent_care",
  MENTRAL_HEALTH: "mental_health",
};

const appointmentStatusEnums = {
  SCHEDULED: "scheduled",
  CONFIRM: "confirm",
  STARTED: "started",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  MISSED: "missed",
};

const doctorAvailabilityEnums = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

const genderEnums = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};

const goalEnums = {
  LOSE_WEIGHT: "lose_weight",
  MAINTAIN_WEIGHT: "maintain_weight",
  GAIN_MUSCLE: "gain_muscle",
  IMPROVE_SLEEP: "improve_sleep",
  BUILD_IMMUNITY: "build_immunity",
  STRENGTH_BONES: "strength_bones",
  BOOST_ENERGY: "boost_energy",
  MENTAL_CLARITY: "mental_clarity",
};

const activityLevelEnums = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

const statusSupportEnum = {
  OPEN: "open",
  CLOSE: "close",
};

const activityCategoryEnum = {
  AUTH: "auth",
};

const activityTypeEnum = {
  LOGIN: "login",
};

const medicineScheduleStatus = {
  ACTIVE: "active",
  PAUSE: "pause",
  ENDED: "ended",
  INACTIVE: "inactive",
};

const feedbackTagEnums = {
  BUG: "bug",
  REQUEST: "request",
  OTHER: "other",
};

const superadminApproveStatusEnum = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const mediaTypeStatusEnum = {
  IMAGE: "image",
  VIDEO: "video",
  FILE: "file",
  AUDIO: "audio",
};

const notificationPreferencesEnum = {
  MEDICATIONS: "medications",
  WATER_INTAKE: "waterIntake",
  EXERCISE: "exercise",
  OTHER: "other",
};

const preferedNotificationMethods = {
  PUSH: "push",
  EMAIL: "email",
  SMS: "sms",
};

const notificationFrequencyEnum = {
  DAILY: "daily",
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

const reasonForAppointmentEnums = {
  GENERAL_CHECKUP: "general_checkup",
  EMERGENCY: "emergency",
  CONSULTATION: "consultation",
  OTHER: "other",
};

export default {
  nodeEnvEnums,
  authProviderEnum,
  userRoleEnum,
  socketEventEnums,
  scheduleStatusEnums,
  progressStatusEnums,
  resultStatusEnums,
  contentHubTypeEnums,
  requestStatusEnum,
  appointmentTypeEnums,
  appointmentStatusEnums,
  doctorAvailabilityEnums,
  genderEnums,
  goalEnums,
  activityLevelEnums,
  statusSupportEnum,
  activityCategoryEnum,
  activityTypeEnum,
  medicineScheduleStatus,
  feedbackTagEnums,
  superadminApproveStatusEnum,
  mediaTypeStatusEnum,
  notificationPreferencesEnum,
  preferedNotificationMethods,
  notificationFrequencyEnum,
  reasonForAppointmentEnums,
};
