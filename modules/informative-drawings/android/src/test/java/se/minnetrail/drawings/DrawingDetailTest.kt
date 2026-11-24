package se.minnetrail.drawings

import org.junit.Assert.*
import org.junit.Test

class DrawingDetailTest {
  @Test fun fullDetailPreservesEveryGrayValue() {
    for (gray in 0..255) assertEquals(gray, DrawingDetail.shade(gray, 100))
  }
  @Test fun removingDetailOnlyLightensAndPreservesWhiteBackground() {
    for (detail in 0..100) {
      assertEquals(255, DrawingDetail.shade(255, detail))
      assertEquals(0, DrawingDetail.shade(0, detail))
      for (gray in 0..255) assertTrue(DrawingDetail.shade(gray, detail) in gray..255)
    }
    assertEquals(255, DrawingDetail.shade(200, 0))
    assertEquals(200, DrawingDetail.shade(200, 100))
  }
  @Test fun detailChangesMonotonically() {
    for (gray in 0..255) for (detail in 0..99) {
      assertTrue(DrawingDetail.shade(gray, detail) >= DrawingDetail.shade(gray, detail + 1))
    }
  }
}
