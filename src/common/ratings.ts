export type ContentRatingName = "EVERYONE" | "MATURE" | "ADULT"

export function classifyAdultLabel(rating: ContentRatingName): "Everyone" | "Mature 18+" {
  return rating === "EVERYONE" ? "Everyone" : "Mature 18+"
}

export function isAdultSource(rating: ContentRatingName): boolean {
  return rating === "MATURE" || rating === "ADULT"
}
