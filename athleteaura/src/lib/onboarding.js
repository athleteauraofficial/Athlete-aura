import { handPreferenceSports, positionOptionsBySport } from "@/lib/onboarding-options";

export function emptyToNull(value) {
  return value === "" ? null : value;
}

export function cleanFieldValue(field, value) {
  if (field.onlyLetters) {
    return value.replace(/[^\p{L}\s]/gu, "");
  }

  if (field.numericOnly) {
    return value.replace(/\D/g, "").slice(0, field.maxLength);
  }

  return value;
}

export function getPositionOptions(sport) {
  const positions = positionOptionsBySport[sport] ?? [];
  return [
    { value: "", label: sport ? "Choose position" : "Choose sport first" },
    ...positions.map((position) => ({ value: position, label: position })),
  ];
}

export function getPreferenceField(sport) {
  if (handPreferenceSports.has(sport)) {
    return {
      label: "Preferred Hand",
      options: [
        { value: "", label: "Select" },
        { value: "right", label: "Right hand" },
        { value: "left", label: "Left hand" },
        { value: "both", label: "Both hands" },
      ],
    };
  }

  return {
    label: "Preferred Foot",
    options: [
      { value: "", label: "Select" },
      { value: "right", label: "Right foot" },
      { value: "left", label: "Left foot" },
      { value: "both", label: "Both feet" },
    ],
  };
}

export function getDateParts(dateValue) {
  const [year = "", month = "", day = ""] = (dateValue ?? "").split("-");
  return { day, month, year };
}

export function getDaysInMonth(month, year) {
  if (!month || !year) {
    return 31;
  }

  return new Date(Number(year), Number(month), 0).getDate();
}

export function buildDateValue(parts) {
  if (!parts.day || !parts.month || !parts.year) {
    return "";
  }

  const maxDay = getDaysInMonth(parts.month, parts.year);
  const safeDay = Math.min(Number(parts.day), maxDay).toString().padStart(2, "0");
  return `${parts.year}-${parts.month}-${safeDay}`;
}

export function normalizeProfile(role, profile, profilePicUrl, userEmail) {
  const fullName = `${profile.first_name} ${profile.last_name}`.trim();
  const commonProfile = {
    email: userEmail,
    full_name: fullName,
    first_name: profile.first_name,
    last_name: profile.last_name,
    country: profile.country,
    current_club: emptyToNull(profile.current_club),
    sport: profile.sport,
  };

  if (role === "athlete") {
    return {
      commonProfile,
      detailProfile: {
        main_position: profile.main_position,
        secondary_position: emptyToNull(profile.secondary_position),
        date_of_birth: profile.date_of_birth,
        height: profile.height ? Number(profile.height) : null,
        weight: profile.weight ? Number(profile.weight) : null,
        preferred_foot: emptyToNull(profile.preferred_foot),
        instagram: emptyToNull(profile.instagram),
        youtube: emptyToNull(profile.youtube),
        tiktok: emptyToNull(profile.tiktok),
        profile_pic_url: profilePicUrl,
      },
    };
  }

  return {
    commonProfile,
    detailProfile: {
      role_title: profile.role_title,
      organization: emptyToNull(profile.organization),
      experience_years: profile.experience_years ? Number(profile.experience_years) : null,
      achievements: emptyToNull(profile.achievements),
      certificates: emptyToNull(profile.certificates),
    },
  };
}

export function isMissingCurrentClubColumn(error) {
  return error?.message?.includes("'current_club' column") || error?.code === "PGRST204";
}
