export function getPriorityColor(priority: "HIGH" | "MEDIUM" | "LOW") {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-800 border-red-300";
    case "MEDIUM":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "LOW":
      return "bg-green-100 text-green-800 border-green-300";
  }
}

export function getPriorityBgColor(priority: "HIGH" | "MEDIUM" | "LOW") {
  switch (priority) {
    case "HIGH":
      return "bg-red-500 hover:bg-red-600";
    case "MEDIUM":
      return "bg-yellow-500 hover:bg-yellow-600";
    case "LOW":
      return "bg-green-500 hover:bg-green-600";
  }
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
