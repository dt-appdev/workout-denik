package cz.workoutdenik.app

import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.samsung.android.sdk.health.data.HealthDataService
import com.samsung.android.sdk.health.data.HealthDataStore
import com.samsung.android.sdk.health.data.error.ResolvablePlatformException
import com.samsung.android.sdk.health.data.permission.AccessType
import com.samsung.android.sdk.health.data.permission.Permission
import com.samsung.android.sdk.health.data.request.DataType
import com.samsung.android.sdk.health.data.request.DataTypes
import com.samsung.android.sdk.health.data.request.LocalTimeFilter
import com.samsung.android.sdk.health.data.request.Ordering
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.time.LocalDateTime

/*
 * Samsung Health (F6-04): čtení měření složení těla přes Samsung Health Data SDK.
 * Soubor se překládá jen tehdy, když je knihovna SDK (samsung-health-data-api-*.aar) v app/libs; stáhne ji
 * nativni/sestav-apk.sh ze soukromého repa (secret WD_SDK_TOKEN). Bez ní APK vznikne bez doplňku
 * a MainActivity ho nezaregistruje (js/nativni.js pak hlásí, že Samsung Health v tomto sestavení chybí).
 * Ke čtení stačí vývojářský režim Samsung Health (Developer Mode for Data Read), bez partnerství se Samsungem.
 * Volání z JS (window.Capacitor.Plugins.SamsungHealth):
 *   connect()        povolení ke čtení složení těla (okno Samsung Health, jen když ještě není), { granted }
 *   read({ limit })  posledních limit měření, nejnovější první, { items: [ { uid, time, zone, appId,
 *                    deviceId, device: { type, name, model }, values: { WEIGHT: 80.1, … } } ] }
 * Hodnoty se berou ze všech polí, která SDK pro složení těla zná (podle názvu pole), aby zkouška ukázala
 * všechno, co Samsung vrací; převod na pole appky dělá js/app.js.
 */
@CapacitorPlugin(name = "SamsungHealth")
class SamsungHealthPlugin : Plugin() {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
  private val permissions = setOf(Permission.of(DataTypes.BODY_COMPOSITION, AccessType.READ))

  private fun store(): HealthDataStore = HealthDataService.getStore(context)

  override fun handleOnDestroy() {
    scope.cancel()
  }

  // spustí práci se SDK; chybu vrátí do JS (kód = název chyby), opravitelnou nechá vyřešit Samsung Health
  private fun run(call: PluginCall, job: suspend () -> JSObject) {
    scope.launch {
      try {
        call.resolve(job())
      } catch (e: Throwable) {
        if (e is ResolvablePlatformException && e.hasResolution) {
          try {
            e.resolve(activity)
          } catch (_: Throwable) {
          }
        }
        call.reject(e.message ?: e.javaClass.simpleName, e.javaClass.simpleName)
      }
    }
  }

  @PluginMethod
  fun connect(call: PluginCall) {
    run(call) {
      var granted = store().getGrantedPermissions(permissions)
      if (!granted.containsAll(permissions)) {
        granted = store().requestPermissions(permissions, activity)
      }
      JSObject().put("granted", granted.containsAll(permissions))
    }
  }

  @PluginMethod
  fun read(call: PluginCall) {
    run(call) {
      val limit = call.getInt("limit", 1) ?: 1
      val now = LocalDateTime.now()
      val request = DataTypes.BODY_COMPOSITION.readDataRequestBuilder
        .setLocalTimeFilter(LocalTimeFilter.of(now.minusYears(20), now.plusDays(1)))
        .setOrdering(Ordering.DESC)
        .setLimit(limit)
        .build()
      val points = store().readData(request).dataList.take(limit)
      val items = JSArray()
      for (point in points) {
        val item = JSObject()
        item.put("uid", point.uid)
        item.put("time", point.startTime.toEpochMilli())
        item.put("zone", point.zoneOffset?.totalSeconds)
        val source = point.dataSource
        item.put("appId", source?.appId)
        item.put("deviceId", source?.deviceId)
        item.put("device", deviceInfo(source?.deviceId))
        item.put("values", values(point))
        items.put(item)
      }
      JSObject().put("items", items)
    }
  }

  // zařízení, ze kterého měření je (hodinky, telefon, váha…); null = nejde zjistit
  private suspend fun deviceInfo(deviceId: String?): JSObject? {
    if (deviceId == null) return null
    return try {
      val device = store().getDeviceManager().getDevice(deviceId) ?: return null
      JSObject()
        .put("type", device.deviceType?.toString())
        .put("name", device.name)
        .put("model", device.model)
    } catch (e: Throwable) {
      JSObject().put("error", e.javaClass.simpleName)
    }
  }

  // všechna pole složení těla, která SDK zná, s hodnotou z měření (pole bez hodnoty vynechá)
  private fun values(point: Any): JSObject {
    val out = JSObject()
    val getValue = point.javaClass.methods.firstOrNull { it.name == "getValue" && it.parameterCount == 1 }
      ?: return out
    val fieldType = getValue.parameterTypes[0]
    for ((name, field) in fields(fieldType)) {
      val value = try {
        getValue.invoke(point, field)
      } catch (_: Throwable) {
        null
      } ?: continue
      if (value is Number) {
        out.put(name, value.toDouble())
      } else {
        out.put(name, value.toString())
      }
    }
    return out
  }

  // pole složení těla (název → pole SDK) z DataType.BodyCompositionType (statická pole i vlastnosti Companion)
  private fun fields(fieldType: Class<*>): Map<String, Any> {
    val found = sortedMapOf<String, Any>()
    val owner = DataType.BodyCompositionType::class.java
    for (f in owner.fields) {
      if (java.lang.reflect.Modifier.isStatic(f.modifiers) && fieldType.isAssignableFrom(f.type)) {
        f.get(null)?.let { found[f.name] = it }
      }
    }
    val companion = DataType.BodyCompositionType
    for (m in companion.javaClass.methods) {
      if (m.parameterCount == 0 && m.name.startsWith("get") && fieldType.isAssignableFrom(m.returnType)) {
        val name = m.name.removePrefix("get")
        if (!found.containsKey(name)) {
          m.invoke(companion)?.let { found[name] = it }
        }
      }
    }
    return found
  }
}
