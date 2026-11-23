package se.vastkustbus.drawings

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import ai.onnxruntime.OnnxTensor
import ai.onnxruntime.OrtEnvironment
import ai.onnxruntime.OrtSession
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.nio.FloatBuffer
import java.util.UUID
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

class InformativeDrawingsModule : Module() {
  private val lock = Any()
  private var session: OrtSession? = null

  override fun definition() = ModuleDefinition {
    Name("InformativeDrawings")
    AsyncFunction("createDrawing") { source: String, destination: String ->
      synchronized(lock) { createDrawing(localFile(source), localFile(destination)) }
    }
    AsyncFunction("adjustDetail") { source: String, destination: String, detail: Int ->
      synchronized(lock) { adjustDetail(localFile(source), localFile(destination), detail) }
    }
    OnDestroy { synchronized(lock) { session?.close(); session = null } }
  }

  private fun localFile(uri: String): File {
    val parsed = Uri.parse(uri)
    require(parsed.scheme == "file") { "Only private local images are supported" }
    val file = File(requireNotNull(parsed.path)).canonicalFile
    val context = requireNotNull(appContext.reactContext)
    val roots = listOf(context.filesDir.canonicalFile, context.cacheDir.canonicalFile)
    require(roots.any { file.path.startsWith(it.path + File.separator) }) { "Image must be in app storage" }
    return file
  }

  private fun model(): OrtSession {
    session?.let { return it }
    val context = requireNotNull(appContext.reactContext)
    val bytes = context.assets.open("models/informative-style1.onnx").use { it.readBytes() }
    val options = OrtSession.SessionOptions()
    try {
      options.setIntraOpNumThreads(2)
      options.setInterOpNumThreads(1)
      options.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.ALL_OPT)
      return OrtEnvironment.getEnvironment().createSession(bytes, options).also { session = it }
    } finally { options.close() }
  }

  private fun decodePhoto(file: File): Bitmap {
    require(file.isFile && file.length() in 1..(40L * 1024 * 1024)) { "Invalid photo" }
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(file.path, bounds)
    require(bounds.outWidth > 0 && bounds.outHeight > 0) { "Photo cannot be decoded" }
    var sample = 1
    while (max(bounds.outWidth, bounds.outHeight) / sample > 2048) sample *= 2
    val bitmap = requireNotNull(BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply {
      inSampleSize = sample
      inPreferredConfig = Bitmap.Config.ARGB_8888
    }))
    val orientation = ExifInterface(file).getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.setScale(-1f, 1f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.setRotate(180f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.setScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> { matrix.setRotate(90f); matrix.postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.setRotate(90f)
      ExifInterface.ORIENTATION_TRANSVERSE -> { matrix.setRotate(-90f); matrix.postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.setRotate(-90f)
    }
    if (matrix.isIdentity) return bitmap
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true).also {
      if (it !== bitmap) bitmap.recycle()
    }
  }

  private fun createDrawing(source: File, destination: File): Map<String, Any> {
    val photo = decodePhoto(source)
    var scaled: Bitmap? = null
    try {
      val scale = min(1.0, 1024.0 / max(photo.width, photo.height))
      val width = max(32, (photo.width * scale / 4).roundToInt() * 4)
      val height = max(32, (photo.height * scale / 4).roundToInt() * 4)
      val image = Bitmap.createScaledBitmap(photo, width, height, true)
      scaled = image
      val size = width * height
      val pixels = IntArray(size)
      image.getPixels(pixels, 0, width, 0, 0, width, height)
      val values = FloatArray(size * 3)
      for (i in 0 until size) {
        val pixel = pixels[i]
        values[i] = ((pixel shr 16) and 255) / 255f
        values[i + size] = ((pixel shr 8) and 255) / 255f
        values[i + size * 2] = (pixel and 255) / 255f
      }
      OnnxTensor.createTensor(OrtEnvironment.getEnvironment(), FloatBuffer.wrap(values), longArrayOf(1, 3, height.toLong(), width.toLong())).use { input ->
        model().run(mapOf("photo" to input)).use { result ->
          val output = (result[0] as OnnxTensor).floatBuffer
          require(output.remaining() == size) { "Unexpected model output" }
          for (i in 0 until size) {
            val value = output.get()
            require(value.isFinite()) { "Invalid model pixel" }
            val gray = (value.coerceIn(0f, 1f) * 255).toInt()
            pixels[i] = (255 shl 24) or (gray shl 16) or (gray shl 8) or gray
          }
        }
      }
      val drawing = Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
      try { save(drawing, source, destination) } finally { drawing.recycle() }
      return mapOf("uri" to Uri.fromFile(destination).toString(), "width" to width, "height" to height)
    } finally {
      if (scaled !== photo) scaled?.recycle()
      photo.recycle()
    }
  }

  private fun adjustDetail(source: File, destination: File, detail: Int): Map<String, Any> {
    require(detail in 0..100)
    val image = requireNotNull(BitmapFactory.decodeFile(source.path)) { "Drawing cannot be opened" }
    try {
      val width = image.width; val height = image.height
      require(width in 1..1024 && height in 1..1024)
      val pixels = IntArray(width * height)
      image.getPixels(pixels, 0, width, 0, 0, width, height)
      for (i in pixels.indices) {
        val gray = DrawingDetail.shade(pixels[i] and 255, detail)
        pixels[i] = (255 shl 24) or (gray shl 16) or (gray shl 8) or gray
      }
      val result = Bitmap.createBitmap(pixels, width, height, Bitmap.Config.ARGB_8888)
      try { save(result, source, destination) } finally { result.recycle() }
      return mapOf("uri" to Uri.fromFile(destination).toString(), "width" to width, "height" to height)
    } finally { image.recycle() }
  }

  private fun save(bitmap: Bitmap, source: File, destination: File) {
    require(source.canonicalPath != destination.canonicalPath) { "Source cannot be overwritten" }
    require(destination.parentFile?.isDirectory == true && source.exists()) { "Memory no longer exists" }
    val temporary = File(destination.parentFile, destination.name + "." + UUID.randomUUID() + ".tmp")
    try {
      temporary.outputStream().use { require(bitmap.compress(Bitmap.CompressFormat.PNG, 100, it)) }
      require(source.exists() && temporary.renameTo(destination)) { "Drawing could not be saved" }
    } finally { temporary.delete() }
  }
}
