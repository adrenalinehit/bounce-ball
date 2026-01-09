export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function circleVsAabb(cx, cy, r, aabb) {
  const closestX = clamp(cx, aabb.x, aabb.x + aabb.w);
  const closestY = clamp(cy, aabb.y, aabb.y + aabb.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Pushes the circle out of the AABB along the collision normal.
 * Returns null if no overlap, else {axis:'x'|'y', nx:number, ny:number, overlap:number}
 *
 * @param {{x:number,y:number,radius:number}} circle
 * @param {{x:number,y:number,w:number,h:number}} aabb
 */
export function resolveCircleAabb(circle, aabb) {
  const closestX = clamp(circle.x, aabb.x, aabb.x + aabb.w);
  const closestY = clamp(circle.y, aabb.y, aabb.y + aabb.h);
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const dist = Math.hypot(dx, dy);

  // If center is exactly on the closest point (rare), pick a fallback normal based on which side is nearer.
  if (dist === 0) {
    const left = Math.abs(circle.x - aabb.x);
    const right = Math.abs(aabb.x + aabb.w - circle.x);
    const top = Math.abs(circle.y - aabb.y);
    const bottom = Math.abs(aabb.y + aabb.h - circle.y);
    const min = Math.min(left, right, top, bottom);
    if (min === left) return { axis: "x", nx: -1, ny: 0, overlap: circle.radius };
    if (min === right) return { axis: "x", nx: 1, ny: 0, overlap: circle.radius };
    if (min === top) return { axis: "y", nx: 0, ny: -1, overlap: circle.radius };
    return { axis: "y", nx: 0, ny: 1, overlap: circle.radius };
  }

  const overlap = circle.radius - dist;
  if (overlap <= 0) return null;
  const nx = dx / dist;
  const ny = dy / dist;

  circle.x += nx * overlap;
  circle.y += ny * overlap;
  return { axis: Math.abs(nx) > Math.abs(ny) ? "x" : "y", nx, ny, overlap };
}


