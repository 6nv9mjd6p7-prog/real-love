"use client";
import { Compass, MessageCircle, UserRound } from "lucide-react";

export function mainDestination(route: string) {
  if (
    route === "circles" ||
    route.startsWith("circles/") ||
    route === "conversations" ||
    route.startsWith("conversations/") ||
    route.startsWith("chat/")
  )
    return "conversations";
  if (["profile", "settings", "review", "notifications"].includes(route))
    return "profile";
  return "discover";
}

export default function MainNavigation({
  current,
  onNavigate,
  circleRequests = 0,
  requests = 0,
  unread = 0,
}: {
  current: string;
  onNavigate: (route: string) => void;
  circleRequests?: number;
  reviewAlerts?: number;
  requests?: number;
  unread?: number;
}) {
  const chatActivity = [
    unread > 0
      ? `${unread} unread ${unread === 1 ? "message" : "messages"}`
      : "",
    requests > 0
      ? `${requests} connection ${requests === 1 ? "request" : "requests"}`
      : "",
    circleRequests > 0
      ? `${circleRequests} circle ${circleRequests === 1 ? "request" : "requests"}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");
  const items = [
    {
      key: "discover",
      label: "Discover",
      Icon: Compass,
      count: 0,
      activity: "",
    },
    {
      key: "conversations",
      label: "Chats",
      Icon: MessageCircle,
      count: unread + requests + circleRequests,
      activity: chatActivity,
    },
    {
      key: "profile",
      label: "Profile",
      Icon: UserRound,
      count: 0,
      activity: "",
    },
  ];
  const selected = mainDestination(current);
  return (
    <nav aria-label="Main navigation">
      {items.map(({ key, label, Icon, count, activity }) => (
        <button
          type="button"
          key={key}
          className={"nav-item" + (selected === key ? " active" : "")}
          aria-label={activity ? label + ", " + activity : label}
          aria-current={selected === key ? "page" : undefined}
          onClick={() => onNavigate(key)}
        >
          <span className="nav-icon">
            <Icon size={21} aria-hidden="true" />
            {count > 0 && (
              <span className="count" aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span className="nav-item-label">{label}</span>
        </button>
      ))}
    </nav>
  );
}
