"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "../page.module.css";

const pendingRoleKey = "athleteaura.pendingRole";

const roleLabels = {
  athlete: "Athlete",
  scout_coach: "Scout / Coach",
};

const initialAthleteProfile = {
  first_name: "",
  last_name: "",
  country: "",
  current_club: "",
  sport: "",
  main_position: "",
  secondary_position: "",
  date_of_birth: "",
  height: "",
  weight: "",
  preferred_foot: "",
  instagram: "",
  youtube: "",
  tiktok: "",
};

const initialScoutCoachProfile = {
  first_name: "",
  last_name: "",
  current_club: "",
  country: "",
  sport: "",
  role_title: "",
  organization: "",
  experience_years: "",
  achievements: "",
  certificates: "",
};

const sportOptions = [
  { value: "", label: "Choose sport" },
  { value: "football", label: "Football" },
  { value: "basketball", label: "Basketball" },
  { value: "tennis", label: "Tennis" },
  { value: "volleyball", label: "Volleyball" },
  { value: "handball", label: "Handball" },
  { value: "swimming", label: "Swimming" },
  { value: "athletics", label: "Athletics" },
  { value: "boxing", label: "Boxing" },
  { value: "mma", label: "MMA" },
  { value: "other", label: "Other" },
];

const countryOptions = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "Andorra",
  "Angola",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Brazil",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cabo Verde",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Colombia",
  "Comoros",
  "Congo",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czechia",
  "Democratic Republic of the Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Fiji",
  "Finland",
  "France",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Greece",
  "Grenada",
  "Guatemala",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Honduras",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Mauritania",
  "Mauritius",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "North Korea",
  "North Macedonia",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Poland",
  "Portugal",
  "Qatar",
  "Romania",
  "Russia",
  "Rwanda",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Sweden",
  "Switzerland",
  "Syria",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Zambia",
  "Zimbabwe",
].map((country) => ({ value: country, label: country }));

const positionOptionsBySport = {
  football: [
    "Goalkeeper",
    "Center Back",
    "Full Back",
    "Wing Back",
    "Defensive Midfielder",
    "Central Midfielder",
    "Attacking Midfielder",
    "Winger",
    "Striker",
  ],
  basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  tennis: ["Singles Player", "Doubles Player", "All-court Player", "Baseline Player", "Serve-and-volley Player"],
  volleyball: ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero", "Defensive Specialist"],
  handball: ["Goalkeeper", "Left Wing", "Right Wing", "Left Back", "Right Back", "Center Back", "Pivot"],
  swimming: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley", "Relay"],
  athletics: ["Sprinter", "Middle Distance", "Long Distance", "Hurdles", "Jumps", "Throws", "Combined Events"],
  boxing: ["Orthodox", "Southpaw", "Switch Hitter", "Out-boxer", "Pressure Fighter", "Counter Puncher"],
  mma: ["Striker", "Wrestler", "Grappler", "Brazilian Jiu-Jitsu", "Kickboxer", "All-rounder"],
  other: ["Athlete"],
};

const handPreferenceSports = new Set([
  "basketball",
  "tennis",
  "volleyball",
  "handball",
  "swimming",
  "boxing",
  "mma",
]);

const athleteIdentityFields = [
  { name: "first_name", label: "First Name", autoComplete: "given-name", onlyLetters: true, required: true },
  { name: "last_name", label: "Last Name", autoComplete: "family-name", onlyLetters: true, required: true },
  { name: "country", label: "Country", required: true, type: "select", options: countryOptions },
  { name: "date_of_birth", label: "Date of Birth", required: true, type: "dob" },
];

const athleteSportFields = [
  { name: "sport", label: "Sport", required: true, type: "select", options: sportOptions },
  { name: "current_club", label: "Current club if any" },
];

const athletePerformanceFields = [
  { name: "main_position", label: "Main position", required: true, type: "position" },
  { name: "secondary_position", label: "Secondary position", type: "position" },
  { name: "height", label: "Height (cm)", maxLength: 3, numericOnly: true, placeholder: "cm" },
  { name: "weight", label: "Weight (kg)", maxLength: 3, numericOnly: true, placeholder: "kg" },
  {
    name: "preferred_foot",
    label: "Preferred Foot",
    type: "preference",
  },
];

const athleteSocialFields = [
  { name: "instagram", label: "Instagram", placeholder: "https://instagram.com/...", type: "url" },
  { name: "youtube", label: "YouTube", placeholder: "https://youtube.com/...", type: "url" },
  { name: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@...", type: "url" },
];

const athleteFieldGroups = [
  { title: "Basic information", fields: athleteIdentityFields },
  { title: "Sport", fields: athleteSportFields },
  { title: "Sport details", fields: athletePerformanceFields },
  { title: "Social links", fields: athleteSocialFields },
  { title: "Profile picture", fields: [], hasProfilePicture: true },
  { title: "You are all set", fields: [], isConfirmation: true },
];

const scoutCoachIdentityFields = [
  { name: "first_name", label: "First Name", autoComplete: "given-name", onlyLetters: true, required: true },
  { name: "last_name", label: "Last Name", autoComplete: "family-name", onlyLetters: true, required: true },
  { name: "country", label: "Country", required: true, type: "select", options: countryOptions },
];

const scoutCoachSportFields = [
  { name: "sport", label: "Sport", required: true, type: "select", options: sportOptions },
  { name: "current_club", label: "Current club if any" },
];

const scoutCoachRoleFields = [
  { name: "role_title", label: "Role title", required: true },
  { name: "organization", label: "Organization" },
  { name: "experience_years", label: "Experience years", maxLength: 2, numericOnly: true },
];

const scoutCoachProofFields = [
  { name: "achievements", label: "Achievements", fullWidth: true, type: "textarea" },
  { name: "certificates", label: "Certificates", fullWidth: true, type: "textarea" },
];

const scoutCoachFieldGroups = [
  { title: "Basic information", fields: scoutCoachIdentityFields },
  { title: "Sport", fields: scoutCoachSportFields },
  { title: "Professional details", fields: scoutCoachRoleFields },
  { title: "Achievements and certificates", fields: scoutCoachProofFields },
  { title: "You are all set", fields: [], isConfirmation: true },
];

function emptyToNull(value) {
  return value === "" ? null : value;
}

function cleanFieldValue(field, value) {
  if (field.onlyLetters) {
    return value.replace(/[^\p{L}\s]/gu, "");
  }

  if (field.numericOnly) {
    return value.replace(/\D/g, "").slice(0, field.maxLength);
  }

  return value;
}

function getPositionOptions(sport) {
  const positions = positionOptionsBySport[sport] ?? [];
  return [
    { value: "", label: sport ? "Choose position" : "Choose sport first" },
    ...positions.map((position) => ({ value: position, label: position })),
  ];
}

function getPreferenceField(sport) {
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

function getDateParts(dateValue) {
  const [year = "", month = "", day = ""] = (dateValue ?? "").split("-");
  return { day, month, year };
}

function getDaysInMonth(month, year) {
  if (!month || !year) {
    return 31;
  }

  return new Date(Number(year), Number(month), 0).getDate();
}

function buildDateValue(parts) {
  if (!parts.day || !parts.month || !parts.year) {
    return "";
  }

  const maxDay = getDaysInMonth(parts.month, parts.year);
  const safeDay = Math.min(Number(parts.day), maxDay).toString().padStart(2, "0");
  return `${parts.year}-${parts.month}-${safeDay}`;
}

function normalizeProfile(role, profile, profilePicUrl, userEmail) {
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

function isMissingCurrentClubColumn(error) {
  return error?.message?.includes("'current_club' column") || error?.code === "PGRST204";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("");
  const [athleteProfile, setAthleteProfile] = useState(initialAthleteProfile);
  const [scoutCoachProfile, setScoutCoachProfile] = useState(initialScoutCoachProfile);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dobParts, setDobParts] = useState({ day: "", month: "", year: "" });

  const selectedRoleLabel = useMemo(() => roleLabels[role] ?? "Profile", [role]);
  const profileSteps = role === "athlete" ? athleteFieldGroups : scoutCoachFieldGroups;
  const activeStep = profileSteps[currentStep] ?? profileSteps[0];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === profileSteps.length - 1;
  const profileState = role === "athlete" ? athleteProfile : scoutCoachProfile;
  const hasOptionalSocialValue =
    role === "athlete" && ["instagram", "youtube", "tiktok"].some((field) => profileState[field]);
  const hasProfilePictureValue = Boolean(profilePic || profilePicUrl);
  const shouldShowSkip =
    (activeStep?.title === "Social links" && !hasOptionalSocialValue) ||
    (activeStep?.hasProfilePicture && !hasProfilePictureValue);

  useEffect(() => {
    let isMounted = true;

    async function loadExistingProfile(userId, activeRole) {
      let { data: commonProfile, error: commonProfileError } = await supabase
        .from("profiles")
        .select("full_name,first_name,last_name,country,current_club,sport")
        .eq("user_id", userId)
        .maybeSingle();

      if (isMissingCurrentClubColumn(commonProfileError)) {
        const fallbackResult = await supabase
          .from("profiles")
          .select("full_name,first_name,last_name,country,sport")
          .eq("user_id", userId)
          .maybeSingle();

        commonProfile = fallbackResult.data;
      }

      if (activeRole === "athlete") {
        const { data: athleteDetails } = await supabase
          .from("athlete_profiles")
          .select("main_position,secondary_position,date_of_birth,height,weight,preferred_foot,instagram,youtube,tiktok,profile_pic_url")
          .eq("user_id", userId)
          .maybeSingle();

        const loadedAthleteProfile = {
          ...initialAthleteProfile,
          ...commonProfile,
          ...athleteDetails,
          main_position: athleteDetails?.main_position ?? "",
          height: athleteDetails?.height?.toString() ?? "",
          weight: athleteDetails?.weight?.toString() ?? "",
        };

        setAthleteProfile(loadedAthleteProfile);
        setDobParts(getDateParts(loadedAthleteProfile.date_of_birth));
        setProfilePicUrl(athleteDetails?.profile_pic_url ?? null);
        return;
      }

      const { data: scoutCoachDetails } = await supabase
        .from("scout_coach_profiles")
        .select("role_title,organization,experience_years,achievements,certificates")
        .eq("user_id", userId)
        .maybeSingle();

      setScoutCoachProfile({
        ...initialScoutCoachProfile,
        ...commonProfile,
        ...scoutCoachDetails,
        experience_years: scoutCoachDetails?.experience_years?.toString() ?? "",
      });
    }

    async function loadProfile() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      const { data, error: userError } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError || !data.user) {
        router.push("/");
        return;
      }

      let activeUser = data.user;
      let activeRole = activeUser.user_metadata?.role;
      const pendingRole = window.localStorage.getItem(pendingRoleKey);

      if (!activeRole && pendingRole) {
        const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
          data: { role: pendingRole },
        });

        if (updateError) {
          setError(updateError.message);
          setIsLoading(false);
          return;
        }

        activeUser = updatedUser.user;
        activeRole = pendingRole;
        window.localStorage.removeItem(pendingRoleKey);
      }

      if (!activeRole) {
        activeRole = "athlete";
      }

      setUser(activeUser);
      setRole(activeRole);
      setCurrentStep(0);

      await loadExistingProfile(activeUser.id, activeRole);

      if (isMounted) {
        setIsLoading(false);
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function uploadProfilePicture(userId) {
    if (!profilePic) {
      return profilePicUrl;
    }

    const fileExtension = profilePic.name.split(".").pop() || "jpg";
    const filePath = `${userId}/profile.${fileExtension}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(filePath, profilePic, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

    return publicUrl;
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaved(false);

    if (!isLastStep) {
      handleNextStep();
      return;
    }

    if (!user || !role) {
      setError("Please sign in again before creating your profile.");
      return;
    }

    setIsSaving(true);

    try {
      const uploadedProfilePicUrl = role === "athlete" ? await uploadProfilePicture(user.id) : null;
      const activeProfile = role === "athlete" ? athleteProfile : scoutCoachProfile;
      const { commonProfile, detailProfile } = normalizeProfile(
        role,
        activeProfile,
        uploadedProfilePicUrl,
        user.email
      );

      const profilePayload = {
        user_id: user.id,
        role,
        ...commonProfile,
      };
      let { error: profileError } = await supabase.from("profiles").upsert(profilePayload);

      if (isMissingCurrentClubColumn(profileError)) {
        const fallbackProfilePayload = { ...profilePayload };
        delete fallbackProfilePayload.current_club;
        const fallbackResult = await supabase.from("profiles").upsert(fallbackProfilePayload);
        profileError = fallbackResult.error;
      }

      if (profileError) {
        throw profileError;
      }

      const detailTable = role === "athlete" ? "athlete_profiles" : "scout_coach_profiles";
      const { error: detailError } = await supabase.from(detailTable).upsert({
        user_id: user.id,
        ...detailProfile,
      });

      if (detailError) {
        throw detailError;
      }

      setProfilePicUrl(uploadedProfilePicUrl);
      setMessage("Profile saved.");
      setIsSaved(true);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  function isStepComplete(step) {
    return step.fields.every((field) => {
      if (!field.required) {
        return true;
      }

      const value = profileState[field.name];
      return value !== undefined && value !== null && value.toString().trim() !== "";
    });
  }

  function handleNextStep() {
    setError("");

    if (!isStepComplete(activeStep)) {
      setError("Please answer the required questions before continuing.");
      return;
    }

    setCurrentStep((step) => Math.min(step + 1, profileSteps.length - 1));
  }

  function handlePreviousStep() {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function updateProfileField(fieldName, value) {
    const setProfile = role === "athlete" ? setAthleteProfile : setScoutCoachProfile;
    setProfile((profile) => ({
      ...profile,
      [fieldName]: value,
      ...(fieldName === "sport" && role === "athlete"
        ? {
            main_position: positionOptionsBySport[value]?.includes(profile.main_position)
              ? profile.main_position
              : "",
            secondary_position: positionOptionsBySport[value]?.includes(profile.secondary_position)
              ? profile.secondary_position
              : "",
          }
        : {}),
    }));
  }

  function getFieldOptions(field) {
    if (field.type === "position") {
      return getPositionOptions(profileState.sport);
    }

    if (field.type === "preference") {
      return getPreferenceField(profileState.sport).options;
    }

    return field.options ?? [];
  }

  function getFieldLabel(field) {
    if (field.type === "preference") {
      return getPreferenceField(profileState.sport).label;
    }

    return field.label;
  }

  function updateDatePart(partName, value) {
    const nextParts = { ...dobParts, [partName]: value };
    const maxDay = getDaysInMonth(nextParts.month, nextParts.year);
    if (nextParts.day && Number(nextParts.day) > maxDay) {
      nextParts.day = maxDay.toString().padStart(2, "0");
    }

    setDobParts(nextParts);
    updateProfileField("date_of_birth", buildDateValue(nextParts));
  }

  function renderProfileField(field) {
    const fieldClassName = field.fullWidth ? styles.fullWidthField : undefined;

    if (field.type === "dob") {
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 80 }, (_, index) => currentYear - index - 5);
      const months = Array.from({ length: 12 }, (_, index) =>
        (index + 1).toString().padStart(2, "0")
      );
      const { day, month, year } = dobParts;
      const days = Array.from({ length: getDaysInMonth(month, year) }, (_, index) =>
        (index + 1).toString().padStart(2, "0")
      );

      return (
        <label className={styles.fullWidthField} key={field.name}>
          {field.label}
          <div className={styles.dateGrid}>
            <select
              aria-label="Birth day"
              onChange={(event) => updateDatePart("day", event.target.value)}
              required={field.required}
              value={day}
            >
              <option value="">Day</option>
              {days.map((dayOption) => (
                <option key={dayOption} value={dayOption}>
                  {dayOption}
                </option>
              ))}
            </select>
            <select
              aria-label="Birth month"
              onChange={(event) => updateDatePart("month", event.target.value)}
              required={field.required}
              value={month}
            >
              <option value="">Month</option>
              {months.map((monthOption) => (
                <option key={monthOption} value={monthOption}>
                  {monthOption}
                </option>
              ))}
            </select>
            <select
              aria-label="Birth year"
              onChange={(event) => updateDatePart("year", event.target.value)}
              required={field.required}
              value={year}
            >
              <option value="">Year</option>
              {years.map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>
          </div>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <label className={fieldClassName} key={field.name}>
          {field.label}
          <textarea
            onChange={(event) => updateProfileField(field.name, event.target.value)}
            rows={3}
            value={profileState[field.name] ?? ""}
          />
        </label>
      );
    }

    if (field.type === "select" || field.type === "position" || field.type === "preference") {
      const options = getFieldOptions(field);

      return (
        <label className={fieldClassName} key={field.name}>
          {getFieldLabel(field)}
          <select
            onChange={(event) => updateProfileField(field.name, event.target.value)}
            required={field.required}
            value={profileState[field.name] ?? ""}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    return (
      <label className={fieldClassName} key={field.name}>
        {field.label}
        <input
          autoComplete={field.autoComplete}
          inputMode={field.numericOnly ? "numeric" : undefined}
          maxLength={field.maxLength}
          onChange={(event) =>
            updateProfileField(field.name, cleanFieldValue(field, event.target.value))
          }
          placeholder={field.placeholder}
          required={field.required}
          type={field.type ?? "text"}
          value={profileState[field.name] ?? ""}
        />
      </label>
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.authPanel} aria-label="Create user profile">
        <div className={styles.brandBlock}>
          <p className={styles.kicker}>AthleteAura</p>
          <h1>Create your profile</h1>
          <p>{isLoading ? "Loading your account..." : `${selectedRoleLabel} profile details`}</p>
        </div>

        {!isLoading && (
          <form className={styles.authForm} onSubmit={handleSaveProfile}>
            <div className={styles.stepTracker} aria-label="Profile progress">
              {profileSteps.map((step, index) => (
                <span
                  aria-current={index === currentStep ? "step" : undefined}
                  className={index === currentStep ? styles.activeStepDot : styles.stepDot}
                  key={step.title}
                >
                  {index + 1}
                </span>
              ))}
            </div>

            <div className={styles.profileSection}>
              <p className={styles.sectionTitle}>{activeStep.title}</p>
              {activeStep.isConfirmation && (
                <div className={styles.confirmPanel}>
                  <p>Now you set up your profile.</p>
                  <p>Click save profile to finish.</p>
                </div>
              )}

              {activeStep.fields.length > 0 && (
                <div className={styles.fieldGrid}>
                  {activeStep.fields.map((field) => renderProfileField(field))}
                </div>
              )}

              {activeStep.hasProfilePicture && (
                <>
                  <label>
                    Upload profile pic
                    <input
                      accept="image/*"
                      onChange={(event) => setProfilePic(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                  </label>
                  {profilePicUrl && (
                    <a className={styles.profileLink} href={profilePicUrl} rel="noreferrer" target="_blank">
                      View current profile picture
                    </a>
                  )}
                </>
              )}
            </div>

            <div className={styles.stepActions}>
              <button
                className={styles.secondaryButton}
                disabled={isFirstStep || isSaving}
                type="button"
                onClick={handlePreviousStep}
              >
                Back
              </button>
              {isLastStep ? (
                <button className={styles.primaryButton} disabled={isSaving} type="submit">
                  {isSaving ? "Saving..." : "Save profile"}
                </button>
              ) : (
                <button className={styles.primaryButton} disabled={isSaving} type="button" onClick={handleNextStep}>
                  {shouldShowSkip ? "Skip" : "Next"}
                </button>
              )}
            </div>
            <button className={styles.secondaryButton} type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </form>
        )}

        {message && <p className={styles.successMessage}>{message}</p>}
        {isSaved && role === "scout_coach" && (
          <Link
            className={styles.primaryButton}
            href="/scout/profile"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
          >
            View my profile
          </Link>
        )}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </section>
    </main>
  );
}
