"use client";

import { useEffect, useMemo, useState } from "react";
import AthleteCard from "@/components/discover/AthleteCard";
import DiscoverFilters from "@/components/discover/DiscoverFilters";
import DiscoverSearch from "@/components/discover/DiscoverSearch";
import {
  hasSupabaseEnv,
  supabase,
  supabaseConfigError,
} from "@/lib/supabase";
import styles from "./discover.module.css";

const FILTER_FIELDS = [
  { field: "sport", label: "Sport" },
  { field: "main_position", label: "Position" },
  { field: "country", label: "Country" },
  { field: "current_club", label: "Club" },
];

const EMPTY_FILTERS = FILTER_FIELDS.reduce(
  (acc, { field }) => ({ ...acc, [field]: "" }),
  {}
);

export default function DiscoverPage() {
  const [athletes, setAthletes] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAthletes() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      try {
        const { data: commonProfiles, error: profileError } = await supabase
          .from("profiles")
          .select(
            "user_id,full_name,first_name,last_name,sport,country,current_club"
          )
          .eq("role", "athlete");

        if (profileError) throw profileError;

        const userIds = (commonProfiles ?? []).map((profile) => profile.user_id);
        let athleteDetails = [];

        if (userIds.length > 0) {
          const { data, error: athleteError } = await supabase
            .from("athlete_profiles")
            .select("user_id,main_position,date_of_birth")
            .in("user_id", userIds);

          if (athleteError) throw athleteError;
          athleteDetails = data ?? [];
        }

        const detailsByUserId = new Map(
          athleteDetails.map((details) => [details.user_id, details])
        );
        const mergedAthletes = (commonProfiles ?? [])
          .filter((profile) => detailsByUserId.has(profile.user_id))
          .map((profile) => ({
            ...profile,
            ...detailsByUserId.get(profile.user_id),
          }));

        if (isMounted) {
          setAthletes(mergedAthletes);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Unable to load athletes.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAthletes();

    return () => {
      isMounted = false;
    };
  }, []);

  const filterOptions = useMemo(() => {
    return FILTER_FIELDS.reduce((acc, { field }) => {
      const values = new Set();
      for (const athlete of athletes) {
        const value = athlete[field];
        if (value) values.add(value);
      }
      acc[field] = Array.from(values).sort((a, b) => a.localeCompare(b));
      return acc;
    }, {});
  }, [athletes]);

  const filteredAthletes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return athletes.filter((athlete) => {
      const matchesFilters = FILTER_FIELDS.every(({ field }) => {
        const selected = filters[field];
        return !selected || athlete[field] === selected;
      });

      if (!matchesFilters) return false;
      if (!query) return true;

      const searchableValues = [
        athlete.full_name,
        `${athlete.first_name ?? ""} ${athlete.last_name ?? ""}`,
        athlete.sport,
        athlete.main_position,
        athlete.country,
        athlete.current_club,
      ];

      return searchableValues.some((value) =>
        value?.toLowerCase().includes(query)
      );
    });
  }, [athletes, search, filters]);

  function handleFilterChange(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function handleResetFilters() {
    setFilters(EMPTY_FILTERS);
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>AthleteAura</p>
          <h1>Discover Athletes</h1>
          <p>Browse athlete profiles and find the right fit for your team.</p>
        </header>

        <DiscoverSearch value={search} onChange={setSearch} />

        {!isLoading && !error && athletes.length > 0 && (
          <DiscoverFilters
            fields={FILTER_FIELDS}
            options={filterOptions}
            values={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        )}

        {isLoading && (
          <p className={styles.status} role="status">
            Loading athletes...
          </p>
        )}

        {!isLoading && error && (
          <div className={styles.error} role="alert">
            <strong>We could not load Discover Athletes.</strong>
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && athletes.length === 0 && (
          <p className={styles.status}>No athletes found.</p>
        )}

        {!isLoading &&
          !error &&
          athletes.length > 0 &&
          filteredAthletes.length === 0 && (
            <p className={styles.status}>No athletes match your search.</p>
          )}

        {!isLoading && !error && filteredAthletes.length > 0 && (
          <div className={styles.grid}>
            {filteredAthletes.map((athlete) => (
              <AthleteCard athlete={athlete} key={athlete.user_id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
