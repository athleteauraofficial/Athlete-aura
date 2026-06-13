"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  position: "",
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

const athleteIdentityFields = [
  { name: "first_name", label: "First Name", autoComplete: "given-name", required: true },
  { name: "last_name", label: "Last Name", autoComplete: "family-name", required: true },
  { name: "country", label: "Country", autoComplete: "country-name", required: true },
];

const athleteSportFields = [
  { name: "sport", label: "Sport", required: true, type: "select", options: sportOptions },
  { name: "current_club", label: "Current club if any" },
];

const athletePerformanceFields = [
  { name: "position", label: "Position", required: true },
  { name: "height", label: "Height", placeholder: "cm", type: "number" },
  { name: "weight", label: "Weight", placeholder: "kg", type: "number" },
  { name: "date_of_birth", label: "Date of Birth", required: true, type: "date" },
  {
    name: "preferred_foot",
    label: "Preferred Foot",
    type: "select",
    options: [
      { value: "", label: "Select" },
      { value: "right", label: "Right" },
      { value: "left", label: "Left" },
      { value: "both", label: "Both" },
    ],
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
];

const scoutCoachIdentityFields = [
  { name: "first_name", label: "First Name", autoComplete: "given-name", required: true },
  { name: "last_name", label: "Last Name", autoComplete: "family-name", required: true },
  { name: "country", label: "Country", autoComplete: "country-name", required: true },
];

const scoutCoachSportFields = [
  { name: "sport", label: "Sport", required: true, type: "select", options: sportOptions },
  { name: "current_club", label: "Current club if any" },
];

const scoutCoachRoleFields = [
  { name: "role_title", label: "Role title", required: true },
  { name: "organization", label: "Organization" },
  { name: "experience_years", label: "Experience years", type: "number" },
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
];

function emptyToNull(value) {
  return value === "" ? null : value;
}

function normalizeProfile(role, profile, profilePicUrl) {
  const commonProfile = {
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
        position: profile.position,
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
  const [currentStep, setCurrentStep] = useState(0);

  const selectedRoleLabel = useMemo(() => roleLabels[role] ?? "Profile", [role]);
  const profileSteps = role === "athlete" ? athleteFieldGroups : scoutCoachFieldGroups;
  const activeStep = profileSteps[currentStep] ?? profileSteps[0];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === profileSteps.length - 1;
  const profileState = role === "athlete" ? athleteProfile : scoutCoachProfile;

  useEffect(() => {
    let isMounted = true;

    async function loadExistingProfile(userId, activeRole) {
      const { data: commonProfile } = await supabase
        .from("profiles")
        .select("first_name,last_name,country,current_club,sport")
        .eq("user_id", userId)
        .maybeSingle();

      if (activeRole === "athlete") {
        const { data: athleteDetails } = await supabase
          .from("athlete_profiles")
          .select("position,date_of_birth,height,weight,preferred_foot,instagram,youtube,tiktok,profile_pic_url")
          .eq("user_id", userId)
          .maybeSingle();

        setAthleteProfile({
          ...initialAthleteProfile,
          ...commonProfile,
          ...athleteDetails,
          height: athleteDetails?.height?.toString() ?? "",
          weight: athleteDetails?.weight?.toString() ?? "",
        });
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
        uploadedProfilePicUrl
      );

      const { error: profileError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        role,
        ...commonProfile,
      });

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
    }));
  }

  function renderProfileField(field) {
    const fieldClassName = field.fullWidth ? styles.fullWidthField : undefined;

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

    if (field.type === "select") {
      return (
        <label className={fieldClassName} key={field.name}>
          {field.label}
          <select
            onChange={(event) => updateProfileField(field.name, event.target.value)}
            required={field.required}
            value={profileState[field.name] ?? ""}
          >
            {field.options.map((option) => (
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
          min={field.type === "number" ? "0" : undefined}
          onChange={(event) => updateProfileField(field.name, event.target.value)}
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
                  Next
                </button>
              )}
            </div>
            <button className={styles.secondaryButton} type="button" onClick={handleSignOut}>
              Sign out
            </button>
          </form>
        )}

        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </section>
    </main>
  );
}
