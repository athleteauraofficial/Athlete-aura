"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Heart,
  ImagePlus,
  Flag,
  Flame,
  MessageCircle,
  Pencil,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./explore.module.css";

const CATEGORIES = [
  "Training",
  "Fitness",
  "Nutrition",
  "Achievement",
  "Question",
  "General Sports",
];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "liked", label: "Most liked" },
  { value: "commented", label: "Most commented" },
];
const REQUEST_TIMEOUT_MS = 12000;
const AUTH_TIMEOUT_MS = 30000;

function withTimeout(promise, message, timeoutMs = REQUEST_TIMEOUT_MS) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function getStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    const authKey = Object.keys(window.localStorage).find(
      (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
    );

    if (!authKey) return null;

    const authValue = JSON.parse(window.localStorage.getItem(authKey) ?? "{}");
    return authValue.user ?? authValue.currentSession?.user ?? null;
  } catch {
    return null;
  }
}

async function getActiveUser() {
  const storedUser = getStoredUser();
  if (storedUser) return storedUser;

  const { data: sessionData, error: sessionError } = await withTimeout(
    supabase.auth.getSession(),
    "Supabase session took too long to load. Sign out and log in again, then reopen Explore.",
    AUTH_TIMEOUT_MS
  );

  if (sessionError) throw sessionError;
  return sessionData.session?.user ?? null;
}

function getDisplayName(profile) {
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return name || profile?.full_name || "AthleteAura user";
}

function getRoleLabel(role) {
  if (role === "athlete") return "Athlete";
  if (role === "scout_coach") return "Coach";
  return "Member";
}

function getInitials(profile) {
  return getDisplayName(profile)
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProfileAvatar({ profile }) {
  if (profile?.profile_pic_url) {
    return (
      <div
        aria-label={`${getDisplayName(profile)} profile picture`}
        className={styles.avatar}
        role="img"
        style={{ backgroundImage: `url("${profile.profile_pic_url}")` }}
      />
    );
  }

  return <div className={styles.avatar}>{getInitials(profile)}</div>;
}

function ProfileLink({ children, userId }) {
  if (!userId) return children;

  return (
    <Link className={styles.profileLink} href={`/profiles/${encodeURIComponent(userId)}`}>
      {children}
    </Link>
  );
}

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function safeFileName(name) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "-").replace(/-+/g, "-");
}

function getHashtags(content) {
  return Array.from(
    new Set((content.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((tag) => tag.toLowerCase()))
  );
}

function getSearchScore(post, author, query) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) return 1;

  const content = post.content.toLowerCase();
  const category = post.category.toLowerCase();
  const authorName = getDisplayName(author).toLowerCase();
  const role = getRoleLabel(author?.role).toLowerCase();
  const haystack = [content, category, authorName, role, author?.sport, author?.country]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let score = 0;
  if (content.includes(query)) score += 8;
  if (category.includes(query)) score += 5;
  if (authorName.includes(query)) score += 4;

  for (const term of terms) {
    if (content.includes(term)) score += 3;
    if (category.includes(term)) score += 2;
    if (authorName.includes(term)) score += 2;
    if (haystack.includes(term)) score += 1;
  }

  return score;
}

export default function ExplorePage() {
  const router = useRouter();
  const imageInputRef = useRef(null);
  const [user, setUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [commentsByPostId, setCommentsByPostId] = useState({});
  const [likesByPostId, setLikesByPostId] = useState({});
  const [commentLikesById, setCommentLikesById] = useState({});
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [followedUserIds, setFollowedUserIds] = useState(new Set());
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [imageFile, setImageFile] = useState(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");
  const [commentDrafts, setCommentDrafts] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyingToCommentId, setReplyingToCommentId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [editingPostId, setEditingPostId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState(CATEGORIES[0]);
  const [isComposerOpen, setIsComposerOpen] = useState(
    () => typeof window !== "undefined" && window.location.hash === "#compose"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [busyPostId, setBusyPostId] = useState(null);
  const [error, setError] = useState("");

  async function loadFeed(activeUserId = user?.id) {
    const { data: postRows, error: postsError } = await withTimeout(
      supabase
        .from("posts")
        .select("id,user_id,content,category,image_url,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      "Explore posts took too long to load. Check Supabase connection and run the community feed SQL."
    );

    if (postsError) throw postsError;

    const loadedPosts = postRows ?? [];
    const postIds = loadedPosts.map((post) => post.id);
    const userIds = Array.from(new Set(loadedPosts.map((post) => post.user_id)));

    let followingRows = [];
    let savedRows = [];
    if (activeUserId) {
      const [{ data: follows, error: followingError }, { data: saves, error: savesError }] =
        await Promise.all([
          withTimeout(
            supabase
              .from("user_follows")
              .select("following_id")
              .eq("follower_id", activeUserId),
            "Following list took too long to load. Check Supabase connection."
          ),
          withTimeout(
            supabase
              .from("post_saves")
              .select("post_id")
              .eq("user_id", activeUserId),
            "Saved posts took too long to load. Check Supabase connection."
          ),
        ]);

      if (followingError && followingError.code !== "42P01") throw followingError;
      if (savesError && savesError.code !== "42P01") throw savesError;
      followingRows = followingError ? [] : follows ?? [];
      savedRows = savesError ? [] : saves ?? [];
    }

    let profileRows = [];
    if (userIds.length > 0) {
      const { data, error: profilesError } = await withTimeout(
        supabase
          .from("community_profiles")
          .select("user_id,role,full_name,first_name,last_name,country,current_club,sport,profile_pic_url")
          .in("user_id", userIds),
        "Explore profiles took too long to load. Check Supabase connection and run the community feed SQL."
      );

      if (profilesError) throw profilesError;
      profileRows = data ?? [];
    }

    let commentRows = [];
    let likeRows = [];
    let commentLikeRows = [];
    if (postIds.length > 0) {
      const [{ data: comments, error: commentsError }, { data: likes, error: likesError }] =
        await Promise.all([
          withTimeout(
            supabase
              .from("comments")
              .select("id,post_id,parent_comment_id,user_id,content,created_at")
              .in("post_id", postIds)
              .order("created_at", { ascending: true }),
            "Explore comments took too long to load. Check Supabase connection."
          ),
          withTimeout(
            supabase.from("post_likes").select("post_id,user_id,created_at").in("post_id", postIds),
            "Explore likes took too long to load. Check Supabase connection."
          ),
        ]);

      if (commentsError) throw commentsError;
      if (likesError) throw likesError;
      commentRows = comments ?? [];
      likeRows = likes ?? [];

      const commentIds = commentRows.map((comment) => comment.id);
      if (commentIds.length > 0) {
        const { data, error: commentLikesError } = await withTimeout(
          supabase
            .from("comment_likes")
            .select("comment_id,user_id,created_at")
            .in("comment_id", commentIds),
          "Comment likes took too long to load. Check Supabase connection."
        );

        if (commentLikesError) throw commentLikesError;
        commentLikeRows = data ?? [];
      }

      const commentUserIds = Array.from(new Set(commentRows.map((comment) => comment.user_id)));
      const missingUserIds = commentUserIds.filter((userId) => !userIds.includes(userId));

      if (missingUserIds.length > 0) {
        const { data, error: commentProfilesError } = await withTimeout(
          supabase
            .from("community_profiles")
            .select("user_id,role,full_name,first_name,last_name,country,current_club,sport,profile_pic_url")
            .in("user_id", missingUserIds),
          "Comment profiles took too long to load. Check Supabase connection."
        );

        if (commentProfilesError) throw commentProfilesError;
        profileRows = [...profileRows, ...(data ?? [])];
      }
    }

    const nextProfilesById = Object.fromEntries(
      profileRows.map((profile) => [profile.user_id, profile])
    );
    const nextCommentsByPostId = commentRows.reduce((acc, comment) => {
      acc[comment.post_id] = [...(acc[comment.post_id] ?? []), comment];
      return acc;
    }, {});
    const nextLikesByPostId = likeRows.reduce((acc, like) => {
      acc[like.post_id] = [...(acc[like.post_id] ?? []), like];
      return acc;
    }, {});
    const nextCommentLikesById = commentLikeRows.reduce((acc, like) => {
      acc[like.comment_id] = [...(acc[like.comment_id] ?? []), like];
      return acc;
    }, {});

    setPosts(loadedPosts);
    setFollowedUserIds(new Set(followingRows.map((follow) => follow.following_id)));
    setSavedPostIds(new Set(savedRows.map((save) => save.post_id)));
    setProfilesById(nextProfilesById);
    setCommentsByPostId(nextCommentsByPostId);
    setLikesByPostId(nextLikesByPostId);
    setCommentLikesById(nextCommentLikesById);
  }

  useEffect(() => {
    let isMounted = true;

    async function loadExplore() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      try {
        const activeUser = await getActiveUser();

        if (!activeUser) {
          router.replace("/");
          return;
        }

        const { data: profile, error: profileError } = await withTimeout(
          supabase
            .from("community_profiles")
            .select("user_id,role,full_name,first_name,last_name,country,current_club,sport,profile_pic_url")
            .eq("user_id", activeUser.id)
            .maybeSingle(),
          "Your community profile took too long to load. Run the community feed SQL in Supabase."
        );

        if (profileError) throw profileError;
        if (!profile?.first_name || !profile?.last_name || !profile?.sport) {
          router.replace("/profile");
          return;
        }

        if (!isMounted) return;
        setUser(activeUser);
        setCurrentProfile(profile);
        await loadFeed(activeUser.id);
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load Explore.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadExplore();

    return () => {
      isMounted = false;
    };
    // loadFeed is called inside the guarded initial load with the active user id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  useEffect(() => {
    function openComposerFromNavigation() {
      if (window.location.hash === "#compose") {
        setIsComposerOpen(true);
      }
    }

    function openComposer() {
      setIsComposerOpen(true);
    }

    window.addEventListener("hashchange", openComposerFromNavigation);
    window.addEventListener("athleteaura:open-composer", openComposer);
    return () => {
      window.removeEventListener("hashchange", openComposerFromNavigation);
      window.removeEventListener("athleteaura:open-composer", openComposer);
    };
  }, []);

  const canPost = useMemo(() => content.trim().length > 0 && !isPosting, [content, isPosting]);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const postsMatchingCategory =
      categoryFilter === "all"
        ? posts
        : posts.filter((post) => post.category === categoryFilter);

    const searchedPosts = !query
      ? postsMatchingCategory
      : postsMatchingCategory
          .map((post) => ({
            post,
            score: getSearchScore(post, profilesById[post.user_id], query),
          }))
          .filter((item) => item.score > 0)
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return new Date(b.post.created_at).getTime() - new Date(a.post.created_at).getTime();
          })
          .map((item) => item.post);

    return [...searchedPosts].sort((a, b) => {
      const aIsFollowed = followedUserIds.has(a.user_id);
      const bIsFollowed = followedUserIds.has(b.user_id);
      if (aIsFollowed !== bIsFollowed) return aIsFollowed ? -1 : 1;

      if (sortMode === "liked") {
        return (likesByPostId[b.id]?.length ?? 0) - (likesByPostId[a.id]?.length ?? 0);
      }
      if (sortMode === "commented") {
        return (commentsByPostId[b.id]?.length ?? 0) - (commentsByPostId[a.id]?.length ?? 0);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    categoryFilter,
    commentsByPostId,
    followedUserIds,
    likesByPostId,
    posts,
    profilesById,
    search,
    sortMode,
  ]);

  const categoryCounts = useMemo(() => {
    const counts = Object.fromEntries(CATEGORIES.map((item) => [item, 0]));
    for (const post of posts) {
      counts[post.category] = (counts[post.category] ?? 0) + 1;
    }
    return counts;
  }, [posts]);

  const suggestedAthletes = useMemo(() => {
    return Object.values(profilesById)
      .filter((profile) => profile.user_id !== user?.id && profile.role === "athlete")
      .slice(0, 3);
  }, [profilesById, user?.id]);

  const activityStats = useMemo(() => {
    const ownPosts = posts.filter((post) => post.user_id === user?.id);
    const likesReceived = ownPosts.reduce(
      (total, post) => total + (likesByPostId[post.id]?.length ?? 0),
      0
    );
    const commentsCount = ownPosts.reduce(
      (total, post) => total + (commentsByPostId[post.id]?.length ?? 0),
      0
    );

    return {
      posts: ownPosts.length,
      likesReceived,
      commentsCount,
    };
  }, [commentsByPostId, likesByPostId, posts, user?.id]);

  async function uploadPostImage() {
    if (!imageFile || !user) return null;

    const path = `${user.id}/${Date.now()}-${safeFileName(imageFile.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, imageFile, { upsert: false });

    if (uploadError) throw uploadError;
    return supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    if (!canPost || !user) return;

    setError("");
    setIsPosting(true);

    try {
      const imageUrl = await uploadPostImage();
      const { error: insertError } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content.trim(),
        category,
        image_url: imageUrl,
      });

      if (insertError) throw insertError;

      setContent("");
      setCategory(CATEGORIES[0]);
      setImageFile(null);
      setIsComposerOpen(false);
      await loadFeed(user.id);
    } catch (postError) {
      setError(postError.message || "Unable to create post.");
    } finally {
      setIsPosting(false);
    }
  }

  async function handleDeletePost(post) {
    if (!user || post.user_id !== user.id) return;

    setError("");
    setBusyPostId(post.id);

    try {
      const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;
      setPosts((current) => current.filter((item) => item.id !== post.id));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete post.");
    } finally {
      setBusyPostId(null);
    }
  }

  function startEditingPost(post) {
    setEditingPostId(post.id);
    setEditContent(post.content);
    setEditCategory(post.category);
    setError("");
  }

  function cancelEditingPost() {
    setEditingPostId(null);
    setEditContent("");
    setEditCategory(CATEGORIES[0]);
  }

  async function handleEditPost(event, post) {
    event.preventDefault();
    if (!user || post.user_id !== user.id || !editContent.trim()) return;

    setError("");
    setBusyPostId(post.id);

    try {
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          content: editContent.trim(),
          category: editCategory,
        })
        .eq("id", post.id)
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      setPosts((current) =>
        current.map((item) =>
          item.id === post.id
            ? { ...item, content: editContent.trim(), category: editCategory }
            : item
        )
      );
      cancelEditingPost();
    } catch (editError) {
      setError(editError.message || "Unable to edit post.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleToggleLike(postId) {
    if (!user) return;

    const likes = likesByPostId[postId] ?? [];
    const hasLiked = likes.some((like) => like.user_id === user.id);
    setBusyPostId(postId);
    setError("");

    try {
      if (hasLiked) {
        const { error: unlikeError } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (unlikeError) throw unlikeError;

        setLikesByPostId((current) => ({
          ...current,
          [postId]: (current[postId] ?? []).filter((like) => like.user_id !== user.id),
        }));
      } else {
        const { data, error: likeError } = await supabase
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id })
          .select("post_id,user_id,created_at")
          .single();

        if (likeError) throw likeError;

        setLikesByPostId((current) => ({
          ...current,
          [postId]: [...(current[postId] ?? []), data],
        }));
      }
    } catch (likeError) {
      setError(likeError.message || "Unable to update like.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleToggleSave(postId) {
    if (!user) return;

    const hasSaved = savedPostIds.has(postId);
    setBusyPostId(postId);
    setError("");

    try {
      if (hasSaved) {
        const { error: unsaveError } = await supabase
          .from("post_saves")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (unsaveError) throw unsaveError;

        setSavedPostIds((current) => {
          const next = new Set(current);
          next.delete(postId);
          return next;
        });
      } else {
        const { error: saveError } = await supabase
          .from("post_saves")
          .upsert(
            { post_id: postId, user_id: user.id },
            { ignoreDuplicates: true, onConflict: "post_id,user_id" }
          );

        if (saveError) throw saveError;

        setSavedPostIds((current) => {
          const next = new Set(current);
          next.add(postId);
          return next;
        });
      }
    } catch (saveError) {
      setError(saveError.message || "Unable to update saved post.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleCreateComment(event, postId, parentCommentId = null) {
    event.preventDefault();
    if (!user) return;

    const draftKey = parentCommentId ?? postId;
    const draft = parentCommentId
      ? (replyDrafts[parentCommentId] ?? "").trim()
      : (commentDrafts[postId] ?? "").trim();
    if (!draft) return;

    setBusyPostId(postId);
    setError("");

    try {
      const { data, error: commentError } = await supabase
        .from("comments")
        .insert({
          post_id: postId,
          parent_comment_id: parentCommentId,
          user_id: user.id,
          content: draft,
        })
        .select("id,post_id,parent_comment_id,user_id,content,created_at")
        .single();

      if (commentError) throw commentError;

      setCommentsByPostId((current) => ({
        ...current,
        [postId]: [...(current[postId] ?? []), data],
      }));
      if (parentCommentId) {
        setReplyDrafts((current) => ({ ...current, [draftKey]: "" }));
        setReplyingToCommentId(null);
      } else {
        setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      }
    } catch (commentError) {
      setError(commentError.message || "Unable to add comment.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleDeleteComment(comment) {
    if (!user || comment.user_id !== user.id) return;

    setError("");
    setBusyPostId(comment.post_id);

    try {
      const { error: deleteError } = await supabase
        .from("comments")
        .delete()
        .eq("id", comment.id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;

      setCommentsByPostId((current) => ({
        ...current,
        [comment.post_id]: (current[comment.post_id] ?? []).filter(
          (item) => item.id !== comment.id && item.parent_comment_id !== comment.id
        ),
      }));
    } catch (deleteError) {
      setError(deleteError.message || "Unable to delete comment.");
    } finally {
      setBusyPostId(null);
    }
  }

  async function handleToggleCommentLike(commentId) {
    if (!user) return;

    const likes = commentLikesById[commentId] ?? [];
    const hasLiked = likes.some((like) => like.user_id === user.id);
    setError("");

    try {
      if (hasLiked) {
        const { error: unlikeError } = await supabase
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", user.id);
        if (unlikeError) throw unlikeError;

        setCommentLikesById((current) => ({
          ...current,
          [commentId]: (current[commentId] ?? []).filter((like) => like.user_id !== user.id),
        }));
      } else {
        const { data, error: likeError } = await supabase
          .from("comment_likes")
          .insert({ comment_id: commentId, user_id: user.id })
          .select("comment_id,user_id,created_at")
          .single();
        if (likeError) throw likeError;

        setCommentLikesById((current) => ({
          ...current,
          [commentId]: [...(current[commentId] ?? []), data],
        }));
      }
    } catch (likeError) {
      setError(likeError.message || "Unable to update comment like.");
    }
  }

  async function handleReportPost(postId) {
    if (!user) return;

    setError("");
    setBusyPostId(postId);

    try {
      const { error: reportError } = await supabase.from("post_reports").insert({
        post_id: postId,
        user_id: user.id,
        reason: "Reported from Explore",
      });

      if (reportError) throw reportError;
    } catch (reportError) {
      setError(reportError.message || "Unable to report post.");
    } finally {
      setBusyPostId(null);
    }
  }

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>Loading Explore...</p>
      </main>
    );
  }

  if (error && !currentProfile) {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <div className={styles.error} role="alert">
            {error}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Community Feed</p>
          <h1>Explore</h1>
          <p>Share training notes, questions, achievements, and sports ideas with the community.</p>
        </header>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <div className={styles.exploreGrid}>
          <section className={styles.feedColumn} aria-label="Community posts">
            <div className={styles.feedTopBar}>
              <section className={styles.searchPanel} aria-label="Search community posts">
                <Search aria-hidden="true" size={19} />
                <input
                  placeholder="Find training tips, questions, achievements..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                {search && (
                  <button aria-label="Clear search" type="button" onClick={() => setSearch("")}>
                    <X size={17} />
                  </button>
                )}
              </section>

              <button
                className={styles.createPostButton}
                type="button"
                onClick={() => setIsComposerOpen((isOpen) => !isOpen)}
              >
                {isComposerOpen ? "Close" : "Add Post"}
              </button>
            </div>

            {isComposerOpen && (
              <form className={styles.composer} onSubmit={handleCreatePost}>
                <div className={styles.composerIdentity}>
                  <div className={styles.avatar}>{getInitials(currentProfile)}</div>
                  <div>
                    <strong>{getDisplayName(currentProfile)}</strong>
                    <span>{getRoleLabel(currentProfile?.role)}</span>
                  </div>
                </div>

                <textarea
                  maxLength={2000}
                  placeholder="What do you want to share?"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />

                {imageFile && (
                  <div className={styles.selectedImage}>
                    <span>{imageFile.name}</span>
                    <button aria-label="Remove selected image" type="button" onClick={() => setImageFile(null)}>
                      <X size={16} />
                    </button>
                  </div>
                )}

                <div className={styles.composerControls}>
                  <div className={styles.categoryButtons}>
                    {CATEGORIES.map((item) => (
                      <button
                        className={category === item ? styles.activeCategoryButton : undefined}
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>

                  <input
                    ref={imageInputRef}
                    accept="image/*"
                    className={styles.hiddenInput}
                    type="file"
                    onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  />

                  <button
                    className={styles.iconButton}
                    title="Add image"
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                  >
                    <ImagePlus size={18} />
                  </button>

                  <button className={styles.postButton} disabled={!canPost} type="submit">
                    {isPosting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            )}

            <div className={styles.feedControls}>
              <label>
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Sort
                <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {search.trim() && (
              <p className={styles.searchMeta}>
                {visiblePosts.length} result{visiblePosts.length === 1 ? "" : "s"} for{" "}
                <span>{search.trim()}</span>
              </p>
            )}

            <div className={styles.feed}>
              {posts.length === 0 ? (
                <p className={styles.status}>No posts yet. Start the first conversation.</p>
              ) : visiblePosts.length === 0 ? (
                <p className={styles.status}>No similar posts found.</p>
              ) : (
                visiblePosts.map((post) => {
                  const author = profilesById[post.user_id];
                  const likes = likesByPostId[post.id] ?? [];
                  const comments = commentsByPostId[post.id] ?? [];
                  const parentComments = comments.filter((comment) => !comment.parent_comment_id);
                  const repliesByCommentId = comments.reduce((acc, comment) => {
                    if (comment.parent_comment_id) {
                      acc[comment.parent_comment_id] = [
                        ...(acc[comment.parent_comment_id] ?? []),
                        comment,
                      ];
                    }
                    return acc;
                  }, {});
                  const tags = getHashtags(post.content);
                  const hasLiked = likes.some((like) => like.user_id === user?.id);
                  const hasSaved = savedPostIds.has(post.id);
                  const isOwner = post.user_id === user?.id;
                  const isEditing = editingPostId === post.id;
                  const commentsOpen = Boolean(expandedComments[post.id]);

                  return (
                    <article className={styles.postCard} id={`post-${post.id}`} key={post.id}>
                      <div className={styles.postHeader}>
                        <div className={styles.authorBlock}>
                          <ProfileLink userId={post.user_id}>
                            <ProfileAvatar profile={author} />
                          </ProfileLink>
                          <div>
                            <ProfileLink userId={post.user_id}>
                              <strong>
                                {getDisplayName(author)} <span>- {getRoleLabel(author?.role)}</span>
                              </strong>
                            </ProfileLink>
                            <small>
                              {[author?.country, formatTime(post.created_at)].filter(Boolean).join(" - ")}
                            </small>
                          </div>
                        </div>

                        <div className={styles.postMenu}>
                          {isOwner ? (
                            <>
                              <button
                                className={styles.smallIconButton}
                                disabled={busyPostId === post.id}
                                title="Edit post"
                                type="button"
                                onClick={() => startEditingPost(post)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className={styles.deleteButton}
                                disabled={busyPostId === post.id}
                                title="Delete post"
                                type="button"
                                onClick={() => handleDeletePost(post)}
                              >
                                <Trash2 size={17} />
                              </button>
                            </>
                          ) : (
                            <button
                              className={styles.smallIconButton}
                              disabled={busyPostId === post.id}
                              title="Report post"
                              type="button"
                              onClick={() => handleReportPost(post.id)}
                            >
                              <Flag size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <span className={styles.category}>{post.category}</span>

                      {isEditing ? (
                        <form className={styles.editPostForm} onSubmit={(event) => handleEditPost(event, post)}>
                          <textarea
                            maxLength={2000}
                            value={editContent}
                            onChange={(event) => setEditContent(event.target.value)}
                          />
                          <div>
                            <select
                              value={editCategory}
                              onChange={(event) => setEditCategory(event.target.value)}
                            >
                              {CATEGORIES.map((item) => (
                                <option key={item} value={item}>
                                  {item}
                                </option>
                              ))}
                            </select>
                            <button type="button" onClick={cancelEditingPost}>
                              Cancel
                            </button>
                            <button disabled={busyPostId === post.id || !editContent.trim()} type="submit">
                              Save
                            </button>
                          </div>
                        </form>
                      ) : (
                        <p className={styles.postContent}>{post.content}</p>
                      )}

                      {tags.length > 0 && (
                        <div className={styles.tagList}>
                          {tags.map((tag) => (
                            <button key={tag} type="button" onClick={() => setSearch(tag)}>
                              {tag}
                            </button>
                          ))}
                        </div>
                      )}

                      {post.image_url && (
                        <Image
                          unoptimized
                          alt=""
                          className={styles.postImage}
                          height={520}
                          src={post.image_url}
                          width={900}
                        />
                      )}

                      <div className={styles.postActions}>
                        <button
                          className={hasLiked ? styles.likedAction : styles.actionButton}
                          disabled={busyPostId === post.id}
                          type="button"
                          onClick={() => handleToggleLike(post.id)}
                        >
                          <Heart size={18} fill={hasLiked ? "currentColor" : "none"} />
                          {likes.length}
                        </button>
                        <button
                          className={styles.actionButton}
                          type="button"
                          onClick={() =>
                            setExpandedComments((current) => ({
                              ...current,
                              [post.id]: !current[post.id],
                            }))
                          }
                        >
                          <MessageCircle size={18} />
                          {comments.length} Comment{comments.length === 1 ? "" : "s"}
                        </button>
                        <button
                          className={hasSaved ? styles.savedAction : styles.actionButton}
                          disabled={busyPostId === post.id}
                          title={hasSaved ? "Remove from saved" : "Save post"}
                          type="button"
                          onClick={() => handleToggleSave(post.id)}
                        >
                          <Bookmark size={18} fill={hasSaved ? "currentColor" : "none"} />
                          {hasSaved ? "Saved" : "Save"}
                        </button>
                      </div>

                      {commentsOpen && parentComments.length > 0 && (
                        <div className={styles.comments}>
                          {parentComments.map((comment) => {
                            const commentAuthor = profilesById[comment.user_id];
                            const commentLikes = commentLikesById[comment.id] ?? [];
                            const hasLikedComment = commentLikes.some((like) => like.user_id === user?.id);
                            const replies = repliesByCommentId[comment.id] ?? [];
                            return (
                              <div className={styles.commentThread} key={comment.id}>
                                <div className={styles.comment}>
                                  <div className={styles.commentBody}>
                                    <strong>{getDisplayName(commentAuthor)}</strong>
                                    <span>{comment.content}</span>
                                    <div className={styles.commentActions}>
                                      <button
                                        className={hasLikedComment ? styles.likedCommentButton : undefined}
                                        type="button"
                                        onClick={() => handleToggleCommentLike(comment.id)}
                                      >
                                        <Heart size={14} fill={hasLikedComment ? "currentColor" : "none"} />
                                        {commentLikes.length}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setReplyingToCommentId(
                                            replyingToCommentId === comment.id ? null : comment.id
                                          )
                                        }
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                  {comment.user_id === user?.id && (
                                    <button
                                      aria-label="Delete comment"
                                      className={styles.commentDeleteButton}
                                      type="button"
                                      onClick={() => handleDeleteComment(comment)}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>

                                {replyingToCommentId === comment.id && (
                                  <form
                                    className={styles.replyForm}
                                    onSubmit={(event) => handleCreateComment(event, post.id, comment.id)}
                                  >
                                    <input
                                      maxLength={1000}
                                      placeholder={`Reply to ${getDisplayName(commentAuthor)}...`}
                                      value={replyDrafts[comment.id] ?? ""}
                                      onChange={(event) =>
                                        setReplyDrafts((current) => ({
                                          ...current,
                                          [comment.id]: event.target.value,
                                        }))
                                      }
                                    />
                                    <button
                                      aria-label="Send reply"
                                      disabled={busyPostId === post.id || !replyDrafts[comment.id]?.trim()}
                                      type="submit"
                                    >
                                      <Send size={15} />
                                    </button>
                                  </form>
                                )}

                                {replies.length > 0 && (
                                  <div className={styles.replies}>
                                    {replies.map((reply) => {
                                      const replyAuthor = profilesById[reply.user_id];
                                      const replyLikes = commentLikesById[reply.id] ?? [];
                                      const hasLikedReply = replyLikes.some(
                                        (like) => like.user_id === user?.id
                                      );

                                      return (
                                        <div className={styles.comment} key={reply.id}>
                                          <div className={styles.commentBody}>
                                            <strong>{getDisplayName(replyAuthor)}</strong>
                                            <span>{reply.content}</span>
                                            <div className={styles.commentActions}>
                                              <button
                                                className={
                                                  hasLikedReply ? styles.likedCommentButton : undefined
                                                }
                                                type="button"
                                                onClick={() => handleToggleCommentLike(reply.id)}
                                              >
                                                <Heart
                                                  size={14}
                                                  fill={hasLikedReply ? "currentColor" : "none"}
                                                />
                                                {replyLikes.length}
                                              </button>
                                            </div>
                                          </div>
                                          {reply.user_id === user?.id && (
                                            <button
                                              aria-label="Delete reply"
                                              className={styles.commentDeleteButton}
                                              type="button"
                                              onClick={() => handleDeleteComment(reply)}
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {commentsOpen && (
                        <form
                          className={styles.commentForm}
                          onSubmit={(event) => handleCreateComment(event, post.id)}
                        >
                          <input
                            maxLength={1000}
                            placeholder="Write a comment..."
                            value={commentDrafts[post.id] ?? ""}
                            onChange={(event) =>
                              setCommentDrafts((current) => ({
                                ...current,
                                [post.id]: event.target.value,
                              }))
                            }
                          />
                          <button
                            aria-label="Send comment"
                            disabled={busyPostId === post.id || !commentDrafts[post.id]?.trim()}
                            type="submit"
                          >
                            <Send size={17} />
                          </button>
                        </form>
                      )}
                    </article>
                  );
                })
              )}
            </div>
          </section>

          <aside className={styles.rightRail} aria-label="Explore sidebar">
            <div className={styles.topicPanel}>
              <h2>
                <Flame size={18} fill="currentColor" />
                Trending Topics
              </h2>
              <div className={styles.topicList}>
                {CATEGORIES.map((item) => (
                  <button
                    className={categoryFilter === item ? styles.activeTopicButton : undefined}
                    key={item}
                    type="button"
                    onClick={() => setCategoryFilter(item)}
                  >
                    <span>#{item}</span>
                    <small>{categoryCounts[item]} posts</small>
                  </button>
                ))}
                <button type="button" onClick={() => setCategoryFilter("all")}>
                  <span>See more</span>
                  <small>{posts.length} posts</small>
                </button>
              </div>
            </div>

            <div className={styles.suggestedPanel}>
              <div className={styles.panelHeader}>
                <h2>Suggested Athletes</h2>
                <Link href="/discover">See all</Link>
              </div>
              <div className={styles.suggestedList}>
                {(suggestedAthletes.length > 0 ? suggestedAthletes : [currentProfile]).map((profile) => (
                  <div className={styles.suggestedItem} key={profile?.user_id ?? "current"}>
                    <ProfileAvatar profile={profile} />
                    <div>
                      <strong>{getDisplayName(profile)}</strong>
                      <span>{profile?.sport || getRoleLabel(profile?.role)}</span>
                    </div>
                    <Link href={`/profiles/${encodeURIComponent(profile?.user_id ?? user.id)}`}>
                      Follow
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.activityPanel}>
              <h2>Your Activity</h2>
              <div className={styles.activityGrid}>
                <div>
                  <Search size={32} />
                  <strong>{activityStats.posts}</strong>
                  <span>Posts</span>
                </div>
                <div>
                  <Heart size={32} />
                  <strong>{activityStats.likesReceived}</strong>
                  <span>Likes received</span>
                </div>
                <div>
                  <MessageCircle size={32} />
                  <strong>{activityStats.commentsCount}</strong>
                  <span>Comments</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
