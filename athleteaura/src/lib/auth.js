export const roleLabels = {
  athlete: "Athlete",
  scout_coach: "Scout / Coach",
};

export const accountRoles = ["athlete", "scout_coach"];

export function getPostAuthRoute(userRole) {
  return userRole === "scout_coach" ? "/scout/profile" : "/profile";
}

export function isStrongPassword(value) {
  return value.length >= 8 && /[A-Z]/.test(value) && /\d/.test(value);
}
