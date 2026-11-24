package se.minnetrail.drawings

/** White-point adjustment: fade weak lines; 100 preserves every model pixel. */
internal object DrawingDetail {
  fun shade(gray: Int, detail: Int): Int {
    require(detail in 0..100)
    val whitePoint = 175 + detail * 0.8
    return (gray * 255.0 / whitePoint).toInt().coerceIn(0, 255)
  }
}
