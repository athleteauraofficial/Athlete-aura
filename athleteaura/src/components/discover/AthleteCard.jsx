import Link from "next/link";
import styles from "./discover.module.css";

function getAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function getInitials(firstName, lastName) {
  return [firstName, lastName]
    .filter(Boolean)
    .map((name) => name[0])
    .join("")
    .toUpperCase() || "AA";
}

export default function AthleteCard({ athlete }) {
  const fullName =
    athlete.full_name?.trim() ||
    `${athlete.first_name ?? ""} ${athlete.last_name ?? ""}`.trim() ||
    "Athlete";
  const age = getAge(athlete.date_of_birth);
  const details = [
    { label: "Position", value: athlete.main_position },
    { label: "Country", value: athlete.country },
    { label: "Club", value: athlete.current_club || "None" },
    { label: "Age", value: age },
  ].filter((detail) => detail.value !== null && detail.value !== undefined && detail.value !== "");

  return (
    <article className={styles.card}>
      <div
        aria-label={`${fullName} profile photo`}
        className={styles.photo}
        role="img"
        style={
          athlete.profile_pic_url
            ? { backgroundImage: `url("${athlete.profile_pic_url}")` }
            : undefined
        }
      >
        {!athlete.profile_pic_url &&
          getInitials(athlete.first_name, athlete.last_name)}
      </div>

      <div className={styles.cardBody}>
        <div>
          {athlete.sport && (
            <span className={styles.sport}>{athlete.sport}</span>
          )}
          <h2>{fullName}</h2>
        </div>

        <dl className={styles.details}>
          {details.map((detail) => (
            <div key={detail.label}>
              <dt>{detail.label}</dt>
              <dd>{detail.value}</dd>
            </div>
          ))}
        </dl>

        <Link
          className={styles.profileLink}
          href={`/athletes/${encodeURIComponent(athlete.user_id)}`}
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
